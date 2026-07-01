package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.sync.SyncManager
import com.example.swayogemployeeapp.data.remote.NetworkClient
import kotlinx.coroutines.flow.Flow

class TaskRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)
    private val apiService = NetworkClient.getApiService(context)

    suspend fun syncTasksFromServer() {
        try {
            val response = apiService.getMyTasks()
            if (response.isSuccessful) {
                val tasksList = response.body()?.data?.tasks ?: emptyList()
                val entities = tasksList.map { dto ->
                    EmployeeTaskEntity(
                        id = dto.id,
                        jobType = dto.jobType,
                        description = dto.description,
                        scheduledTime = dto.scheduledTime,
                        status = dto.status.lowercase(),
                        customerName = dto.customerName,
                        customerPhone = dto.customerPhone,
                        address = dto.address,
                        latitude = dto.latitude,
                        longitude = dto.longitude,
                        completionMessage = null,
                        completionDocumentUrl = null,
                        completedAt = null
                    )
                }
                db.employeeTaskDao().insertAll(entities)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getAllTasks(): Flow<List<EmployeeTaskEntity>> = db.employeeTaskDao().getAllTasksFlow()

    fun getTaskById(taskId: Int): Flow<EmployeeTaskEntity?> = db.employeeTaskDao().getTaskByIdFlow(taskId)

    suspend fun updateTaskStatus(taskId: Int, status: String) {
        val task = db.employeeTaskDao().getTaskById(taskId)
        if (task != null) {
            db.employeeTaskDao().update(task.copy(status = status))
        }
    }

    suspend fun completeTask(taskId: Int, completionMessage: String, documentUrl: String?) {
        val task = db.employeeTaskDao().getTaskById(taskId)
        if (task != null) {
            val updated = task.copy(
                status = "completed",
                completionMessage = completionMessage,
                completionDocumentUrl = documentUrl,
                completedAt = System.currentTimeMillis().toString()
            )
            db.employeeTaskDao().update(updated)

            // Queue in outbox
            val payload = "$taskId|||$completionMessage|||${documentUrl ?: ""}"
            val outbox = OutboxQueueEntity(
                actionType = "TASK_COMPLETE",
                endpoint = "api/v1/employee/tasks/$taskId/complete",
                payloadJson = payload,
                localAttachmentPaths = null
            )
            db.outboxQueueDao().enqueue(outbox)

            SyncManager.enqueueSync(context)
        }
    }

    suspend fun assignTaskLocally(task: EmployeeTaskEntity) {
        db.employeeTaskDao().insert(task)
    }
}
