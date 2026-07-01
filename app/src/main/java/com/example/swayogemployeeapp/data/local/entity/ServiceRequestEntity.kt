package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "service_requests")
data class ServiceRequestEntity(
    @PrimaryKey val id: Int,
    val customerId: Int,
    val title: String,
    val description: String,
    val address: String?,
    val latitude: Float?,
    val longitude: Float?,
    val status: String,
    val scheduledDate: String?,
    val scheduledTime: String?,
    val createdAt: String,
    val updatedAt: String,
    val isSynced: Boolean = false
)
