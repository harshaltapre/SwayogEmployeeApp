package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "task_images")
data class TaskImageEntity(
    @PrimaryKey val id: String,
    val taskId: Int,
    val employeeUserId: String,
    val type: String,
    val url: String,
    val latitude: Float?,
    val longitude: Float?,
    val watermarkText: String?,
    val uploadedAt: String,
    val isSynced: Boolean = false
)
