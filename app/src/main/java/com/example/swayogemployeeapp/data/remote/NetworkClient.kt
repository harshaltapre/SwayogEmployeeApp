package com.example.swayogemployeeapp.data.remote

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object NetworkClient {
    private var apiService: ApiService? = null

    fun getApiService(context: Context): ApiService {
        return apiService ?: synchronized(this) {
            val db = AppDatabase.getDatabase(context)
            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(5, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(5, java.util.concurrent.TimeUnit.SECONDS)
                .addInterceptor(EmployeeAuthInterceptor(context, db))
                .build()

            // Standard Android emulator localhost bridge to local Express/Node backend on port 4000
            val baseUrl = "http://10.0.2.2:4000/"

            val retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            val service = retrofit.create(ApiService::class.java)
            apiService = service
            service
        }
    }
}
