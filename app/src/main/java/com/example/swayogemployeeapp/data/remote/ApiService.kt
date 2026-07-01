package com.example.swayogemployeeapp.data.remote

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/v1/employee/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("api/v1/employee/attendance/check-in")
    suspend fun checkIn(
        @Body request: AttendanceCheckInRequest
    ): Response<AttendanceCheckInResponse>

    @POST("api/v1/employee/attendance/check-out")
    suspend fun checkOut(
        @Body request: AttendanceCheckOutRequest
    ): Response<CommonResponse>

    @POST("api/v1/employee/submissions")
    suspend fun submitDailyWork(
        @Body request: WorkSubmissionRequest
    ): Response<CommonResponse>

    @Multipart
    @POST("api/v1/employee/surveys")
    suspend fun submitSurvey(
        @Part("taskId") taskId: RequestBody,
        @Part("customerId") customerId: RequestBody,
        @Part("roofType") roofType: RequestBody,
        @Part("lengthFt") lengthFt: RequestBody,
        @Part("widthFt") widthFt: RequestBody,
        @Part("obstacleNotes") obstacleNotes: RequestBody,
        @Part("shadowFactors") shadowFactors: RequestBody,
        @Part("recommendedCapacityKw") recommendedCapacityKw: RequestBody,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part photos: List<MultipartBody.Part>
    ): Response<SurveyResponse>

    @Multipart
    @POST("api/v1/employee/designs")
    suspend fun submitDesign(
        @Part("customerId") customerId: RequestBody,
        @Part("panelCount") panelCount: RequestBody,
        @Part("inverterModel") inverterModel: RequestBody,
        @Part("systemCapacityKw") systemCapacityKw: RequestBody,
        @Part("tiltAngle") tiltAngle: RequestBody,
        @Part cadLayout: MultipartBody.Part,
        @Part sldDiagram: MultipartBody.Part
    ): Response<DesignResponse>

    @POST("api/v1/employee/tasks/{taskId}/complete")
    suspend fun completeTask(
        @Path("taskId") taskId: Int,
        @Body request: TaskCompleteRequest
    ): Response<CommonResponse>

    @POST("api/v1/employee/token/refresh")
    suspend fun refreshTokens(
        @Body request: TokenRefreshRequest
    ): Response<TokenRefreshResponse>

    @GET("api/v1/attendance/work-submissions")
    suspend fun getWorkSubmissions(
        @Query("employeeId") employeeId: String? = null
    ): Response<WorkSubmissionsResponse>

    @GET("api/v1/employee/tasks")
    suspend fun getMyTasks(): Response<TasksResponse>

    @GET("api/v1/inventory")
    suspend fun getInventory(): Response<List<InventoryItemDto>>

    // ── Service Coordinator (Sub-Admin) APIs ──

    @GET("api/v1/customers")
    suspend fun listCustomers(
        @Query("limit") limit: Int = 200,
        @Query("city") city: String? = null
    ): Response<List<CustomerDto>>

    @GET("api/v1/subadmin/customers/{customerId}/summary")
    suspend fun getCustomerSummary(
        @Path("customerId") customerId: Int
    ): Response<CustomerSummaryResponse>

    @GET("api/v1/subadmin/customers/{customerId}/inverter-generation")
    suspend fun getCustomerInverterGeneration(
        @Path("customerId") customerId: Int
    ): Response<InverterGenerationResponse>

    @GET("api/v1/subadmin/service-requests/stats")
    suspend fun getServiceRequestStats(
        @Query("customerId") customerId: Int? = null
    ): Response<ServiceRequestStatsResponse>

    @PATCH("api/v1/subadmin/customers/{customerId}")
    suspend fun updateCustomerCredentials(
        @Path("customerId") customerId: Int,
        @Body request: UpdateCredentialsRequest
    ): Response<CommonResponse>

    @PATCH("api/v1/subadmin/tasks/{taskId}/schedule")
    suspend fun updateTaskSchedule(
        @Path("taskId") taskId: Int,
        @Query("scheduledDate") scheduledDate: String,
        @Query("scheduledTime") scheduledTime: String,
        @Query("employeeId") employeeId: String?
    ): Response<CommonResponse>

    @PATCH("api/v1/subadmin/customers/{customerId}/amc-settings")
    suspend fun updateAmcSettings(
        @Path("customerId") customerId: Int,
        @Query("cleaningsPerMonth") cleaningsPerMonth: Int?,
        @Query("monthlyRate") monthlyRate: Double?,
        @Query("clientType") clientType: String?,
        @Query("employeeId") employeeId: String?,
        @Query("cleaningWindows") cleaningWindows: String?
    ): Response<CommonResponse>

    @POST("api/v1/subadmin/payments")
    suspend fun logPayment(
        @Body request: PaymentLogRequest
    ): Response<CommonResponse>

    @PATCH("api/v1/subadmin/customers/{customerId}/inverter-credentials")
    suspend fun updateInverterCredentials(
        @Path("customerId") customerId: Int,
        @Query("brand") brand: String?,
        @Query("loginId") loginId: String?,
        @Query("password") password: String?,
        @Query("deviceSn") deviceSn: String?,
        @Query("apiKey") apiKey: String?
    ): Response<CommonResponse>

    @POST("api/v1/subadmin/tasks/assign")
    suspend fun assignTask(
        @Query("customerId") customerId: Int?,
        @Query("jobType") jobType: String,
        @Query("description") description: String,
        @Query("address") address: String,
        @Query("employeeId") employeeId: String?
    ): Response<CommonResponse>

    // ── Dispatch Record Endpoints ──

    @GET("api/v1/dispatch-records")
    suspend fun getDispatchRecords(
        @Query("customerId") customerId: Int? = null
    ): Response<List<DispatchRecordDto>>

    @POST("api/v1/dispatch-records")
    suspend fun createDispatchRecord(
        @Body request: DispatchRecordRequest
    ): Response<DispatchRecordResponse>

    // ── Solar Design Endpoints ──

    @GET("api/v1/solar-designs")
    suspend fun getSolarDesigns(
        @Query("customerId") customerId: Int? = null,
        @Query("engineerId") engineerId: String? = null
    ): Response<List<SolarDesignDto>>

    @GET("api/v1/solar-designs/{id}")
    suspend fun getSolarDesignById(
        @Path("id") id: String
    ): Response<SolarDesignDto>

    @POST("api/v1/solar-designs")
    suspend fun createSolarDesign(
        @Body request: SolarDesignRequest
    ): Response<SolarDesignResponse>

    @PUT("api/v1/solar-designs/{id}")
    suspend fun updateSolarDesign(
        @Path("id") id: String,
        @Body request: SolarDesignRequest
    ): Response<CommonResponse>

    // ── Electrical Design Endpoints ──

    @GET("api/v1/electrical-designs")
    suspend fun getElectricalDesigns(
        @Query("customerId") customerId: Int? = null,
        @Query("engineerId") engineerId: String? = null
    ): Response<List<ElectricalDesignDto>>

    @GET("api/v1/electrical-designs/{id}")
    suspend fun getElectricalDesignById(
        @Path("id") id: String
    ): Response<ElectricalDesignDto>

    @POST("api/v1/electrical-designs")
    suspend fun createElectricalDesign(
        @Body request: ElectricalDesignRequest
    ): Response<ElectricalDesignResponse>

    @PUT("api/v1/electrical-designs/{id}")
    suspend fun updateElectricalDesign(
        @Path("id") id: String,
        @Body request: ElectricalDesignRequest
    ): Response<CommonResponse>

    @GET("api/v1/employee/lookup")
    suspend fun lookupEmployee(
        @Query("identifier") identifier: String
    ): Response<LookupEmployeeResponse>

    @GET("api/v1/users/internal")
    suspend fun getInternalUsers(
        @Query("limit") limit: Int = 300,
        @Query("search") search: String? = null
    ): Response<List<InternalUserDto>>

    @PATCH("api/v1/attendance/admin/work-submissions/{id}/review")
    suspend fun reviewWorkSubmission(
        @Path("id") submissionId: String,
        @Body request: ReviewWorkRequest
    ): Response<CommonResponse>

    @GET("api/v1/attendance/admin/work-submissions/pending")
    suspend fun getPendingWorkSubmissions(): Response<PendingSubmissionsResponse>

    @POST("api/v1/daily-commits")
    suspend fun submitDailyCommit(
        @Body request: DailyCommitRequest
    ): Response<DailyCommitResponse>

    @GET("api/v1/daily-commits/mine")
    suspend fun getMyDailyCommits(
        @Query("from") from: String? = null,
        @Query("to") to: String? = null
    ): Response<List<DailyCommitResponseDto>>

    // ── Apartment Endpoints ──

    @GET("api/v1/apartments")
    suspend fun getApartments(): Response<List<ApartmentDto>>

    @GET("api/v1/apartments/{id}")
    suspend fun getApartmentById(
        @Path("id") id: Int
    ): Response<ApartmentDto>

    // ── Invoice Endpoints ──

    @GET("api/v1/invoices")
    suspend fun getInvoices(
        @Query("customerId") customerId: Int? = null,
        @Query("paymentStatus") paymentStatus: String? = null
    ): Response<List<InvoiceDto>>

    @GET("api/v1/invoices/{id}")
    suspend fun getInvoiceById(
        @Path("id") id: String
    ): Response<InvoiceDto>

    @POST("api/v1/invoices")
    suspend fun createInvoice(
        @Body request: InvoiceRequest
    ): Response<InvoiceResponse>

    @PUT("api/v1/invoices/{id}")
    suspend fun updateInvoice(
        @Path("id") id: String,
        @Body request: InvoiceRequest
    ): Response<CommonResponse>

    // ── Payment Endpoints ──

    @GET("api/v1/payments")
    suspend fun getPayments(
        @Query("customerId") customerId: Int? = null,
        @Query("taskId") taskId: Int? = null,
        @Query("paymentStatus") paymentStatus: String? = null
    ): Response<List<PaymentDto>>

    @GET("api/v1/payments/{id}")
    suspend fun getPaymentById(
        @Path("id") id: String
    ): Response<PaymentDto>

    @POST("api/v1/payments")
    suspend fun createPayment(
        @Body request: PaymentRequest
    ): Response<PaymentResponse>

    @PUT("api/v1/payments/{id}")
    suspend fun updatePayment(
        @Path("id") id: String,
        @Body request: PaymentRequest
    ): Response<CommonResponse>

    // ── Task Assignment Endpoints ──

    @GET("api/v1/task-assignments")
    suspend fun getTaskAssignments(
        @Query("taskId") taskId: Int? = null,
        @Query("employeeUserId") employeeUserId: String? = null
    ): Response<List<TaskAssignmentDto>>

    @POST("api/v1/task-assignments")
    suspend fun createTaskAssignment(
        @Body request: TaskAssignmentRequest
    ): Response<TaskAssignmentResponse>

    @PUT("api/v1/task-assignments/{id}")
    suspend fun updateTaskAssignment(
        @Path("id") id: String,
        @Body request: TaskAssignmentRequest
    ): Response<CommonResponse>

    // ── Task Image Endpoints ──

    @GET("api/v1/task-images")
    suspend fun getTaskImages(
        @Query("taskId") taskId: Int? = null,
        @Query("employeeUserId") employeeUserId: String? = null
    ): Response<List<TaskImageDto>>

    @POST("api/v1/task-images")
    suspend fun createTaskImage(
        @Body request: TaskImageRequest
    ): Response<TaskImageResponse>

    // ── Customer Notification Endpoints ──

    @GET("api/v1/customer-notifications")
    suspend fun getCustomerNotifications(
        @Query("customerId") customerId: Int? = null,
        @Query("isRead") isRead: Boolean? = null
    ): Response<List<CustomerNotificationDto>>

    @PATCH("api/v1/customer-notifications/{id}/read")
    suspend fun markNotificationAsRead(
        @Path("id") id: String
    ): Response<CommonResponse>

    // ── Performance Snapshot Endpoints ──

    @GET("api/v1/performance-snapshots")
    suspend fun getPerformanceSnapshots(
        @Query("employeeId") employeeId: String? = null,
        @Query("month") month: Int? = null,
        @Query("year") year: Int? = null
    ): Response<List<PerformanceSnapshotDto>>

    @GET("api/v1/performance-snapshots/{id}")
    suspend fun getPerformanceSnapshotById(
        @Path("id") id: String
    ): Response<PerformanceSnapshotDto>
}

