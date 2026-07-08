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
    
    suspend fun refreshTasks(employeeUserId: String): Result<List<Task>> {
        if (employeeUserId == "mock-123") {
            val mockTasks = getMockTasks(employeeUserId)
            val entities = mockTasks.map { task ->
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
            return Result.success(mockTasks)
        }

        return try {
            val response = apiService.getEmployeeTasks(employeeUserId)
            if (response.isSuccessful && response.body()?.data != null) {
                val tasks = response.body()!!.data!!
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
    
    suspend fun updateTaskStatus(taskId: Int, status: String): Result<Task> {
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
                
                Result.failure(Exception("Failed to update task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun completeTask(
        taskId: Int,
        completionMessage: String,
        completionDocumentUrl: String?
    ): Result<Task> {
        return try {
            val response = apiService.completeTask(
                taskId,
                CompleteTaskRequest(completionMessage, completionDocumentUrl)
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

    private fun getMockTasks(userId: String): List<Task> {
        return listOf(
            Task(
                id = 1,
                jobType = "Site Survey",
                description = "Initial survey for new solar installation",
                customerName = "Rahul Sharma",
                customerPhone = "+91 9988776655",
                address = "Flat 402, Sunshine Apts, Baner, Pune",
                latitude = 18.5596,
                longitude = 73.7797,
                status = "assigned",
                scheduledTime = "2024-01-20 10:00 AM",
                employeeUserId = userId,
                assignedById = "MGR-01",
                completionMessage = null,
                completionDocumentUrl = null,
                completedAt = null,
                createdAt = "2024-01-18 09:00 AM",
                updatedAt = "2024-01-18 09:00 AM"
            ),
            Task(
                id = 2,
                jobType = "Panel Maintenance",
                description = "Routine cleaning and health check of panels",
                customerName = "Priya Deshmukh",
                customerPhone = "+91 8877665544",
                address = "Bunglow 15, Green Park, Aundh, Pune",
                latitude = 18.5580,
                longitude = 73.8075,
                status = "in-progress",
                scheduledTime = "2024-01-20 02:30 PM",
                employeeUserId = userId,
                assignedById = "MGR-01",
                completionMessage = null,
                completionDocumentUrl = null,
                completedAt = null,
                createdAt = "2024-01-19 11:00 AM",
                updatedAt = "2024-01-20 02:45 PM"
            ),
            Task(
                id = 3,
                jobType = "Inverter Repair",
                description = "Replace faulty fuse in the inverter",
                customerName = "Amit Patil",
                customerPhone = "+91 7766554433",
                address = "Sector 2, Pimpri, Pune",
                latitude = 18.6298,
                longitude = 73.7997,
                status = "completed",
                scheduledTime = "2024-01-19 11:00 AM",
                employeeUserId = userId,
                assignedById = "MGR-01",
                completionMessage = "Fuse replaced, system working normally",
                completionDocumentUrl = null,
                completedAt = "2024-01-19 12:15 PM",
                createdAt = "2024-01-18 02:00 PM",
                updatedAt = "2024-01-19 12:15 PM"
            )
        )
    }
}
