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

data class UpdateAmcSettingsRequest(
    val clientType: String,
    val consumerNumber: String? = null,
    val monthlyCleaningRate: Int?,
    val cleaningsPerMonth: Int,
    val cleaningWindow1: String? = null,
    val cleaningWindow2: String? = null,
    val cleaningWindow3: String? = null,
    val cleaningWindow4: String? = null,
    val cleaningWindow5: String? = null,
    val cleaningWindow6: String? = null,
    val cleaningWindow7: String? = null,
    val cleaningWindow8: String? = null,
    val nextSurveyDate: String? = null,
    val paymentTerms: String? = null,
    val remarks: String? = null,
    val assignedEmployeeId: String? = null,
    val useVariableTiming: Boolean = false,
    val cleaningTimeSlot1: String? = null,
    val cleaningTimeSlot2: String? = null,
    val cleaningTimeSlot3: String? = null,
    val cleaningTimeSlot4: String? = null,
    val cleaningTimeSlot5: String? = null,
    val cleaningTimeSlot6: String? = null,
    val cleaningTimeSlot7: String? = null,
    val cleaningTimeSlot8: String? = null,
    val scheduleMonth: String? = null
)

data class ApartmentAmcSettingsRequest(
    val clientType: String,
    val monthlyCleaningRate: Int?,
    val cleaningsPerMonth: Int,
    val cleaningWindow1: String? = null,
    val cleaningWindow2: String? = null,
    val cleaningWindow3: String? = null,
    val cleaningWindow4: String? = null,
    val cleaningWindow5: String? = null,
    val cleaningWindow6: String? = null,
    val cleaningWindow7: String? = null,
    val cleaningWindow8: String? = null,
    val nextSurveyDate: String? = null,
    val paymentTerms: String? = null,
    val remarks: String? = null,
    val assignedEmployeeId: String? = null,
    val useVariableTiming: Boolean = false,
    val cleaningTimeSlot1: String? = null,
    val cleaningTimeSlot2: String? = null,
    val cleaningTimeSlot3: String? = null,
    val cleaningTimeSlot4: String? = null,
    val cleaningTimeSlot5: String? = null,
    val cleaningTimeSlot6: String? = null,
    val cleaningTimeSlot7: String? = null,
    val cleaningTimeSlot8: String? = null,
    val scheduleMonth: String? = null
)
