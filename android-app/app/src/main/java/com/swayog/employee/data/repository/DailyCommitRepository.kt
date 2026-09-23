package com.swayog.employee.data.repository

import android.content.Context
import androidx.work.*
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.DailyCommitDao
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.entity.DailyCommitEntity
import com.swayog.employee.data.local.entity.OutboxQueueEntity
import com.swayog.employee.data.model.*
import com.swayog.employee.core.util.NetworkUtils
import com.swayog.employee.core.util.ErrorUtils
import com.swayog.employee.core.util.OfflinePendingException
import com.swayog.employee.data.sync.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DailyCommitRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val dailyCommitDao: DailyCommitDao,
    private val outboxQueueDao: OutboxQueueDao,
    private val apiService: ApiService
) {
    val pendingSyncCount: Flow<Int> = outboxQueueDao.getPendingCountFlow()
    
    fun getDailyCommitsByEmployeeId(employeeId: String): Flow<List<DailyCommit>> {
        return dailyCommitDao.getDailyCommitsByEmployeeId(employeeId).map { entities ->
            entities.map { entity ->
                DailyCommit(
                    id = entity.id,
                    employeeId = entity.employeeId,
                    commitDate = entity.commitDate,
                    taskWorkedOn = entity.taskWorkedOn,
                    workSummary = entity.workSummary,
                    hoursSpent = entity.hoursSpent,
                    issuesBlockers = entity.issuesBlockers,
                    tomorrowPlan = entity.tomorrowPlan,
                    attachmentUrl = entity.attachmentUrl,
                    submittedAt = entity.submittedAt,
                    createdAt = entity.createdAt
                )
            }
        }
    }
    
    suspend fun refreshDailyCommits(): Result<List<DailyCommit>> {
        return try {
            val response = apiService.getDailyCommits()
            if (response.isSuccessful && response.body()?.data != null) {
                val commits = response.body()!!.data!!
                val nowStr = java.time.LocalDateTime.now().toString()
                val entities = commits.map { commit ->
                    DailyCommitEntity(
                        id = commit.id,
                        employeeId = if (!commit.employeeId.isNull_or_empty()) commit.employeeId else "",
                        commitDate = commit.commitDate,
                        taskWorkedOn = commit.taskWorkedOn,
                        workSummary = commit.workSummary,
                        hoursSpent = commit.hoursSpent,
                        issuesBlockers = commit.issuesBlockers,
                        tomorrowPlan = commit.tomorrowPlan,
                        attachmentUrl = commit.attachmentUrl,
                        submittedAt = commit.submittedAt ?: commit.createdAt ?: nowStr,
                        createdAt = commit.createdAt ?: commit.submittedAt ?: nowStr,
                        isSynced = true
                    )
                }
                dailyCommitDao.insertDailyCommits(entities)
                Result.success(commits)
            } else {
                Result.failure(Exception("Failed to fetch daily commits"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createDailyCommit(
        employeeId: String,
        commitDate: String,
        taskWorkedOn: String,
        workSummary: String,
        hoursSpent: Double,
        issuesBlockers: String?,
        tomorrowPlan: String?,
        attachmentUrl: String?,
        isQuickUpdate: Boolean = false
    ): Result<DailyCommit> {
        val isOnline = NetworkUtils.isNetworkAvailable(context)
        val nowStr = java.time.LocalDateTime.now().toString()

        var requestTask = taskWorkedOn.trim().take(190)
        var requestSummary = workSummary.trim().take(4900)
        var requestHours = hoursSpent
        var requestBlockers = issuesBlockers
        var requestPlan = tomorrowPlan

        // Check if an entry already exists for this employee and date to prevent overwriting
        val existing = dailyCommitDao.getDailyCommitByDate(employeeId, commitDate)
        if (existing != null) {
            val exTask = existing.taskWorkedOn.trim()
            val exSummary = existing.workSummary.trim()

            if (isQuickUpdate) {
                // Current submission is Quick Work Update
                if (!exTask.equals("Quick Work Update", ignoreCase = true) && !exTask.equals("Quick Update", ignoreCase = true)) {
                    requestTask = exTask
                }
                if (!exSummary.contains(workSummary.trim())) {
                    val quickText = if (workSummary.trim().startsWith("Quick Update: ")) workSummary.trim() else "Quick Update: ${workSummary.trim()}"
                    requestSummary = "$exSummary\n\n[Quick Update]: $quickText".take(4900)
                } else {
                    requestSummary = exSummary
                }
                requestHours = maxOf(existing.hoursSpent, hoursSpent)
                requestBlockers = existing.issuesBlockers ?: issuesBlockers
                requestPlan = existing.tomorrowPlan ?: tomorrowPlan
            } else {
                // Current submission is full Daily Commit Log
                if (exTask.equals("Quick Work Update", ignoreCase = true) || exTask.equals("Quick Update", ignoreCase = true)) {
                    requestTask = taskWorkedOn.trim().take(190)
                    if (!workSummary.trim().contains(exSummary)) {
                        requestSummary = "${workSummary.trim()}\n\n[Previous Quick Update]: $exSummary".take(4900)
                    } else {
                        requestSummary = workSummary.trim().take(4900)
                    }
                    requestHours = maxOf(hoursSpent, existing.hoursSpent)
                    requestBlockers = issuesBlockers ?: existing.issuesBlockers
                    requestPlan = tomorrowPlan ?: existing.tomorrowPlan
                } else {
                    // Both are Daily Commit Logs
                    if (!exSummary.contains(workSummary.trim()) && !workSummary.trim().contains(exSummary)) {
                        requestTask = if (exTask.equals(taskWorkedOn.trim(), ignoreCase = true)) exTask else "$exTask | ${taskWorkedOn.trim()}".take(190)
                        requestSummary = "$exSummary\n\n--- Additional Log ---\n${workSummary.trim()}".take(4900)
                        requestHours = existing.hoursSpent + hoursSpent
                        requestBlockers = issuesBlockers ?: existing.issuesBlockers
                        requestPlan = tomorrowPlan ?: existing.tomorrowPlan
                    }
                }
            }
        }
        
        return if (isOnline) {
            try {
                val response = apiService.createDailyCommit(
                    DailyCommitRequest(
                        commitDate = commitDate,
                        taskWorkedOn = requestTask,
                        workSummary = requestSummary,
                        hoursSpent = requestHours,
                        issuesBlockers = requestBlockers,
                        tomorrowPlan = requestPlan
                    )
                )
                if (response.isSuccessful && response.body()?.data != null) {
                    val commit = response.body()!!.data!!
                    val entity = DailyCommitEntity(
                        id = commit.id,
                        employeeId = if (!commit.employeeId.isNull_or_empty()) commit.employeeId else employeeId,
                        commitDate = commit.commitDate,
                        taskWorkedOn = commit.taskWorkedOn,
                        workSummary = commit.workSummary,
                        hoursSpent = commit.hoursSpent,
                        issuesBlockers = commit.issuesBlockers,
                        tomorrowPlan = commit.tomorrowPlan,
                        attachmentUrl = commit.attachmentUrl,
                        submittedAt = commit.submittedAt ?: commit.createdAt ?: nowStr,
                        createdAt = commit.createdAt ?: commit.submittedAt ?: nowStr,
                        isSynced = true
                    )
                    dailyCommitDao.deleteUnsyncedByDate(commitDate)
                    dailyCommitDao.insertDailyCommit(entity)
                    Result.success(commit)
                } else {
                    // API call failed - save to outbox queue for offline sync and create local entity
                    val tempId = UUID.randomUUID().toString()
                    saveDailyCommitToOutbox(employeeId, commitDate, requestTask, requestSummary, requestHours, requestBlockers, requestPlan, attachmentUrl)
                    val entity = DailyCommitEntity(
                        id = tempId,
                        employeeId = employeeId,
                        commitDate = commitDate,
                        taskWorkedOn = requestTask,
                        workSummary = requestSummary,
                        hoursSpent = requestHours,
                        issuesBlockers = requestBlockers,
                        tomorrowPlan = requestPlan,
                        attachmentUrl = attachmentUrl,
                        submittedAt = nowStr,
                        createdAt = nowStr,
                        isSynced = false
                    )
                    dailyCommitDao.insertDailyCommit(entity)
                    Result.failure(OfflinePendingException("Saved locally. Will sync automatically when online."))
                }
            } catch (e: Exception) {
                // Network error - save to outbox queue for offline sync and create local entity
                val tempId = UUID.randomUUID().toString()
                saveDailyCommitToOutbox(employeeId, commitDate, requestTask, requestSummary, requestHours, requestBlockers, requestPlan, attachmentUrl)
                val entity = DailyCommitEntity(
                    id = tempId,
                    employeeId = employeeId,
                    commitDate = commitDate,
                    taskWorkedOn = requestTask,
                    workSummary = requestSummary,
                    hoursSpent = requestHours,
                    issuesBlockers = requestBlockers,
                    tomorrowPlan = requestPlan,
                    attachmentUrl = attachmentUrl,
                    submittedAt = nowStr,
                    createdAt = nowStr,
                    isSynced = false
                )
                dailyCommitDao.insertDailyCommit(entity)
                Result.failure(OfflinePendingException("Saved locally. Will sync automatically when online."))
            }
        } else {
            // Offline - save to outbox queue and create local commit record
            val tempId = UUID.randomUUID().toString()
            saveDailyCommitToOutbox(employeeId, commitDate, requestTask, requestSummary, requestHours, requestBlockers, requestPlan, attachmentUrl)
            
            // Create local daily commit record
            val entity = DailyCommitEntity(
                id = tempId,
                employeeId = employeeId,
                commitDate = commitDate,
                taskWorkedOn = requestTask,
                workSummary = requestSummary,
                hoursSpent = requestHours,
                issuesBlockers = requestBlockers,
                tomorrowPlan = requestPlan,
                attachmentUrl = attachmentUrl,
                submittedAt = nowStr,
                createdAt = nowStr,
                isSynced = false
            )
            dailyCommitDao.insertDailyCommit(entity)
            
            Result.failure(OfflinePendingException("Saved locally. Will sync automatically when online."))
        }
    }

    private fun String?.isNull_or_empty(): Boolean {
        return this == null || this.trim().isEmpty()
    }
    
    private suspend fun saveDailyCommitToOutbox(
        employeeId: String,
        commitDate: String,
        taskWorkedOn: String,
        workSummary: String,
        hoursSpent: Double,
        issuesBlockers: String?,
        tomorrowPlan: String?,
        attachmentUrl: String?
    ) {
        val payload = JSONObject().apply {
            put("employeeId", employeeId)
            put("commitDate", commitDate)
            put("taskWorkedOn", taskWorkedOn)
            put("workSummary", workSummary)
            put("hoursSpent", hoursSpent)
            put("issuesBlockers", issuesBlockers)
            put("tomorrowPlan", tomorrowPlan)
        }.toString()
        
        val outboxItem = OutboxQueueEntity(
            id = UUID.randomUUID().toString(),
            endpoint = "daily-commits",
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
        android.util.Log.d("TASK_SYNC", "Enqueued automatic sync work after daily commit queue update")
    }
}