// Request & Response DTOs
data class LoginRequest(
    val emailOrPhone: String,
    val securityCode: String,
    val mode: String // "PASSCODE" or "OTP"
)

data class LoginResponse(
    val success: Boolean,
    val id: String,
    val loginId: String,
    val email: String,
    val name: String,
    val role: String,
    val jobRole: String,
    val employeeCode: String?,
    val reportingManagerId: String?,
    val accessToken: String,
    val refreshToken: String
)

data class AttendanceCheckInRequest(
    val date: String,
    val checkInTime: String,
    val latitude: Double,
    val longitude: Double
)

data class AttendanceCheckInResponse(
    val success: Boolean,
    val data: AttendanceCheckInData
)

data class AttendanceCheckInData(
    val attendanceId: String,
    val status: String
)

data class AttendanceCheckOutRequest(
    val date: String,
    val checkOutTime: String,
    val latitude: Double,
    val longitude: Double
)

data class WorkSubmissionRequest(
    val title: String,
    val description: String,
    val hoursSpent: Double,
    val taskId: String
)

data class SurveyResponse(
    val success: Boolean,
    val surveyId: String,
    val message: String
)

data class DesignResponse(
    val success: Boolean,
    val designId: String,
    val message: String
)

data class TaskCompleteRequest(
    val completionMessage: String,
    val completionDocumentUrl: String?
)

