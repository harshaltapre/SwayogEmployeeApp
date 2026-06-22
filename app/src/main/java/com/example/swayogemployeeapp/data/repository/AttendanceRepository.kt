package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.remote.AttendanceCheckInRequest
import com.example.swayogemployeeapp.data.remote.AttendanceCheckOutRequest
import com.example.swayogemployeeapp.data.remote.WorkSubmissionRequest
import com.example.swayogemployeeapp.data.remote.NetworkClient
import com.example.swayogemployeeapp.data.remote.WorkSubmissionDto
import com.example.swayogemployeeapp.data.sync.SyncManager
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class AttendanceRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)
    private val apiService = NetworkClient.getApiService(context)
    private val gson = Gson()

    fun getAllRecords(): Flow<List<AttendanceRecordEntity>> = db.attendanceRecordDao().getAllRecordsFlow()

    fun getTodayRecord(date: String): Flow<AttendanceRecordEntity?> = db.attendanceRecordDao().getRecordForDateFlow(date)

    suspend fun checkIn(latitude: Double, longitude: Double): Long {
        val todayStr = getCurrentDateString()
        val isoTime = getCurrentIsoTimestamp()

        val record = AttendanceRecordEntity(
            date = todayStr,
            checkInTime = isoTime,
            checkInLatitude = latitude,
            checkInLongitude = longitude,
            checkOutTime = null,
            checkOutLatitude = null,
            checkOutLongitude = null,
            totalBreakDurationSeconds = 0,
            isSynced = false
        )
        val localId = db.attendanceRecordDao().insert(record)

        // Queue in Outbox
        val request = AttendanceCheckInRequest(todayStr, isoTime, latitude, longitude)
        val outbox = OutboxQueueEntity(
            actionType = "CHECK_IN",
            endpoint = "api/v1/employee/attendance/check-in",
            payloadJson = gson.toJson(request),
            localAttachmentPaths = null
        )
        db.outboxQueueDao().enqueue(outbox)

        // Trigger Sync
        SyncManager.enqueueSync(context)
        return localId
    }

    suspend fun checkOut(latitude: Double, longitude: Double) {
        val todayStr = getCurrentDateString()
        val isoTime = getCurrentIsoTimestamp()

        val existing = db.attendanceRecordDao().getRecordForDate(todayStr)
        if (existing != null) {
            val updated = existing.copy(
                checkOutTime = isoTime,
                checkOutLatitude = latitude,
                checkOutLongitude = longitude,
                isSynced = false
            )
            db.attendanceRecordDao().update(updated)

            val request = AttendanceCheckOutRequest(todayStr, isoTime, latitude, longitude)
            val outbox = OutboxQueueEntity(
                actionType = "CHECK_OUT",
                endpoint = "api/v1/employee/attendance/check-out",
                payloadJson = gson.toJson(request),
                localAttachmentPaths = null
            )
            db.outboxQueueDao().enqueue(outbox)

            SyncManager.enqueueSync(context)
        }
    }

    suspend fun updateBreakDuration(durationSeconds: Long) {
        val todayStr = getCurrentDateString()
        val existing = db.attendanceRecordDao().getRecordForDate(todayStr)
        if (existing != null) {
            db.attendanceRecordDao().update(
                existing.copy(totalBreakDurationSeconds = existing.totalBreakDurationSeconds + durationSeconds)
            )
        }
    }

    suspend fun submitDailyWorkCommit(title: String, description: String, hours: Double, taskId: String): Long {
        val todayStr = getCurrentDateString()
        val localCommit = DailyCommitEntity(
            date = todayStr,
            taskDescription = "$title: $description",
            hoursSpent = hours,
            isSynced = false
        )
        val localId = db.dailyCommitDao().insert(localCommit)

        val request = WorkSubmissionRequest(title, description, hours, taskId)
        val outbox = OutboxQueueEntity(
            actionType = "COMMIT",
            endpoint = "api/v1/employee/submissions",
            payloadJson = gson.toJson(request),
            localAttachmentPaths = null
        )
        db.outboxQueueDao().enqueue(outbox)

        SyncManager.enqueueSync(context)
        return localId
    }

    fun getAllCommits(): Flow<List<DailyCommitEntity>> = db.dailyCommitDao().getAllCommitsFlow()

    suspend fun getWorkSubmissions(): List<WorkSubmissionDto> {
        return try {
            val response = apiService.getWorkSubmissions()
            if (response.isSuccessful) {
                response.body()?.submissions ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun getCurrentDateString(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }

    private fun getCurrentIsoTimestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }
}
