package com.swayog.employee.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.util.Log
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.TaskRepository

/**
 * Periodic worker that refreshes tasks from the backend to ensure dashboard synchronization.
 * Runs on a periodic interval (configured when enqueuing the worker) to keep local data
 * in sync with the backend without requiring manual refresh.
 */
@HiltWorker
class PeriodicTaskRefreshWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val dataStoreManager: DataStoreManager,
    private val taskRepository: TaskRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d("PeriodicSync", "PeriodicTaskRefreshWorker started")
            
            val userId = dataStoreManager.getUserId()
            if (userId == null) {
                Log.w("PeriodicSync", "No user ID found, skipping periodic refresh")
                return@withContext Result.success()
            }
            
            Log.d("PeriodicSync", "Refreshing tasks for user $userId")
            val result = taskRepository.refreshTasks(userId)
            
            if (result.isSuccess) {
                Log.d("PeriodicSync", "Periodic task refresh successful for user $userId")
                Result.success()
            } else {
                Log.e("PeriodicSync", "Periodic task refresh failed: ${result.exceptionOrNull()?.message}")
                // Return success to avoid retrying immediately - will retry on next scheduled run
                Result.success()
            }
        } catch (e: Exception) {
            Log.e("PeriodicSync", "PeriodicTaskRefreshWorker failed with exception: ${e.message}", e)
            // Return success to avoid excessive retries
            Result.success()
        }
    }
}
