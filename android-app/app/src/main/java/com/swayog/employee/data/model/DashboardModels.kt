package com.swayog.employee.data.model

data class RevenueMonth(val month: String, val amount: Double)
data class InstallationMonth(val month: String, val count: Int)
data class ZoneJob(val zone: String, val count: Int)

data class DashboardStats(
    val totalRevenue: Double = 0.0,
    val totalInstallations: Int = 0,
    val activeJobs: Int = 0,
    val totalCustomers: Int = 0,
    val totalEmployees: Int = 0,
    val pendingTasks: Int = 0,
    val revenueByMonth: List<RevenueMonth> = emptyList(),
    val installationsByMonth: List<InstallationMonth> = emptyList(),
    val jobsByZone: List<ZoneJob> = emptyList()
)
