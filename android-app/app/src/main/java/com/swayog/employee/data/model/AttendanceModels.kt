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
    val longitude: Double?,
    val matchConfidence: Float? = null
)

data class FaceEnrollRequest(
    val descriptor1: List<Float>,
    val descriptor2: List<Float>,
    val descriptor3: List<Float>
)

data class FaceEnrollment(
    val id: String,
    val employeeId: String,
    val descriptor1: List<Float>,
    val descriptor2: List<Float>,
    val descriptor3: List<Float>,
    val enrolledAt: String,
    val modelVersion: String
)

data class FaceEnrollmentStatusResponse(
    val enrolled: Boolean,
    val enrollment: FaceEnrollment?
)

data class CheckInResponse(
    @SerializedName("checkInRecord")
    val checkIn: CheckIn,
    @SerializedName("attendance")
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

data class TodayAttendanceResponse(
    val record: AttendanceRecord?
)

data class CheckInApiResponse(
    val success: Boolean,
    val result: CheckInResponse?
)

data class PerformanceResponse(
    val snapshot: PerformanceSnapshot?
)

data class MonthlyAttendanceResponse(
    val records: List<AttendanceRecord>,
    val present: Int,
    val absent: Int,
    val halfDays: Int,
    val workingDays: Int,
    val attendancePercent: Double
)
