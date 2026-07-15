package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
    val id: Int,
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
    val updatedAt: String? = null,
    val isSynced: Boolean = true
)
