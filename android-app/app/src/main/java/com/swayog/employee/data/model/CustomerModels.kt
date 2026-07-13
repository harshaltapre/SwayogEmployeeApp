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
    val city: String,
    val address: String,
    val systemSizeKw: Float,
    val installationDate: String,
    val warrantyExpiry: String?,
    val panelBrand: String?,
    val inverterBrand: String?,
    val inverterModel: String?,
    val amcStatus: String,
    val amcExpiryDate: String?,
    val status: String,
    val projectStage: Int,
    val latitude: Double?,
    val longitude: Double?,
    val inverterLoginId: String?,
    val inverterPassword: String?,
    val inverterApiKey: String?,
    val inverterDeviceSn: String?,
    val cleaningsPerMonth: Int? = null,
    val completedVisits: Int? = null,
    val pendingVisits: Int? = null
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
