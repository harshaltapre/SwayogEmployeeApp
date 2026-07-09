package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.AttendanceDao
import com.swayog.employee.data.local.entity.AttendanceEntity
import com.swayog.employee.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AttendanceRepository @Inject constructor(
    private val attendanceDao: AttendanceDao,
    private val apiService: ApiService
) {
    
    fun getAttendanceByEmployeeId(employeeId: String): Flow<List<AttendanceRecord>> {
        return attendanceDao.getAttendanceByEmployeeId(employeeId).map { entities ->
            entities.map { entity ->
                AttendanceRecord(
                    id = entity.id,
                    employeeId = entity.employeeId,
                    date = entity.date,
                    checkInTime = entity.checkInTime,
                    checkOutTime = entity.checkOutTime,
                    totalMinutes = entity.totalMinutes,
                    status = entity.status,
                    notes = entity.notes
                )
            }
        }
    }
    
    suspend fun getTodayAttendance(): Result<AttendanceRecord?> {
        return try {
            val response = apiService.getTodayAttendance()
            
            if (response.isSuccessful) {
                val body = response.body()
                
                when {
                    body?.data != null -> {
                        val data = body.data
                        val gson = com.google.gson.Gson()
                        
                        val attendanceRecord = when (data) {
                            is AttendanceRecord -> data
                            is List<*> -> {
                                val firstItem = data.firstOrNull()
                                if (firstItem != null) {
                                    gson.fromJson(gson.toJson(firstItem), AttendanceRecord::class.java)
                                } else null
                            }
                            else -> {
                                gson.fromJson(gson.toJson(data), AttendanceRecord::class.java)
                            }
                        }
                        
                        Result.success(attendanceRecord)
                    }
                    else -> {
                        Result.success(null)
                    }
                }
            } else {
                Result.failure(Exception("Failed to fetch attendance"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun checkIn(
        selfie: String?,
        latitude: Double?,
        longitude: Double?
    ): Result<CheckInResponse> {
        return try {
            val response = apiService.checkIn(
                CheckInRequest(selfie, latitude, longitude)
            )
            if (response.isSuccessful && response.body()?.data != null) {
                val checkInResponse = response.body()!!.data!!
                
                // Save to local database
                val attendanceEntity = AttendanceEntity(
                    id = checkInResponse.attendanceRecord.id,
                    employeeId = checkInResponse.attendanceRecord.employeeId,
                    date = checkInResponse.attendanceRecord.date,
                    checkInTime = checkInResponse.attendanceRecord.checkInTime,
                    checkOutTime = checkInResponse.attendanceRecord.checkOutTime,
                    totalMinutes = checkInResponse.attendanceRecord.totalMinutes,
                    status = checkInResponse.attendanceRecord.status,
                    notes = checkInResponse.attendanceRecord.notes,
                    checkInSelfieUrl = checkInResponse.checkIn.selfieUrl,
                    checkInLocation = if (latitude != null && longitude != null) "Lat $latitude, Lng $longitude" else null,
                    isSynced = true
                )
                attendanceDao.insertAttendance(attendanceEntity)
                
                Result.success(checkInResponse)
            } else {
                Result.failure(Exception("Check-in failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun checkOut(): Result<Unit> {
        return try {
            val response = apiService.checkOut()
            if (response.isSuccessful) {
                // Update local database with check-out time
                val todayAttendance = attendanceDao.getTodayAttendance()
                todayAttendance?.let {
                    attendanceDao.updateAttendance(it.copy(checkOutTime = java.time.LocalDateTime.now().toString()))
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Check-out failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun saveWorkDescription(
        employeeId: String,
        description: String
    ): Result<Unit> {
        return try {
            val response = apiService.saveWorkDescription(
                WorkDescriptionRequest(
                    employeeId = employeeId,
                    description = description,
                    timestamp = System.currentTimeMillis().toString()
                )
            )
            if (response.isSuccessful) {
                // Update local database with work description
                val todayAttendance = attendanceDao.getTodayAttendance()
                todayAttendance?.let {
                    attendanceDao.updateAttendance(it.copy(notes = description))
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to save work description"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getPerformance(
        month: Int,
        year: Int
    ): Result<PerformanceSnapshot> {
        return try {
            val response = apiService.getPerformance(month, year)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                // Return mock performance if API fails (useful for mock testing)
                Result.success(PerformanceSnapshot(
                    id = "perf-mock",
                    employeeId = "mock-123",
                    month = month,
                    year = year,
                    attendancePercent = 91.0,
                    taskCompletionRate = 85.0,
                    avgWorkScore = 4.2,
                    totalHoursLogged = 160.0,
                    performanceScore = 4.5,
                    daysPresent = 20,
                    daysAbsent = 2,
                    tasksAssigned = 45,
                    tasksCompleted = 42,
                    workSubmissions = 38
                ))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
