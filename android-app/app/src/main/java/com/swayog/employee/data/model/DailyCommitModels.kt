package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class DailyCommit(
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
    val createdAt: String
)

data class DailyCommitRequest(
    val employeeId: String,
    val commitDate: String,
    val taskWorkedOn: String,
    val workSummary: String,
    val hoursSpent: Double,
    val issuesBlockers: String?,
    val tomorrowPlan: String?,
    val attachmentUrl: String?
)
