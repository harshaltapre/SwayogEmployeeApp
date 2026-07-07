package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginWithPhoneRequest(
    val phoneNumber: String,
    val otp: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val fullName: String,
    val phoneNumber: String?
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class AuthResponse(
    val user: User,
    val token: String,
    val refreshToken: String
)

data class User(
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
    val employeeProfile: EmployeeProfile?
)

data class EmployeeProfile(
    val id: String,
    val userId: String,
    val jobRole: String,
    val zone: String?,
    val monthlySalaryInr: Int?,
    val isActive: Boolean
)
