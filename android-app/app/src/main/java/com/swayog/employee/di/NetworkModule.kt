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

            // Dynamic base URL: read saved server URL from preferences
            val savedUrl = dataStoreManager.getServerUrlBlocking()
            val request = if (!savedUrl.isNullOrBlank()) {
                try {
                    val newBaseUrl = savedUrl.let { url ->
                        val normalized = if (url.endsWith("/")) url else "$url/"
                        normalized.toHttpUrl()
                    }
                    val newUrl = originalRequest.url.newBuilder()
                        .scheme(newBaseUrl.scheme)
                        .host(newBaseUrl.host)
                        .port(newBaseUrl.port)
                        .build()
                    
                    val requestBuilder = originalRequest.newBuilder()
                        .url(newUrl)
                        .header("Content-Type", "application/json")
                        .header("bypass-tunnel-reminder", "true")
                    
                    val authToken = runBlocking { dataStoreManager.authToken.first() }
                    if (authToken != null) {
                        requestBuilder.header("Authorization", "Bearer $authToken")
                    }
                    requestBuilder.build()
                } catch (e: Exception) {
                    Log.e("NetworkModule", "Failed to parse saved server URL: $savedUrl", e)
                    // Fallback to original request with auth header
                    val requestBuilder = originalRequest.newBuilder()
                        .header("Content-Type", "application/json")
                        .header("bypass-tunnel-reminder", "true")
                    val authToken = runBlocking { dataStoreManager.authToken.first() }
                    if (authToken != null) {
                        requestBuilder.header("Authorization", "Bearer $authToken")
                    }
                    requestBuilder.build()
                }
            } else {
                val requestBuilder = originalRequest.newBuilder()
                    .header("Content-Type", "application/json")
                    .header("bypass-tunnel-reminder", "true")
                val authToken = runBlocking { dataStoreManager.authToken.first() }
                if (authToken != null) {
                    requestBuilder.header("Authorization", "Bearer $authToken")
                }
                requestBuilder.build()
            }
            
            var response = chain.proceed(request)
            
            if (response.code == 401) {
                val refreshToken = runBlocking { dataStoreManager.refreshToken.first() }
                if (refreshToken != null) {
                    val currentBaseUrl = request.url.newBuilder().encodedPath("").build().toString()
                    val refreshUrl = "${currentBaseUrl}api/v1/auth/refresh"
                    
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
        loggingInterceptor: HttpLoggingInterceptor,
        authInterceptor: Interceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val baseUrl = BuildConfig.API_BASE_URL.let { url ->
            if (url.endsWith("/")) url else "$url/"
        }
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
