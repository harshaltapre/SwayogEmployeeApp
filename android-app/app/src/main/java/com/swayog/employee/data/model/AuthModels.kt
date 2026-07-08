package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T?
)

data class LoginRequest(
    val email: String,
    val password: String,
    val role: String = "EMPLOYEE"
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
    @SerializedName("accessToken")
    val token: String,
    val refreshToken: String
)

data class User(
    val id: String,
    val fullName: String,
    val email: String,
    val role: String,
    val isActive: Boolean,
    val loginId: String? = null,
    val employeeCode: String? = null,
    val phoneNumber: String? = null,
    val designationTitle: String? = null,
    val departmentId: String? = null,
    val reportingManagerId: String? = null,
    val createdAt: String? = null,
    val employeeProfile: EmployeeProfile? = null
)

data class EmployeeProfile(
    val id: String,
    val userId: String,
    val jobRole: String,
    val zone: String?,
    val monthlySalaryInr: Int?,
    val isActive: Boolean
)
