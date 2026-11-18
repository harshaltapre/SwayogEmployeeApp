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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
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
import javax.inject.Named
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class ApiOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class UpdateOkHttpClient

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

            // Use cached token to avoid runBlocking deadlocks in release builds
            val authToken = dataStoreManager.getCachedAuthToken()
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
                    CoroutineScope(Dispatchers.IO).launch {
                        dataStoreManager.recordUserActive(now)
                    }
                }
            }

            if (response.code == 401 && !isAuthRequest && request.header("X-Auth-Retried") == null) {
                val tokenUsed = authToken ?: ""
                var newAccessTokenToRetry: String? = null
                var shouldClearSession = false

                synchronized(tokenRefreshLock) {
                    // Check if another concurrent request already refreshed the token
                    val latestStoredToken = dataStoreManager.getCachedAuthToken()
                    if (!latestStoredToken.isNullOrBlank() && latestStoredToken != tokenUsed) {
                        // Already refreshed by another thread!
                        newAccessTokenToRetry = latestStoredToken
                    } else {
                        val refreshToken = dataStoreManager.getCachedRefreshToken()
                        if (refreshToken.isNullOrBlank()) {
                            Log.w("NetworkModule", "No refresh token available; clearing session")
                            shouldClearSession = true
                        } else {
                            val refreshUrl = "${AppConfig.API_BASE_URL}auth/refresh"
                            val refreshJson = JSONObject().put("refreshToken", refreshToken).toString()
                            val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()

                            val basicClient = OkHttpClient.Builder()
                                .connectTimeout(30, TimeUnit.SECONDS)
                                .readTimeout(30, TimeUnit.SECONDS)
                                .writeTimeout(30, TimeUnit.SECONDS)
                                .retryOnConnectionFailure(true)
                                .build()

                            // Retry once on transient network / 5xx errors; never clear session on transient failure
                            for (attempt in 1..2) {
                                val refreshRequest = okhttp3.Request.Builder()
                                    .url(refreshUrl)
                                    .post(refreshJson.toRequestBody(mediaType))
                                    .header("bypass-tunnel-reminder", "true")
                                    .header("Content-Type", "application/json")
                                    .build()

                                try {
                                    basicClient.newCall(refreshRequest).execute().use { refreshResponse ->
                                        val code = refreshResponse.code
                                        val responseBodyStr = refreshResponse.body?.string()
                                        if (refreshResponse.isSuccessful && !responseBodyStr.isNullOrBlank()) {
                                            val json = JSONObject(responseBodyStr)
                                            val dataObj = json.optJSONObject("data")
                                            val newAccessToken = dataObj?.optString("accessToken")
                                            val newRefreshToken = dataObj?.optString("refreshToken")

                                            if (!newAccessToken.isNullOrBlank() && !newRefreshToken.isNullOrBlank()) {
                                                val saved = runBlocking {
                                                    dataStoreManager.saveTokensAtomically(newAccessToken, newRefreshToken)
                                                }
                                                if (saved) {
                                                    newAccessTokenToRetry = newAccessToken
                                                    Log.d("NetworkModule", "Token refresh successful on attempt $attempt")
                                                } else {
                                                    Log.e("NetworkModule", "Failed to persist refreshed tokens atomically")
                                                }
                                                return@use
                                            } else {
                                                Log.w("NetworkModule", "Token refresh response missing tokens (attempt $attempt)")
                                            }
                                        } else if (code == 401 || code == 403) {
                                            Log.w("NetworkModule", "Refresh token rejected by server (HTTP $code): $responseBodyStr")
                                            shouldClearSession = true
                                            return@use
                                        } else {
                                            Log.w("NetworkModule", "Transient HTTP $code during token refresh (attempt $attempt): $responseBodyStr")
                                        }
                                    }
                                    if (newAccessTokenToRetry != null || shouldClearSession) break
                                } catch (e: Exception) {
                                    Log.e("NetworkModule", "Transient error during token refresh (attempt $attempt): ${e.message}", e)
                                }

                                if (attempt == 1) {
                                    try { Thread.sleep(400L) } catch (_: InterruptedException) { break }
                                }
                            }

                            if (newAccessTokenToRetry == null && !shouldClearSession) {
                                runBlocking { dataStoreManager.incrementTokenRefreshFailure() }
                            }
                        }
                    }
                }

                if (!newAccessTokenToRetry.isNullOrBlank()) {
                    response.close()
                    val newRequest = request.newBuilder()
                        .header("Authorization", "Bearer $newAccessTokenToRetry")
                        .header("X-Auth-Retried", "1")
                        .build()
                    response = chain.proceed(newRequest)
                } else if (shouldClearSession) {
                    // Refresh token is genuinely invalid/revoked; clear full auth session consistently
                    Log.w("NetworkModule", "Clearing full auth session after permanent refresh rejection")
                    runBlocking {
                        dataStoreManager.clearAuthData()
                    }
                } else {
                    Log.w("NetworkModule", "Preserving existing session after transient token refresh failure")
                }
            }
            
            response
        }
    }
    
    @Provides
    @Singleton
    @ApiOkHttpClient
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
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(120, java.util.concurrent.TimeUnit.SECONDS)   // Increased: site visits can have 10+ large photos
            .writeTimeout(120, java.util.concurrent.TimeUnit.SECONDS)  // Increased: large base64 payloads need more time
            .build()
    }
    
    @Provides
    @Singleton
    @UpdateOkHttpClient
    fun provideUpdateOkHttpClient(): OkHttpClient {
        // Separate client for update checks without auth interceptor
        return OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
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
    fun provideRetrofit(
        @ApiOkHttpClient okHttpClient: OkHttpClient,
        gson: com.google.gson.Gson
    ): Retrofit {
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