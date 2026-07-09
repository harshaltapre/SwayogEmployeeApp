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
    
    // Employee endpoints
    @GET("employee/tasks")
    suspend fun getEmployeeTasks(
        @Query("employeeUserId") employeeUserId: String
    ): Response<ApiResponse<TasksResponse>>
    
    @GET("employee/attendance/today")
    suspend fun getTodayAttendance(): Response<ApiResponse<Any>>
    
    @POST("employee/attendance/check-in")
    suspend fun checkIn(
        @Body request: CheckInRequest
    ): Response<ApiResponse<CheckInResponse>>
    
    @POST("employee/attendance/check-out")
    suspend fun checkOut(): Response<ApiResponse<Unit>>
    
    @POST("employee/attendance/work-description")
    suspend fun saveWorkDescription(
        @Body request: WorkDescriptionRequest
    ): Response<ApiResponse<Unit>>
    
    @GET("employee/attendance/performance")
    suspend fun getPerformance(
        @Query("month") month: Int,
        @Query("year") year: Int
    ): Response<ApiResponse<PerformanceSnapshot>>
    
    @GET("employee/daily-commits")
    suspend fun getDailyCommits(): Response<ApiResponse<List<DailyCommit>>>
    
    @POST("employee/daily-commits")
    suspend fun createDailyCommit(
        @Body request: DailyCommitRequest
    ): Response<ApiResponse<DailyCommit>>
    
    // Sub-admin endpoints
    @GET("subadmin/customers")
    suspend fun getCustomers(
        @Query("limit") limit: Int?,
        @Query("city") city: String?
    ): Response<ApiResponse<List<Customer>>>
    
    @GET("subadmin/customers/{customerId}/summary")
    suspend fun getCustomerSummary(
        @Path("customerId") customerId: Int
    ): Response<ApiResponse<CustomerSummary>>
    
    @GET("subadmin/customers/{customerId}/inverter-generation")
    suspend fun getCustomerInverterGeneration(
        @Path("customerId") customerId: Int
    ): Response<ApiResponse<InverterGeneration>>
    
    @GET("subadmin/customers/{customerId}/inverter-generation-history")
    suspend fun getCustomerInverterGenerationHistory(
        @Path("customerId") customerId: Int,
        @Query("period") period: String
    ): Response<ApiResponse<List<GenerationHistory>>>
    
    @PATCH("subadmin/customers/{customerId}")
    suspend fun updateCustomerCredentials(
        @Path("customerId") customerId: Int,
        @Body request: UpdateCredentialsRequest
    ): Response<ApiResponse<Customer>>
    
    @GET("subadmin/complaints")
    suspend fun getComplaints(): Response<ApiResponse<List<ServiceRequest>>>
    
    @GET("subadmin/employees")
    suspend fun getSubAdminEmployees(): Response<ApiResponse<List<User>>>
    
    // Task endpoints
    @POST("tasks")
    suspend fun createTask(
        @Body request: CreateTaskRequest
    ): Response<ApiResponse<Task>>
    
    @PATCH("tasks/{taskId}")
    suspend fun updateTask(
        @Path("taskId") taskId: Int,
        @Body request: UpdateTaskRequest
    ): Response<ApiResponse<Task>>
    
    @POST("tasks/{taskId}/assign")
    suspend fun assignTask(
        @Path("taskId") taskId: Int,
        @Body request: AssignTaskRequest
    ): Response<ApiResponse<Task>>
    
    @POST("tasks/{taskId}/complete")
    suspend fun completeTask(
        @Path("taskId") taskId: Int,
        @Body request: CompleteTaskRequest
    ): Response<ApiResponse<Task>>
    
    // AMC endpoints
    @GET("amc/visits")
    suspend fun getAmcVisits(
        @Query("employeeId") employeeId: String?
    ): Response<ApiResponse<List<AmcVisit>>>
    
    @PATCH("amc/visits/{visitId}")
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
}
