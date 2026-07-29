package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.Notification
import com.swayog.employee.core.util.ErrorUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getNotifications(): Result<List<Notification>> {
        return try {
            val response = apiService.getNotifications()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to fetch notifications: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch notifications: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun getUnreadCount(): Result<Int> {
        return try {
            val response = apiService.getUnreadCount()
            if (response.isSuccessful && response.body()?.data != null) {
                val count = response.body()!!.data!!["count"] ?: 0
                Result.success(count)
            } else {
                Result.failure(Exception("Failed to fetch unread count: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch unread count: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun markAsRead(notificationId: String): Result<Unit> {
        return try {
            val response = apiService.markNotificationAsRead(notificationId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark notification as read: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to mark notification as read: ${ErrorUtils.formatException(e)}"))
        }
    }
}
