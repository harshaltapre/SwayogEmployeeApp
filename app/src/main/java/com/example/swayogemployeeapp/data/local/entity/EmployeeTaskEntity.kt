package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "employee_tasks")
data class EmployeeTaskEntity(
    @PrimaryKey val id: Int,
    val jobType: String,        // "Installation", "Service", "AMC Visit", "Complaint", "Survey"
    val description: String,
    val scheduledTime: String,   // ISO timestamp
    val status: String,          // "assigned", "in_progress", "completed", "cancelled"
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val completionMessage: String?,
    val completionDocumentUrl: String?,
    val completedAt: String?,
    val employeeUserId: String? = null,
    val isSynced: Boolean = false
)
