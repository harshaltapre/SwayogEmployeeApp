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
import com.swayog.employee.data.sync.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
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
                    completedAt = entity.completedAt,
                    createdAt = entity.createdAt,
                    updatedAt = entity.updatedAt
                )
            }
        }
    }

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
                Result.failure(Exception("Failed to refresh tasks: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to refresh tasks: ${ErrorUtils.formatException(e)}"))
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
        return try {
            val response = apiService.completeTask(
                taskId,
                CompleteTaskRequest(
                    message = completionMessage, 
                    documentUrl = completionDocumentUrl,
                    beforeImageUrl = beforeImageUrl,
                    afterImageUrl = afterImageUrl,
                    beforeLatitude = beforeLatitude,
                    beforeLongitude = beforeLongitude,
                    afterLatitude = afterLatitude,
                    afterLongitude = afterLongitude
                )
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
                Result.failure(Exception("Failed to complete task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
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
