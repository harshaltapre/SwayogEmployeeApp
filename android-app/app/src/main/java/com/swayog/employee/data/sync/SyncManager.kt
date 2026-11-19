package com.swayog.employee.data.sync

import android.content.Context
import androidx.work.*
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import java.util.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val outboxQueueDao: OutboxQueueDao,
    private val dataStoreManager: DataStoreManager,
    private val gson: Gson
) {
    
    companion object {
        // All repositories share this unique work name so queued operations are
        // serialized by the same worker instead of racing each other.
        const val SYNC_WORK_NAME = "offline_sync_work"
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    val pendingSyncCountForCurrentUser: Flow<Int> = dataStoreManager.userId.flatMapLatest { userId ->
        if (userId.isNullOrBlank()) {
            flowOf(0)
        } else {
            outboxQueueDao.getPendingCountFlowForUser(userId)
        }
    }
    
    /**
     * Enqueue a task completion action to the outbox queue
     */
    suspend fun enqueueTaskCompletion(
        taskId: String,
        status: String,
        completionMessage: String?,
        beforeImageUrl: String?,
        afterImageUrl: String?,
        beforeLatitude: Double?,
        beforeLongitude: Double?,
        afterLatitude: Double?,
        afterLongitude: Double?
    ) {
        val ownerId = dataStoreManager.userId.first().orEmpty()
        if (ownerId.isBlank()) return

        val clientUploadId = UUID.randomUUID().toString()
        val payload = mapOf(
            "status" to status,
            "completionMessage" to (completionMessage ?: ""),
            "beforeImageUrl" to (beforeImageUrl ?: ""),
            "afterImageUrl" to (afterImageUrl ?: ""),
            "beforeLatitude" to (beforeLatitude ?: 0.0),
            "beforeLongitude" to (beforeLongitude ?: 0.0),
            "afterLatitude" to (afterLatitude ?: 0.0),
            "afterLongitude" to (afterLongitude ?: 0.0),
            "clientUploadId" to clientUploadId
        )
        
        val item = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "tasks/$taskId",
            method = "PATCH",
            payload = gson.toJson(payload),
            createdAt = System.currentTimeMillis().toString(),
            retryCount = 0,
            isSynced = false,
            clientUploadId = clientUploadId,
            ownerUserId = ownerId
        )
        
        outboxQueueDao.insertItem(item)
        scheduleSync()
    }
    
    /**
     * Enqueue an attendance check-in action to the outbox queue
     */
    suspend fun enqueueAttendanceCheckIn(
        latitude: Double,
        longitude: Double,
        selfieUrl: String?
    ) {
        val ownerId = dataStoreManager.userId.first().orEmpty()
        if (ownerId.isBlank()) return

        val clientUploadId = UUID.randomUUID().toString()
        val payload = mapOf(
            "latitude" to latitude,
            "longitude" to longitude,
            "selfie" to (selfieUrl ?: ""),
            "clientUploadId" to clientUploadId
        )
        
        val item = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "attendance/check-in",
            method = "POST",
            payload = gson.toJson(payload),
            createdAt = System.currentTimeMillis().toString(),
            retryCount = 0,
            isSynced = false,
            clientUploadId = clientUploadId,
            ownerUserId = ownerId
        )
        
        outboxQueueDao.insertItem(item)
        scheduleSync()
    }
    
    /**
     * Enqueue a daily commit action to the outbox queue
     */
    suspend fun enqueueDailyCommit(
        tasksWorkedOn: String,
        workSummary: String,
        hoursSpent: Int,
        blockers: String?,
        tomorrowsPlan: String?
    ) {
        val ownerId = dataStoreManager.userId.first().orEmpty()
        if (ownerId.isBlank()) return

        val clientUploadId = UUID.randomUUID().toString()
        val payload = mapOf(
            "commitDate" to java.time.LocalDate.now().toString(),
            "taskWorkedOn" to tasksWorkedOn,
            "workSummary" to workSummary,
            "hoursSpent" to hoursSpent,
            "issuesBlockers" to (blockers ?: ""),
            "tomorrowPlan" to (tomorrowsPlan ?: "")
        )
        
        val item = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "daily-commits",
            method = "POST",
            payload = gson.toJson(payload),
            createdAt = System.currentTimeMillis().toString(),
            retryCount = 0,
            isSynced = false,
            clientUploadId = clientUploadId,
            ownerUserId = ownerId
        )
        
        outboxQueueDao.insertItem(item)
        scheduleSync()
    }
    
    /**
     * Get the count of pending sync items for the currently logged-in user
     */
    suspend fun getPendingSyncCount(): Int {
        val ownerId = dataStoreManager.userId.first().orEmpty()
        return if (ownerId.isBlank()) 0 else outboxQueueDao.getPendingCountForUser(ownerId)
    }

    /**
     * Central entry point for scheduling background synchronization.
     * Always uses [ExistingWorkPolicy.KEEP] so an already running SyncWorker is never
     * cancelled mid-flight; SyncWorker itself re-checks the queue in a drain loop before exiting.
     */
    fun scheduleSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                30L,
                TimeUnit.SECONDS
            )
            .build()
        
        WorkManager.getInstance(context).enqueueUniqueWork(
            SYNC_WORK_NAME,
            ExistingWorkPolicy.KEEP,
            syncRequest
        )
    }
    
    /**
     * Cancel all pending sync workers
     */
    fun cancelSyncWorkers() {
        WorkManager.getInstance(context).cancelUniqueWork(SYNC_WORK_NAME)
    }
    
    /**
     * Clear all synced items from the queue
     */
    suspend fun clearSyncedItems() {
        outboxQueueDao.deleteSyncedItems()
    }
}
