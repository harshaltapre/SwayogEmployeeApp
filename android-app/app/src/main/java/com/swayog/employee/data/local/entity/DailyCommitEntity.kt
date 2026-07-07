package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_commits")
data class DailyCommitEntity(
    @PrimaryKey
    val id: String,
    val employeeId: String,
    val commitDate: String,
    val taskWorkedOn: String,
    val workSummary: String,
    val hoursSpent: Double,
    val issuesBlockers: String?,
    val tomorrowPlan: String?,
    val attachmentUrl: String?,
    val submittedAt: String,
    val createdAt: String,
    val isSynced: Boolean = true
)
