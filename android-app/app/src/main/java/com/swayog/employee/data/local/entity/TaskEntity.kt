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
    val latitude: Double? = null,
    val longitude: Double? = null,
    val status: String,
    val scheduledTime: String,
    val employeeUserId: String? = null,
    val assignedById: String? = null,
    val completionMessage: String? = null,
    val completionDocumentUrl: String? = null,
    val completedAt: String? = null,
    val createdAt: String,
    val updatedAt: String? = null,
    val isSynced: Boolean = true
)
