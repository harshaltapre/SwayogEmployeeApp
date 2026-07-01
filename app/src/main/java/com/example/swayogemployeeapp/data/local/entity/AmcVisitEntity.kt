package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "amc_visits")
data class AmcVisitEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val scheduledDate: String,
    val status: String,
    val completedAt: String?,
    val notes: String?,
    val assignedEmployeeId: String?,
    val completedByEmployeeId: String?,
    val completedByName: String?,
    val visitNotes: String?,
    val beforeImageUrl: String?,
    val afterImageUrl: String?,
    val cleaningNumber: Int?,
    val timeSlot: String?,
    val isSynced: Boolean = false
)
