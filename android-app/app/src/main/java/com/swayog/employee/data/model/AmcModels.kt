package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

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
    val updatedAt: String
)

data class UpdateAmcVisitRequest(
    val status: String,
    val notes: String?,
    val beforeImageUrl: String?,
    val afterImageUrl: String?,
    val visitNotes: String?
)
