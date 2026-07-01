package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "task_assignments")
data class TaskAssignmentEntity(
    @PrimaryKey val id: String,
    val taskId: Int,
    val employeeUserId: String,
    val assignedAt: String,
    val status: String,
    val isSynced: Boolean = false
)
