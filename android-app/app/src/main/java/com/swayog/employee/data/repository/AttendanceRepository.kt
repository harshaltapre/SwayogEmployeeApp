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
import kotlinx.coroutines.flow.first
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
    private val apiService: ApiService,
    private val dataStoreManager: com.swayog.employee.data.local.preferences.DataStoreManager
) {
    val pendingSyncCount: Flow<Int> = outboxQueueDao.getPendingCountFlow()
    
    private fun formatDate(dateStr: String): String {
        return if (dateStr.length >= 10) dateStr.substring(0, 10) else dateStr
    }
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

    /**
     * Reactive Flow for today's attendance record, queried by date only (no employeeId filter).
     * This is the reliable source of truth for the dashboard badge — it always reflects
     * whatever record the server wrote after check-in/check-out, regardless of employeeId format.
     */
    fun getTodayAttendanceFlow(): Flow<AttendanceRecord?> {
        val todayStr = java.time.LocalDate.now().toString()
        return attendanceDao.getTodayAttendanceFlow(todayStr).map { entity ->
            entity?.let {
                AttendanceRecord(
                    id = it.id,
                    employeeId = it.employeeId,
                    date = it.date,
                    checkInTime = it.checkInTime,
                    checkOutTime = it.checkOutTime,
                    totalMinutes = it.totalMinutes,
                    status = it.status,
                    notes = it.notes
                )
            }
        }
    }

    suspend fun getTodayAttendance(): Result<AttendanceRecord?> {
        val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        return try {
            val response = apiService.getTodayAttendance()
            
            if (response.isSuccessful && response.body() != null) {
                val record = response.body()!!.record
                if (record != null) {
                    attendanceDao.insertAttendance(
                        AttendanceEntity(
                            id = record.id,
                            employeeId = record.employeeId,
                            date = formatDate(record.date),
                            checkInTime = record.checkInTime,
                            checkOutTime = record.checkOutTime,
                            totalMinutes = record.totalMinutes,
                            status = record.status,
                            notes = record.notes,
                            checkInSelfieUrl = null,
                            checkInLocation = null,
                            isSynced = true
                        )
                    )
                }
                Result.success(record)
            } else {
                val cached = attendanceDao.getTodayAttendance(todayStr)
                Result.success(cached?.toAttendanceRecord())
            }
        } catch (e: Exception) {
            val cached = try { attendanceDao.getTodayAttendance(todayStr) } catch (_: Exception) { null }
            if (cached != null) {
                Result.success(cached.toAttendanceRecord())
            } else {
                Result.failure(e)
            }
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
                        date = formatDate(checkInResponse.attendanceRecord.date),
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
            // Offline — save to outbox queue and create a local attendance record so the
            // dashboard immediately reflects the check-in without waiting for a sync.
            val tempId = UUID.randomUUID().toString()
            // Use the real employeeId so the DashboardViewModel's Room Flow
            // (which filters by userId) can pick up this record immediately.
            val realEmployeeId = dataStoreManager.userId.first() ?: "temp"

            saveCheckInToOutbox(selfie, latitude, longitude, matchConfidence)

            // Create local attendance record
            val attendanceEntity = AttendanceEntity(
                id = tempId,
                employeeId = realEmployeeId,
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
        android.util.Log.d("TASK_SYNC", "Enqueued automatic sync work after attendance queue update")
    }
    
    suspend fun checkOut(): Result<Unit> {
        return try {
            val response = apiService.checkOut()
            if (response.isSuccessful) {
                // Write the local DB update immediately so the UI updates even before
                // we re-fetch from the server.
                val todayAttendance = attendanceDao.getTodayAttendance()
                todayAttendance?.let {
                    attendanceDao.updateAttendance(
                        it.copy(checkOutTime = java.time.LocalDateTime.now().toString())
                    )
                }
                // Re-fetch the authoritative record from the server (includes totalMinutes
                // computed by the backend) and persist it so the dashboard shows accurate data.
                getTodayAttendance()
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
                        date = formatDate(record.date),
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

    val attendanceRuleFlow: Flow<AttendanceRule> = dataStoreManager.attendanceRule

    suspend fun syncFaceEnrollment(employeeId: String? = null): Result<Boolean> {
        return try {
            val response = apiService.getFaceEnrollmentStatus(employeeId)
            if (response.isSuccessful && response.body() != null) {
                val status = response.body()!!
                if (status.enrolled && status.enrollment != null) {
                    val e = status.enrollment
                    if (e.descriptor1.isNotEmpty() && e.descriptor2.isNotEmpty() && e.descriptor3.isNotEmpty()) {
                        dataStoreManager.saveFaceEnrollment(e.descriptor1, e.descriptor2, e.descriptor3)
                    }
                    Result.success(true)
                } else {
                    dataStoreManager.clearFaceEnrollment()
                    Result.success(false)
                }
            } else {
                Result.failure(Exception("Failed to fetch face enrollment status: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAttendanceRules(): Result<AttendanceRule> {
        return try {
            val response = apiService.getAttendanceRules()
            if (response.isSuccessful && response.body() != null) {
                val rules = response.body()!!
                dataStoreManager.saveAttendanceRule(rules)
                Result.success(rules)
            } else {
                val cachedRule = dataStoreManager.attendanceRule.first()
                Result.success(cachedRule)
            }
        } catch (e: Exception) {
            val cachedRule = try { dataStoreManager.attendanceRule.first() } catch (_: Exception) { AttendanceRule() }
            Result.success(cachedRule)
        }
    }

    suspend fun updateAttendanceRules(rules: AttendanceRule): Result<AttendanceRule> {
        return try {
            val response = apiService.updateAttendanceRules(rules)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.rules != null) {
                val updated = response.body()!!.rules!!
                dataStoreManager.saveAttendanceRule(updated)
                Result.success(updated)
            } else {
                Result.failure(Exception("Failed to update attendance rules"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAllFaceEnrollments(): Result<List<EmployeeFaceEnrollmentItem>> {
        return try {
            val response = apiService.getAllFaceEnrollments()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.enrollments)
            } else {
                Result.failure(Exception("Failed to fetch face enrollments list"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

