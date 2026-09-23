package com.swayog.employee.data.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.swayog.employee.core.util.LocalFileHelper
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.DailyCommitDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.dao.TaskDao
import com.swayog.employee.data.local.entity.DailyCommitEntity
import com.swayog.employee.data.local.entity.TaskEntity
import com.swayog.employee.data.model.*
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import org.json.JSONObject

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val outboxQueueDao: OutboxQueueDao,
    private val taskDao: TaskDao,
    private val dailyCommitDao: DailyCommitDao,
    private val apiService: ApiService,
    private val dataStoreManager: com.swayog.employee.data.local.preferences.DataStoreManager
) : CoroutineWorker(appContext, workerParams) {

    private val gson = Gson()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            var hasFailure = false

            // 1. Check pending face enrollment sync
            try {
                val faceSyncStatus = dataStoreManager.faceEnrollmentSyncStatus.first()
                if (faceSyncStatus == "PENDING" || faceSyncStatus == "FAILED") {
                    val descriptors = dataStoreManager.faceDescriptors.first()
                    if (descriptors.size >= 3) {
                        Log.d("TASK_SYNC", "SyncWorker attempting to sync pending face enrollment")
                        val req = FaceEnrollRequest(
                            descriptor1 = descriptors[0],
                            descriptor2 = descriptors[1],
                            descriptor3 = descriptors[2],
                            source = "MOBILE"
                        )
                        val res = apiService.enrollFace(req)
                        if (res.isSuccessful && res.body()?.success == true) {
                            val body = res.body()!!
                            val currentVersion = dataStoreManager.faceEnrollmentVersion.first()
                            dataStoreManager.saveFaceEnrollment(
                                descriptor1 = descriptors[0],
                                descriptor2 = descriptors[1],
                                descriptor3 = descriptors[2],
                                enrollmentId = body.enrollmentId,
                                syncVersion = body.syncVersion ?: (currentVersion + 1),
                                updatedAt = body.enrolledAt,
                                syncStatus = "SYNCED"
                            )
                            Log.d("TASK_SYNC", "SyncWorker successfully uploaded pending face enrollment")
                        } else {
                            hasFailure = true
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("TASK_SYNC", "Failed to sync pending face enrollment: ${e.message}", e)
                hasFailure = true
            }

            val pendingItems = outboxQueueDao.getPendingItems()
            Log.d("TASK_SYNC", "SyncWorker started with ${pendingItems.size} pending outbox item(s)")

            for (item in pendingItems) {
                Log.d("TASK_SYNC", "Processing outbox item ${item.id} endpoint=${item.endpoint} method=${item.method} retryCount=${item.retryCount}")
                val filesToDelete = mutableListOf<String>()
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
                                val beforeImageFilePath = if (json.isNull("beforeImageFilePath")) null else json.optString("beforeImageFilePath")
                                val afterImageFilePath = if (json.isNull("afterImageFilePath")) null else json.optString("afterImageFilePath")
                                
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

                                val clientUploadId = item.clientUploadId ?: json.optString("clientUploadId").takeIf { it.isNotEmpty() }
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
                                    afterImages = afterImages,
                                    clientUploadId = clientUploadId
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
                            
                            val selfieFilePath = if (json.isNull("selfieFilePath")) null else json.optString("selfieFilePath")
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
                            if (response.isSuccessful && response.body()?.data != null) {
                                val commit = response.body()!!.data!!
                                val nowStr = java.time.LocalDateTime.now().toString()
                                val entity = DailyCommitEntity(
                                    id = commit.id,
                                    employeeId = commit.employeeId,
                                    commitDate = commit.commitDate,
                                    taskWorkedOn = commit.taskWorkedOn,
                                    workSummary = commit.workSummary,
                                    hoursSpent = commit.hoursSpent,
                                    issuesBlockers = commit.issuesBlockers,
                                    tomorrowPlan = commit.tomorrowPlan,
                                    attachmentUrl = commit.attachmentUrl,
                                    submittedAt = commit.submittedAt ?: commit.createdAt ?: nowStr,
                                    createdAt = commit.createdAt ?: commit.submittedAt ?: nowStr,
                                    isSynced = true
                                )
                                dailyCommitDao.deleteUnsyncedByDate(commit.commitDate)
                                dailyCommitDao.insertDailyCommit(entity)
                            }
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
            Result.retry()
        }
    }
}
