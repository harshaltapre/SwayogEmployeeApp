package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val type: String? = null,
    @SerializedName("isRead")
    val isRead: Boolean = false,
    val createdAt: String,
    val relatedTaskId: String? = null,
    val relatedCustomerId: Int? = null,
    val relatedAmcVisitId: String? = null
)

data class DashboardStats(
    val totalRevenue: Double,
    val totalInstallations: Int,
    val activeJobs: Int,
    val totalCustomers: Int,
    val totalEmployees: Int,
    val pendingTasks: Int,
    val completedTasks: Int,
    val revenueByMonth: List<MonthlyRevenue>,
    val installationsByMonth: List<MonthlyInstallation>,
    val jobsByZone: List<ZoneJob>
)

data class MonthlyRevenue(
    val month: String,
    val amount: Double
)

data class MonthlyInstallation(
    val month: String,
    val count: Int
)

data class ZoneJob(
    val zone: String,
    val count: Int
)
