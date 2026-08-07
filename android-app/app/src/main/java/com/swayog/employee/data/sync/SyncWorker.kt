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
import com.swayog.employee.data.local.dao.TaskDao
import com.swayog.employee.data.local.entity.TaskEntity
import com.swayog.employee.core.util.LocalFileHelper
import com.google.gson.Gson
import android.util.Log

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val outboxQueueDao: OutboxQueueDao,
    private val taskDao: TaskDao,
    private val apiService: ApiService
) : CoroutineWorker(appContext, workerParams) {

    private val gson = Gson()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val pendingItems = outboxQueueDao.getPendingItems()
            Log.d("TASK_SYNC", "SyncWorker started with ${pendingItems.size} pending outbox item(s)")
            if (pendingItems.isEmpty()) {
                Log.d("TASK_SYNC", "SyncWorker exiting early because the queue is empty")
                return@withContext Result.success()
            }

            var hasFailure = false

            for (item in pendingItems) {
                Log.d("TASK_SYNC", "Processing outbox item ${item.id} endpoint=${item.endpoint} method=${item.method} retryCount=${item.retryCount}")
                var filesToDelete = mutableListOf<String>()
                val success = try {
                    when {
                        item.endpoint.startsWith("tasks/") && item.method == "PATCH" -> {
                            val taskId = item.endpoint.substringAfter("tasks/")
                            if (taskId.isNotEmpty()) {
                                val json = JSONObject(item.payload)
                                val status = json.optString("status")
                                val response = apiService.updateTask(taskId, UpdateTaskRequest(status = status))
                                if (response.isSuccessful) {
                                    val localTask = taskDao.getTaskById(taskId)
                                    if (localTask != null) {
                                        taskDao.updateTask(localTask.copy(status = status, isSynced = true))
                                    }
                                    true
                                } else {
                                    false
                                }
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
                                
                                val imageFilePathsArray = json.optJSONArray("imageFilePaths")
                                val imageFilePaths = if (imageFilePathsArray != null) {
                                    List(imageFilePathsArray.length()) { imageFilePathsArray.getString(it) }
                                } else null
                                val images = imageFilePaths?.mapNotNull { 
                                    filesToDelete.add(it)
                                    LocalFileHelper.readFileToBase64(it) 
                                }

                                val beforeImagePathsArray = json.optJSONArray("beforeImagePaths")
                                val beforeImagePaths = if (beforeImagePathsArray != null) {
                                    List(beforeImagePathsArray.length()) { beforeImagePathsArray.getString(it) }
                                } else null
                                val beforeImages = beforeImagePaths?.mapNotNull { 
                                    filesToDelete.add(it)
                                    LocalFileHelper.readFileToBase64(it) 
                                }

                                val afterImagePathsArray = json.optJSONArray("afterImagePaths")
                                val afterImagePaths = if (afterImagePathsArray != null) {
                                    List(afterImagePathsArray.length()) { afterImagePathsArray.getString(it) }
                                } else null
                                val afterImages = afterImagePaths?.mapNotNull { 
                                    filesToDelete.add(it)
                                    LocalFileHelper.readFileToBase64(it) 
                                }

                                val request = CompleteTaskRequest(
                                    message = json.optString("message"),
                                    documentUrl = json.optString("documentUrl").takeIf { it.isNotEmpty() },
                                    beforeImageUrl = beforeImageUrl,
                                    afterImageUrl = afterImageUrl,
                                    beforeLatitude = json.optDouble("beforeLatitude").takeIf { !json.isNull("beforeLatitude") },
                                    beforeLongitude = json.optDouble("beforeLongitude").takeIf { !json.isNull("beforeLongitude") },
                                    afterLatitude = json.optDouble("afterLatitude").takeIf { !json.isNull("afterLatitude") },
                                    afterLongitude = json.optDouble("afterLongitude").takeIf { !json.isNull("afterLongitude") },
                                    taskType = json.optString("taskType").takeIf { it.isNotEmpty() },
                                    images = images,
                                    sitePhotos = images,
                                    beforeImages = beforeImages,
                                    afterImages = afterImages
                                )
                                val response = apiService.completeTask(taskId, request)
                                if (response.isSuccessful) {
                                    val task = response.body()?.data
                                    if (task != null) {
                                        val entity = TaskEntity(
                                            id = task.id,
                                            jobType = task.jobType,
                                            description = task.description,
                                            customerName = task.customerName,
                                            customerPhone = task.customerPhone,
                                            address = task.address,
                                            latitude = task.latitude,
                                            longitude = task.longitude,
                                            status = task.status,
                                            scheduledTime = task.scheduledTime,
                                            employeeUserId = task.employeeUserId,
                                            assignedById = task.assignedById,
                                            completionMessage = task.completionMessage,
                                            completionDocumentUrl = task.completionDocumentUrl,
                                            beforeImageUrl = task.beforeImageUrl,
                                            afterImageUrl = task.afterImageUrl,
                                            beforeLatitude = task.beforeLatitude,
                                            beforeLongitude = task.beforeLongitude,
                                            afterLatitude = task.afterLatitude,
                                            afterLongitude = task.afterLongitude,
                                            completedAt = task.completedAt,
                                            createdAt = task.createdAt,
                                            updatedAt = task.updatedAt,
                                            isSynced = true,
                                            invoiceJson = task.invoice?.let { gson.toJson(it) },
                                            taskType = task.taskType,
                                            imagesJson = (task.sitePhotos ?: task.images ?: images)?.let { gson.toJson(it) },
                                            sitePhotosJson = (task.sitePhotos ?: task.images ?: images)?.let { gson.toJson(it) },
                                            beforeImagesJson = beforeImages?.let { gson.toJson(it) },
                                            afterImagesJson = afterImages?.let { gson.toJson(it) },
                                            assignedEmployeeName = task.assignedEmployeeName,
                                            assignedEmployeePhone = task.assignedEmployeePhone
                                        )
                                        taskDao.updateTask(entity)
                                    } else {
                                        val localTask = taskDao.getTaskById(taskId)
                                        if (localTask != null) {
                                            taskDao.updateTask(localTask.copy(status = "completed", isSynced = true))
                                        }
                                    }
                                    true
                                } else {
                                    false
                                }
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
                    Log.e("TASK_SYNC", "Exception while syncing item ${item.id}: ${e.message}", e)
                    false
                }

                if (success) {
                    filesToDelete.forEach { filePath ->
                        LocalFileHelper.deleteFile(filePath)
                    }
                    outboxQueueDao.updateItem(item.copy(isSynced = true))
                    outboxQueueDao.deleteItem(item)
                    Log.d("TASK_SYNC", "Successfully synced and removed item ${item.id}")
                } else {
                    val updatedItem = item.copy(retryCount = item.retryCount + 1)
                    outboxQueueDao.updateItem(updatedItem)
                    Log.d("TASK_SYNC", "Failed to sync item ${item.id}; incremented retryCount to ${updatedItem.retryCount}")
                    hasFailure = true
                }
            }

            if (hasFailure) {
                Log.d("TASK_SYNC", "SyncWorker completed with failures; requesting retry")
                Result.retry()
            } else {
                Log.d("TASK_SYNC", "SyncWorker completed successfully")
                Result.success()
            }
        } catch (e: Exception) {
            Log.e("TASK_SYNC", "SyncWorker failed with exception: ${e.message}", e)
            Result.failure()
        }
    }
}
