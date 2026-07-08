package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.DailyCommitDao
import com.swayog.employee.data.local.entity.DailyCommitEntity
import com.swayog.employee.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DailyCommitRepository @Inject constructor(
    private val dailyCommitDao: DailyCommitDao,
    private val apiService: ApiService
) {
    
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
        return try {
            val response = apiService.createDailyCommit(
                DailyCommitRequest(
                    employeeId = employeeId,
                    commitDate = commitDate,
                    taskWorkedOn = taskWorkedOn,
                    workSummary = workSummary,
                    hoursSpent = hoursSpent,
                    issuesBlockers = issuesBlockers,
                    tomorrowPlan = tomorrowPlan,
                    attachmentUrl = attachmentUrl
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
                Result.failure(Exception("Failed to create daily commit"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
