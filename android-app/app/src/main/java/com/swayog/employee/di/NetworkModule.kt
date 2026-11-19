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

    internal fun isPermanentRefreshRejection(httpCode: Int): Boolean {
        return httpCode == 401 || httpCode == 403
    }

    internal fun isDynamicNoCachePath(encodedPath: String): Boolean {
        return encodedPath.contains("/attendance") ||
            encodedPath.contains("/auth/") ||
            encodedPath.contains("/users/me")
    }

    private val refreshOkHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(dataStoreManager: DataStoreManager): Interceptor {
        return Interceptor { chain ->
            val originalRequest = chain.request()
            val requestPath = originalRequest.url.encodedPath

            val requestBuilder = originalRequest.newBuilder()
                .header("Content-Type", "application/json")
                .header("bypass-tunnel-reminder", "true")

            // Never serve stale HTTP disk cache for dynamic attendance/auth endpoints
            if (isDynamicNoCachePath(requestPath)) {
                requestBuilder.header("Cache-Control", "no-cache, no-store")
            }

            // Read primed in-memory token cache (waits briefly on cold start if still priming)
            val authToken = dataStoreManager.getCachedAuthToken()
            if (!authToken.isNullOrBlank()) {
                requestBuilder.header("Authorization", "Bearer $authToken")
            }

            val request = requestBuilder.build()
            var response = chain.proceed(request)

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

            if (response.code == 401 && !isAuthRequest) {
                val tokenUsed = authToken ?: ""
                var newAccessTokenToRetry: String? = null
                var shouldClearSession = false
                var isTransientFailure = false

                synchronized(tokenRefreshLock) {
                    // Check if another concurrent request already refreshed the token
                    val latestStoredToken = dataStoreManager.getCachedAuthToken()
                    if (!latestStoredToken.isNullOrBlank() && latestStoredToken != tokenUsed) {
                        newAccessTokenToRetry = latestStoredToken
                    } else {
                        val refreshToken = dataStoreManager.getCachedRefreshToken()
                        if (!refreshToken.isNullOrBlank()) {
                            val refreshUrl = "${AppConfig.API_BASE_URL}auth/refresh"
                            val refreshJson = JSONObject().put("refreshToken", refreshToken).toString()
                            val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
                            val refreshRequest = okhttp3.Request.Builder()
                                .url(refreshUrl)
                                .post(refreshJson.toRequestBody(mediaType))
                                .header("bypass-tunnel-reminder", "true")
                                .header("Content-Type", "application/json")
                                .header("Cache-Control", "no-cache, no-store")
                                .build()

                            try {
                                refreshOkHttpClient.newCall(refreshRequest).execute().use { refreshResponse ->
                                    val code = refreshResponse.code
                                    val responseBodyStr = refreshResponse.body?.string()
                                    if (refreshResponse.isSuccessful && !responseBodyStr.isNullOrBlank()) {
                                        val json = JSONObject(responseBodyStr)
                                        val dataObj = json.optJSONObject("data")
                                        val newAccessToken = dataObj?.optString("accessToken")
                                            ?.takeIf { it.isNotBlank() }
                                            ?: dataObj?.optString("token")?.takeIf { it.isNotBlank() }
                                        val newRefreshToken = dataObj?.optString("refreshToken")
                                            ?.takeIf { it.isNotBlank() }

                                        if (!newAccessToken.isNullOrBlank() && !newRefreshToken.isNullOrBlank()) {
                                            val saved = runBlocking {
                                                dataStoreManager.saveTokensAtomically(newAccessToken, newRefreshToken)
                                            }
                                            if (saved) {
                                                newAccessTokenToRetry = newAccessToken
                                                Log.d("NetworkModule", "Token refresh successful")
                                            } else {
                                                isTransientFailure = true
                                                Log.e("NetworkModule", "Failed to persist refreshed tokens; keeping existing session")
                                            }
                                        } else {
                                            // Unexpected body shape (e.g. proxy HTML) — do not wipe valid tokens
                                            isTransientFailure = true
                                            Log.w("NetworkModule", "Token refresh response missing tokens; preserving session")
                                        }
                                    } else if (isPermanentRefreshRejection(code)) {
                                        Log.w("NetworkModule", "Token refresh permanently rejected with HTTP $code")
                                        shouldClearSession = true
                                    } else {
                                        // Transient server error (5xx, 429, 408, etc.) — preserve tokens!
                                        isTransientFailure = true
                                        Log.w("NetworkModule", "Transient token refresh failure HTTP $code; preserving tokens")
                                    }
                                }
                            } catch (e: Exception) {
                                // Network/timeout error — NEVER wipe tokens on transient connectivity loss
                                isTransientFailure = true
                                Log.e("NetworkModule", "Transient token refresh network error (tokens preserved): ${e.message}")
                            }
                        } else if (dataStoreManager.isCachedLoggedIn()) {
                            // User is marked logged in, priming finished, yet no refresh token exists
                            Log.w("NetworkModule", "Logged-in session has no refresh token; marking session expired")
                            shouldClearSession = true
                        }
                    }
                    Unit
                }

                if (!newAccessTokenToRetry.isNullOrBlank()) {
                    response.close()
                    val newRequest = request.newBuilder()
                        .header("Authorization", "Bearer $newAccessTokenToRetry")
                        .build()
                    response = chain.proceed(newRequest)
                } else if (shouldClearSession) {
                    Log.w("NetworkModule", "Refresh token expired/revoked — clearing auth session so user can re-login")
                    runBlocking {
                        dataStoreManager.incrementTokenRefreshFailures()
                        dataStoreManager.clearAuthSessionOnly()
                    }
                } else if (isTransientFailure) {
                    CoroutineScope(Dispatchers.IO).launch {
                        dataStoreManager.incrementTokenRefreshFailures()
                    }
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
        val httpCacheDir = java.io.File(context.cacheDir, "http_cache")
        val cache = okhttp3.Cache(httpCacheDir, cacheSize)

        val packetTelemetryInterceptor = Interceptor { chain ->
            val req = chain.request()
            val startNs = System.nanoTime()
            val reqBytes = try { req.body?.contentLength() ?: 0L } catch (_: Exception) { 0L }
            try {
                val res = chain.proceed(req)
                val durationMs = (System.nanoTime() - startNs) / 1_000_000L
                if (BuildConfig.DEBUG || durationMs > 1000L || !res.isSuccessful) {
                    val resBytes = res.header("Content-Length")?.toLongOrNull() ?: -1L
                    val encoding = res.header("Content-Encoding") ?: "identity"
                    Log.d(
                        "PACKET_TRANSFER",
                        "${req.method} ${req.url.encodedPath} -> HTTP ${res.code} (${durationMs}ms, tx=${reqBytes}B, rx=${resBytes}B, enc=$encoding)"
                    )
                }
                res
            } catch (e: Exception) {
                val durationMs = (System.nanoTime() - startNs) / 1_000_000L
                Log.w(
                    "PACKET_TRANSFER",
                    "${req.method} ${req.url.encodedPath} -> FAILED after ${durationMs}ms (tx=${reqBytes}B): ${e.javaClass.simpleName}: ${e.message}"
                )
                throw e
            }
        }

        return OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(authInterceptor)
            .addInterceptor(packetTelemetryInterceptor)
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