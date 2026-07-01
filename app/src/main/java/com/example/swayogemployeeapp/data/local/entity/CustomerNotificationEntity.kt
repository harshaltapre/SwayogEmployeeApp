package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "customer_notifications")
data class CustomerNotificationEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val type: String,
    val message: String,
    val taskId: Int?,
    val imageUrl: String?,
    val isRead: Boolean,
    val createdAt: String,
    val isSynced: Boolean = false
)
