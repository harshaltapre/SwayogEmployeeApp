package com.swayog.employee.data.api

import com.swayog.employee.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/login-with-phone")
    suspend fun loginWithPhone(@Body request: LoginWithPhoneRequest): Response<ApiResponse<AuthResponse>>
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<ApiResponse<AuthResponse>>
    
    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>
    
    @GET("auth/me")
    suspend fun getCurrentUser(): Response<ApiResponse<User>>
    
    @PUT("users/internal/profile-photo")
    suspend fun updateProfilePhoto(
        @Body request: UpdateProfilePhotoRequest
    ): Response<ApiResponse<User>>

    @GET("health")
    suspend fun checkHealth(): Response<Unit>
    
    // Employee endpoints
    @GET("employee/tasks")
    suspend fun getEmployeeTasks(
        @Query("employeeUserId") employeeUserId: String
    ): Response<ApiResponse<TasksResponse>>
    
    @GET("employee/attendance/today")
    suspend fun getTodayAttendance(): Response<TodayAttendanceResponse>
    
    @POST("employee/attendance/check-in")
    suspend fun checkIn(
        @Body request: CheckInRequest
    ): Response<CheckInApiResponse>
    
    @POST("employee/attendance/check-out")
    suspend fun checkOut(): Response<ApiResponse<Unit>>
    
    @POST("employee/attendance/work-description")
    suspend fun saveWorkDescription(
        @Body request: WorkDescriptionRequest
    ): Response<ApiResponse<Unit>>
    
    // Face Recognition Endpoints
    @POST("attendance/face/enroll")
    suspend fun enrollFace(
        @Body request: FaceEnrollRequest
    ): Response<ApiResponse<Unit>>

    @GET("attendance/face/enrollment")
    suspend fun getFaceEnrollmentStatus(): Response<FaceEnrollmentStatusResponse>
    
    @DELETE("attendance/face/enrollment/{employeeId}")
    suspend fun deleteFaceEnrollment(
        @Path("employeeId") employeeId: String
    ): Response<ApiResponse<Unit>>
    
    @GET("employee/attendance/performance")
    suspend fun getPerformance(
        @Query("month") month: Int,
        @Query("year") year: Int
    ): Response<PerformanceResponse>
    
    @GET("employee/attendance/monthly")
    suspend fun getMonthlyAttendance(
        @Query("month") month: Int,
        @Query("year") year: Int
    ): Response<MonthlyAttendanceResponse>
    
    @GET("employee/daily-commits")
    suspend fun getDailyCommits(): Response<ApiResponse<List<DailyCommit>>>
    
    @POST("employee/daily-commits")
    suspend fun createDailyCommit(
        @Body request: DailyCommitRequest
    ): Response<ApiResponse<DailyCommit>>
    
    // Sub-admin endpoints
    @GET("customers")
    suspend fun getCustomers(
        @Query("limit") limit: Int?,
        @Query("city") city: String?
    ): Response<ApiResponse<List<Customer>>>
    
    @GET("subadmin/customers/{customerId}/summary")
    suspend fun getCustomerSummary(
        @Path("customerId") customerId: Int
    ): Response<ApiResponse<CustomerSummaryResponse>>
    
    @GET("subadmin/amc/customers")
    suspend fun getAmcCustomers(): Response<ApiResponse<List<Customer>>>
    
    @PUT("subadmin/amc/customers/{customerId}/settings")
    suspend fun updateAmcSettings(
        @Path("customerId") customerId: Int,
        @Body request: AmcSettingsRequest
    ): Response<ApiResponse<Unit>>
    
    @PUT("subadmin/amc/apartments/{apartmentId}/settings")
    suspend fun updateApartmentAmcSettings(
        @Path("apartmentId") apartmentId: Int,
        @Body request: ApartmentAmcSettingsRequest
    ): Response<ApiResponse<Unit>>
    
    @POST("subadmin/customers/bulk-import")
    suspend fun importCustomersFromExcel(
        @Body data: List<Map<String, String>>
    ): Response<ApiResponse<Unit>>
    
    @GET("subadmin/customers/{customerId}/inverter-generation")
    suspend fun getCustomerInverterGeneration(
        @Path("customerId") customerId: Int
    ): Response<ApiResponse<InverterGeneration>>
    
    @GET("subadmin/customers/{customerId}/inverter-generation-history")
    suspend fun getCustomerInverterGenerationHistory(
        @Path("customerId") customerId: Int,
        @Query("period") period: String
    ): Response<ApiResponse<InverterGenerationHistoryResponse>>
    
    @PATCH("subadmin/customers/{customerId}")
    suspend fun updateCustomerCredentials(
        @Path("customerId") customerId: Int,
        @Body request: UpdateCredentialsRequest
    ): Response<ApiResponse<Customer>>
    
    @PATCH("subadmin/customers/{customerId}/amc-settings")
    suspend fun updateAmcSettings(
        @Path("customerId") customerId: Int,
        @Body request: UpdateAmcSettingsRequest
    ): Response<ApiResponse<Customer>>
    
    @GET("subadmin/service-requests")
    suspend fun getComplaints(): Response<ApiResponse<ServiceRequestsResponse>>


    @PATCH("subadmin/service-requests/{requestId}")
    suspend fun updateServiceRequest(
        @Path("requestId") requestId: Int,
        @Body request: UpdateServiceRequestRequest
    ): Response<ApiResponse<ServiceRequest>>
    
    @GET("users/internal")
    suspend fun getInternalUsers(
        @Query("role") role: String? = null,
        @Query("limit") limit: Int? = 300
    ): Response<ApiResponse<List<com.swayog.employee.data.model.Employee>>>
    
    @GET("subadmin/amc-visits")
    suspend fun getSubAdminAmcVisits(
        @Query("customerId") customerId: Int?,
        @Query("status") status: String?,
        @Query("from") from: String?,
        @Query("to") to: String?
    ): Response<ApiResponse<List<AmcVisit>>>
    
    // Task endpoints
    @GET("tasks")
    suspend fun getTasks(
        @Query("employeeUserId") employeeUserId: String? = null,
        @Query("status") status: String? = null,
        @Query("limit") limit: Int? = 300
    ): Response<ApiResponse<List<com.swayog.employee.data.model.Task>>>

    @POST("tasks")
    suspend fun createTask(
        @Body request: CreateTaskRequest
    ): Response<ApiResponse<Task>>
    
    @PATCH("tasks/{taskId}")
    suspend fun updateTask(
        @Path("taskId") taskId: String,
        @Body request: UpdateTaskRequest
    ): Response<ApiResponse<Task>>
    
    @POST("tasks/{taskId}/assign")
    suspend fun assignTask(
        @Path("taskId") taskId: String,
        @Body request: AssignTaskRequest
    ): Response<ApiResponse<Task>>
    
    @PATCH("tasks/{taskId}/complete")
    suspend fun completeTask(
        @Path("taskId") taskId: String,
        @Body request: CompleteTaskRequest
    ): Response<ApiResponse<Task>>
    
    // AMC endpoints
    @GET("amc/visits")
    suspend fun getAmcVisits(
        @Query("employeeId") employeeId: String?
    ): Response<ApiResponse<List<AmcVisit>>>
    
    @POST("subadmin/amc-visits")
    suspend fun createAmcVisit(
        @Body request: Map<String, String?>
    ): Response<ApiResponse<Unit>>
    
    @PATCH("subadmin/amc-visits/{visitId}")
    suspend fun updateAmcVisit(
        @Path("visitId") visitId: String,
        @Body request: UpdateAmcVisitRequest
    ): Response<ApiResponse<AmcVisit>>
    
    // Inventory endpoints
    @GET("inventory")
    suspend fun getInventory(): Response<ApiResponse<List<InventoryItem>>>
    
    @POST("inventory/dispatch")
    suspend fun createDispatch(
        @Body request: DispatchRequest
    ): Response<ApiResponse<DispatchRecord>>
    
    @POST("employee/submissions")
    suspend fun submitWork(
        @Body request: WorkSubmissionRequest
    ): Response<ApiResponse<Unit>>

    @POST("employee/surveys")
    suspend fun submitSurvey(
        @Body request: SurveySubmissionRequest
    ): Response<ApiResponse<SurveySubmissionResponse>>

    @POST("employee/designs")
    suspend fun submitDesign(
        @Body request: DesignSubmissionRequest
    ): Response<ApiResponse<DesignSubmissionResponse>>

    // Invoices endpoints
    @GET("invoices")
    suspend fun getInvoices(
        @Query("invoiceType") invoiceType: String? = null
    ): Response<ApiResponse<List<Invoice>>>

    @POST("invoices")
    suspend fun createInvoice(
        @Body request: CreateInvoiceRequest
    ): Response<ApiResponse<Invoice>>
}
