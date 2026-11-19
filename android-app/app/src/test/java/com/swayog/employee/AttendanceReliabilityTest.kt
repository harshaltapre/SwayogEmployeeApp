package com.swayog.employee

import android.content.Context
import androidx.sqlite.db.SupportSQLiteDatabase
import com.swayog.employee.core.util.OnlineSubmissionFailedException
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.AttendanceDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.database.AppDatabase
import com.swayog.employee.data.local.entity.AttendanceEntity
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.AttendanceRule
import com.swayog.employee.data.model.TodayAttendanceResponse
import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.data.repository.DailyCommitRepository
import com.swayog.employee.data.sync.SyncManager
import com.swayog.employee.presentation.attendance.face.FaceIndexManager
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import retrofit2.Response

class AttendanceReliabilityTest {

    private lateinit var context: Context
    private lateinit var attendanceDao: AttendanceDao
    private lateinit var outboxQueueDao: OutboxQueueDao
    private lateinit var apiService: ApiService
    private lateinit var dailyCommitRepository: DailyCommitRepository
    private lateinit var dataStoreManager: DataStoreManager
    private lateinit var faceIndexManager: FaceIndexManager
    private lateinit var syncManager: SyncManager
    private lateinit var repository: AttendanceRepository

    @Before
    fun setUp() {
        context = mock(Context::class.java)
        attendanceDao = mock(AttendanceDao::class.java)
        outboxQueueDao = mock(OutboxQueueDao::class.java)
        apiService = mock(ApiService::class.java)
        dailyCommitRepository = mock(DailyCommitRepository::class.java)
        dataStoreManager = mock(DataStoreManager::class.java)
        faceIndexManager = mock(FaceIndexManager::class.java)
        syncManager = mock(SyncManager::class.java)

        `when`(syncManager.pendingSyncCountForCurrentUser).thenReturn(flowOf(0))
        `when`(dataStoreManager.userId).thenReturn(flowOf("emp-123"))
        `when`(dataStoreManager.attendanceRule).thenReturn(flowOf(AttendanceRule(faceRequired = true)))

        repository = AttendanceRepository(
            context = context,
            attendanceDao = attendanceDao,
            outboxQueueDao = outboxQueueDao,
            apiService = apiService,
            dailyCommitRepository = dailyCommitRepository,
            dataStoreManager = dataStoreManager,
            faceIndexManager = faceIndexManager,
            syncManager = syncManager
        )
    }

    @Test
    fun getTodayAttendance_httpFailure_returnsFailureInsteadOfFalseSuccess() = runTest {
        val errorBody = """{"error":"Unauthorized"}""".toResponseBody("application/json".toMediaType())
        `when`(apiService.getTodayAttendance()).thenReturn(Response.error(401, errorBody))

        val result = repository.getTodayAttendance()

        assertTrue("Failed HTTP response must return Result.failure, never cached Result.success", result.isFailure)
        assertTrue(result.exceptionOrNull() is OnlineSubmissionFailedException)
    }

    @Test
    fun getTodayAttendance_httpSuccess_reconcilesRoomAndRemovesStaleTempRows() = runTest {
        val today = java.time.LocalDate.now().toString()
        val serverRecord = AttendanceRecord(
            id = "server-att-99",
            employeeId = "emp-123",
            date = today,
            checkInTime = "${today}T09:15:00Z",
            checkOutTime = null,
            totalMinutes = null,
            status = "PRESENT",
            notes = null,
            latitude = 18.5204,
            longitude = 73.8567,
            source = "EMPLOYEE_CHECK_IN"
        )
        `when`(apiService.getTodayAttendance()).thenReturn(Response.success(TodayAttendanceResponse(serverRecord)))

        val result = repository.getTodayAttendance()

        assertTrue(result.isSuccess)
        assertEquals("server-att-99", result.getOrNull()?.id)
        verify(attendanceDao).deleteStaleTodayRowsExcludingId("emp-123", today, "server-att-99")
        verify(attendanceDao).insertAttendance(
            AttendanceEntity(
                id = "server-att-99",
                employeeId = "emp-123",
                date = today,
                checkInTime = "${today}T09:15:00Z",
                checkOutTime = null,
                totalMinutes = null,
                status = "PRESENT",
                notes = null,
                checkInSelfieUrl = null,
                checkInLocation = "Lat 18.5204, Lng 73.8567",
                isSynced = true,
                source = "EMPLOYEE_CHECK_IN",
                manualOverride = false,
                reviewedBy = null,
                reviewerName = null,
                isAttendanceCompleted = false
            )
        )
    }

