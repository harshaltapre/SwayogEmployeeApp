package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class Customer(
    val id: Int,
    val customerCode: String,
    @SerializedName("name", alternate = ["fullName"])
    val fullName: String,
    val email: String,
    @SerializedName("phone", alternate = ["phoneNumber"])
    val phoneNumber: String,
    val city: String?,
    val address: String?,
    val systemSizeKw: Float?,
    val installationDate: String?,
    val warrantyExpiry: String?,
    val panelBrand: String?,
    val inverterBrand: String?,
    val inverterModel: String?,
    val amcStatus: String,
    val amcExpiryDate: String?,
    val status: String,
    val projectStage: Int?,
    val latitude: Double?,
    val longitude: Double?,
    val inverterLoginId: String?,
    val inverterPassword: String?,
    val inverterApiKey: String?,
    val inverterDeviceSn: String?,
    val cleaningsPerMonth: Int? = null,
    val completedVisits: Int? = null,
    val pendingVisits: Int? = null,
    // AMC Settings fields
    val clientType: String? = null,
    val consumerNumber: String? = null,
    val contractStartDate: String? = null,
    val contractEndDate: String? = null,
    val monthlyCleaningRate: Double? = null,
    val paymentTerms: String? = null,
    val remarks: String? = null,
    val cleaningWindow1: String? = null,
    val cleaningWindow2: String? = null,
    val cleaningWindow3: String? = null,
    val cleaningWindow4: String? = null,
    val cleaningWindow5: String? = null,
    val cleaningWindow6: String? = null,
    val cleaningWindow7: String? = null,
    val cleaningWindow8: String? = null,
    val assignedEmployeeId: String? = null,
    // Apartment fields
    val apartmentId: Int? = null,
    val apartment: Apartment? = null
)

data class Apartment(
    val id: Int,
    val name: String,
    val address: String?,
    val city: String?
)

data class UpdateAmcSettingsRequest(
    val clientType: String,
    val consumerNumber: String?,
    val monthlyCleaningRate: Double,
    val cleaningsPerMonth: Int,
    val cleaningWindow1: String,
    val cleaningWindow2: String?,
    val cleaningWindow3: String?,
    val cleaningWindow4: String?,
    val cleaningWindow5: String?,
    val cleaningWindow6: String?,
    val cleaningWindow7: String?,
    val cleaningWindow8: String?,
    val nextSurveyDate: String?,
    val paymentTerms: String?,
    val remarks: String?,
    val assignedEmployeeId: String?,
    val useVariableTiming: Boolean,
    val cleaningTimeSlot1: String,
    val cleaningTimeSlot2: String,
    val cleaningTimeSlot3: String,
    val cleaningTimeSlot4: String,
    val scheduleMonth: String
)

data class CustomerSummary(
    val customer: Customer,
    val openComplaints: Int,
    val pendingAmcVisits: Int,
    val serviceRequestStats: ServiceRequestStats,
    val inverterData: InverterGeneration?
)


data class ServiceRequestStats(
    val total: Int,
    val pending: Int,
    val completed: Int,
    @SerializedName("scheduled")
    val inProgress: Int
)

data class InverterGeneration(
    val customerId: Int,
    val todayGeneration: Double,
    val monthlyGeneration: Double,
    val yearlyGeneration: Double,
    val totalGeneration: Double,
    val currentPower: Double,
    val status: String,
    val lastUpdated: String
)

data class CustomerSummaryResponse(
    val customer: Customer,
    val serviceRequestStats: ServiceRequestStats
)

data class InverterGenerationHistoryResponse(
    val customerId: Int,
    val period: String,
    val history: List<GenerationHistory>,
    val isSimulated: Boolean
)

data class GenerationHistory(
    val date: String,
    val label: String,
    val generation: Double,
    val actualGeneration: Double? = null,
    val expectedGeneration: Double? = null,
    val isAlert: Boolean = false,
    val generationDropPct: Double? = null,
    val power: Double? = null // For realtime period
)

data class UpdateCredentialsRequest(
    val inverterBrand: String?,
    val inverterLoginId: String?,
    val inverterPassword: String?,
    val inverterApiKey: String?,
    val inverterDeviceSn: String?,
    val city: String?,
    val address: String?,
    val projectStage: Int?
)

data class ServiceRequest(
    val id: Int,
    val customerId: Int,
    val title: String,
    val description: String,
    val address: String?,
    val customerCity: String? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerEmail: String? = null,
    val assignedEmployeeId: String? = null,
    val latitude: Double?,
    val longitude: Double?,
    val status: String,
    val scheduledDate: String?,
    val scheduledTime: String?,
    val createdAt: String,
    val updatedAt: String
)

data class UpdateServiceRequestRequest(
    val status: String?,
    val scheduledDate: String? = null,
    val scheduledTime: String? = null,
    val assignedEmployeeId: String? = null
)

data class ServiceRequestsResponse(
    val requests: List<ServiceRequest>,
    val pagination: Pagination? = null
)
