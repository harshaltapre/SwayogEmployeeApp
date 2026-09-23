package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class DailyCommit(
    val id: String,
    val employeeId: String = "",
    val commitDate: String,
    val taskWorkedOn: String,
    val workSummary: String,
    val hoursSpent: Double,
    val issuesBlockers: String? = null,
    val tomorrowPlan: String? = null,
    val attachmentUrl: String? = null,
    val submittedAt: String? = null,
    val createdAt: String? = null,
    val employeeName: String? = null,
    val employeeCode: String? = null,
    val status: String? = null
)

data class DailyCommitRequest(
    val commitDate: String,
    val taskWorkedOn: String,
    val workSummary: String,
    val hoursSpent: Double,
    val issuesBlockers: String?,
    val tomorrowPlan: String?
)
