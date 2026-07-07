package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.api.RetrofitClient
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
    private val attendanceDao: AttendanceDao
) {
    
    private val apiService = RetrofitClient.apiService
    
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
    
    suspend fun getTodayAttendance(token: String): Result<AttendanceRecord> {
        return try {
            val response = apiService.getTodayAttendance("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
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
        longitude: Double?,
        token: String
    ): Result<CheckInResponse> {
        return try {
            val response = apiService.checkIn(
                "Bearer $token",
                CheckInRequest(selfie, latitude, longitude)
            )
            if (response.isSuccessful && response.body() != null) {
                val checkInResponse = response.body()!!
                
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
    
    suspend fun checkOut(token: String): Result<Unit> {
        return try {
            val response = apiService.checkOut("Bearer $token")
            if (response.isSuccessful) {
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
        description: String,
        token: String
    ): Result<Unit> {
        return try {
            val response = apiService.saveWorkDescription(
                "Bearer $token",
                WorkDescriptionRequest(
                    employeeId = employeeId,
                    description = description,
                    timestamp = System.currentTimeMillis().toString()
                )
            )
            if (response.isSuccessful) {
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
        year: Int,
        token: String
    ): Result<PerformanceSnapshot> {
        return try {
            val response = apiService.getPerformance("Bearer $token", month, year)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch performance"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