data class CommonResponse(
    val success: Boolean,
    val message: String
)

data class TokenRefreshRequest(
    val refreshToken: String
)

data class TokenRefreshResponse(
    val accessToken: String,
    val refreshToken: String
)

data class WorkSubmissionsResponse(
    val submissions: List<WorkSubmissionDto>
)

data class WorkSubmissionDto(
    val id: String,
    val employeeId: String,
    val taskId: Int?,
    val title: String,
    val description: String,
    val proofUrl: String?,
    val proofNotes: String?,
    val hoursSpent: Double,
    val status: String,
    val reviewScore: Int?,
    val reviewNotes: String?,
    val reviewedBy: String?,
    val reviewedAt: String?
)

// ── Service Coordinator DTOs ──

data class CustomerDto(
    val id: Int,
    val customerCode: String?,
    val name: String?,
    val fullName: String?,
    val email: String?,
    val phone: String?,
    val phoneNumber: String?,
    val city: String?,
    val address: String?,
    val systemSizeKw: Double?,
    val inverterBrand: String?,
    val inverterLoginId: String?,
    val inverterPassword: String?,
    val inverterApiKey: String?,
    val inverterDeviceSn: String?,
    val amcStatus: String?,
    val status: String?,
    val projectStage: Int?,
    val installationDate: String?,
    val cleaningsPerMonth: Int?,
    val completedVisits: Int?,
    val pendingVisits: Int?
) {
    fun displayName(): String = name ?: fullName ?: "Customer #$id"
    fun displayPhone(): String = phone ?: phoneNumber ?: ""
}

