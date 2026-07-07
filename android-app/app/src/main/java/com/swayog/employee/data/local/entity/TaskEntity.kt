package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
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
    val updatedAt: String,
    val isSynced: Boolean = true
)
