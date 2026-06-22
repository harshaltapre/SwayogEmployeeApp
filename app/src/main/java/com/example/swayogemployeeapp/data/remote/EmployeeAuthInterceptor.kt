package com.example.swayogemployeeapp.data.remote

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.google.gson.Gson
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response

class EmployeeAuthInterceptor(
    private val context: Context,
    private val db: AppDatabase
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = runBlocking {
            db.employeeSessionDao().getSession()?.accessToken ?: ""
        }

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .header("X-App-Platform", "Android-Employee")
            .build()

        val response = chain.proceed(authenticatedRequest)

        if (response.code() == 401) { // Access token expired
            synchronized(this) {
                val session = runBlocking { db.employeeSessionDao().getSession() }
                val refreshToken = session?.refreshToken
                if (refreshToken != null) {
                    val newTokens = requestTokenRefresh(refreshToken)
                    if (newTokens != null) {
                        runBlocking {
                            val updatedSession = session.copy(
                                accessToken = newTokens.accessToken,
                                refreshToken = newTokens.refreshToken,
                                lastSyncTimestamp = System.currentTimeMillis()
                            )
                            db.employeeSessionDao().insert(updatedSession)
                        }

                        val retriedRequest = originalRequest.newBuilder()
                            .header("Authorization", "Bearer ${newTokens.accessToken}")
                            .header("X-App-Platform", "Android-Employee")
                            .build()
                        response.close()
                        return chain.proceed(retriedRequest)
                    }
                }
            }
        }
        return response
    }

    private fun requestTokenRefresh(refreshToken: String): TokenRefreshResponse? {
        val client = OkHttpClient.Builder()
            .build()

        val gson = Gson()
        val jsonPayload = gson.toJson(TokenRefreshRequest(refreshToken))
        val requestBody = RequestBody.create(MediaType.parse("application/json"), jsonPayload)
        
        val request = Request.Builder()
            .url("http://10.0.2.2:4000/api/v1/employee/token/refresh")
            .post(requestBody)
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = response.body()?.string()
                gson.fromJson(json, TokenRefreshResponse::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
