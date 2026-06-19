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
                .addInterceptor(EmployeeAuthInterceptor(context, db))
                .addInterceptor(MockInterceptor())
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl("https://api.swayog.com/")
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            val service = retrofit.create(ApiService::class.java)
            apiService = service
            service
        }
    }
}
