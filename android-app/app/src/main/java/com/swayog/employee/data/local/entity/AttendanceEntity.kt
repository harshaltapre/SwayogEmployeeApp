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
    fun toAttendanceRecord(): AttendanceRecord {
        var lat: Double? = null
        var lng: Double? = null
        if (!checkInLocation.isNullOrBlank()) {
            try {
                val parts = checkInLocation
                    .replace("Lat", "")
                    .replace("Lng", "")
                    .replace("lat:", "")
                    .replace("lng:", "")
                    .split(",")
                if (parts.size == 2) {
                    lat = parts[0].trim().toDoubleOrNull()
                    lng = parts[1].trim().toDoubleOrNull()
                }
            } catch (_: Exception) {}
        }
        return AttendanceRecord(
            id = id,
            employeeId = employeeId,
            date = date,
            checkInTime = checkInTime,
            checkOutTime = checkOutTime,
            totalMinutes = totalMinutes,
            status = status,
            notes = notes,
            latitude = lat,
            longitude = lng
        )
    }
}

