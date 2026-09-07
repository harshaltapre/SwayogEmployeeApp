package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.*
import com.swayog.employee.core.util.ErrorUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InventoryRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getInventoryItems(): Result<List<InventoryItem>> {
        return try {
            val response = apiService.getInventoryItems()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to fetch inventory: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch inventory: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun createInventoryItem(request: CreateInventoryRequest): Result<InventoryItem> {
        return try {
            val response = apiService.createInventoryItem(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to create inventory item: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to create inventory item: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun updateInventoryItem(id: String, request: UpdateInventoryRequest): Result<InventoryItem> {
        return try {
            val response = apiService.updateInventoryItem(id, request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to update inventory item: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to update inventory item: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun deleteInventoryItem(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteInventoryItem(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete inventory item: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to delete inventory item: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun getDispatches(): Result<List<DispatchRecord>> {
        return try {
            val response = apiService.getDispatches()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to fetch dispatches: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch dispatches: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun createDispatch(request: DispatchRequest): Result<DispatchRecord> {
        return try {
            val response = apiService.createDispatch(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to record dispatch: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to record dispatch: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun updateDispatch(id: String, request: UpdateDispatchRequest): Result<DispatchRecord> {
        return try {
            val response = apiService.updateDispatch(id, request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to update dispatch: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to update dispatch: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun deleteDispatch(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteDispatch(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete dispatch: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to delete dispatch: ${ErrorUtils.formatException(e)}"))
        }
    }
}
