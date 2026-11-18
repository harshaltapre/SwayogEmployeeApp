package com.swayog.employee

import android.content.Context
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.AttendanceDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.database.AppDatabase
import com.swayog.employee.data.local.entity.AttendanceEntity
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.TodayAttendanceResponse
import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.data.repository.DailyCommitRepository
import com.swayog.employee.data.sync.SyncManager
import com.swayog.employee.presentation.attendance.face.FaceIndexManager
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Test
import org.mockito.Mockito.*
import retrofit2.Response
import java.io.IOException

class AttendanceSyncReliabilityTest {

    private fun buildRepository(
        apiService: ApiService,
        attendanceDao: AttendanceDao = mock(AttendanceDao::class.java),
        outboxQueueDao: OutboxQueueDao = mock(OutboxQueueDao::class.java),
        dataStoreManager: DataStoreManager = mock(DataStoreManager::class.java),
        syncManager: SyncManager = mock(SyncManager::class.java)
    ): AttendanceRepository {
        val context = mock(Context::class.java)
        val dailyCommitRepo = mock(DailyCommitRepository::class.java)
        val faceIndexManager = mock(FaceIndexManager::class.java)
        `when`(dataStoreManager.userId).thenReturn(flowOf("emp-123"))
        `when`(dataStoreManager.lastSuccessfulSyncAt).thenReturn(flowOf(null))
        `when`(dataStoreManager.lastSyncStatus).thenReturn(flowOf("UNKNOWN"))
        `when`(dataStoreManager.lastSyncError).thenReturn(flowOf(null))
        `when`(syncManager.pendingSyncCountForCurrentUser).thenReturn(flowOf(0))
        `when`(syncManager.failedSyncCountForCurrentUser).thenReturn(flowOf(0))

        return AttendanceRepository(
            context = context,
            attendanceDao = attendanceDao,
            outboxQueueDao = outboxQueueDao,
            apiService = apiService,
            dailyCommitRepository = dailyCommitRepo,
            dataStoreManager = dataStoreManager,
            faceIndexManager = faceIndexManager,
            syncManager = syncManager
        )
    }

    @Test
    fun getTodayAttendance_returnsFailure_onHttp500_evenWhenCachedExists() = runTest {
        val apiService = mock(ApiService::class.java)
        val attendanceDao = mock(AttendanceDao::class.java)
        val dataStoreManager = mock(DataStoreManager::class.java)

        val errorBody = """{"error":"Internal Server Error"}""".toResponseBody("application/json".toMediaTypeOrNull())
        `when`(apiService.getTodayAttendance()).thenReturn(Response.error(500, errorBody))
        `when`(attendanceDao.getTodayAttendance(anyString(), anyString())).thenReturn(
            AttendanceEntity(
                id = "att-1",
                employeeId = "emp-123",
                date = "2026-11-18",
                checkInTime = "2026-11-18T04:00:00Z",
                checkOutTime = null,
                totalMinutes = null,
                status = "PRESENT",
                notes = null,
                checkInSelfieUrl = null,
                checkInLocation = null,
                isSynced = true
            )
        )

        val repo = buildRepository(apiService, attendanceDao = attendanceDao, dataStoreManager = dataStoreManager)
        val result = repo.getTodayAttendance()

        assertTrue("Expected Result.failure on HTTP 500, not silent cached success", result.isFailure)
    }

    @Test
    fun getTodayAttendance_returnsFailure_onNetworkException() = runTest {
        val apiService = mock(ApiService::class.java)
        `when`(apiService.getTodayAttendance()).thenAnswer { throw IOException("timeout") }

        val repo = buildRepository(apiService)
        val result = repo.getTodayAttendance()

        assertTrue("Expected Result.failure on IOException", result.isFailure)
    }

    @Test
    fun getTodayAttendance_returnsSuccessAndCaches_onHttp200() = runTest {
        val apiService = mock(ApiService::class.java)
        val attendanceDao = mock(AttendanceDao::class.java)
        val dataStoreManager = mock(DataStoreManager::class.java)

        val record = AttendanceRecord(
            id = "att-2",
            employeeId = "emp-123",
            date = "2026-11-18",
            checkInTime = "2026-11-18T04:00:00Z",
            checkOutTime = null,
            totalMinutes = null,
            status = "PRESENT",
            notes = null
        )
        `when`(apiService.getTodayAttendance()).thenReturn(
            Response.success(TodayAttendanceResponse(record = record))
        )

        val repo = buildRepository(apiService, attendanceDao = attendanceDao, dataStoreManager = dataStoreManager)
        val result = repo.getTodayAttendance()

        assertTrue(result.isSuccess)
        assertEquals("att-2", result.getOrNull()?.id)
    }

    @Test
    fun outboxQueueEntity_preservesEmployeeOwnershipAndIdempotencyKey() {
        val item = OutboxQueueEntity(
            id = "req-1",
            endpoint = "attendance/check-in",
            method = "POST",
            payload = "{}",
            createdAt = "1700000000000",
            clientUploadId = "idem-1",
            ownerUserId = "emp-A",
            status = "PENDING"
        )
        assertEquals("emp-A", item.ownerUserId)
        assertEquals("idem-1", item.clientUploadId)
        assertEquals("PENDING", item.status)
    }

    @Test
    fun appDatabase_migration17To18_hasExpectedVersions() {
        assertEquals(17, AppDatabase.MIGRATION_17_18.startVersion)
        assertEquals(18, AppDatabase.MIGRATION_17_18.endVersion)
    }
}
