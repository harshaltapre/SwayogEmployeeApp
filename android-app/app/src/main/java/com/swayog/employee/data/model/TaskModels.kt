package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class Task(
    val id: Int,
    val jobType: String,
    val description: String,
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val status: String,
    val scheduledTime: String,
    val employeeUserId: String,
    val assignedById: String,
    val completionMessage: String?,
    val completionDocumentUrl: String?,
    val completedAt: String?,
    val createdAt: String,
    val updatedAt: String
)

data class CreateTaskRequest(
    val jobType: String,
    val description: String,
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val scheduledTime: String,
    val employeeUserId: String
)

data class UpdateTaskRequest(
    val status: String? = null,
    val description: String? = null,
    val scheduledTime: String? = null
)

data class AssignTaskRequest(
    val employeeUserId: String,
    val role: String?
)

data class CompleteTaskRequest(
    val completionMessage: String,
    val completionDocumentUrl: String?
)

data class TaskAssignee(
    val id: String,
    val taskId: Int,
    val userId: String,
    val role: String?,
    val status: String,
    val createdAt: String
)

data class TasksResponse(
    val tasks: List<Task>,
    val pagination: Pagination?
)

data class Pagination(
    val total: Int,
    val limit: Int,
    val offset: Int
)
