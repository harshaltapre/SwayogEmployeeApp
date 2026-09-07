package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class AmcCustomerInfo(
    val fullName: String? = null,
    val city: String? = null,
    val phoneNumber: String? = null,
    val address: String? = null,
    val apartmentId: Int? = null,
    val apartment: Apartment? = null
)

data class AssignedEmployeeInfo(
    val id: String? = null,
    val name: String? = null,
    val fullName: String? = null,
    val phoneNumber: String? = null
)

data class AmcVisit(
    val id: String = "",
    val customerId: Int = 0,
    val scheduledDate: String = "",
    val status: String = "PENDING",
    val completedAt: String? = null,
    val notes: String? = null,
    val assignedEmployeeId: String? = null,
    val cleaningNumber: Int? = null,
    val timeSlot: String? = null,
    val scheduledTime: String? = null,
    val completedByEmployeeId: String? = null,
    val completedByName: String? = null,
    val visitNotes: String? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val sitePhotos: List<String>? = null,
    val images: List<String>? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val customer: AmcCustomerInfo? = null,
    val assignedEmployee: AssignedEmployeeInfo? = null
)

data class CreateAmcVisitRequest(
    val customerId: Int,
    val scheduledDate: String,
    val timeSlot: String? = null,
    val assignedEmployeeId: String? = null,
    val notes: String? = null
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
