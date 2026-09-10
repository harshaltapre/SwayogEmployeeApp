package com.swayog.employee.di

import android.content.Context
import android.util.Log
import com.swayog.employee.BuildConfig
import com.swayog.employee.core.config.AppConfig
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
    
    private val tokenRefreshLock = Any()
    @Volatile
    private var lastRecordedActiveTime = 0L

    @Provides
    @Singleton
    fun provideAuthInterceptor(dataStoreManager: DataStoreManager): Interceptor {
        return Interceptor { chain ->
            val originalRequest = chain.request()

            val requestBuilder = originalRequest.newBuilder()
                .header("Content-Type", "application/json")
                .header("bypass-tunnel-reminder", "true")

            val authToken = runBlocking { dataStoreManager.authToken.first() }
            if (!authToken.isNullOrBlank()) {
                requestBuilder.header("Authorization", "Bearer $authToken")
            }

            val request = requestBuilder.build()
            var response = chain.proceed(request)
            
            val requestPath = request.url.encodedPath
            val isAuthRequest = requestPath.contains("auth/login") || requestPath.contains("auth/refresh")
            
            if (response.isSuccessful && !isAuthRequest && !authToken.isNullOrBlank()) {
                val now = System.currentTimeMillis()
                if (now - lastRecordedActiveTime > 60_000L) {
                    lastRecordedActiveTime = now
                    runBlocking { dataStoreManager.recordUserActive(now) }
                }
            }

            if (response.code == 401 && !isAuthRequest) {
                val tokenUsed = authToken ?: ""
                var newAccessTokenToRetry: String? = null

                synchronized(tokenRefreshLock) {
                    // Check if another concurrent request already refreshed the token
                    val latestStoredToken = runBlocking { dataStoreManager.authToken.first() }
                    if (!latestStoredToken.isNullOrBlank() && latestStoredToken != tokenUsed) {
                        // Already refreshed by another thread!
                        newAccessTokenToRetry = latestStoredToken
                    } else {
                        // This thread performs the single refresh
                        val refreshToken = runBlocking { dataStoreManager.refreshToken.first() }
                        if (refreshToken != null) {
                            val refreshUrl = "${AppConfig.API_BASE_URL}auth/refresh"
                            
                            val refreshJson = JSONObject().put("refreshToken", refreshToken).toString()
                            val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
                            val refreshRequest = okhttp3.Request.Builder()
                                .url(refreshUrl)
                                .post(refreshJson.toRequestBody(mediaType))
                                .header("bypass-tunnel-reminder", "true")
                                .build()
                            
                            val basicClient = OkHttpClient.Builder()
                                .connectTimeout(30, TimeUnit.SECONDS)
                                .readTimeout(30, TimeUnit.SECONDS)
                                .writeTimeout(30, TimeUnit.SECONDS)
                                .retryOnConnectionFailure(true)
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
                                            dataStoreManager.recordUserActive()
                                        }
                                        newAccessTokenToRetry = newAccessToken
                                    }
                                } else {
                                    val code = refreshResponse.code
                                    Log.w("NetworkModule", "Token refresh attempt returned HTTP $code")
                                }
                            } catch (e: Exception) {
                                Log.e("NetworkModule", "Token refresh network error: ${e.message}")
                            }
                        }
                    }
                }

                if (!newAccessTokenToRetry.isNullOrBlank()) {
                    response.close()
                    val newRequest = request.newBuilder()
                        .header("Authorization", "Bearer $newAccessTokenToRetry")
                        .build()
                    response = chain.proceed(newRequest)
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
        val cacheSize = (20 * 1024 * 1024).toLong() // 20 MB cache
        val cache = okhttp3.Cache(context.cacheDir, cacheSize)

        return OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .retryOnConnectionFailure(true)
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
        return Retrofit.Builder()
            .baseUrl(AppConfig.API_BASE_URL)
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
