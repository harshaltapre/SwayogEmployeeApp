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
import com.swayog.employee.core.util.OnlineSubmissionFailedException
import java.io.IOException
import com.swayog.employee.core.util.LocalFileHelper
import com.swayog.employee.core.util.NetworkUtils
import com.swayog.employee.data.sync.SyncWorker
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class SyncResultSummary(
    val total: Int = 0,
    val synced: Int = 0,
    val failed: Int = 0,
    val permanentlyFailed: Int = 0, // Items removed because they will never succeed (404 task not found, 403 not authorized)
    val isOffline: Boolean = false,
    val isAuthError: Boolean = false,
    val isPhotoError: Boolean = false,
    val lastError: String? = null
)

@Singleton
class TaskRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val taskDao: TaskDao,
    private val outboxQueueDao: OutboxQueueDao,
    private val apiService: ApiService
) {
    private val gson = Gson()
    
    fun getTasksByEmployeeId(employeeUserId: String): Flow<List<Task>> {
        return taskDao.getTasksByEmployeeId(employeeUserId).map { entities ->
            entities.map { it.toTask() }
        }
    }
    
    fun getActiveTasksByEmployeeId(employeeUserId: String): Flow<List<Task>> {
        return taskDao.getActiveTasksByEmployeeId(employeeUserId).map { entities ->
            entities.map { it.toTask() }
        }
    }

    val pendingSyncCount: Flow<Int> = outboxQueueDao.getPendingCountFlow()

    fun getAllTasksFlow(): Flow<List<Task>> {
        return taskDao.getAllTasks().map { entities ->
            entities.map { it.toTask() }
        }
    }
    
    suspend fun refreshTasks(employeeUserId: String): Result<List<Task>> {
        return try {
            val response = apiService.getTasks(employeeUserId)
            if (response.isSuccessful && response.body()?.data != null) {
                val tasks = response.body()!!.data!!
                withContext(Dispatchers.IO) {
                    // ── Smart Sync: Before overwriting local data with backend data,
                    // detect tasks that were completed locally (isSynced=false) but
                    // the backend still shows them as NOT completed.
                    // We re-queue their completion so the backend eventually gets updated.
                    val localUnsyncedCompleted = taskDao.getUnsyncedTasks()
                        .filter { it.status?.equals("completed", ignoreCase = true) == true }
                        .associateBy { it.id }

                    val entities = tasks.map { task ->
                        val existingLocal = taskDao.getTaskById(task.id)
                        val mergedSitePhotos = (task.sitePhotos ?: task.images)?.filter { it.isNotBlank() }
                            ?: existingLocal?.sitePhotosJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }
                            ?: existingLocal?.imagesJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }

                        val mergedTaskType = task.taskType 
                            ?: existingLocal?.taskType 
                            ?: if (!mergedSitePhotos.isNullOrEmpty()) "SITE_VISIT" else null

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
                            completionMessage = task.completionMessage ?: existingLocal?.completionMessage,
                            completionDocumentUrl = task.completionDocumentUrl ?: existingLocal?.completionDocumentUrl,
                            beforeImageUrl = task.beforeImageUrl ?: existingLocal?.beforeImageUrl,
                            afterImageUrl = task.afterImageUrl ?: existingLocal?.afterImageUrl,
                            beforeLatitude = task.beforeLatitude ?: existingLocal?.beforeLatitude,
                            beforeLongitude = task.beforeLongitude ?: existingLocal?.beforeLongitude,
                            afterLatitude = task.afterLatitude ?: existingLocal?.afterLatitude,
                            afterLongitude = task.afterLongitude ?: existingLocal?.afterLongitude,
                            completedAt = task.completedAt ?: existingLocal?.completedAt,
                            createdAt = task.createdAt,
                            updatedAt = task.updatedAt,
                            isSynced = existingLocal?.isSynced ?: true,
                            invoiceJson = task.invoice?.let { gson.toJson(it) } ?: existingLocal?.invoiceJson,
                            taskType = mergedTaskType,
                            imagesJson = mergedSitePhotos?.let { gson.toJson(it) },
                            sitePhotosJson = mergedSitePhotos?.let { gson.toJson(it) },
                            assignedEmployeeName = task.assignedEmployeeName,
                            assignedEmployeePhone = task.assignedEmployeePhone
                        )
                    }
                    taskDao.insertTasks(entities)

                    // Re-queue completions for tasks the backend still shows as not-completed
                    val pendingOutboxItems = outboxQueueDao.getPendingItems()
                    for ((localId, localTask) in localUnsyncedCompleted) {
                        val backendTask = tasks.find { it.id == localId }
                        val backendIsNotCompleted = backendTask != null &&
                            !backendTask.status.equals("completed", ignoreCase = true)
                        val alreadyInOutbox = pendingOutboxItems.any {
                            it.endpoint.contains(localId) && it.endpoint.contains("complete")
                        }

                        if (backendIsNotCompleted && !alreadyInOutbox) {
                            android.util.Log.w("TaskSync", "[TaskSync] Task $localId was completed locally but backend shows not-completed. Re-queuing submission.")
                            // Restore local completed status and re-queue for sync
                            val baseEntity = entities.find { it.id == localId } ?: localTask
                            taskDao.updateTask(baseEntity.copy(
                                status = "completed",
                                completionMessage = localTask.completionMessage,
                                completionDocumentUrl = localTask.completionDocumentUrl,
                                beforeImageUrl = localTask.beforeImageUrl,
                                afterImageUrl = localTask.afterImageUrl,
                                beforeLatitude = localTask.beforeLatitude,
                                beforeLongitude = localTask.beforeLongitude,
                                afterLatitude = localTask.afterLatitude,
                                afterLongitude = localTask.afterLongitude,
                                completedAt = localTask.completedAt,
                                imagesJson = localTask.imagesJson,
                                sitePhotosJson = localTask.sitePhotosJson,
                                isSynced = false
                            ))
                            // Re-queue outbox item using base64 data from Room DB
                            val sitePhotos = localTask.sitePhotosJson?.let {
                                try { gson.fromJson(it, Array<String>::class.java).toList() } catch (_: Exception) { null }
                            } ?: localTask.imagesJson?.let {
                                try { gson.fromJson(it, Array<String>::class.java).toList() } catch (_: Exception) { null }
                            }
                            saveTaskCompletionToOutbox(
                                taskId = localId,
                                completionMessage = localTask.completionMessage ?: "",
                                completionDocumentUrl = localTask.completionDocumentUrl,
                                beforeImageUrl = localTask.beforeImageUrl,
                                afterImageUrl = localTask.afterImageUrl,
                                beforeLatitude = localTask.beforeLatitude,
                                beforeLongitude = localTask.beforeLongitude,
                                afterLatitude = localTask.afterLatitude,
                                afterLongitude = localTask.afterLongitude,
                                taskType = localTask.taskType,
                                images = sitePhotos
                            )
                        }
                    }
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
                        val existingLocal = taskDao.getTaskById(task.id)
                        val mergedSitePhotos = (task.sitePhotos ?: task.images)?.filter { it.isNotBlank() }
                            ?: existingLocal?.sitePhotosJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }
                            ?: existingLocal?.imagesJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }

                        val mergedTaskType = task.taskType 
                            ?: existingLocal?.taskType 
                            ?: if (!mergedSitePhotos.isNullOrEmpty()) "SITE_VISIT" else null

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
                            completionMessage = task.completionMessage ?: existingLocal?.completionMessage,
                            completionDocumentUrl = task.completionDocumentUrl ?: existingLocal?.completionDocumentUrl,
                            beforeImageUrl = task.beforeImageUrl ?: existingLocal?.beforeImageUrl,
                            afterImageUrl = task.afterImageUrl ?: existingLocal?.afterImageUrl,
                            beforeLatitude = task.beforeLatitude ?: existingLocal?.beforeLatitude,
                            beforeLongitude = task.beforeLongitude ?: existingLocal?.beforeLongitude,
                            afterLatitude = task.afterLatitude ?: existingLocal?.afterLatitude,
                            afterLongitude = task.afterLongitude ?: existingLocal?.afterLongitude,
                            completedAt = task.completedAt ?: existingLocal?.completedAt,
                            createdAt = task.createdAt,
                            updatedAt = task.updatedAt,
                            isSynced = existingLocal?.isSynced ?: true,
                            invoiceJson = task.invoice?.let { gson.toJson(it) } ?: existingLocal?.invoiceJson,
                            taskType = mergedTaskType,
                            imagesJson = mergedSitePhotos?.let { gson.toJson(it) },
                            sitePhotosJson = mergedSitePhotos?.let { gson.toJson(it) },
                            assignedEmployeeName = task.assignedEmployeeName,
                            assignedEmployeePhone = task.assignedEmployeePhone
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
        val cleanTaskId = sanitizeTaskId(taskId)
        if (cleanTaskId.startsWith("amc_")) {
            val visitId = cleanTaskId.replace("amc_", "")
            val updateReq = UpdateAmcVisitRequest(status = if (status.lowercase() == "completed") "COMPLETED" else "PENDING")
            return try {
                val response = apiService.updateAmcVisit(visitId, updateReq)
                if (response.isSuccessful && response.body()?.data != null) {
                    val visit = response.body()!!.data!!
                    val updatedTask = Task(
                        id = cleanTaskId,
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
                        id = cleanTaskId,
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
                cleanTaskId,
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
    
    suspend fun createTask(
        jobType: String,
        description: String,
        customerName: String,
        customerPhone: String,
        address: String,
        latitude: Double?,
        longitude: Double?,
        scheduledTime: String,
        employeeUserId: String
    ): Result<Task> {
        return try {
            val request = CreateTaskRequest(
                jobType = jobType,
                description = description,
                customerName = customerName,
                customerPhone = customerPhone,
                address = address,
                latitude = latitude,
                longitude = longitude,
                scheduledTime = scheduledTime,
                employeeUserId = employeeUserId
            )
            val response = apiService.createTask(request)
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
                taskDao.insertTask(entity)
                Result.success(task)
            } else {
                Result.failure(Exception("Failed to create task: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to create task: ${ErrorUtils.formatException(e)}"))
        }
    }

    suspend fun rateTask(
        taskId: String,
        rating: Int,
        feedback: String?,
        fixCharges: Double?
    ): Result<Task> {
        return try {
            val request = RateTaskRequest(
                rating = rating,
                feedback = feedback,
                fixCharges = fixCharges
            )
            val response = apiService.rateTask(taskId, request)
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
                Result.failure(Exception("Failed to rate task: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to rate task: ${ErrorUtils.formatException(e)}"))
        }
    }

    private fun sanitizeTaskId(rawId: String): String {
        var cleaned = rawId.trim()
        if (cleaned.startsWith("TASK-amc_")) {
            return cleaned.removePrefix("TASK-")
        }
        if (cleaned.startsWith("TASK-")) {
            cleaned = cleaned.removePrefix("TASK-")
        }
        if (cleaned.contains("amc_")) {
            val idx = cleaned.indexOf("amc_")
            return cleaned.substring(idx)
        }
        if (cleaned.endsWith(".0")) {
            cleaned = cleaned.removeSuffix(".0")
        } else if (cleaned.contains(".") && !cleaned.contains("-")) {
            cleaned = cleaned.substringBefore(".")
        }
        // If string contains non-digit characters (like UUID or slug), keep as-is
        if (cleaned.matches(Regex("^[0-9]+$"))) {
            val nonZero = cleaned.replaceFirst(Regex("^0+"), "")
            return if (nonZero.isNotEmpty()) nonZero else "0"
        }
        return cleaned
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
        afterLongitude: Double? = null,
        taskType: String? = null,
        images: List<String>? = null,
        beforeImages: List<String>? = null,
        afterImages: List<String>? = null,
        sitePhotos: List<String>? = null
    ): Result<Task> {
        val cleanTaskId = sanitizeTaskId(taskId)
        if (cleanTaskId.startsWith("amc_")) {
            val visitId = cleanTaskId.replace("amc_", "")
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
                        id = cleanTaskId,
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
                        id = cleanTaskId,
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
                    saveTaskCompletionToOutbox(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude, taskType, images, beforeImages, afterImages)
                    saveCompletionLocally(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude, taskType, images, beforeImages, afterImages)
                    Result.failure(OfflinePendingException("AMC Visit completed & saved locally on app! Syncing with server..."))
                }
            } catch (e: Exception) {
                saveTaskCompletionToOutbox(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude, taskType, images, beforeImages, afterImages)
                saveCompletionLocally(taskId, completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude, taskType, images, beforeImages, afterImages)
                Result.failure(OfflinePendingException("AMC Visit completed & saved locally on app! Syncing with server..."))
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
                    afterLongitude = afterLongitude,
                    taskType = taskType,
                    images = images,
                    sitePhotos = sitePhotos ?: images,
                    beforeImages = beforeImages,
                    afterImages = afterImages
                )
                android.util.Log.d("TaskSubmissionChain", "LOG 3 - Immediately Before API Call: RawTaskId=$taskId, CleanTaskId=$cleanTaskId, Endpoint=PATCH tasks/$cleanTaskId/complete, sitePhotosCount=${req.sitePhotos?.size}, message=${req.message}")
                var response = apiService.completeTask(cleanTaskId, req)
                android.util.Log.d("TaskSubmissionChain", "LOG 4 - API Call Returned: statusCode=${response.code()}, isSuccessful=${response.isSuccessful}, cleanTaskId=$cleanTaskId")
                
                var successTask: Task? = if (response.isSuccessful && response.body()?.data != null) response.body()!!.data else null

                // Fallback 1: Retrying with raw taskId if cleanTaskId returned error
                if (successTask == null && taskId != cleanTaskId) {
                    android.util.Log.w("TaskSubmissionChain", "[TaskSubmission] cleanTaskId $cleanTaskId failed (${response.code()}). Retrying with raw taskId $taskId")
                    val respRaw = apiService.completeTask(taskId, req)
                    if (respRaw.isSuccessful && respRaw.body()?.data != null) {
                        successTask = respRaw.body()!!.data
                    }
                }

                // Fallback 2: Call status update endpoint (employee/tasks/:taskId/status) to guarantee DB completion
                if (successTask == null) {
                    android.util.Log.w("TaskSubmissionChain", "[TaskSubmission] completeTask endpoint failed. Falling back to status update endpoint employee/tasks/$cleanTaskId/status")
                    val respStatus = apiService.updateTask(cleanTaskId, UpdateTaskRequest(status = "COMPLETED"))
                    if (respStatus.isSuccessful && respStatus.body()?.data != null) {
                        successTask = respStatus.body()!!.data
                    }
                }

                if (successTask != null) {
                    // ✅ SUCCESS: Save to local DB and return
                    val task = successTask

                    // 📸 PHOTO TRANSFER FIX: If this is a site visit with photos, also call the
                    // dedicated PATCH /tasks/:id/photos endpoint. This is the same endpoint the
                    // web app uses (updateTaskPhotos). It processes base64 → disk files and stores
                    // proper file paths in task.sitePhotos, making them visible in the dashboard.
                    // Without this, photos only go to taskImages.url as raw base64 strings which
                    // can cause issues when the coordinator dashboard tries to display them.
                    val isSiteTask = taskType == "SITE_VISIT" || task.isSiteVisit || task.jobType?.lowercase()?.contains("site") == true || task.jobType?.lowercase()?.contains("visit") == true || !images.isNullOrEmpty()
                    val finalSitePhotos: List<String>? = if (!images.isNullOrEmpty() && isSiteTask) {
                        try {
                            android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Uploading ${images.size} site photos via dedicated /photos endpoint for task $cleanTaskId")
                            val photosResponse = apiService.updateTaskPhotos(
                                cleanTaskId,
                                mapOf("sitePhotos" to images)
                            )
                            if (photosResponse.isSuccessful && photosResponse.body()?.data != null) {
                                val updatedTask = photosResponse.body()!!.data!!
                                android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Photos endpoint returned ${updatedTask.sitePhotos?.size ?: 0} file-path URLs")
                                updatedTask.sitePhotos ?: task.sitePhotos ?: images
                            } else {
                                android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Photos endpoint returned HTTP ${photosResponse.code()} — falling back to base64 from local")
                                task.sitePhotos ?: task.images ?: images
                            }
                        } catch (photoEx: Exception) {
                            android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Photos endpoint threw exception: ${photoEx.message} — using local images")
                            task.sitePhotos ?: task.images ?: images
                        }
                    } else {
                        task.sitePhotos ?: task.images ?: images
                    }
                    val entity = TaskEntity(
                        id = task.id,
                        jobType = task.jobType,
                        description = task.description,
                        customerName = task.customerName,
                        customerPhone = task.customerPhone,
                        address = task.address,
                        latitude = task.latitude,
                        longitude = task.longitude,
                        status = "completed",
                        scheduledTime = task.scheduledTime,
                        employeeUserId = task.employeeUserId,
                        assignedById = task.assignedById,
                        completionMessage = task.completionMessage ?: completionMessage,
                        completionDocumentUrl = task.completionDocumentUrl ?: completionDocumentUrl,
                        beforeImageUrl = task.beforeImageUrl ?: beforeImageUrl,
                        afterImageUrl = task.afterImageUrl ?: afterImageUrl,
                        beforeLatitude = task.beforeLatitude ?: beforeLatitude,
                        beforeLongitude = task.beforeLongitude ?: beforeLongitude,
                        afterLatitude = task.afterLatitude ?: afterLatitude,
                        afterLongitude = task.afterLongitude ?: afterLongitude,
                        completedAt = task.completedAt ?: java.time.LocalDateTime.now().toString(),
                        createdAt = task.createdAt,
                        updatedAt = task.updatedAt,
                        isSynced = true,
                        invoiceJson = task.invoice?.let { gson.toJson(it) },
                        taskType = task.taskType ?: taskType,
                        imagesJson = finalSitePhotos?.let { gson.toJson(it) },
                        sitePhotosJson = finalSitePhotos?.let { gson.toJson(it) },
                        beforeImagesJson = beforeImages?.let { gson.toJson(it) },
                        afterImagesJson = afterImages?.let { gson.toJson(it) },
                        assignedEmployeeName = task.assignedEmployeeName,
                        assignedEmployeePhone = task.assignedEmployeePhone
                    )
                    taskDao.updateTask(entity)
                    Result.success(task)
                } else {
                    // ⚠️ Server returned HTTP error (404, 403, 500, etc.).
                    // Save locally as completed so the employee is not blocked, and queue to outbox for background sync!
                    val errorDetail = ErrorUtils.formatResponseError(response)
                    android.util.Log.w("TaskSubmissionChain", "[TaskSubmission] Server error for task $taskId ($errorDetail) — saving locally & queuing to outbox")
                    saveTaskCompletionToOutbox(
                        taskId = taskId,
                        completionMessage = completionMessage,
                        completionDocumentUrl = completionDocumentUrl,
                        beforeImageUrl = beforeImageUrl,
                        afterImageUrl = afterImageUrl,
                        beforeLatitude = beforeLatitude,
                        beforeLongitude = beforeLongitude,
                        afterLatitude = afterLatitude,
                        afterLongitude = afterLongitude,
                        taskType = taskType,
                        images = images,
                        beforeImages = beforeImages,
                        afterImages = afterImages
                    )
                    saveCompletionLocally(
                        taskId = taskId,
                        completionMessage = completionMessage,
                        completionDocumentUrl = completionDocumentUrl,
                        beforeImageUrl = beforeImageUrl,
                        afterImageUrl = afterImageUrl,
                        beforeLatitude = beforeLatitude,
                        beforeLongitude = beforeLongitude,
                        afterLatitude = afterLatitude,
                        afterLongitude = afterLongitude,
                        taskType = taskType,
                        images = images,
                        beforeImages = beforeImages,
                        afterImages = afterImages
                    )
                    Result.failure(OfflinePendingException("Task completed & saved locally on app! Syncing with server..."))
                }
            } catch (e: Exception) {
                // 🌐 Network exception or unexpected exception — queue to outbox & save locally.
                android.util.Log.w("TaskSubmissionChain", "[TaskSubmission] Exception for task $taskId — saving to outbox: ${e.message}")
                saveTaskCompletionToOutbox(
                    taskId = taskId,
                    completionMessage = completionMessage,
                    completionDocumentUrl = completionDocumentUrl,
                    beforeImageUrl = beforeImageUrl,
                    afterImageUrl = afterImageUrl,
                    beforeLatitude = beforeLatitude,
                    beforeLongitude = beforeLongitude,
                    afterLatitude = afterLatitude,
                    afterLongitude = afterLongitude,
                    taskType = taskType,
                    images = images,
                    beforeImages = beforeImages,
                    afterImages = afterImages
                )
                saveCompletionLocally(
                    taskId = taskId,
                    completionMessage = completionMessage,
                    completionDocumentUrl = completionDocumentUrl,
                    beforeImageUrl = beforeImageUrl,
                    afterImageUrl = afterImageUrl,
                    beforeLatitude = beforeLatitude,
                    beforeLongitude = beforeLongitude,
                    afterLatitude = afterLatitude,
                    afterLongitude = afterLongitude,
                    taskType = taskType,
                    images = images,
                    beforeImages = beforeImages,
                    afterImages = afterImages
                )
                Result.failure(OfflinePendingException("Task completed & saved locally on app! Syncing with server..."))
            }
        } else {
            // 📴 OFFLINE — save to outbox queue and update local DB
            android.util.Log.d("TaskSubmissionChain", "[TaskSubmission] Device offline — saving task $taskId to outbox.")
            saveTaskCompletionToOutbox(
                taskId = taskId,
                completionMessage = completionMessage,
                completionDocumentUrl = completionDocumentUrl,
                beforeImageUrl = beforeImageUrl,
                afterImageUrl = afterImageUrl,
                beforeLatitude = beforeLatitude,
                beforeLongitude = beforeLongitude,
                afterLatitude = afterLatitude,
                afterLongitude = afterLongitude,
                taskType = taskType,
                images = images,
                beforeImages = beforeImages,
                afterImages = afterImages
            )
            saveCompletionLocally(
                taskId = taskId,
                completionMessage = completionMessage,
                completionDocumentUrl = completionDocumentUrl,
                beforeImageUrl = beforeImageUrl,
                afterImageUrl = afterImageUrl,
                beforeLatitude = beforeLatitude,
                beforeLongitude = beforeLongitude,
                afterLatitude = afterLatitude,
                afterLongitude = afterLongitude,
                taskType = taskType,
                images = images,
                beforeImages = beforeImages,
                afterImages = afterImages
            )
            Result.failure(OfflinePendingException())
        }
    }

    /**
     * Updates the local Room DB with task completion data (used for offline/IO-error saves).
     * This allows the task to appear as completed in the UI while waiting to sync.
     */
    private suspend fun saveCompletionLocally(
        taskId: String,
        completionMessage: String,
        completionDocumentUrl: String?,
        beforeImageUrl: String?,
        afterImageUrl: String?,
        beforeLatitude: Double?,
        beforeLongitude: Double?,
        afterLatitude: Double?,
        afterLongitude: Double?,
        taskType: String? = null,
        images: List<String>? = null,
        beforeImages: List<String>? = null,
        afterImages: List<String>? = null
    ) {
        val localTask = taskDao.getTaskById(taskId)
        if (localTask != null) {
            val finalTaskType = taskType ?: localTask.taskType ?: if (!images.isNullOrEmpty()) "SITE_VISIT" else null
            val finalPhotos = images ?: localTask.sitePhotosJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }
            taskDao.updateTask(localTask.copy(
                status = "completed",
                completionMessage = completionMessage,
                completionDocumentUrl = completionDocumentUrl,
                beforeImageUrl = beforeImageUrl ?: localTask.beforeImageUrl,
                afterImageUrl = afterImageUrl ?: localTask.afterImageUrl,
                beforeLatitude = beforeLatitude ?: localTask.beforeLatitude,
                beforeLongitude = beforeLongitude ?: localTask.beforeLongitude,
                afterLatitude = afterLatitude ?: localTask.afterLatitude,
                afterLongitude = afterLongitude ?: localTask.afterLongitude,
                completedAt = java.time.LocalDateTime.now().toString(),
                isSynced = false,
                taskType = finalTaskType,
                imagesJson = finalPhotos?.let { gson.toJson(it) } ?: localTask.imagesJson,
                sitePhotosJson = finalPhotos?.let { gson.toJson(it) } ?: localTask.sitePhotosJson,
                beforeImagesJson = beforeImages?.let { gson.toJson(it) } ?: localTask.beforeImagesJson,
                afterImagesJson = afterImages?.let { gson.toJson(it) } ?: localTask.afterImagesJson
            ))
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
        afterLongitude: Double?,
        taskType: String? = null,
        images: List<String>? = null,
        beforeImages: List<String>? = null,
        afterImages: List<String>? = null
    ) {
        val cleanTaskId = sanitizeTaskId(taskId)
        val beforeImageFilePath = beforeImageUrl?.let { LocalFileHelper.saveBase64ToFile(context, it, "task_before") }
        val afterImageFilePath = afterImageUrl?.let { LocalFileHelper.saveBase64ToFile(context, it, "task_after") }
        
        val imageFilePaths = images?.mapIndexed { index, b64 -> LocalFileHelper.saveBase64ToFile(context, b64, "task_img_$index") }
        val beforeImagePaths = beforeImages?.mapIndexed { index, b64 -> LocalFileHelper.saveBase64ToFile(context, b64, "task_bimg_$index") }
        val afterImagePaths = afterImages?.mapIndexed { index, b64 -> LocalFileHelper.saveBase64ToFile(context, b64, "task_aimg_$index") }

        val sitePhotoFilePaths = images?.mapNotNull { base64 ->
            if (base64.isNotBlank()) LocalFileHelper.saveBase64ToFile(context, base64, "task_site_photo") else null
        }
        val beforeImageFilePaths = beforeImages?.mapNotNull { base64 ->
            if (base64.isNotBlank()) LocalFileHelper.saveBase64ToFile(context, base64, "task_amc_before") else null
        }
        val afterImageFilePaths = afterImages?.mapNotNull { base64 ->
            if (base64.isNotBlank()) LocalFileHelper.saveBase64ToFile(context, base64, "task_amc_after") else null
        }

        val jsonArraySitePhotoFilePaths = JSONObject.wrap(sitePhotoFilePaths ?: emptyList<String>())
        val jsonArrayBeforeFilePaths = JSONObject.wrap(beforeImageFilePaths ?: emptyList<String>())
        val jsonArrayAfterFilePaths = JSONObject.wrap(afterImageFilePaths ?: emptyList<String>())

        val payload = JSONObject().apply {
            put("taskId", cleanTaskId)
            put("message", completionMessage)
            put("documentUrl", completionDocumentUrl)
            put("beforeImageFilePath", beforeImageFilePath)
            put("afterImageFilePath", afterImageFilePath)
            put("beforeLatitude", beforeLatitude)
            put("beforeLongitude", beforeLongitude)
            put("afterLatitude", afterLatitude)
            put("afterLongitude", afterLongitude)
            put("taskType", taskType)
            put("sitePhotoFilePaths", jsonArraySitePhotoFilePaths)
            put("beforeImagesFilePaths", jsonArrayBeforeFilePaths)
            put("afterImagesFilePaths", jsonArrayAfterFilePaths)
        }.toString()
        
        val outboxItem = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "tasks/$cleanTaskId/complete",
            method = "PATCH",
            payload = payload,
            createdAt = System.currentTimeMillis().toString()
        )
        outboxQueueDao.insertItem(outboxItem)

        // Update local entity in Room immediately so it shows as completed in UI
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
                isSynced = false,
                taskType = taskType ?: localTask.taskType,
                imagesJson = images?.let { gson.toJson(it) } ?: localTask.imagesJson,
                sitePhotosJson = (images ?: beforeImages)?.let { gson.toJson(it) } ?: localTask.sitePhotosJson
            ))
        }

        scheduleSync()
        android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Enqueued offline completion for task $taskId with ${sitePhotoFilePaths?.size ?: 0} site photos saved locally.")
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

    suspend fun syncPendingActions(): SyncResultSummary {
        return withContext(Dispatchers.IO) {
            if (!NetworkUtils.isNetworkAvailable(context)) {
                android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Sync skipped: No internet connection.")
                return@withContext SyncResultSummary(isOffline = true)
            }

            try {
                val pendingItems = outboxQueueDao.getPendingItems()
                android.util.Log.d("TASK_SYNC", "Manual syncPendingActions() started with ${pendingItems.size} pending outbox item(s)")
                if (pendingItems.isEmpty()) {
                    android.util.Log.d("SiteVisitSync", "[SiteVisitSync] No pending outbox items to sync.")
                    return@withContext SyncResultSummary(total = 0, synced = 0, failed = 0)
                }

                android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Sync started. Pending count: ${pendingItems.size}")
                var syncedCount = 0
                var failedCount = 0
                var permanentlyFailedCount = 0
                var hasAuthError = false
                var hasPhotoError = false
                var lastErrorMessage: String? = null

                for (item in pendingItems) {
                    val filesToDelete = mutableListOf<String>()
                    var isPhotoErrorForItem = false
                    var isAuthErrorForItem = false
                    var isPermanentFailure = false

                    android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Processing outbox item: ID=${item.id}, endpoint=${item.endpoint}, retryCount=${item.retryCount}")
                    val success = try {
                        when {
                            item.endpoint.contains("complete") -> {
                                val json = JSONObject(item.payload)
                                val rawTaskId = json.optString("taskId").ifEmpty {
                                    item.endpoint.removePrefix("tasks/").removeSuffix("/complete")
                                }
                                val taskId = sanitizeTaskId(rawTaskId)

                                if (taskId.startsWith("amc_")) {
                                    val visitId = taskId.removePrefix("amc_")
                                    val msg = json.optString("message", "")
                                    val response = apiService.updateAmcVisit(visitId, UpdateAmcVisitRequest(status = "COMPLETED", notes = msg))
                                    if (response.code() == 401) isAuthErrorForItem = true
                                    response.isSuccessful
                                } else {
                                    val beforeImageFilePath = json.optString("beforeImageFilePath", null)
                                    val afterImageFilePath = json.optString("afterImageFilePath", null)

                                    val beforeImageUrl = beforeImageFilePath?.takeIf { it.isNotBlank() }?.let { path ->
                                        filesToDelete.add(path)
                                        try {
                                            LocalFileHelper.readFileToBase64(path)
                                        } catch (e: Exception) {
                                            isPhotoErrorForItem = true
                                            null
                                        }
                                    } ?: json.optString("beforeImageUrl").takeIf { it.isNotEmpty() }

                                    val afterImageUrl = afterImageFilePath?.takeIf { it.isNotBlank() }?.let { path ->
                                        filesToDelete.add(path)
                                        try {
                                            LocalFileHelper.readFileToBase64(path)
                                        } catch (e: Exception) {
                                            isPhotoErrorForItem = true
                                            null
                                        }
                                    } ?: json.optString("afterImageUrl").takeIf { it.isNotEmpty() }

                                    val sitePhotosList = mutableListOf<String>()
                                    val sitePhotoFilePaths = json.optJSONArray("sitePhotoFilePaths")
                                    if (sitePhotoFilePaths != null) {
                                        for (i in 0 until sitePhotoFilePaths.length()) {
                                            val path = sitePhotoFilePaths.optString(i)
                                            if (path.isNotBlank()) {
                                                filesToDelete.add(path)
                                                try {
                                                    val b64 = LocalFileHelper.readFileToBase64(path)
                                                    if (!b64.isNullOrBlank()) {
                                                        sitePhotosList.add(b64)
                                                    } else {
                                                        isPhotoErrorForItem = true
                                                    }
                                                } catch (e: Exception) {
                                                    android.util.Log.e("SiteVisitSync", "[SiteVisitSync] Error reading photo file $path: ${e.message}")
                                                    isPhotoErrorForItem = true
                                                }
                                            }
                                        }
                                    }

                                    // Fallback to inline array if any
                                    if (sitePhotosList.isEmpty()) {
                                        val rawSitePhotos = json.optJSONArray("sitePhotos") ?: json.optJSONArray("images")
                                        if (rawSitePhotos != null) {
                                            for (i in 0 until rawSitePhotos.length()) {
                                                val str = rawSitePhotos.optString(i)
                                                if (str.isNotBlank()) sitePhotosList.add(str)
                                            }
                                        }
                                    }

                                    if (isPhotoErrorForItem && sitePhotosList.isEmpty() && beforeImageUrl == null && afterImageUrl == null) {
                                        android.util.Log.e("SiteVisitSync", "[SiteVisitSync] Photo retrieval failed for task $taskId")
                                        false
                                    } else {
                                        android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Preparing photos: ${sitePhotosList.size} site photos loaded")
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
                                            images = sitePhotosList.takeIf { it.isNotEmpty() },
                                            sitePhotos = sitePhotosList.takeIf { it.isNotEmpty() }
                                        )

                                        android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Submitting Site Visit for task ID: $taskId...")
                                        var response = apiService.completeTask(taskId, request)
                                        android.util.Log.d("SiteVisitSync", "[SiteVisitSync] HTTP status for completeTask: ${response.code()}")

                                        if (!response.isSuccessful) {
                                            android.util.Log.w("SiteVisitSync", "[SiteVisitSync] completeTask endpoint failed (${response.code()}). Trying status fallback endpoint for task $taskId")
                                            val statusResponse = apiService.updateTask(taskId, UpdateTaskRequest(status = "COMPLETED"))
                                            if (statusResponse.isSuccessful && statusResponse.body()?.data != null) {
                                                response = statusResponse
                                            }
                                        }

                                        if (response.code() == 401) {
                                            isAuthErrorForItem = true
                                        }

                                        // Detect permanent failures (task not found or not authorized) — remove from queue
                                        val httpCode = response.code()
                                        if (httpCode == 404) {
                                            android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Task $taskId not found on server (404). Will re-queue on next refresh.")
                                            isPermanentFailure = true
                                            // DO NOT mark isSynced=true - the task was NOT synced.
                                            // refreshTasks will detect isSynced=false + status=completed and re-queue.
                                        } else if (httpCode == 403) {
                                            android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Task $taskId access denied (403). Employee not authorized to complete this task. Removing from outbox.")
                                            isPermanentFailure = true
                                        }

                                        if (response.isSuccessful && response.body()?.data != null) {
                                            val task = response.body()!!.data!!

                                            // 📸 PHOTO TRANSFER FIX: After task is successfully completed via outbox sync,
                                            // upload the site photos via the dedicated /photos endpoint so they are stored
                                            // as file-path URLs (not raw base64) in task.sitePhotos — visible in dashboard.
                                            if (sitePhotosList.isNotEmpty()) {
                                                try {
                                                    android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Uploading ${sitePhotosList.size} site photos via /photos endpoint for task $taskId (outbox sync)")
                                                    val photosResp = apiService.updateTaskPhotos(
                                                        taskId,
                                                        mapOf("sitePhotos" to sitePhotosList)
                                                    )
                                                    if (photosResp.isSuccessful) {
                                                        android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Photos uploaded successfully for task $taskId via /photos endpoint")
                                                    } else {
                                                        android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Photos /photos endpoint returned HTTP ${photosResp.code()} for task $taskId — photos may appear via taskImages fallback")
                                                    }
                                                } catch (photoEx: Exception) {
                                                    android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Photos /photos endpoint failed for task $taskId: ${photoEx.message}")
                                                }
                                            }

                                            val entity = TaskEntity(
                                                id = task.id,
                                                jobType = task.jobType,
                                                description = task.description,
                                                customerName = task.customerName,
                                                customerPhone = task.customerPhone,
                                                address = task.address,
                                                latitude = task.latitude,
                                                longitude = task.longitude,
                                                status = "completed",
                                                scheduledTime = task.scheduledTime,
                                                employeeUserId = task.employeeUserId,
                                                assignedById = task.assignedById,
                                                completionMessage = task.completionMessage ?: json.optString("message"),
                                                completionDocumentUrl = task.completionDocumentUrl ?: json.optString("documentUrl").takeIf { it.isNotEmpty() },
                                                beforeImageUrl = task.beforeImageUrl ?: beforeImageUrl,
                                                afterImageUrl = task.afterImageUrl ?: afterImageUrl,
                                                beforeLatitude = task.beforeLatitude,
                                                beforeLongitude = task.beforeLongitude,
                                                afterLatitude = task.afterLatitude,
                                                afterLongitude = task.afterLongitude,
                                                completedAt = task.completedAt ?: java.time.LocalDateTime.now().toString(),
                                                createdAt = task.createdAt,
                                                updatedAt = task.updatedAt,
                                                isSynced = true,
                                                invoiceJson = task.invoice?.let { gson.toJson(it) },
                                                taskType = task.taskType ?: json.optString("taskType").takeIf { it.isNotEmpty() } ?: if (sitePhotosList.isNotEmpty()) "SITE_VISIT" else null,
                                                imagesJson = (task.sitePhotos ?: task.images ?: sitePhotosList)?.let { gson.toJson(it) },
                                                sitePhotosJson = (task.sitePhotos ?: task.images ?: sitePhotosList)?.let { gson.toJson(it) },
                                                assignedEmployeeName = task.assignedEmployeeName,
                                                assignedEmployeePhone = task.assignedEmployeePhone
                                            )
                                            taskDao.updateTask(entity)
                                            true
                                        } else {
                                            lastErrorMessage = ErrorUtils.formatResponseError(response)
                                            false
                                        }
                                    }
                                }
                            }
                            item.endpoint.startsWith("tasks/") || item.endpoint.contains("status") -> {
                                val taskId = item.endpoint.removePrefix("tasks/").removeSuffix("/status")
                                val json = JSONObject(item.payload)
                                val status = json.optString("status")
                                if (taskId.startsWith("amc_")) {
                                    val visitId = taskId.removePrefix("amc_")
                                    val response = apiService.updateAmcVisit(visitId, UpdateAmcVisitRequest(status = if (status.lowercase() == "completed") "COMPLETED" else "PENDING"))
                                    if (response.code() == 401) isAuthErrorForItem = true
                                    response.isSuccessful
                                } else {
                                    val response = apiService.updateTask(taskId, UpdateTaskRequest(status = status))
                                    if (response.isSuccessful) {
                                        val localTask = taskDao.getTaskById(taskId)
                                        if (localTask != null) {
                                            taskDao.updateTask(localTask.copy(status = status, isSynced = true))
                                        }
                                    }
                                    if (response.code() == 401) isAuthErrorForItem = true
                                    response.isSuccessful
                                }
                            }
                            item.endpoint.contains("check-in") -> {
                                val json = JSONObject(item.payload)
                                val selfieFilePath = json.optString("selfieFilePath", null)
                                val selfie = selfieFilePath?.takeIf { it.isNotBlank() }?.let {
                                    filesToDelete.add(it)
                                    LocalFileHelper.readFileToBase64(it)
                                } ?: json.optString("selfie").takeIf { it.isNotEmpty() }

                                val request = CheckInRequest(
                                    selfie = selfie,
                                    latitude = json.optDouble("latitude").takeIf { !json.isNull("latitude") },
                                    longitude = json.optDouble("longitude").takeIf { !json.isNull("longitude") }
                                )
                                val response = apiService.checkIn(request)
                                if (response.code() == 401) isAuthErrorForItem = true
                                response.isSuccessful
                            }
                            item.endpoint.contains("daily-commits") -> {
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
                                if (response.code() == 401) isAuthErrorForItem = true
                                response.isSuccessful
                            }
                            else -> true
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("SiteVisitSync", "[SiteVisitSync] Submission failed with exception for item ${item.id}: ${e.message}", e)
                        lastErrorMessage = e.message
                        false
                    }

                    if (isAuthErrorForItem) hasAuthError = true
                    if (isPhotoErrorForItem) hasPhotoError = true

                    if (success) {
                        android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Submission successful. Removing outbox item ${item.id}")
                        filesToDelete.forEach { filePath ->
                            LocalFileHelper.deleteFile(filePath)
                        }
                        outboxQueueDao.deleteItem(item)
                        syncedCount++
                    } else if (isPermanentFailure) {
                        // 404 / 403 — will never succeed on retry, remove from outbox
                        android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Permanent failure for item ${item.id}. Removing from outbox.")
                        filesToDelete.forEach { filePath ->
                            LocalFileHelper.deleteFile(filePath)
                        }
                        outboxQueueDao.deleteItem(item)
                        permanentlyFailedCount++
                    } else {
                        android.util.Log.w("SiteVisitSync", "[SiteVisitSync] Submission failed (retryable). Retrying later for item ${item.id}")
                        outboxQueueDao.updateItem(item.copy(retryCount = item.retryCount + 1))
                        failedCount++
                    }
                }

                scheduleSync()
                android.util.Log.d("SiteVisitSync", "[SiteVisitSync] Sync cycle completed. Total: ${pendingItems.size}, Synced: $syncedCount, Failed: $failedCount")

                SyncResultSummary(
                    total = pendingItems.size,
                    synced = syncedCount,
                    failed = failedCount,
                    permanentlyFailed = permanentlyFailedCount,
                    isAuthError = hasAuthError,
                    isPhotoError = hasPhotoError,
                    lastError = lastErrorMessage
                )
            } catch (e: Exception) {
                android.util.Log.e("SiteVisitSync", "[SiteVisitSync] syncPendingActions exception: ${e.message}", e)
                SyncResultSummary(total = 0, synced = 0, failed = 1, lastError = e.message)
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
        android.util.Log.d("TASK_SYNC", "Enqueued automatic sync work after task queue update")
    }
}
