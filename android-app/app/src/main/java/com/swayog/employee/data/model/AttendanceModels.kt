package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class AttendanceRecord(
    val id: String,
    val employeeId: String,
    val date: String,
    val checkInTime: String?,
    val checkOutTime: String?,
    val totalMinutes: Int?,
    val status: String,
    val notes: String?
)

data class CheckInRequest(
    val selfie: String?,
    val latitude: Double?,
    val longitude: Double?
)

data class CheckInResponse(
    val checkIn: CheckIn,
    val attendanceRecord: AttendanceRecord
)

data class CheckIn(
    val id: String,
    val employeeId: String,
    val selfieUrl: String?,
    val latitude: Double?,
    val longitude: Double?,
    val status: String,
    val createdAt: String
)

data class WorkDescriptionRequest(
    val employeeId: String,
    val description: String,
    val timestamp: String
)

data class PerformanceSnapshot(
    val id: String,
    val employeeId: String,
    val month: Int,
    val year: Int,
    val attendancePercent: Double,
    val taskCompletionRate: Double,
    val avgWorkScore: Double,
    val totalHoursLogged: Double,
    val performanceScore: Double,
    val daysPresent: Int,
    val daysAbsent: Int,
    val tasksAssigned: Int,
    val tasksCompleted: Int,
    val workSubmissions: Int
)
