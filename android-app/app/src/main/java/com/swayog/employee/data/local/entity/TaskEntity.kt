package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.swayog.employee.data.model.Task

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
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
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val beforeLatitude: Double? = null,
    val beforeLongitude: Double? = null,
    val afterLatitude: Double? = null,
    val afterLongitude: Double? = null,
    val completedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val isSynced: Boolean = true
) {
    fun toTask(): Task = Task(
        id = id,
        jobType = jobType,
        description = description,
        customerName = customerName,
        customerPhone = customerPhone,
        address = address,
        latitude = latitude,
        longitude = longitude,
        status = status,
        scheduledTime = scheduledTime,
        employeeUserId = employeeUserId,
        assignedById = assignedById,
        completionMessage = completionMessage,
        completionDocumentUrl = completionDocumentUrl,
        beforeImageUrl = beforeImageUrl,
        afterImageUrl = afterImageUrl,
        beforeLatitude = beforeLatitude,
        beforeLongitude = beforeLongitude,
        afterLatitude = afterLatitude,
        afterLongitude = afterLongitude,
        completedAt = completedAt,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

