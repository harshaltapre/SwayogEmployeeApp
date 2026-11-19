package com.swayog.employee.data.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.swayog.employee.core.util.LocalFileHelper
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.AttendanceDao
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
    private val attendanceDao: AttendanceDao,
    private val apiService: ApiService,
    private val dataStoreManager: com.swayog.employee.data.local.preferences.DataStoreManager
) : CoroutineWorker(appContext, workerParams) {

    private val gson = Gson()

    companion object {
        private const val MAX_DRAIN_PASSES = 5
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val currentUserId = dataStoreManager.userId.first()
            if (currentUserId.isNullOrBlank()) {
                Log.d("TASK_SYNC", "SyncWorker skipped: no authenticated user session")
                return@withContext Result.success()
            }

            var hasFailure = false
            var lastSyncError: String? = null
            var lastHttpCode: Int? = null
            var syncedAnyAttendance = false

            // 1. Check pending face enrollment sync (scoped to current user)
            try {
                val faceSyncStatus = dataStoreManager.faceEnrollmentSyncStatus.first()
                if (faceSyncStatus == "PENDING" || faceSyncStatus == "FAILED") {
                    val descriptors = dataStoreManager.faceDescriptors.first()
                    val validDescriptors = descriptors.size == 3 && descriptors.all {
                        com.swayog.employee.data.local.preferences.DataStoreManager.isValidFaceDescriptor(
                            it,
                            com.swayog.employee.presentation.attendance.face.FaceEmbeddingHelper.EMBEDDING_DIMENSION
                        )
                    }
                    if (validDescriptors) {
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
                            lastHttpCode = res.code()
                            lastSyncError = "Face enrollment sync failed (HTTP ${res.code()})"
                        }
                    } else if (descriptors.isNotEmpty()) {
                        Log.e("TASK_SYNC", "Refusing to sync invalid local face descriptor set")
                        dataStoreManager.setFaceSyncStatus("FAILED")
                    }
                }
            } catch (e: Exception) {
                Log.e("TASK_SYNC", "Failed to sync pending face enrollment: ${e.message}", e)
                hasFailure = true
                lastSyncError = e.message ?: "Face enrollment sync exception"
            }

            // 2. Drain outbox items strictly owned by currentUserId.
            // Loop to pick up any items newly enqueued while earlier items were syncing
            // (eliminates the WorkManager ExistingWorkPolicy.KEEP exit race).
            val attemptedIds = mutableSetOf<String>()
            var pass = 0
            while (pass < MAX_DRAIN_PASSES) {
                pass++
                val activeUserNow = dataStoreManager.userId.first()
                if (activeUserNow.isNullOrBlank() || activeUserNow != currentUserId) {
                    Log.w("TASK_SYNC", "Active user changed during sync; aborting remaining items safely")
                    break
                }

                val pendingItems = outboxQueueDao.getPendingItemsForUser(currentUserId)
                    .filter { it.id !in attemptedIds }
                if (pendingItems.isEmpty()) {
                    break
                }

                Log.d("TASK_SYNC", "SyncWorker pass $pass processing ${pendingItems.size} item(s) for user=$currentUserId")

                for (item in pendingItems) {
                    attemptedIds.add(item.id)
                    if (item.ownerUserId.isBlank() || item.ownerUserId != currentUserId) {
                        Log.w("TASK_SYNC", "Skipping quarantined or cross-user outbox item ${item.id}")
                        continue
                    }

                    Log.d("TASK_SYNC", "Processing outbox item ${item.id} endpoint=${item.endpoint} method=${item.method} retryCount=${item.retryCount}")
                    val filesToDelete = mutableListOf<String>()
                    var itemError: String? = null
                    val success = try {
                        when {
                            item.endpoint.startsWith("tasks/") && item.method == "PATCH" -> {
                                val taskId = item.endpoint.substringAfter("tasks/")
                                if (taskId.isNotEmpty()) {
                                    val json = JSONObject(item.payload)
                                    val status = json.optString("status")
                                    val response = apiService.updateTask(taskId, UpdateTaskRequest(status = status))
                                    lastHttpCode = response.code()
                                    if (response.isSuccessful) {
                                        val localTask = taskDao.getTaskById(taskId)
                                        if (localTask != null) {
                                            taskDao.updateTask(localTask.copy(status = status, isSynced = true))
                                        }
                                        true
                                    } else {
                                        itemError = "HTTP ${response.code()}"
                                        false
                                    }
                                } else {
                                    itemError = "Empty taskId"
                                    false
                                }
                            }
                            item.endpoint.contains("complete") && (item.method == "POST" || item.method == "PATCH") -> {
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

                                    val maintenanceVideoFilePathsArray = json.optJSONArray("maintenanceVideoFilePaths")
                                    val maintenanceVideoFilePaths = if (maintenanceVideoFilePathsArray != null) {
                                        List(maintenanceVideoFilePathsArray.length()) { maintenanceVideoFilePathsArray.getString(it) }
                                    } else null
                                    val maintenanceVideos = maintenanceVideoFilePaths?.mapNotNull { 
                                        filesToDelete.add(it)
                                        LocalFileHelper.readFileToBase64(it)
                                    } ?: run {
                                        val payloadVideos = json.optJSONArray("maintenanceVideos")
                                        if (payloadVideos != null) {
                                            List(payloadVideos.length()) { index -> payloadVideos.getString(index) }
                                                .filter { it.isNotBlank() }
                                        } else null
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
                                        maintenanceVideos = maintenanceVideos,
                                        clientUploadId = clientUploadId
                                    )
                                    val response = apiService.completeTask(taskId, request)
                                    lastHttpCode = response.code()
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
                                                maintenanceVideosJson = task.maintenanceVideos?.filter { it.isNotBlank() }?.let { gson.toJson(it) },
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
                                        itemError = "HTTP ${response.code()}"
                                        false
                                    }
                                } else {
                                    itemError = "Empty taskId"
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

                                val idempotencyKey = item.clientUploadId
                                    ?: json.optString("clientUploadId").takeIf { it.isNotBlank() }
                                    ?: item.id
                                
                                val request = CheckInRequest(
                                    selfie = selfie,
                                    latitude = json.optDouble("latitude").takeIf { !json.isNull("latitude") },
                                    longitude = json.optDouble("longitude").takeIf { !json.isNull("longitude") },
                                    matchConfidence = json.optDouble("matchConfidence").takeIf { !json.isNull("matchConfidence") }?.toFloat(),
                                    accuracy = json.optDouble("accuracy").takeIf { !json.isNull("accuracy") },
                                    verificationToken = json.optString("verificationToken").takeIf { it.isNotBlank() },
                                    clientUploadId = idempotencyKey
                                )
                                val response = apiService.checkIn(request, idempotencyKey)
                                lastHttpCode = response.code()
                                val errStr = if (!response.isSuccessful) {
                                    try { response.errorBody()?.string().orEmpty() } catch (_: Exception) { "" }
                                } else ""
                                val isAlreadyDone = (response.code() == 409 || response.code() == 400) &&
                                    errStr.contains("Already checked in", ignoreCase = true)
                                if (response.isSuccessful || isAlreadyDone) {
                                    syncedAnyAttendance = true
                                    true
                                } else {
                                    itemError = "HTTP ${response.code()}: ${errStr.take(120)}"
                                    false
                                }
                            }
                            item.endpoint.contains("check-out") && item.method == "POST" -> {
                                val json = try { JSONObject(item.payload) } catch (_: Exception) { JSONObject() }
                                val idempotencyKey = item.clientUploadId
                                    ?: json.optString("clientUploadId").takeIf { it.isNotBlank() }
                                    ?: item.id
                                val response = apiService.checkOut(
                                    request = CheckOutRequest(clientUploadId = idempotencyKey),
                                    idempotencyKey = idempotencyKey
                                )
                                lastHttpCode = response.code()
                                val errStr = if (!response.isSuccessful) {
                                    try { response.errorBody()?.string().orEmpty() } catch (_: Exception) { "" }
                                } else ""
                                val isAlreadyDone = (response.code() == 409 || response.code() == 400) &&
                                    errStr.contains("Already checked out", ignoreCase = true)
                                if (response.isSuccessful || isAlreadyDone) {
                                    val todayRecord = attendanceDao.getTodayAttendance(currentUserId)
                                    if (todayRecord != null) {
                                        attendanceDao.updateAttendance(todayRecord.copy(isSynced = true))
                                    }
                                    syncedAnyAttendance = true
                                    true
                                } else {
                                    itemError = "HTTP ${response.code()}: ${errStr.take(120)}"
                                    false
                                }
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
                                lastHttpCode = response.code()
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
                                    true
                                } else {
                                    itemError = "HTTP ${response.code()}"
                                    false
                                }
                            }
                            else -> {
                                itemError = "Unsupported outbox endpoint: ${item.endpoint}"
                                false
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("TASK_SYNC", "Exception while syncing item ${item.id}: ${e.message}", e)
                        itemError = e.message ?: e.javaClass.simpleName
                        false
                    }

                    if (success) {
                        filesToDelete.forEach { filePath ->
                            LocalFileHelper.deleteFile(filePath)
                        }
                        outboxQueueDao.updateItem(item.copy(isSynced = true, lastError = null, lastAttemptAt = System.currentTimeMillis()))
                        outboxQueueDao.deleteItem(item)
                        Log.d("TASK_SYNC", "Successfully synced and removed item ${item.id}")
                    } else {
                        val updatedItem = item.copy(
                            retryCount = item.retryCount + 1,
                            lastError = itemError?.take(250),
                            lastAttemptAt = System.currentTimeMillis()
                        )
                        outboxQueueDao.updateItem(updatedItem)
                        Log.d("TASK_SYNC", "Failed to sync item ${item.id}; retryCount=${updatedItem.retryCount} error=$itemError")
                        hasFailure = true
                        lastSyncError = itemError
                    }
                }
            }

            // Reconcile today's attendance from server if any attendance operation synced
            if (syncedAnyAttendance) {
                reconcileTodayAttendance(currentUserId)
            }

            // Record local sync health & best-effort report to backend monitor
            if (hasFailure) {
                dataStoreManager.recordSyncFailure(
                    error = lastSyncError ?: "One or more outbox items failed to sync",
                    httpCode = lastHttpCode,
                    status = "DEGRADED"
                )
            } else {
                dataStoreManager.recordSyncSuccess(httpCode = lastHttpCode ?: 200)
            }
            reportSyncHealthBestEffort(currentUserId)

            if (hasFailure) {
                Log.d("TASK_SYNC", "SyncWorker completed with failures; requesting retry")
                Result.retry()
            } else {
                Log.d("TASK_SYNC", "SyncWorker completed successfully")
                Result.success()
            }
        } catch (e: Exception) {
            Log.e("TASK_SYNC", "SyncWorker failed with exception: ${e.message}", e)
            dataStoreManager.recordSyncFailure(e.message ?: "SyncWorker exception", status = "FAILED")
            Result.retry()
        }
    }

    private suspend fun reconcileTodayAttendance(userId: String) {
        try {
            val todayResp = apiService.getTodayAttendance()
            if (todayResp.isSuccessful && todayResp.body()?.record != null) {
                val record = todayResp.body()!!.record!!
                val dateKey = if (record.date.length >= 10) record.date.substring(0, 10) else record.date
                val existingLoc = try { attendanceDao.getTodayAttendance(userId, dateKey)?.checkInLocation } catch (_: Exception) { null }
                val locStr = if (record.latitude != null && record.longitude != null) {
                    "Lat ${record.latitude}, Lng ${record.longitude}"
                } else existingLoc
                attendanceDao.deleteStaleTodayRowsExcludingId(userId, dateKey, record.id)
                attendanceDao.insertAttendance(
                    com.swayog.employee.data.local.entity.AttendanceEntity(
                        id = record.id,
                        employeeId = userId,
                        date = dateKey,
                        checkInTime = record.checkInTime,
                        checkOutTime = record.checkOutTime,
                        totalMinutes = record.totalMinutes,
                        status = record.status,
                        notes = record.notes,
                        checkInSelfieUrl = null,
                        checkInLocation = locStr,
                        isSynced = true,
                        source = record.source,
                        manualOverride = record.manualOverride,
                        reviewedBy = record.reviewedBy,
                        reviewerName = record.reviewerName,
                        isAttendanceCompleted = record.isAttendanceCompleted
                    )
                )
            }
        } catch (e: Exception) {
            Log.w("TASK_SYNC", "Post-sync attendance reconciliation skipped: ${e.message}")
        }
    }

    private suspend fun reportSyncHealthBestEffort(userId: String) {
        try {
            val snapshot = dataStoreManager.getSyncHealthSnapshot()
            val pendingCount = outboxQueueDao.getPendingCountForUser(userId)
            val failedCount = outboxQueueDao.getFailedCountForUser(userId)
            val pInfo = applicationContext.packageManager.getPackageInfo(applicationContext.packageName, 0)
            val versionCode = androidx.core.content.pm.PackageInfoCompat.getLongVersionCode(pInfo)
            val versionName = pInfo.versionName
            apiService.reportSyncHealth(
                SyncHealthReportRequest(
                    appVersionCode = versionCode,
                    appVersionName = versionName,
                    androidVersion = android.os.Build.VERSION.RELEASE,
                    deviceModel = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}",
                    pendingOutboxCount = pendingCount,
                    failedOutboxCount = failedCount,
                    lastSuccessfulSyncAt = snapshot.lastSuccessfulSyncAt,
                    lastSyncStatus = snapshot.lastSyncStatus,
                    lastSyncError = snapshot.lastSyncError,
                    lastHttpCode = snapshot.lastHttpCode,
                    tokenRefreshFailures = snapshot.tokenRefreshFailures
                )
            )
        } catch (_: Exception) {
            // Diagnostics are strictly best-effort and must never fail sync
        }
    }
}
