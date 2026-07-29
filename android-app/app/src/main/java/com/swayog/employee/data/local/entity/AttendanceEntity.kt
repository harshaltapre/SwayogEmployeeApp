package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.swayog.employee.data.model.AttendanceRecord

@Entity(tableName = "attendance")
data class AttendanceEntity(
    @PrimaryKey
    val id: String,
    val employeeId: String,
    val date: String,
    val checkInTime: String?,
    val checkOutTime: String?,
    val totalMinutes: Int?,
    val status: String,
    val notes: String?,
    val checkInSelfieUrl: String?,
    val checkInLocation: String?,
    val isSynced: Boolean = true
) {
    fun toAttendanceRecord(): AttendanceRecord = AttendanceRecord(
        id = id,
        employeeId = employeeId,
        date = date,
        checkInTime = checkInTime,
        checkOutTime = checkOutTime,
        totalMinutes = totalMinutes,
        status = status,
        notes = notes
    )
}

