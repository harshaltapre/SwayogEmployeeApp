package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "attendance_records")
data class AttendanceRecordEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String? = null, // Null if not synced
    val date: String,      // YYYY-MM-DD
    val checkInTime: String, // ISO timestamp
    val checkInLatitude: Double,
    val checkInLongitude: Double,
    val checkOutTime: String?, // ISO timestamp, null if active
    val checkOutLatitude: Double?,
    val checkOutLongitude: Double?,
    val totalBreakDurationSeconds: Long = 0,
    val isSynced: Boolean = false
)
