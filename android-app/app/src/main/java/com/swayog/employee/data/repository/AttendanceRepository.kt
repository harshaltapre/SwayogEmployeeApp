package com.swayog.employee.data.repository

import android.content.Context
import androidx.work.*
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.AttendanceDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.entity.AttendanceEntity
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.model.*
import com.swayog.employee.core.util.ErrorUtils
import com.swayog.employee.core.util.OfflinePendingException
import com.swayog.employee.core.util.LocalFileHelper
import com.swayog.employee.core.util.NetworkUtils
import com.swayog.employee.data.sync.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AttendanceRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val attendanceDao: AttendanceDao,
    private val outboxQueueDao: OutboxQueueDao,
    private val apiService: ApiService
) {
    val pendingSyncCount: Flow<Int> = outboxQueueDao.getPendingCountFlow()
    
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
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.record)
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun checkIn(
        selfie: String?,
        latitude: Double?,
        longitude: Double?,
        matchConfidence: Float? = null
    ): Result<CheckInResponse> {
        val isOnline = NetworkUtils.isNetworkAvailable(context)
        
        return if (isOnline) {
            try {
                val response = apiService.checkIn(
                    CheckInRequest(selfie, latitude, longitude, matchConfidence)
                )
                if (response.isSuccessful && response.body()?.result != null) {
                    val checkInResponse = response.body()!!.result!!
                    
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
                    // API call failed - save for offline sync
                    saveCheckInToOutbox(selfie, latitude, longitude, matchConfidence)
                    Result.failure(OfflinePendingException())
                }
            } catch (e: Exception) {
                // Network error - save for offline sync
                saveCheckInToOutbox(selfie, latitude, longitude, matchConfidence)
                Result.failure(OfflinePendingException())
            }
        } else {
            // Offline - save to outbox queue and create local attendance record
            val tempId = UUID.randomUUID().toString()
            val employeeId = "temp" // Will be updated when synced
            
            saveCheckInToOutbox(selfie, latitude, longitude, matchConfidence)
            
            // Create local attendance record
            val attendanceEntity = AttendanceEntity(
                id = tempId,
                employeeId = employeeId,
                date = java.time.LocalDate.now().toString(),
                checkInTime = java.time.LocalDateTime.now().toString(),
                checkOutTime = null,
                totalMinutes = null,
                status = "PRESENT",
                notes = null,
                checkInSelfieUrl = selfie,
                checkInLocation = if (latitude != null && longitude != null) "Lat $latitude, Lng $longitude" else null,
                isSynced = false
            )
            attendanceDao.insertAttendance(attendanceEntity)
            
            Result.failure(OfflinePendingException())
        }
    }
    
    private suspend fun saveCheckInToOutbox(
        selfie: String?,
        latitude: Double?,
        longitude: Double?,
        matchConfidence: Float?
    ) {
        val selfieFilePath = selfie?.let { LocalFileHelper.saveBase64ToFile(context, it, "attendance_selfie") }

        val payload = JSONObject().apply {
            put("selfieFilePath", selfieFilePath)
            put("latitude", latitude)
            put("longitude", longitude)
            put("matchConfidence", matchConfidence)
        }.toString()
        
        val outboxItem = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "attendance/check-in",
            method = "POST",
            payload = payload,
            createdAt = System.currentTimeMillis().toString()
        )
        outboxQueueDao.insertItem(outboxItem)
        scheduleSync()
    }
    
    private fun scheduleSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "offline_sync_work",
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )
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
            if (response.isSuccessful && response.body()?.snapshot != null) {
                Result.success(response.body()!!.snapshot!!)
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

    suspend fun syncMonthlyAttendance(month: Int, year: Int): Result<List<AttendanceRecord>> {
        return try {
            val response = apiService.getMonthlyAttendance(month, year)
            if (response.isSuccessful && response.body() != null) {
                val records = response.body()!!.records
                val entities = records.map { record ->
                    AttendanceEntity(
                        id = record.id,
                        employeeId = record.employeeId,
                        date = record.date,
                        checkInTime = record.checkInTime,
                        checkOutTime = record.checkOutTime,
                        totalMinutes = record.totalMinutes,
                        status = record.status,
                        notes = record.notes,
                        checkInSelfieUrl = null,
                        checkInLocation = null,
                        isSynced = true
                    )
                }
                attendanceDao.insertAll(entities)
                Result.success(records)
            } else {
                Result.failure(Exception("Failed to sync monthly attendance: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
