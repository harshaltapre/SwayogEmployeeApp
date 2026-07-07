package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService

import com.swayog.employee.data.local.dao.TaskDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.entity.TaskEntity
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
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
    
    suspend fun refreshTasks(employeeUserId: String, token: String): Result<List<Task>> {
        return try {
            val response = apiService.getEmployeeTasks("Bearer $token", employeeUserId)
            if (response.isSuccessful && response.body() != null) {
                val tasks = response.body()!!
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
                Result.success(tasks)
            } else {
                Result.failure(Exception("Failed to fetch tasks"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateTaskStatus(taskId: Int, status: String, token: String): Result<Task> {
        return try {
            val response = apiService.updateTask(
                "Bearer $token",
                taskId,
                UpdateTaskRequest(status = status)
            )
            if (response.isSuccessful && response.body() != null) {
                val task = response.body()!!
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
                } else {
                    // If task doesn't exist locally, create it with the new status
                    val newTaskEntity = TaskEntity(
                        id = taskId,
                        jobType = "Unknown",
                        description = "Task updated offline",
                        customerName = "Unknown",
                        customerPhone = "",
                        address = "",
                        latitude = null,
                        longitude = null,
                        status = status,
                        scheduledTime = "",
                        employeeUserId = "OfflineUser",
                        assignedById = "",
                        completionMessage = null,
                        completionDocumentUrl = null,
                        completedAt = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString(),
                        isSynced = false
                    )
                    taskDao.insertTask(newTaskEntity)
                }
                
                Result.failure(Exception("Failed to update task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun completeTask(
        taskId: Int,
        completionMessage: String,
        completionDocumentUrl: String?,
        token: String
    ): Result<Task> {
        return try {
            val response = apiService.completeTask(
                "Bearer $token",
                taskId,
                CompleteTaskRequest(completionMessage, completionDocumentUrl)
            )
            if (response.isSuccessful && response.body() != null) {
                val task = response.body()!!
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
}