data class CustomerSummaryResponse(
    val customer: CustomerDto,
    val serviceRequestStats: ServiceRequestStatsResponse?
)

data class InverterGenerationResponse(
    val dailyGeneration: Double?,
    val peakPower: Double?,
    val totalGeneration: Double?,
    val lastUpdated: String?,
    val isSimulated: Boolean?,
    val dataUnavailable: Boolean?,
    val unavailableReason: String?
)

data class ServiceRequestStatsResponse(
    val total: Int?,
    val pending: Int?,
    val scheduled: Int?,
    val completed: Int?
)

data class UpdateCredentialsRequest(
    val inverterBrand: String?,
    val inverterLoginId: String?,
    val inverterPassword: String?,
    val inverterApiKey: String?,
    val inverterDeviceSn: String?
)

data class TasksResponse(
    val data: TasksData
)

data class TasksData(
    val tasks: List<TaskDto>
)

data class TaskDto(
    val id: Int,
    val jobType: String,
    val description: String,
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val status: String,
    val scheduledTime: String
)

data class InventoryItemDto(
    val id: Int,
    val sku: String,
    val name: String,
    val category: String,
    val inStock: Double,
    val minThreshold: Double,
    val supplier: String?
)

// ── Dispatch Record DTOs ──

data class DispatchRecordDto(
    val id: String,
    val customerId: Int,
    val itemId: String,
    val quantity: Int,
    val dispatchedAt: String,
    val notes: String?
)

