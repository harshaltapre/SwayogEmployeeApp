package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class AmcCustomerInfo(
    val fullName: String,
    val city: String?,
    val phoneNumber: String?
)

data class AmcVisit(
    val id: String,
    val customerId: Int,
    val scheduledDate: String,
    val status: String,
    val completedAt: String?,
    val notes: String?,
    val assignedEmployeeId: String?,
    val cleaningNumber: Int?,
    val timeSlot: String?,
    val completedByEmployeeId: String?,
    val completedByName: String?,
    val visitNotes: String?,
    val beforeImageUrl: String?,
    val afterImageUrl: String?,
    val createdAt: String,
    val updatedAt: String,
    val customer: AmcCustomerInfo? = null
)

data class UpdateAmcVisitRequest(
    val status: String? = null,
    val scheduledDate: String? = null,
    val timeSlot: String? = null,
    val assignedEmployeeId: String? = null,
    val notes: String? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val visitNotes: String? = null
)

data class CreateAmcVisitRequest(
    val customerId: Int,
    val scheduledDate: String,
    val timeSlot: String?,
    val assignedEmployeeId: String?,
    val notes: String?
)

data class AmcSettingsRequest(
    val monthlyRate: Int?,
    val cleaningsPerMonth: Int?,
    val clientType: String,
    val consumerNumber: String
)

data class ApartmentAmcSettingsRequest(
    val monthlyRate: Int?,
    val cleaningsPerMonth: Int?,
    val clientType: String
)
