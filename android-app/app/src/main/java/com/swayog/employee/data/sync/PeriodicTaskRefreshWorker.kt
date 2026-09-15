package com.swayog.employee.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import android.util.Log
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.TaskRepository

@HiltWorker
class PeriodicTaskRefreshWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val taskRepository: TaskRepository,
    private val dataStoreManager: DataStoreManager
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val WORK_NAME = "periodic_task_refresh"
        const val TAG = "PeriodicTaskRefresh"
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "PeriodicTaskRefreshWorker started")
            
            // Get current user ID from DataStore
            val userId = dataStoreManager.userId.first()
            if (userId.isNullOrBlank()) {
                Log.w(TAG, "No user ID found, skipping task refresh")
                return@withContext Result.success()
            }
            
            Log.d(TAG, "Refreshing tasks for user: $userId")
            
            // Refresh tasks from backend
            val result = taskRepository.refreshTasks(userId)
            
            if (result.isSuccess) {
                Log.d(TAG, "Successfully refreshed tasks for user: $userId")
                Result.success()
            } else {
                Log.w(TAG, "Failed to refresh tasks: ${result.exceptionOrNull()?.message}")
                // Don't retry immediately - let the periodic schedule handle it
                Result.success()
            }
        } catch (e: Exception) {
            Log.e(TAG, "PeriodicTaskRefreshWorker failed with exception: ${e.message}", e)
            // Don't crash the worker, just return success and let periodic schedule handle retry
            Result.success()
        }
    }
}