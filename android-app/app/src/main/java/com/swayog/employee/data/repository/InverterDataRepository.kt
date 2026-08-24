package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.WaareeInverterDataResponse
import com.swayog.employee.data.model.WaareePowerGraphResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InverterDataRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getInverterData(customerId: Int? = null): Result<WaareeInverterDataResponse> {
        return try {
            val response = apiService.getWaareeInverterData(customerId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch inverter data: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPowerGraph(period: String = "realtime"): Result<WaareePowerGraphResponse> {
        return try {
            val response = apiService.getWaareePowerGraph(period)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch power graph: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
