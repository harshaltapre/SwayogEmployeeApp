package com.swayog.employee.di

import android.content.Context
import android.util.Log
import com.swayog.employee.BuildConfig
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.preferences.DataStoreManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.Response
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }
    
    @Provides
    @Singleton
    fun provideAuthInterceptor(dataStoreManager: DataStoreManager): Interceptor {
        return Interceptor { chain ->
            val originalRequest = chain.request()

            val savedUrl = dataStoreManager.getServerUrlBlocking()?.trim()
            val defaultBaseUrl = BuildConfig.API_BASE_URL.trim()

            val requestBuilder = originalRequest.newBuilder()
                .header("Content-Type", "application/json")
                .header("bypass-tunnel-reminder", "true")

            val authToken = runBlocking { dataStoreManager.authToken.first() }
            if (!authToken.isNullOrBlank()) {
                requestBuilder.header("Authorization", "Bearer $authToken")
            }

            if (!savedUrl.isNullOrBlank() && savedUrl.removeSuffix("/") != defaultBaseUrl.removeSuffix("/")) {
                try {
                    val customBaseUrl = if (savedUrl.endsWith("/")) savedUrl else "$savedUrl/"
                    val newHttpUrl = customBaseUrl.toHttpUrl()

                    val updatedUrl = originalRequest.url.newBuilder()
                        .scheme(newHttpUrl.scheme)
                        .host(newHttpUrl.host)
                        .port(newHttpUrl.port)
                        .build()

                    Log.d("NetworkModule", "Using custom server URL: $updatedUrl")
                    requestBuilder.url(updatedUrl)
                } catch (e: Exception) {
                    Log.e("NetworkModule", "Failed to apply custom server URL: $savedUrl", e)
                }
            }

            val request = requestBuilder.build()
            var response = chain.proceed(request)
            
            val requestPath = request.url.encodedPath
            val isAuthRequest = requestPath.contains("auth/login") || requestPath.contains("auth/refresh")
            
            if (response.code == 401 && !isAuthRequest) {
                val refreshToken = runBlocking { dataStoreManager.refreshToken.first() }
                if (refreshToken != null) {
                    val currentBaseUrl = request.url.newBuilder()
                        .encodedPath("/")
                        .build()
                        .toString()
                    val refreshUrl = if (currentBaseUrl.endsWith("/")) {
                        "${currentBaseUrl}api/v1/auth/refresh"
                    } else {
                        "${currentBaseUrl}/api/v1/auth/refresh"
                    }
                    
                    val refreshJson = JSONObject().put("refreshToken", refreshToken).toString()
                    val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
                    val refreshRequest = okhttp3.Request.Builder()
                        .url(refreshUrl)
                        .post(refreshJson.toRequestBody(mediaType))
                        .header("bypass-tunnel-reminder", "true")
                        .build()
                    
                    val basicClient = OkHttpClient.Builder()
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(10, TimeUnit.SECONDS)
                        .build()
                    
                    try {
                        val refreshResponse = basicClient.newCall(refreshRequest).execute()
                        if (refreshResponse.isSuccessful && refreshResponse.body != null) {
                            val responseBodyStr = refreshResponse.body!!.string()
                            val json = JSONObject(responseBodyStr)
                            val dataObj = json.optJSONObject("data")
                            val newAccessToken = dataObj?.optString("accessToken")
                            val newRefreshToken = dataObj?.optString("refreshToken")
                            
                            if (!newAccessToken.isNullOrBlank() && !newRefreshToken.isNullOrBlank()) {
                                runBlocking {
                                    dataStoreManager.saveAuthToken(newAccessToken)
                                    dataStoreManager.saveRefreshToken(newRefreshToken)
                                }
                                
                                response.close()
                                
                                val newRequest = request.newBuilder()
                                    .header("Authorization", "Bearer $newAccessToken")
                                    .build()
                                response = chain.proceed(newRequest)
                            } else {
                                runBlocking { dataStoreManager.clearAll() }
                            }
                        } else {
                            val code = refreshResponse.code
                            if (code == 400 || code == 401 || code == 403) {
                                runBlocking { dataStoreManager.clearAll() }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("NetworkModule", "Token refresh error", e)
                    }
                } else {
                    runBlocking { dataStoreManager.clearAll() }
                }
            }
            
            response
        }
    }
    
    @Provides
    @Singleton
    fun provideOkHttpClient(
        @ApplicationContext context: Context,
        loggingInterceptor: HttpLoggingInterceptor,
        authInterceptor: Interceptor
    ): OkHttpClient {
        val cacheSize = (10 * 1024 * 1024).toLong() // 10 MB
        val cache = okhttp3.Cache(context.cacheDir, cacheSize)

        return OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)   // Increased: site visits can have 10+ large photos
            .writeTimeout(120, TimeUnit.SECONDS)  // Increased: large base64 payloads need more time
            .build()
    }
    
    @Provides
    @Singleton
    fun provideGson(): com.google.gson.Gson {
        // Custom type adapter ensures integer JSON fields (like task IDs "id": 123) are
        // deserialized cleanly into String fields as "123" (not "123.0"), preventing 404s
        // when the Android app sends the task ID back to the server for completion.
        val integerAsStringAdapter = object : com.google.gson.TypeAdapter<String>() {
            override fun write(out: com.google.gson.stream.JsonWriter, value: String?) {
                if (value == null) out.nullValue() else out.value(value)
            }
            override fun read(reader: com.google.gson.stream.JsonReader): String? {
                return when (reader.peek()) {
                    com.google.gson.stream.JsonToken.NULL -> { reader.nextNull(); null }
                    com.google.gson.stream.JsonToken.NUMBER -> {
                        val numStr = reader.nextString()
                        // Remove trailing .0 from integer representations (e.g., "123.0" → "123")
                        if (numStr.endsWith(".0")) numStr.dropLast(2) else numStr
                    }
                    else -> reader.nextString()
                }
            }
        }
        return com.google.gson.GsonBuilder()
            .setLenient()
            .registerTypeAdapter(String::class.java, integerAsStringAdapter)
            .create()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, gson: com.google.gson.Gson): Retrofit {
        val baseUrl = BuildConfig.API_BASE_URL.let { url ->
            if (url.endsWith("/")) url else "$url/"
        }
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
