package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.Employee
import javax.inject.Inject
import javax.inject.Singleton
import com.swayog.employee.core.util.ErrorUtils

@Singleton
class EmployeeRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getInternalUsers(role: String? = null): Result<List<Employee>> {
        return try {
            val response = apiService.getInternalUsers(role)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to fetch employees: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch employees: ${ErrorUtils.formatException(e)}"))
        }
    }
}
