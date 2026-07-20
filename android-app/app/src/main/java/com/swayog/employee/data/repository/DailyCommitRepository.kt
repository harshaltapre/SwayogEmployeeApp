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
                val entities = commits.map { commit ->
                    DailyCommitEntity(
                        id = commit.id,
                        employeeId = commit.employeeId,
                        commitDate = commit.commitDate,
                        taskWorkedOn = commit.taskWorkedOn,
                        workSummary = commit.workSummary,
                        hoursSpent = commit.hoursSpent,
                        issuesBlockers = commit.issuesBlockers,
                        tomorrowPlan = commit.tomorrowPlan,
                        attachmentUrl = commit.attachmentUrl,
                        submittedAt = commit.submittedAt,
                        createdAt = commit.createdAt,
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
        attachmentUrl: String?
    ): Result<DailyCommit> {
        val isOnline = NetworkUtils.isNetworkAvailable(context)
        
        return if (isOnline) {
            try {
                val response = apiService.createDailyCommit(
                    DailyCommitRequest(
                        commitDate = commitDate,
                        taskWorkedOn = taskWorkedOn,
                        workSummary = workSummary,
                        hoursSpent = hoursSpent,
                        issuesBlockers = issuesBlockers,
                        tomorrowPlan = tomorrowPlan
                    )
                )
                if (response.isSuccessful && response.body()?.data != null) {
                    val commit = response.body()!!.data!!
                    val entity = DailyCommitEntity(
                        id = commit.id,
                        employeeId = commit.employeeId,
                        commitDate = commit.commitDate,
                        taskWorkedOn = commit.taskWorkedOn,
                        workSummary = commit.workSummary,
                        hoursSpent = commit.hoursSpent,
                        issuesBlockers = commit.issuesBlockers,
                        tomorrowPlan = commit.tomorrowPlan,
                        attachmentUrl = commit.attachmentUrl,
                        submittedAt = commit.submittedAt,
                        createdAt = commit.createdAt,
                        isSynced = true
                    )
                    dailyCommitDao.insertDailyCommit(entity)
                    Result.success(commit)
                } else {
                    // API call failed - save to outbox queue for offline sync
                    saveDailyCommitToOutbox(employeeId, commitDate, taskWorkedOn, workSummary, hoursSpent, issuesBlockers, tomorrowPlan, attachmentUrl)
                    Result.failure(OfflinePendingException())
                }
            } catch (e: Exception) {
                // Network error - save to outbox queue for offline sync
                saveDailyCommitToOutbox(employeeId, commitDate, taskWorkedOn, workSummary, hoursSpent, issuesBlockers, tomorrowPlan, attachmentUrl)
                Result.failure(OfflinePendingException())
            }
        } else {
            // Offline - save to outbox queue and create local commit record
            val tempId = UUID.randomUUID().toString()
            
            saveDailyCommitToOutbox(employeeId, commitDate, taskWorkedOn, workSummary, hoursSpent, issuesBlockers, tomorrowPlan, attachmentUrl)
            
            // Create local daily commit record
            val entity = DailyCommitEntity(
                id = tempId,
                employeeId = employeeId,
                commitDate = commitDate,
                taskWorkedOn = taskWorkedOn,
                workSummary = workSummary,
                hoursSpent = hoursSpent,
                issuesBlockers = issuesBlockers,
                tomorrowPlan = tomorrowPlan,
                attachmentUrl = attachmentUrl,
                submittedAt = java.time.LocalDateTime.now().toString(),
                createdAt = java.time.LocalDateTime.now().toString(),
                isSynced = false
            )
            dailyCommitDao.insertDailyCommit(entity)
            
            Result.failure(OfflinePendingException())
        }
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
    }
}
