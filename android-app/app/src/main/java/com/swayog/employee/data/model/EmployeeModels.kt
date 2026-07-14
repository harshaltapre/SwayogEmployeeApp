package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class Employee(
    val id: String,
    val loginId: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String?,
    val role: String,
    val isActive: Boolean,
    val createdAt: String,
    val department: Department?,
    val reportingManagerId: String?,
    val employeeProfile: EmployeeProfile?,
    val partnerProfile: PartnerProfile?,
    val rating: Double? = null,
    val activeTasksCount: Int? = null,
    val status: String? = null
) {
    // Helper property to match the frontend 'zone' flattening
    val zone: String
        get() = employeeProfile?.zone ?: partnerProfile?.serviceZone ?: "Unassigned Zone"
}

data class Department(
    val id: String,
    val name: String
)



data class PartnerProfile(
    val serviceZone: String?,
    val businessName: String?
)
