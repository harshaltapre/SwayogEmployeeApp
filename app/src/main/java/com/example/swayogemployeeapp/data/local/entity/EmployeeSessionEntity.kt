package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "employee_session")
data class EmployeeSessionEntity(
    @PrimaryKey val id: String,
    val loginId: String,
    val email: String,
    val name: String,
    val role: String,        // "EMPLOYEE" or "SUB_ADMIN"
    val jobRole: String,     // "Solar Design Engineer", "Electrical Engineer", "Inventory Executive", etc.
    val employeeCode: String?,
    val reportingManagerId: String?,
    val accessToken: String,
    val refreshToken: String,
    val lastSyncTimestamp: Long
)
