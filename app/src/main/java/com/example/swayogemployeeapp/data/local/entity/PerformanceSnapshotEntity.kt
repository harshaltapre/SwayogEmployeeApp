package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "performance_snapshots")
data class PerformanceSnapshotEntity(
    @PrimaryKey val id: String,
    val employeeId: String,
    val month: Int,
    val year: Int,
    val attendancePercent: Double,
    val taskCompletionRate: Double,
    val avgWorkScore: Double,
    val totalHoursLogged: Double,
    val performanceScore: Double,
    val daysPresent: Int,
    val daysAbsent: Int,
    val tasksAssigned: Int,
    val tasksCompleted: Int,
    val workSubmissions: Int,
    val calculatedAt: String,
    val createdAt: String,
    val updatedAt: String,
    val isSynced: Boolean = false
)
