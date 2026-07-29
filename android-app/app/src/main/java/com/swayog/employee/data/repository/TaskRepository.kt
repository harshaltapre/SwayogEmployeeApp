package com.swayog.employee.data.repository

import android.content.Context
import androidx.work.*
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.TaskDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.entity.TaskEntity
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.model.*
import com.swayog.employee.core.util.ErrorUtils
import com.swayog.employee.core.util.OfflinePendingException
import com.swayog.employee.core.util.LocalFileHelper
import com.swayog.employee.core.util.NetworkUtils
import com.swayog.employee.data.sync.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val taskDao: TaskDao,
    private val outboxQueueDao: OutboxQueueDao,
    private val apiService: ApiService
) {
    
    fun getTasksByEmployeeId(employeeUserId: String): Flow<List<Task>> {
        return taskDao.getTasksByEmployeeId(employeeUserId).map { entities ->
            entities.map { entity ->
                Task(
                    id = entity.id,
                    jobType = entity.jobType,
                    description = entity.description,
                    customerName = entity.customerName,
                    customerPhone = entity.customerPhone,
                    address = entity.address,
                    latitude = entity.latitude,
                    longitude = entity.longitude,
                    status = entity.status,
                    scheduledTime = entity.scheduledTime,
                    employeeUserId = entity.employeeUserId,
                    assignedById = entity.assignedById,
                    completionMessage = entity.completionMessage,
                    completionDocumentUrl = entity.completionDocumentUrl,
                    beforeImageUrl = entity.beforeImageUrl,
                    afterImageUrl = entity.afterImageUrl,
                    beforeLatitude = entity.beforeLatitude,
                    beforeLongitude = entity.beforeLongitude,
                    afterLatitude = entity.afterLatitude,
                    afterLongitude = entity.afterLongitude,
                    completedAt = entity.completedAt,
                    createdAt = entity.createdAt,
                    updatedAt = entity.updatedAt
                )
            }
        }
    }
    
    fun getActiveTasksByEmployeeId(employeeUserId: String): Flow<List<Task>> {
        return taskDao.getActiveTasksByEmployeeId(employeeUserId).map { entities ->
            entities.map { entity ->
                Task(
                    id = entity.id,
                    jobType = entity.jobType,
                    description = entity.description,
                    customerName = entity.customerName,
                    customerPhone = entity.customerPhone,
                    address = entity.address,
                    latitude = entity.latitude,
                    longitude = entity.longitude,
                    status = entity.status,
                    scheduledTime = entity.scheduledTime,
                    employeeUserId = entity.employeeUserId,
                    assignedById = entity.assignedById,
                    completionMessage = entity.completionMessage,
                    completionDocumentUrl = entity.completionDocumentUrl,
                    beforeImageUrl = entity.beforeImageUrl,
                    afterImageUrl = entity.afterImageUrl,
                    beforeLatitude = entity.beforeLatitude,
                    beforeLongitude = entity.beforeLongitude,
                    afterLatitude = entity.afterLatitude,
                    afterLongitude = entity.afterLongitude,
                    completedAt = entity.completedAt,
                    createdAt = entity.createdAt,
                    updatedAt = entity.updatedAt
                )
            }
        }
    }

    val pendingSyncCount: Flow<Int> = outboxQueueDao.getPendingCountFlow()

    fun getAllTasksFlow(): Flow<List<Task>> {
        return taskDao.getAllTasks().map { entities ->
            entities.map { entity ->
                Task(
                    id = entity.id,
                    jobType = entity.jobType,
                    description = entity.description,
                    customerName = entity.customerName,
                    customerPhone = entity.customerPhone,
                    address = entity.address,
                    latitude = entity.latitude,
                    longitude = entity.longitude,
                    status = entity.status,
                    scheduledTime = entity.scheduledTime,
                    employeeUserId = entity.employeeUserId,
                    assignedById = entity.assignedById,
                    completionMessage = entity.completionMessage,
                    completionDocumentUrl = entity.completionDocumentUrl,
                    beforeImageUrl = entity.beforeImageUrl,
                    afterImageUrl = entity.afterImageUrl,
                    beforeLatitude = entity.beforeLatitude,
                    beforeLongitude = entity.beforeLongitude,
                    afterLatitude = entity.afterLatitude,
                    afterLongitude = entity.afterLongitude,
                    completedAt = entity.completedAt,
                    createdAt = entity.createdAt,
                    updatedAt = entity.updatedAt
                )
            }
        }
    }
    
    suspend fun refreshTasks(employeeUserId: String): Result<List<Task>> {
        return try {
            val response = apiService.getTasks(employeeUserId)
            if (response.isSuccessful && response.body()?.data != null) {
                val tasks = response.body()!!.data!!
                withContext(Dispatchers.IO) {
                    val entities = tasks.map { task ->
                        TaskEntity(
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
                            isSynced = true
                        )
                    }
                    taskDao.insertTasks(entities)
                }
                Result.success(tasks)
            } else {
                val localTasks = try { taskDao.getTasksByEmployeeIdDirect(employeeUserId).map { it.toTask() } } catch (_: Exception) { emptyList() }
                if (localTasks.isNotEmpty()) {
                    Result.success(localTasks)
                } else {
                    Result.failure(Exception("Failed to refresh tasks: ${ErrorUtils.formatResponseError(response)}"))
                }
            }
        } catch (e: Exception) {
            val localTasks = try { taskDao.getTasksByEmployeeIdDirect(employeeUserId).map { it.toTask() } } catch (_: Exception) { emptyList() }
            if (localTasks.isNotEmpty()) {
                Result.success(localTasks)
            } else {
                Result.failure(Exception("Failed to refresh tasks: ${ErrorUtils.formatException(e)}"))
            }
        }
    }
    
    suspend fun getAllTasks(
        employeeUserId: String? = null,
        status: String? = null
    ): Result<List<Task>> {
        return try {
            val response = apiService.getTasks(employeeUserId, status)
            if (response.isSuccessful && response.body()?.data != null) {
                val tasks = response.body()!!.data!!
                withContext(Dispatchers.IO) {
                    val entities = tasks.map { task ->
                        TaskEntity(
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
                            isSynced = true
                        )
                    }
                    taskDao.insertTasks(entities)
                }
                Result.success(tasks)
            } else {
                Result.failure(Exception("Failed to fetch all tasks: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch all tasks: ${ErrorUtils.formatException(e)}"))
        }
    }
    
    suspend fun updateTaskStatus(taskId: String, status: String): Result<Task> {
        if (taskId.startsWith("amc_")) {
            val visitId = taskId.replace("amc_", "")
            val updateReq = UpdateAmcVisitRequest(status = if (status.lowercase() == "completed") "COMPLETED" else "PENDING")
            return try {
                val response = apiService.updateAmcVisit(visitId, updateReq)
                if (response.isSuccessful && response.body()?.data != null) {
                    val visit = response.body()!!.data!!
                    val updatedTask = Task(
                        id = taskId,
                        jobType = "AMC",
                        description = visit.visitNotes ?: "AMC Cleaning Visit",
                        customerName = visit.customer?.fullName ?: "AMC Customer",
                        customerPhone = visit.customer?.phoneNumber ?: "",
                        address = visit.customer?.address ?: visit.customer?.city ?: "",
                        status = visit.status.lowercase(),
                        scheduledTime = visit.scheduledDate,
                        employeeUserId = visit.assignedEmployeeId,
                        assignedById = "system",
                        completedAt = visit.completedAt,
                        createdAt = visit.createdAt,
                        updatedAt = visit.updatedAt
                    )
                    val entity = TaskEntity(
                        id = taskId,
                        jobType = "AMC",
                        description = updatedTask.description,
                        customerName = updatedTask.customerName,
                        customerPhone = updatedTask.customerPhone,
                        address = updatedTask.address,
                        status = updatedTask.status,
                        scheduledTime = updatedTask.scheduledTime,
                        employeeUserId = updatedTask.employeeUserId,
                        assignedById = updatedTask.assignedById,
                        completedAt = updatedTask.completedAt,
                        createdAt = updatedTask.createdAt,
                        updatedAt = updatedTask.updatedAt,
                        isSynced = true
                    )
                    taskDao.updateTask(entity)
                    Result.success(updatedTask)
                } else {
                    Result.failure(Exception("Failed to update AMC visit status"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
        return try {
            val response = apiService.updateTask(
                taskId,
                UpdateTaskRequest(status = status)
            )
            if (response.isSuccessful && response.body()?.data != null) {
                val task = response.body()!!.data!!
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
                    completedAt = task.completedAt,
                    createdAt = task.createdAt,
                    updatedAt = task.updatedAt,
                    isSynced = true
                )
                taskDao.updateTask(entity)
                Result.success(task)
            } else {
                // Add to outbox queue for offline sync
                val outboxItem = OutboxQueueEntity(
                    id = UUID.randomUUID().toString(),
                    endpoint = "tasks/$taskId",
                    method = "PATCH",
                    payload = """{"status":"$status"}""",
                    createdAt = System.currentTimeMillis().toString()
                )
                outboxQueueDao.insertItem(outboxItem)
                
                // Update local entity
                val localTask = taskDao.getTaskById(taskId)
                if (localTask != null) {
                    taskDao.updateTask(localTask.copy(status = status, isSynced = false))
                }
                
                // Trigger background sync when online
                scheduleSync()
                
                Result.failure(Exception("Failed to update task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun completeTask(
        taskId: String,
        completionMessage: String,
        completionDocumentUrl: String?,
        beforeImageUrl: String? = null,
        afterImageUrl: String? = null,
        beforeLatitude: Double? = null,
        beforeLongitude: Double? = null,
        afterLatitude: Double? = null,
        afterLongitude: Double? = null
    ): Result<Task> {
        if (taskId.startsWith("amc_")) {
            val visitId = taskId.replace("amc_", "")
            val body = mapOf(
                "notes" to completionMessage,
                "visitNotes" to completionMessage,
                "beforeImageUrl" to beforeImageUrl,
                "afterImageUrl" to afterImageUrl
            )
            return try {
                val response = apiService.markAmcVisitDone(visitId, body)
                if (response.isSuccessful && response.body()?.data != null) {
                    val visit = response.body()!!.data!!
                    val completedTask = Task(
                        id = taskId,
                        jobType = "AMC",
                        description = visit.visitNotes ?: "AMC Visit",
                        customerName = visit.customer?.fullName ?: "AMC Customer",
                        customerPhone = visit.customer?.phoneNumber ?: "",
                        address = visit.customer?.address ?: visit.customer?.city ?: "",
                        status = "completed",
                        scheduledTime = visit.scheduledDate,
                        employeeUserId = visit.assignedEmployeeId,
                        assignedById = "system",
                        completionMessage = completionMessage,
                        beforeImageUrl = beforeImageUrl,
                        afterImageUrl = afterImageUrl,
                        completedAt = visit.completedAt,
                        createdAt = visit.createdAt,
                        updatedAt = visit.updatedAt
                    )
                    val entity = TaskEntity(
                        id = taskId,
                        jobType = "AMC",
                        description = completedTask.description,
                        customerName = completedTask.customerName,
                        customerPhone = completedTask.customerPhone,
                        address = completedTask.address,
                        status = "completed",
                        scheduledTime = completedTask.scheduledTime,
                        employeeUserId = completedTask.employeeUserId,
                        assignedById = completedTask.assignedById,
                        completionMessage = completionMessage,
                        beforeImageUrl = beforeImageUrl,
                        afterImageUrl = afterImageUrl,
                        completedAt = completedTask.completedAt,
                        createdAt = completedTask.createdAt,
                        updatedAt = completedTask.updatedAt,
                        isSynced = true
                    )
                    taskDao.updateTask(entity)
                    Result.success(completedTask)
                } else {
                    Result.failure(Exception("Failed to complete AMC visit"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
        val isOnline = NetworkUtils.isNetworkAvailable(context)
        
        return if (isOnline) {
            try {
                val req = CompleteTaskRequest(
                    message = completionMessage, 
                    documentUrl = completionDocumentUrl,
                    beforeImageUrl = beforeImageUrl,
                    afterImageUrl = afterImageUrl,
                    beforeLatitude = beforeLatitude,
                    beforeLongitude = beforeLongitude,
                    afterLatitude = afterLatitude,
                    afterLongitude = afterLongitude
                )
                android.util.Log.d("TaskSubmissionChain", "LOG 3 - Immediately Before API Call: Endpoint=PATCH tasks/$taskId/complete, RequestBody={beforeImgLen=${req.beforeImageUrl?.length}, afterImgLen=${req.afterImageUrl?.length}, message=${req.message}}")
                val response = apiService.completeTask(taskId, req)
                android.util.Log.d("TaskSubmissionChain", "LOG 4 - API Call Returned: statusCode=${response.code()}, isSuccessful=${response.isSuccessful}, responseBodyDataBeforeImg=${response.body()?.data?.beforeImageUrl}, responseBodyDataAfterImg=${response.body()?.data?.afterImageUrl}")
                if (response.isSuccessful && response.body()?.data != null) {
                    val task = response.body()!!.data!!
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
                        isSynced = true
                    )
                    taskDao.updateTask(entity)
                    Result.success(task)
                } else {
                    // API call failed - save to outbox queue for offline sync
                    saveTaskCompletionToOutbox(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude)
                    Result.failure(OfflinePendingException())
                }
            } catch (e: Exception) {
                // Network error - save to outbox queue for offline sync
                saveTaskCompletionToOutbox(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude)
                Result.failure(OfflinePendingException())
            }
        } else {
            // Offline - save to outbox queue
            saveTaskCompletionToOutbox(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude)
            
            // Update local entity with completion data
            val localTask = taskDao.getTaskById(taskId)
            if (localTask != null) {
                taskDao.updateTask(localTask.copy(
                    status = "completed",
                    completionMessage = completionMessage,
                    completionDocumentUrl = completionDocumentUrl,
                    beforeImageUrl = beforeImageUrl,
                    afterImageUrl = afterImageUrl,
                    beforeLatitude = beforeLatitude,
                    beforeLongitude = beforeLongitude,
                    afterLatitude = afterLatitude,
                    afterLongitude = afterLongitude,
                    completedAt = java.time.LocalDateTime.now().toString(),
                    isSynced = false
                ))
            }
            
            Result.failure(OfflinePendingException())
        }
    }
    
    private suspend fun saveTaskCompletionToOutbox(
        taskId: String,
        completionMessage: String,
        completionDocumentUrl: String?,
        beforeImageUrl: String?,
        afterImageUrl: String?,
        beforeLatitude: Double?,
        beforeLongitude: Double?,
        afterLatitude: Double?,
        afterLongitude: Double?
    ) {
        val beforeImageFilePath = beforeImageUrl?.let { LocalFileHelper.saveBase64ToFile(context, it, "task_before") }
        val afterImageFilePath = afterImageUrl?.let { LocalFileHelper.saveBase64ToFile(context, it, "task_after") }

        val payload = JSONObject().apply {
            put("taskId", taskId)
            put("message", completionMessage)
            put("documentUrl", completionDocumentUrl)
            put("beforeImageFilePath", beforeImageFilePath)
            put("afterImageFilePath", afterImageFilePath)
            put("beforeLatitude", beforeLatitude)
            put("beforeLongitude", beforeLongitude)
            put("afterLatitude", afterLatitude)
            put("afterLongitude", afterLongitude)
        }.toString()
        
        val outboxItem = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "tasks/$taskId/complete",
            method = "POST",
            payload = payload,
            createdAt = System.currentTimeMillis().toString()
        )
        outboxQueueDao.insertItem(outboxItem)
        scheduleSync()
    }

    suspend fun submitWork(title: String, description: String, hoursSpent: Double, taskId: String?): Result<Unit> {
        return try {
            val response = apiService.submitWork(WorkSubmissionRequest(title, description, hoursSpent, taskId))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Submission failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitSurvey(
        taskId: String?,
        customerId: Int?,
        roofType: String,
        lengthFt: Double,
        widthFt: Double,
        obstacleNotes: String?,
        shadowFactors: String?,
        recommendedCapacityKw: Double,
        latitude: Double?,
        longitude: Double?
    ): Result<SurveySubmissionResponse> {
        return try {
            val request = SurveySubmissionRequest(
                taskId = taskId,
                customerId = customerId,
                roofType = roofType,
                lengthFt = lengthFt,
                widthFt = widthFt,
                obstacleNotes = obstacleNotes,
                shadowFactors = shadowFactors,
                recommendedCapacityKw = recommendedCapacityKw,
                latitude = latitude,
                longitude = longitude
            )
            val response = apiService.submitSurvey(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Survey upload failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitDesign(
        customerId: Int?,
        panelCount: Int,
        inverterModel: String,
        systemCapacityKw: Double,
        tiltAngle: Double
    ): Result<DesignSubmissionResponse> {
        return try {
            val request = DesignSubmissionRequest(
                customerId = customerId,
                panelCount = panelCount,
                inverterModel = inverterModel,
                systemCapacityKw = systemCapacityKw,
                tiltAngle = tiltAngle
            )
            val response = apiService.submitDesign(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Design upload failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun syncPendingActions(): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val pendingItems = outboxQueueDao.getPendingItems()
                if (pendingItems.isEmpty()) {
                    android.util.Log.d("TASK_SYNC", "No pending outbox items to sync.")
                    return@withContext Result.success(Unit)
                }

                android.util.Log.d("TASK_SYNC", "Syncing ${pendingItems.size} pending outbox items...")
                var syncedCount = 0

                for (item in pendingItems) {
                    val success = try {
                        when {
                            item.endpoint.contains("complete") -> {
                                val json = org.json.JSONObject(item.payload)
                                val taskId = json.optString("taskId").ifEmpty {
                                    item.endpoint.removePrefix("tasks/").removeSuffix("/complete")
                                }
                                if (taskId.startsWith("amc_")) {
                                    val visitId = taskId.removePrefix("amc_")
                                    val msg = json.optString("message", "")
                                    val response = apiService.updateAmcVisit(visitId, UpdateAmcVisitRequest(status = "COMPLETED", notes = msg))
                                    response.isSuccessful
                                } else {
                                    val request = CompleteTaskRequest(
                                        message = json.optString("message"),
                                        documentUrl = json.optString("documentUrl").takeIf { it.isNotEmpty() },
                                        beforeImageUrl = json.optString("beforeImageUrl").takeIf { it.isNotEmpty() },
                                        afterImageUrl = json.optString("afterImageUrl").takeIf { it.isNotEmpty() }
                                    )
                                    val response = apiService.completeTask(taskId, request)
                                    response.isSuccessful
                                }
                            }
                            item.endpoint.startsWith("tasks/") || item.endpoint.contains("status") -> {
                                val taskId = item.endpoint.removePrefix("tasks/").removeSuffix("/status")
                                val json = org.json.JSONObject(item.payload)
                                val status = json.optString("status")
                                if (taskId.startsWith("amc_")) {
                                    val visitId = taskId.removePrefix("amc_")
                                    val response = apiService.updateAmcVisit(visitId, UpdateAmcVisitRequest(status = if (status.lowercase() == "completed") "COMPLETED" else "PENDING"))
                                    response.isSuccessful
                                } else {
                                    val response = apiService.updateTask(taskId, UpdateTaskRequest(status = status))
                                    response.isSuccessful
                                }
                            }
                            item.endpoint.contains("check-in") -> {
                                val json = org.json.JSONObject(item.payload)
                                val request = CheckInRequest(
                                    selfie = json.optString("selfie").takeIf { it.isNotEmpty() },
                                    latitude = json.optDouble("latitude").takeIf { !json.isNull("latitude") },
                                    longitude = json.optDouble("longitude").takeIf { !json.isNull("longitude") }
                                )
                                val response = apiService.checkIn(request)
                                response.isSuccessful
                            }
                            item.endpoint.contains("daily-commits") -> {
                                val json = org.json.JSONObject(item.payload)
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
                            else -> true
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("TASK_SYNC", "Failed to process outbox item ${item.id}: ${e.message}")
                        false
                    }

                    if (success || item.retryCount >= 3) {
                        outboxQueueDao.deleteItem(item)
                        syncedCount++
                        android.util.Log.d("TASK_SYNC", "Cleared item ${item.id} (success=$success, retryCount=${item.retryCount})")
                    } else {
                        outboxQueueDao.updateItem(item.copy(retryCount = item.retryCount + 1))
                    }
                }

                scheduleSync()
                android.util.Log.d("TASK_SYNC", "Sync completed. Cleared $syncedCount of ${pendingItems.size} items.")
                Result.success(Unit)
            } catch (e: Exception) {
                android.util.Log.e("TASK_SYNC", "syncPendingActions exception: ${e.message}", e)
                Result.failure(e)
            }
        }
    }

    private fun scheduleSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "offline_sync_work",
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )
    }
}
