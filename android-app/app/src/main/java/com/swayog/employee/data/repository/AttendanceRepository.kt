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
import com.swayog.employee.core.util.OnlineSubmissionFailedException
import com.swayog.employee.core.util.LocalFileHelper
import com.swayog.employee.core.util.NetworkUtils
import com.swayog.employee.data.sync.SyncManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
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
    private val dailyCommitRepository: DailyCommitRepository,
    private val dataStoreManager: com.swayog.employee.data.local.preferences.DataStoreManager,
    private val faceIndexManager: com.swayog.employee.presentation.attendance.face.FaceIndexManager,
    private val syncManager: SyncManager
) {
    val pendingSyncCount: Flow<Int> = syncManager.pendingSyncCountForCurrentUser
    
    private fun formatDate(dateStr: String): String {
        return if (dateStr.length >= 10) dateStr.substring(0, 10) else dateStr
    }
    fun getAttendanceByEmployeeId(employeeId: String): Flow<List<AttendanceRecord>> {
        return attendanceDao.getAttendanceByEmployeeId(employeeId).map { entities ->
            entities.map { it.toAttendanceRecord() }
        }
    }

    /** Current user's cached attendance only; another account's row must never feed this flow. */
    @OptIn(ExperimentalCoroutinesApi::class)
    fun getTodayAttendanceFlow(): Flow<AttendanceRecord?> {
        val todayStr = java.time.LocalDate.now().toString()
        return dataStoreManager.userId.flatMapLatest { userId ->
            if (userId.isNullOrBlank()) {
                flowOf(null)
            } else {
                attendanceDao.getTodayAttendanceFlow(userId, todayStr).map { entity ->
                    entity?.takeIf { it.employeeId == userId }?.toAttendanceRecord()
                }
            }
        }
    }

    /**
     * Fetches authoritative today's attendance from the backend and reconciles Room.
     * IMPORTANT: Never masks HTTP/network failures as Result.success(cached);
     * cached data continues to flow reactively via [getTodayAttendanceFlow], while callers
     * receive the truthful Result.failure so refresh errors are visible and recoverable.
     */
    suspend fun getTodayAttendance(): Result<AttendanceRecord?> {
        val todayStr = java.time.LocalDate.now().toString()
        val userId = dataStoreManager.userId.first()
        if (userId.isNullOrBlank()) return Result.failure(Exception("User is not authenticated"))
        return try {
            val response = apiService.getTodayAttendance()
            
            if (response.isSuccessful && response.body() != null) {
                val record = response.body()!!.record
                if (record != null) {
                    val dateKey = formatDate(record.date)
                    val existingLocal = try { attendanceDao.getTodayAttendance(userId, dateKey) } catch (_: Exception) { null }
                    val existingLoc = existingLocal?.checkInLocation
                    val locStr = if (record.latitude != null && record.longitude != null) {
                        "Lat ${record.latitude}, Lng ${record.longitude}"
                    } else existingLoc

                    // Conflict resolution: preserve an unsynced local check-out if the server hasn't received it yet
                    val hasUnsyncedLocalCheckOut = existingLocal != null &&
                        !existingLocal.isSynced &&
                        !existingLocal.checkOutTime.isNullOrBlank() &&
                        record.checkOutTime.isNullOrBlank()
                    val effectiveCheckOutTime = if (hasUnsyncedLocalCheckOut) existingLocal!!.checkOutTime else record.checkOutTime
                    val effectiveIsSynced = !hasUnsyncedLocalCheckOut

                    attendanceDao.deleteStaleTodayRowsExcludingId(userId, dateKey, record.id)
                    attendanceDao.insertAttendance(
                        AttendanceEntity(
                            id = record.id,
                            employeeId = userId,
                            date = dateKey,
                            checkInTime = record.checkInTime,
                            checkOutTime = effectiveCheckOutTime,
                            totalMinutes = record.totalMinutes,
                            status = record.status,
                            notes = record.notes,
                            checkInSelfieUrl = null,
                            checkInLocation = locStr,
                            isSynced = effectiveIsSynced,
                            source = record.source,
                            manualOverride = record.manualOverride,
                            reviewedBy = record.reviewedBy,
                            reviewerName = record.reviewerName,
                            isAttendanceCompleted = record.isAttendanceCompleted || !effectiveCheckOutTime.isNullOrBlank()
                        )
                    )
                    if (hasUnsyncedLocalCheckOut) {
                        syncManager.scheduleSync()
                    }
                } else {
                    val hasPendingCheckIn = outboxQueueDao.getPendingItemsForUser(userId)
                        .any { it.endpoint.contains("check-in") }
                    if (!hasPendingCheckIn) {
                        attendanceDao.deleteSyncedTodayAttendance(userId, todayStr)
                    }
                }
                dataStoreManager.recordSyncSuccess(httpCode = response.code())
                Result.success(record)
            } else {
                val errorMsg = ErrorUtils.formatResponseError(response)
                android.util.Log.w("AttendanceRepository", "getTodayAttendance failed: $errorMsg")
                dataStoreManager.recordSyncFailure(errorMsg, httpCode = response.code())
                Result.failure(OnlineSubmissionFailedException(errorMsg))
            }
        } catch (e: Exception) {
            val formatted = ErrorUtils.formatException(e)
            android.util.Log.w("AttendanceRepository", "getTodayAttendance exception: $formatted")
            dataStoreManager.recordSyncFailure(formatted)
            Result.failure(e)
        }
    }
    
    suspend fun checkIn(
        selfie: String?,
        latitude: Double?,
        longitude: Double?,
        matchConfidence: Float? = null,
        accuracy: Double? = null,
        verificationToken: String? = null,
        faceVerified: Boolean = false,
        livenessVerified: Boolean = false,
        liveDescriptor: List<Float>? = null
    ): Result<CheckInResponse> {
        val userId = dataStoreManager.userId.first()
        if (userId.isNullOrBlank()) return Result.failure(Exception("User is not authenticated"))
        val isOnline = NetworkUtils.isNetworkAvailable(context)
        val clientUploadId = UUID.randomUUID().toString()
        
        return if (isOnline) {
            try {
                // Obtain server-signed face verification token when face verification is required
                // and a live 128-d descriptor was captured on-device, without weakening verification.
                var effectiveVerificationToken = verificationToken
                if (effectiveVerificationToken.isNullOrBlank() && liveDescriptor != null && liveDescriptor.size == 128) {
                    val verifyResult = obtainFaceVerificationToken(
                        liveDescriptor = liveDescriptor,
                        livenessVerified = livenessVerified || faceVerified
                    )
                    if (verifyResult.isSuccess) {
                        effectiveVerificationToken = verifyResult.getOrNull()
                    } else {
                        val verifyErr = verifyResult.exceptionOrNull()
                        if (verifyErr != null && ErrorUtils.isNetworkException(verifyErr)) {
                            return handleOfflineCheckIn(
                                userId, selfie, latitude, longitude, matchConfidence, accuracy, null, clientUploadId
                            )
                        }
                        val rules = try { dataStoreManager.attendanceRule.first() } catch (_: Exception) { AttendanceRule() }
                        if (rules.faceRequired) {
                            val errMsg = verifyErr?.message ?: "Face verification failed on server. Please try again."
                            dataStoreManager.recordSyncFailure(errMsg, httpCode = 422)
                            return Result.failure(OnlineSubmissionFailedException(errMsg))
                        }
                    }
                }

                val request = CheckInRequest(
                    selfie = selfie,
                    latitude = latitude,
                    longitude = longitude,
                    matchConfidence = matchConfidence,
                    accuracy = accuracy,
                    verificationToken = effectiveVerificationToken,
                    faceVerified = !effectiveVerificationToken.isNullOrBlank() || faceVerified,
                    livenessVerified = !effectiveVerificationToken.isNullOrBlank() || livenessVerified,
                    liveDescriptor = liveDescriptor,
                    clientUploadId = clientUploadId
                )
                val response = apiService.checkIn(request, clientUploadId)
                if (response.isSuccessful && response.body()?.result != null) {
                    val checkInResponse = response.body()!!.result!!
                    val attRecord = checkInResponse.attendanceRecord
                    val authoritativeId = attRecord?.id ?: UUID.randomUUID().toString()
                    val dateKey = formatDate(attRecord?.date ?: java.time.LocalDate.now().toString())
                    
                    // Save authoritative record to local database and remove any stale temp row
                    val attendanceEntity = AttendanceEntity(
                        id = authoritativeId,
                        employeeId = userId,
                        date = dateKey,
                        checkInTime = attRecord?.checkInTime ?: java.time.LocalDateTime.now().toString(),
                        checkOutTime = attRecord?.checkOutTime,
                        totalMinutes = attRecord?.totalMinutes,
                        status = attRecord?.status ?: "PRESENT",
                        notes = attRecord?.notes,
                        checkInSelfieUrl = checkInResponse.checkIn?.selfieUrl ?: selfie,
                        checkInLocation = if (latitude != null && longitude != null) "Lat $latitude, Lng $longitude" else null,
                        isSynced = true,
                        source = attRecord?.source,
                        manualOverride = attRecord?.manualOverride ?: false,
                        reviewedBy = attRecord?.reviewedBy,
                        reviewerName = attRecord?.reviewerName,
                        isAttendanceCompleted = attRecord?.isAttendanceCompleted ?: false
                    )
                    attendanceDao.deleteStaleTodayRowsExcludingId(userId, dateKey, authoritativeId)
                    attendanceDao.insertAttendance(attendanceEntity)
                    dataStoreManager.recordSyncSuccess(httpCode = response.code())
                    
                    Result.success(checkInResponse)
                } else {
                    // Online but server rejected/failed the request — do NOT save to outbox.
                    val errorMsg = ErrorUtils.formatResponseError(response)
                    android.util.Log.e("AttendanceRepository", "Check-in rejected by server (online): $errorMsg")

                    // Idempotent recovery: If server confirms already checked in today (409 or 400), reconcile and succeed
                    if ((response.code() == 409 || response.code() == 400) &&
                        errorMsg.contains("Already checked in", ignoreCase = true)
                    ) {
                        android.util.Log.i("AttendanceRepository", "Attendance already recorded on server; reconciling local state")
                        val todayRecord = getTodayAttendance().getOrNull()
                        return Result.success(CheckInResponse(attendanceRecord = todayRecord))
                    }
                    
                    dataStoreManager.recordSyncFailure(errorMsg, httpCode = response.code())
                    val userFriendlyError = if (response.code() == 401 || errorMsg.contains("401", ignoreCase = true) || 
                        errorMsg.contains("unauthorized", ignoreCase = true) || errorMsg.contains("authentication", ignoreCase = true)) {
                        "Your session has expired. Please sign in again and retry check-in."
                    } else {
                        errorMsg
                    }
                    
                    Result.failure(OnlineSubmissionFailedException(userFriendlyError))
                }
            } catch (e: Exception) {
                if (ErrorUtils.isNetworkException(e)) {
                    android.util.Log.w("AttendanceRepository", "Check-in network exception: ${e.message}")
                    handleOfflineCheckIn(userId, selfie, latitude, longitude, matchConfidence, accuracy, verificationToken, clientUploadId)
                } else {
                    android.util.Log.e("AttendanceRepository", "Check-in unexpected exception (online): ${e.message}")
                    Result.failure(OnlineSubmissionFailedException(e.message ?: "An unexpected error occurred during check-in."))
                }
            }
        } else {
            handleOfflineCheckIn(userId, selfie, latitude, longitude, matchConfidence, accuracy, verificationToken, clientUploadId)
        }
    }

    /**
     * Handles offline/network-interrupted check-in while strictly preserving face verification integrity.
     * When face verification is mandatory and no server-issued verificationToken is present,
     * we refuse to bypass verification or mark the employee as verified offline.
     */
    private suspend fun handleOfflineCheckIn(
        userId: String,
        selfie: String?,
        latitude: Double?,
        longitude: Double?,
        matchConfidence: Float?,
        accuracy: Double?,
        verificationToken: String?,
        clientUploadId: String
    ): Result<CheckInResponse> {
        val rules = try { dataStoreManager.attendanceRule.first() } catch (_: Exception) { AttendanceRule() }
        if (rules.faceRequired && verificationToken.isNullOrBlank()) {
            return Result.failure(
                OnlineSubmissionFailedException(
                    "Internet connection is required to complete face-verified check-in. Please reconnect and try again."
                )
            )
        }

        val tempId = UUID.randomUUID().toString()
        saveCheckInToOutbox(userId, selfie, latitude, longitude, matchConfidence, accuracy, verificationToken, clientUploadId)

        val attendanceEntity = AttendanceEntity(
            id = tempId,
            employeeId = userId,
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

        return Result.failure(OfflinePendingException())
    }
    
    private suspend fun saveCheckInToOutbox(
        ownerUserId: String,
        selfie: String?,
        latitude: Double?,
        longitude: Double?,
        matchConfidence: Float?,
        accuracy: Double?,
        verificationToken: String?,
        clientUploadId: String
    ) {
        val selfieFilePath = selfie?.let { LocalFileHelper.saveBase64ToFile(context, it, "attendance_selfie") }

        val payload = JSONObject().apply {
            put("selfieFilePath", selfieFilePath)
            put("latitude", latitude)
            put("longitude", longitude)
            put("matchConfidence", matchConfidence)
            put("accuracy", accuracy)
            if (!verificationToken.isNullOrBlank()) {
                put("verificationToken", verificationToken)
            }
            put("clientUploadId", clientUploadId)
        }.toString()
        
        val pending = outboxQueueDao.getPendingItemsForUser(ownerUserId)
        val existingCheckIn = pending.firstOrNull { it.endpoint.contains("check-in") }
        if (existingCheckIn != null) {
            outboxQueueDao.updateItem(
                existingCheckIn.copy(
                    payload = payload,
                    clientUploadId = existingCheckIn.clientUploadId ?: clientUploadId
                )
            )
            syncManager.scheduleSync()
            return
        }

        val outboxItem = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "employee/attendance/check-in",
            method = "POST",
            payload = payload,
            createdAt = System.currentTimeMillis().toString(),
            clientUploadId = clientUploadId,
            ownerUserId = ownerUserId
        )
        outboxQueueDao.insertItem(outboxItem)
        syncManager.scheduleSync()
    }
    
    suspend fun checkOut(): Result<Unit> {
        val userId = dataStoreManager.userId.first()
        if (userId.isNullOrBlank()) return Result.failure(Exception("User is not authenticated"))
        val isOnline = NetworkUtils.isNetworkAvailable(context)
        val clientUploadId = UUID.randomUUID().toString()
        return if (isOnline) {
            try {
                val response = apiService.checkOut(
                    request = CheckOutRequest(clientUploadId = clientUploadId),
                    idempotencyKey = clientUploadId
                )
                if (response.isSuccessful) {
                    val todayAttendance = attendanceDao.getTodayAttendance(userId)
                    todayAttendance?.let {
                        attendanceDao.updateAttendance(
                            it.copy(checkOutTime = java.time.LocalDateTime.now().toString(), isSynced = true)
                        )
                    }
                    dataStoreManager.recordSyncSuccess(httpCode = response.code())
                    // Re-fetch authoritative record from server
                    getTodayAttendance()
                    Result.success(Unit)
                } else {
                    val errorMsg = ErrorUtils.formatResponseError(response)
                    android.util.Log.e("AttendanceRepository", "Check-out rejected by server: $errorMsg")
                    // Idempotent recovery: If server confirms already checked out today (409 or 400), reconcile and succeed
                    if ((response.code() == 409 || response.code() == 400) &&
                        errorMsg.contains("Already checked out", ignoreCase = true)
                    ) {
                        android.util.Log.i("AttendanceRepository", "Already checked out on server; reconciling local state")
                        val todayAttendance = attendanceDao.getTodayAttendance(userId)
                        todayAttendance?.let {
                            attendanceDao.updateAttendance(
                                it.copy(checkOutTime = java.time.LocalDateTime.now().toString(), isSynced = true)
                            )
                        }
                        getTodayAttendance()
                        return Result.success(Unit)
                    }
                    dataStoreManager.recordSyncFailure(errorMsg, httpCode = response.code())
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                if (ErrorUtils.isNetworkException(e)) {
                    saveCheckOutToOutbox(userId, clientUploadId)
                    updateLocalCheckOut(userId)
                    Result.failure(OfflinePendingException("Check-out saved offline. Will sync automatically when online."))
                } else {
                    Result.failure(e)
                }
            }
        } else {
            saveCheckOutToOutbox(userId, clientUploadId)
            updateLocalCheckOut(userId)
            Result.failure(OfflinePendingException("Check-out saved offline. Will sync automatically when online."))
        }
    }

    private suspend fun updateLocalCheckOut(userId: String) {
        try {
            val todayAttendance = attendanceDao.getTodayAttendance(userId)
            todayAttendance?.let {
                attendanceDao.updateAttendance(
                    it.copy(
                        checkOutTime = java.time.LocalDateTime.now().toString(),
                        isSynced = false
                    )
                )
            }
        } catch (e: Exception) {
            android.util.Log.w("AttendanceRepository", "Local check-out update notice: ${e.message}")
        }
    }

    private suspend fun saveCheckOutToOutbox(ownerUserId: String, clientUploadId: String) {
        val pending = outboxQueueDao.getPendingItemsForUser(ownerUserId)
        val existingCheckOut = pending.firstOrNull { it.endpoint.contains("check-out") }
        if (existingCheckOut != null) {
            syncManager.scheduleSync()
            return
        }

        val payload = JSONObject().apply {
            put("clientUploadId", clientUploadId)
        }.toString()

        val outboxItem = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "employee/attendance/check-out",
            method = "POST",
            payload = payload,
            createdAt = System.currentTimeMillis().toString(),
            clientUploadId = clientUploadId,
            ownerUserId = ownerUserId
        )
        outboxQueueDao.insertItem(outboxItem)
        syncManager.scheduleSync()
    }
    
    suspend fun saveWorkDescription(
        employeeId: String,
        description: String
    ): Result<Unit> {
        val todayStr = java.time.LocalDate.now().toString()
        val trimmed = description.trim()
        if (trimmed.length < 2) {
            return Result.failure(Exception("Description is too short"))
        }

        // Ensure work summary satisfies server schema requirement (min 10 characters)
        val formattedSummary = if (trimmed.length < 10) {
            "Quick Update: $trimmed"
        } else {
            trimmed
        }

        // 1. Submit to DailyCommit (visible directly to Admin & Super Admin)
        val commitResult = dailyCommitRepository.createDailyCommit(
            employeeId = employeeId,
            commitDate = todayStr,
            taskWorkedOn = "Quick Work Update",
            workSummary = formattedSummary,
            hoursSpent = 1.0,
            issuesBlockers = null,
            tomorrowPlan = null,
            attachmentUrl = null
        )

        if (commitResult.isSuccess) {
            android.util.Log.d("ATTENDANCE_REPO", "Quick update saved to DailyCommit for admin/superadmin visibility")
        } else {
            android.util.Log.w("ATTENDANCE_REPO", "Daily commit submission result: ${commitResult.exceptionOrNull()?.message}")
        }

        // 2. Update local attendance notes if available
        try {
            val todayAttendance = attendanceDao.getTodayAttendance(employeeId)
            todayAttendance?.let {
                attendanceDao.updateAttendance(it.copy(notes = trimmed))
            }
        } catch (e: Exception) {
            android.util.Log.w("ATTENDANCE_REPO", "Local attendance notes update notice: ${e.message}")
        }

        return if (commitResult.isSuccess) {
            Result.success(Unit)
        } else {
            val err = commitResult.exceptionOrNull()
            if (err is OfflinePendingException) {
                Result.failure(err)
            } else {
                Result.failure(err ?: Exception("Failed to submit quick update"))
            }
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
                val errorMsg = response.errorBody()?.string() ?: "Failed to fetch performance snapshot (${response.code()})"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMonthlyAttendanceData(month: Int, year: Int): Result<MonthlyAttendanceResponse> {
        return try {
            val response = apiService.getMonthlyAttendance(month, year)
            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                val records = data.records
                val userId = dataStoreManager.userId.first()
                    ?: return Result.failure(Exception("User is not authenticated"))
                val entities = records.map { record ->
                    val locStr = if (record.latitude != null && record.longitude != null) {
                        "Lat ${record.latitude}, Lng ${record.longitude}"
                    } else null
                    AttendanceEntity(
                        id = record.id,
                        employeeId = userId,
                        date = formatDate(record.date),
                        checkInTime = record.checkInTime,
                        checkOutTime = record.checkOutTime,
                        totalMinutes = record.totalMinutes,
                        status = record.status,
                        notes = record.notes,
                        checkInSelfieUrl = null,
                        checkInLocation = locStr,
                        isSynced = true,
                        source = record.source,
                        manualOverride = record.manualOverride,
                        reviewedBy = record.reviewedBy,
                        reviewerName = record.reviewerName,
                        isAttendanceCompleted = record.isAttendanceCompleted
                    )
                }
                if (entities.isNotEmpty()) {
                    attendanceDao.insertAll(entities)
                }
                dataStoreManager.recordSyncSuccess(httpCode = response.code())
                Result.success(data)
            } else {
                val errMsg = ErrorUtils.formatResponseError(response)
                dataStoreManager.recordSyncFailure(errMsg, httpCode = response.code())
                Result.failure(OnlineSubmissionFailedException(errMsg))
            }
        } catch (e: Exception) {
            dataStoreManager.recordSyncFailure(ErrorUtils.formatException(e))
            Result.failure(e)
        }
    }

    suspend fun getHolidays(month: Int? = null, year: Int? = null): Result<List<HolidayItem>> {
        return try {
            val response = apiService.getHolidays(month, year)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.holidays)
            } else {
                Result.failure(Exception("Failed to fetch holidays: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun syncMonthlyAttendance(month: Int, year: Int): Result<List<AttendanceRecord>> {
        return getMonthlyAttendanceData(month, year).map { it.records }
    }

    val attendanceRuleFlow: Flow<AttendanceRule> = dataStoreManager.attendanceRule

    suspend fun syncFaceEnrollment(employeeId: String? = null): Result<Boolean> {
        return try {
            val response = apiService.getFaceEnrollmentStatus(employeeId)
            if (response.isSuccessful && response.body() != null) {
                val status = response.body()!!
                if (status.enrolled && status.enrollment != null && !status.enrollment.isDeleted) {
                    val e = status.enrollment
                    val localVersion = try { dataStoreManager.faceEnrollmentVersion.first() } catch (_: Exception) { 0 }
                    val localDescriptors = dataStoreManager.faceDescriptors.first()

                    val serverDescriptors = listOf(e.descriptor1, e.descriptor2, e.descriptor3)
                    val serverDescriptorsValid = serverDescriptors.all {
                        com.swayog.employee.data.local.preferences.DataStoreManager.isValidFaceDescriptor(
                            it,
                            com.swayog.employee.presentation.attendance.face.FaceEmbeddingHelper.EMBEDDING_DIMENSION
                        )
                    }
                    if (serverDescriptorsValid) {
                        if (e.syncVersion > localVersion || localDescriptors.size != 3) {
                            dataStoreManager.saveFaceEnrollment(
                                descriptor1 = e.descriptor1,
                                descriptor2 = e.descriptor2,
                                descriptor3 = e.descriptor3,
                                enrollmentId = e.id,
                                syncVersion = e.syncVersion,
                                updatedAt = e.updatedAt,
                                syncStatus = "SYNCED"
                            )
                            faceIndexManager.loadFromDataStore()
                        } else {
                            android.util.Log.w(
                                "AttendanceRepository",
                                "[FACE_UPDATE_5] Keeping newer local enrollment version=$localVersion over server version=${e.syncVersion}"
                            )
                            faceIndexManager.loadFromDataStore()
                        }
                    } else {
                        android.util.Log.w("AttendanceRepository", "Ignoring invalid server face descriptors; preserving local enrollment")
                        faceIndexManager.loadFromDataStore()
                    }
                    Result.success(true)
                } else if (status.enrollment?.isDeleted == true) {
                    dataStoreManager.clearFaceEnrollment()
                    faceIndexManager.clear()
                    Result.success(false)
                } else {
                    val localDescriptors = faceIndexManager.loadFromDataStore()
                    if (localDescriptors.isNotEmpty()) {
                        android.util.Log.w(
                            "AttendanceRepository",
                            "Server reports no face enrollment; preserving valid local descriptors for offline recognition"
                        )
                        dataStoreManager.setFaceSyncStatus("PENDING")
                    }
                    Result.success(localDescriptors.isNotEmpty())
                }
            } else {
                // If network/server fails, warm up in-memory index from local cache so offline face match works
                faceIndexManager.loadFromDataStore()
                Result.failure(Exception("Failed to fetch face enrollment status: ${response.message()}"))
            }
        } catch (e: Exception) {
            // Offline fallback: load cached embeddings into in-memory index
            try { faceIndexManager.loadFromDataStore() } catch (_: Exception) {}
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

    suspend fun submitRegularizationRequest(
        payload: RegularizationRequestPayload
    ): Result<RegularizationItem> {
        return try {
            val response = apiService.submitRegularizationRequest(payload)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && body.request != null) {
                    Result.success(body.request)
                } else {
                    val msg = body.error ?: body.message ?: "Failed to submit regularization request"
                    Result.failure(Exception(msg))
                }
            } else {
                val errBody = try { response.errorBody()?.string() } catch (_: Exception) { null }
                val errorMsg = if (!errBody.isNullOrBlank()) {
                    try {
                        val json = org.json.JSONObject(errBody)
                        val error = json.optString("error", json.optString("message", errBody))
                        // Improve error message for token expiration
                        if (error.contains("expired", ignoreCase = true) || error.contains("token", ignoreCase = true)) {
                            "Your session has expired. Please sign in again and resubmit your request."
                        } else {
                            error
                        }
                    } catch (_: Exception) {
                        errBody
                    }
                } else {
                    response.message().ifEmpty { "Failed to submit regularization request" }
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyRegularizationRequests(): Result<List<RegularizationItem>> {
        return try {
            val response = apiService.getMyRegularizationRequests()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.requests)
            } else {
                Result.failure(Exception("Failed to fetch regularization requests"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLateAllowanceSummary(month: Int? = null, year: Int? = null): Result<LateAllowanceSummaryResponse> {
        return try {
            val response = apiService.getLateAllowanceSummary(month, year)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch late allowance summary: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAlarmSettings(): Result<AlarmSettingsResponse> {
        return try {
            val response = apiService.getAlarmSettings()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch alarm settings: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveAlarmSettings(settings: com.swayog.employee.data.model.SaveAlarmSettingsRequest): Result<SaveAlarmSettingsResponse> {
        return try {
            val response = apiService.saveAlarmSettings(settings)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to save alarm settings: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAlarmPolicy(): Result<com.swayog.employee.data.model.CompanyAlarmPolicyResponse> {
        return try {
            val response = apiService.getAlarmPolicy()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch alarm policy: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Exchanges a live 128-d face descriptor for a short-lived server-signed verification token.
     * If the server reports 404 (no enrollment on server yet) while valid local descriptors exist,
     * uploads the pending enrollment first and retries verification once.
     */
    private suspend fun obtainFaceVerificationToken(
        liveDescriptor: List<Float>,
        livenessVerified: Boolean
    ): Result<String> {
        val firstAttempt = try {
            apiService.verifyFace(FaceVerifyRequest(liveDescriptor, livenessVerified))
        } catch (e: Exception) {
            return Result.failure(e)
        }

        if (firstAttempt.isSuccessful && firstAttempt.body()?.success == true && !firstAttempt.body()?.verificationToken.isNullOrBlank()) {
            return Result.success(firstAttempt.body()!!.verificationToken!!)
        }

        // If server has no enrollment yet (404) but device has valid local 3-descriptor enrollment, sync it once and retry
        if (firstAttempt.code() == 404) {
            val localDescriptors = try { dataStoreManager.faceDescriptors.first() } catch (_: Exception) { emptyList() }
            val validLocal = localDescriptors.size == 3 && localDescriptors.all {
                com.swayog.employee.data.local.preferences.DataStoreManager.isValidFaceDescriptor(
                    it,
                    com.swayog.employee.presentation.attendance.face.FaceEmbeddingHelper.EMBEDDING_DIMENSION
                )
            }
            if (validLocal) {
                try {
                    val enrollResp = apiService.enrollFace(
                        FaceEnrollRequest(
                            descriptor1 = localDescriptors[0],
                            descriptor2 = localDescriptors[1],
                            descriptor3 = localDescriptors[2],
                            source = "MOBILE"
                        )
                    )
                    if (enrollResp.isSuccessful && enrollResp.body()?.success == true) {
                        val body = enrollResp.body()!!
                        val currentVersion = try { dataStoreManager.faceEnrollmentVersion.first() } catch (_: Exception) { 0 }
                        dataStoreManager.saveFaceEnrollment(
                            descriptor1 = localDescriptors[0],
                            descriptor2 = localDescriptors[1],
                            descriptor3 = localDescriptors[2],
                            enrollmentId = body.enrollmentId,
                            syncVersion = body.syncVersion ?: (currentVersion + 1),
                            updatedAt = body.enrolledAt,
                            syncStatus = "SYNCED"
                        )
                        val retryAttempt = apiService.verifyFace(FaceVerifyRequest(liveDescriptor, livenessVerified))
                        if (retryAttempt.isSuccessful && retryAttempt.body()?.success == true && !retryAttempt.body()?.verificationToken.isNullOrBlank()) {
                            return Result.success(retryAttempt.body()!!.verificationToken!!)
                        }
                        return Result.failure(Exception(ErrorUtils.formatResponseError(retryAttempt)))
                    }
                } catch (e: Exception) {
                    return Result.failure(e)
                }
            }
        }

        val errMsg = firstAttempt.body()?.error?.takeIf { it.isNotBlank() }
            ?: ErrorUtils.formatResponseError(firstAttempt)
        return Result.failure(Exception(errMsg))
    }

    suspend fun verifyFace(request: FaceVerifyRequest): Result<FaceVerifyResponse> {
        return try {
            val response = apiService.verifyFace(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = ErrorUtils.formatResponseError(response)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
