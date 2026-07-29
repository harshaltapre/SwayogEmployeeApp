package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.DashboardStats
import com.swayog.employee.core.util.ErrorUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdminDashboardRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getDashboardStats(): Result<DashboardStats> {
        return try {
            val response = apiService.getAdminDashboard()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to fetch dashboard stats: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch dashboard stats: ${ErrorUtils.formatException(e)}"))
        }
    }
}
