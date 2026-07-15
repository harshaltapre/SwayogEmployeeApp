package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val loginId: String,
    val employeeCode: String?,
    val email: String,
    val phoneNumber: String?,
    val fullName: String,
    val role: String,
    val designationTitle: String?,
    val departmentId: String?,
    val reportingManagerId: String?,
    val isActive: Boolean,
    val createdAt: String,
    val jobRole: String?,
    val zone: String?,
    val monthlySalaryInr: Int?,
    val profilePhotoUrl: String?,
    val rating: Double? = 0.0
)