data class DispatchRecordRequest(
    val customerId: Int,
    val itemId: String,
    val quantity: Int,
    val notes: String?
)

data class DispatchRecordResponse(
    val success: Boolean,
    val dispatchRecord: DispatchRecordDto,
    val message: String
)

// ── Solar Design DTOs ──

data class SolarDesignDto(
    val id: String,
    val customerId: Int,
    val engineerId: String,
    val panelCount: Int,
    val inverterModel: String,
    val systemCapacityKw: Double,
    val tiltAngle: Double,
    val cadLayoutPath: String?,
    val sldDiagramPath: String?,
    val designStatus: String,
    val submittedAt: String,
    val reviewedAt: String?,
    val reviewedBy: String?,
    val reviewNotes: String?
)

data class SolarDesignRequest(
    val customerId: Int,
    val panelCount: Int,
    val inverterModel: String,
    val systemCapacityKw: Double,
    val tiltAngle: Double,
    val cadLayoutPath: String?,
    val sldDiagramPath: String?
)

data class SolarDesignResponse(
    val success: Boolean,
    val designId: String,
    val message: String
)

// ── Electrical Design DTOs ──

data class ElectricalDesignDto(
    val id: String,
    val customerId: Int,
    val engineerId: String,
    val systemSizeKw: Double,
    val mainBreakerSize: Double,
    val cableSize: String,
    val designStatus: String,
    val schematicUrl: String?,
    val loadCalculations: String?,
    val complianceCheck: String?,
    val submittedAt: String,
    val reviewedAt: String?,
    val reviewedBy: String?,
    val reviewNotes: String?
)

data class ElectricalDesignRequest(
    val customerId: Int,
    val systemSizeKw: Double,
    val mainBreakerSize: Double,
    val cableSize: String,
    val schematicUrl: String?,
    val loadCalculations: String?,
    val complianceCheck: String?
)

data class ElectricalDesignResponse(
    val success: Boolean,
    val designId: String,
    val message: String
)

// ── Apartment DTOs ──

data class ApartmentDto(
    val id: Int,
    val name: String,
    val address: String,
    val city: String,
    val createdAt: String,
    val updatedAt: String
)

// ── Invoice DTOs ──

data class InvoiceDto(
    val id: String,
    val invoiceNumber: String?,
    val customerId: Int,
    val invoiceType: String,
    val amount: Double,
    val paymentStatus: String,
    val amountPaid: Double,
    val invoiceDate: String,
    val paymentDate: String?,
    val zone: String?,
    val state: String?,
    val partnerId: String?,
    val createdAt: String,
    val updatedAt: String,
    val description: String?,
    val paymentMethod: String?,
    val proofUrl: String?
)

data class InvoiceRequest(
    val customerId: Int,
    val invoiceType: String,
    val amount: Double,
    val description: String?,
    val paymentMethod: String?
)

data class InvoiceResponse(
    val success: Boolean,
    val invoiceId: String,
    val message: String
)

// ── Payment DTOs ──

data class PaymentDto(
    val id: String,
    val taskId: Int,
    val customerId: Int,
    val amount: Double,
    val paymentMethod: String?,
    val paymentStatus: String,
    val transactionId: String?,
    val paidBy: String?,
    val paidAt: String?,
    val processedBy: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String
)

