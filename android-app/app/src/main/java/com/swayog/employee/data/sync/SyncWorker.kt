package com.swayog.employee.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.model.UpdateTaskRequest
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val outboxQueueDao: OutboxQueueDao,
    private val apiService: ApiService
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val pendingItems = outboxQueueDao.getPendingItems()
            if (pendingItems.isEmpty()) {
                return@withContext Result.success()
            }

            var hasFailure = false

            for (item in pendingItems) {
                val success = try {
                    if (item.endpoint.startsWith("tasks/") && item.method == "PATCH") {
                        val taskId = item.endpoint.substringAfter("tasks/").toIntOrNull()
                        if (taskId != null) {
                            val json = JSONObject(item.payload)
                            val status = json.optString("status")
                            val response = apiService.updateTask(taskId, UpdateTaskRequest(status = status))
                            response.isSuccessful
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                } catch (e: Exception) {
                    false
                }

                if (success) {
                    outboxQueueDao.updateItem(item.copy(isSynced = true))
                    outboxQueueDao.deleteItem(item)
                } else {
                    hasFailure = true
                }
            }

            if (hasFailure) {
                Result.retry()
            } else {
                Result.success()
            }
        } catch (e: Exception) {
            Result.failure()
        }
    }
}