    @Test
    fun getTodayAttendance_serverNullAndNoPendingCheckIn_clearsStaleSyncedRow() = runTest {
        val today = java.time.LocalDate.now().toString()
        `when`(apiService.getTodayAttendance()).thenReturn(Response.success(TodayAttendanceResponse(null)))
        `when`(outboxQueueDao.getPendingItemsForUser("emp-123")).thenReturn(emptyList())

        val result = repository.getTodayAttendance()

        assertTrue(result.isSuccess)
        verify(attendanceDao).deleteSyncedTodayAttendance("emp-123", today)
    }

    @Test
    fun checkIn_offlineWithFaceRequiredAndNoToken_refusesToBypassVerification() = runTest {
        // context.getSystemService returns null in unit test -> NetworkUtils.isNetworkAvailable is false (offline)
        val result = repository.checkIn(
            selfie = null,
            latitude = 18.5204,
            longitude = 73.8567,
            verificationToken = null
        )

        assertTrue("Offline face-required check-in without token must fail cleanly", result.isFailure)
        assertTrue(result.exceptionOrNull() is OnlineSubmissionFailedException)
        verify(outboxQueueDao, never()).insertItem(
            OutboxQueueEntity(id = "", endpoint = "", method = "", payload = "", createdAt = "")
        )
        assertFalse(result.isSuccess)
    }

    @Test
    fun migration17To18_isNonDestructiveAndQuarantinesLegacyOutboxRows() {
        val db = mock(SupportSQLiteDatabase::class.java)
        val executedSql = mutableListOf<String>()
        Mockito.doAnswer { invocation ->
            executedSql.add(invocation.getArgument(0))
            null
        }.`when`(db).execSQL(Mockito.anyString())

        AppDatabase.MIGRATION_17_18.migrate(db)

        assertTrue(
            "Migration 17->18 must add ownerUserId with default ''",
            executedSql.any { it.contains("ALTER TABLE `outbox_queue` ADD COLUMN `ownerUserId` TEXT NOT NULL DEFAULT ''") }
        )
        assertTrue(
            "Migration 17->18 must add lastError column",
            executedSql.any { it.contains("ALTER TABLE `outbox_queue` ADD COLUMN `lastError` TEXT") }
        )
        assertTrue(
            "Migration 17->18 must add lastAttemptAt column",
            executedSql.any { it.contains("ALTER TABLE `outbox_queue` ADD COLUMN `lastAttemptAt` INTEGER") }
        )
        assertFalse(
            "Migration 17->18 must NEVER drop any table",
            executedSql.any { it.contains("DROP TABLE", ignoreCase = true) }
        )
    }

    @Test
    fun getMonthlyAttendanceData_preservesEnrichedFieldsAndFailsTruthfully() = runTest {
        val today = java.time.LocalDate.now().toString()
        val record = AttendanceRecord(
            id = "att-month-1",
            employeeId = "emp-123",
            date = "${today}T00:00:00.000Z",
            checkInTime = "${today}T09:15:00.000Z",
            checkOutTime = "${today}T18:15:00.000Z",
            totalMinutes = 540,
            status = "PRESENT_LATE_ALLOWANCE",
            notes = "Admin verified",
            latitude = 18.5204,
            longitude = 73.8567,
            source = "ADMIN_MARKED",
            manualOverride = true,
            reviewedBy = "admin-1",
            reviewerName = "Manager",
            isAttendanceCompleted = true
        )
        `when`(apiService.getMonthlyAttendance(11, 2026)).thenReturn(
            Response.success(
                com.swayog.employee.data.model.MonthlyAttendanceResponse(
                    records = listOf(record),
                    present = 1,
                    workingDays = 1
                )
            )
        )

        val result = repository.getMonthlyAttendanceData(11, 2026)

        assertTrue(result.isSuccess)
        verify(attendanceDao).insertAll(
            listOf(
                AttendanceEntity(
                    id = "att-month-1",
                    employeeId = "emp-123",
                    date = today,
                    checkInTime = "${today}T09:15:00.000Z",
                    checkOutTime = "${today}T18:15:00.000Z",
                    totalMinutes = 540,
                    status = "PRESENT_LATE_ALLOWANCE",
                    notes = "Admin verified",
                    checkInSelfieUrl = null,
                    checkInLocation = "Lat 18.5204, Lng 73.8567",
                    isSynced = true,
                    source = "ADMIN_MARKED",
                    manualOverride = true,
                    reviewedBy = "admin-1",
                    reviewerName = "Manager",
                    isAttendanceCompleted = true
                )
            )
        )

        val errBody = """{"success":false,"error":"Unauthorized"}""".toResponseBody("application/json".toMediaType())
        `when`(apiService.getMonthlyAttendance(10, 2026)).thenReturn(Response.error(401, errBody))
        val failed = repository.getMonthlyAttendanceData(10, 2026)
        assertTrue(failed.isFailure)
    }

    @Test
    fun syncManager_usesSingleSharedUniqueWorkName() {
        assertEquals("offline_sync_work", SyncManager.SYNC_WORK_NAME)
    }
}
