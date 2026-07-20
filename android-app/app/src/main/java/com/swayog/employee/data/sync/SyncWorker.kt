package com.swayog.employee.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.model.*
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import com.swayog.employee.core.util.LocalFileHelper

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
                var filesToDelete = mutableListOf<String>()
                val success = try {
                    when {
                        item.endpoint.startsWith("tasks/") && item.method == "PATCH" -> {
                            val taskId = item.endpoint.substringAfter("tasks/")
                            if (taskId.isNotEmpty()) {
                                val json = JSONObject(item.payload)
                                val status = json.optString("status")
                                val response = apiService.updateTask(taskId, UpdateTaskRequest(status = status))
                                response.isSuccessful
                            } else {
                                false
                            }
                        }
                        item.endpoint.contains("complete") && item.method == "POST" -> {
                            val json = JSONObject(item.payload)
                            val taskId = json.optString("taskId")
                            if (taskId.isNotEmpty()) {
                                val beforeImageFilePath = json.optString("beforeImageFilePath", null)
                                val afterImageFilePath = json.optString("afterImageFilePath", null)
                                
                                val beforeImageUrl = beforeImageFilePath?.takeIf { it.isNotBlank() }?.let { 
                                    filesToDelete.add(it)
                                    LocalFileHelper.readFileToBase64(it) 
                                } ?: json.optString("beforeImageUrl").takeIf { it.isNotEmpty() }
                                
                                val afterImageUrl = afterImageFilePath?.takeIf { it.isNotBlank() }?.let { 
                                    filesToDelete.add(it)
                                    LocalFileHelper.readFileToBase64(it) 
                                } ?: json.optString("afterImageUrl").takeIf { it.isNotEmpty() }
                                
                                val request = CompleteTaskRequest(
                                    message = json.optString("message"),
                                    documentUrl = json.optString("documentUrl").takeIf { it.isNotEmpty() },
                                    beforeImageUrl = beforeImageUrl,
                                    afterImageUrl = afterImageUrl,
                                    beforeLatitude = json.optDouble("beforeLatitude").takeIf { !json.isNull("beforeLatitude") },
                                    beforeLongitude = json.optDouble("beforeLongitude").takeIf { !json.isNull("beforeLongitude") },
                                    afterLatitude = json.optDouble("afterLatitude").takeIf { !json.isNull("afterLatitude") },
                                    afterLongitude = json.optDouble("afterLongitude").takeIf { !json.isNull("afterLongitude") }
                                )
                                val response = apiService.completeTask(taskId, request)
                                response.isSuccessful
                            } else {
                                false
                            }
                        }
                        item.endpoint.contains("check-in") && item.method == "POST" -> {
                            val json = JSONObject(item.payload)
                            
                            val selfieFilePath = json.optString("selfieFilePath", null)
                            val selfie = selfieFilePath?.takeIf { it.isNotBlank() }?.let { 
                                filesToDelete.add(it)
                                LocalFileHelper.readFileToBase64(it) 
                            } ?: json.optString("selfie").takeIf { it.isNotEmpty() }
                            
                            val request = CheckInRequest(
                                selfie = selfie,
                                latitude = json.optDouble("latitude").takeIf { !json.isNull("latitude") },
                                longitude = json.optDouble("longitude").takeIf { !json.isNull("longitude") },
                                matchConfidence = json.optDouble("matchConfidence").takeIf { !json.isNull("matchConfidence") }?.toFloat()
                            )
                            val response = apiService.checkIn(request)
                            response.isSuccessful
                        }
                        item.endpoint.contains("daily-commits") && item.method == "POST" -> {
                            val json = JSONObject(item.payload)
                            val request = DailyCommitRequest(
                                commitDate = json.optString("commitDate"),
                                taskWorkedOn = json.optString("taskWorkedOn"),
                                workSummary = json.optString("workSummary"),
                                hoursSpent = json.optDouble("hoursSpent"),
                                issuesBlockers = json.optString("issuesBlockers").takeIf { it.isNotEmpty() },
                                tomorrowPlan = json.optString("tomorrowPlan").takeIf { it.isNotEmpty() }
                            )
                            val response = apiService.createDailyCommit(request)
                            response.isSuccessful
                        }
                        else -> false
                    }
                } catch (e: Exception) {
                    false
                }

                if (success) {
                    filesToDelete.forEach { filePath ->
                        LocalFileHelper.deleteFile(filePath)
                    }
                    outboxQueueDao.updateItem(item.copy(isSynced = true))
                    outboxQueueDao.deleteItem(item)
                } else {
                    val updatedItem = item.copy(retryCount = item.retryCount + 1)
                    outboxQueueDao.updateItem(updatedItem)
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