data class PaymentRequest(
    val taskId: Int,
    val customerId: Int,
    val amount: Double,
    val paymentMethod: String?,
    val notes: String?
)

data class PaymentResponse(
    val success: Boolean,
    val paymentId: String,
    val message: String
)

// ── Task Assignment DTOs ──

data class TaskAssignmentDto(
    val id: String,
    val taskId: Int,
    val employeeUserId: String,
    val assignedAt: String,
    val status: String
)

data class TaskAssignmentRequest(
    val taskId: Int,
    val employeeUserId: String,
    val status: String
)

data class TaskAssignmentResponse(
    val success: Boolean,
    val assignmentId: String,
    val message: String
)

// ── Task Image DTOs ──

data class TaskImageDto(
    val id: String,
    val taskId: Int,
    val employeeUserId: String,
    val type: String,
    val url: String,
    val latitude: Float?,
    val longitude: Float?,
    val watermarkText: String?,
    val uploadedAt: String
)

data class TaskImageRequest(
    val taskId: Int,
    val type: String,
    val url: String,
    val latitude: Float?,
    val longitude: Float?,
    val watermarkText: String?
)

data class TaskImageResponse(
    val success: Boolean,
    val imageId: String,
    val message: String
)

// ── Customer Notification DTOs ──

data class CustomerNotificationDto(
    val id: String,
    val customerId: Int,
    val type: String,
    val message: String,
    val taskId: Int?,
    val imageUrl: String?,
    val isRead: Boolean,
    val createdAt: String
)

// ── Performance Snapshot DTOs ──

data class PerformanceSnapshotDto(
    val id: String,
    val employeeId: String,
    val month: Int,
    val year: Int,
    val attendancePercent: Double,
    val taskCompletionRate: Double,
    val avgWorkScore: Double,
    val totalHoursLogged: Double,
    val performanceScore: Double,
    val daysPresent: Int,
    val daysAbsent: Int,
    val tasksAssigned: Int,
    val tasksCompleted: Int,
    val workSubmissions: Int,
    val calculatedAt: String,
    val createdAt: String,
    val updatedAt: String
)

data class LookupEmployeeResponse(
    val success: Boolean,
    val email: String,
    val phoneNumber: String?,
    val loginId: String,
    val fullName: String
)

// ── Daily Commit & Review DTOs ──

data class InternalUserDto(
    val id: String,
    val loginId: String,
    val employeeCode: String?,
    val fullName: String,
    val email: String,
    val phoneNumber: String?,
    val role: String,
    val designationTitle: String?,
    val departmentId: String?,
    val reportingManagerId: String?,
    val isActive: Boolean,
    val employeeProfile: EmployeeProfileDto?
)

data class EmployeeProfileDto(
    val zone: String?,
    val jobRole: String?,
    val monthlySalaryInr: Int?
)

data class ReviewWorkRequest(
    val status: String,
    val reviewScore: Int?,
    val reviewNotes: String?
)

data class PendingSubmissionsResponse(
    val submissions: List<WorkSubmissionDto>
)

data class DailyCommitRequest(
    val commitDate: String,
    val taskWorkedOn: String,
    val workSummary: String,
    val hoursSpent: Double,
    val issuesBlockers: String? = null,
    val tomorrowPlan: String? = null
)

data class DailyCommitResponse(
    val success: Boolean,
    val data: DailyCommitResponseDto
)

data class DailyCommitResponseDto(
    val id: String,
    val employeeId: String,
    val employeeName: String?,
    val employeeCode: String?,
    val commitDate: String,
    val taskWorkedOn: String,
    val workSummary: String,
    val hoursSpent: Double,
    val issuesBlockers: String?,
    val tomorrowPlan: String?,
    val attachmentUrl: String?,
    val submittedAt: String,
    val status: String
)

data class PaymentLogRequest(
    val customerId: Int,
    val invoiceNumber: String?,
    val amount: Double,
    val description: String?,
    val invoiceType: String?,
    val paymentMethod: String?
)
