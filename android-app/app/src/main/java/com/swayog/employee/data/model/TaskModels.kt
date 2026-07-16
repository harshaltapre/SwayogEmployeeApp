package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class Task(
    val id: String,
    val jobType: String? = null,
    val description: String? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val address: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val status: String? = null,
    val scheduledTime: String? = null,
    val employeeUserId: String? = null,
    val assignedById: String? = null,
    val completionMessage: String? = null,
    val completionDocumentUrl: String? = null,
    val completedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    // Helper to check if this task is actually an AMC visit
    val isAmcVisit: Boolean
        get() = id.startsWith("amc_")

    // Extract the actual visit ID if this is an AMC visit
    val amcVisitId: String?
        get() = if (isAmcVisit) id.removePrefix("amc_") else null
}

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
    val message: String,
    val documentUrl: String? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val beforeLatitude: Double? = null,
    val beforeLongitude: Double? = null,
    val afterLatitude: Double? = null,
    val afterLongitude: Double? = null
)

data class TaskAssignee(
    val id: String,
    val taskId: String,
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

data class WorkSubmissionRequest(
    val title: String,
    val description: String,
    val hoursSpent: Double,
    val taskId: String? = null
)

data class SurveySubmissionRequest(
    val taskId: String? = null,
    val customerId: Int? = null,
    val roofType: String,
    val lengthFt: Double,
    val widthFt: Double,
    val obstacleNotes: String? = null,
    val shadowFactors: String? = null,
    val recommendedCapacityKw: Double,
    val latitude: Double? = null,
    val longitude: Double? = null
)

data class SurveySubmissionResponse(
    val surveyId: Int,
    val message: String
)

data class DesignSubmissionRequest(
    val customerId: Int? = null,
    val panelCount: Int,
    val inverterModel: String,
    val systemCapacityKw: Double,
    val tiltAngle: Double
)

data class DesignSubmissionResponse(
    val designId: Int,
    val message: String
)
