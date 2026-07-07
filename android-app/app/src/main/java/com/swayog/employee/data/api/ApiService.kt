package com.swayog.employee.data.api

import com.swayog.employee.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<AuthResponse>
    
    @POST("auth/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<Unit>
    
    @GET("auth/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    // Employee endpoints
    @GET("employee/tasks")
    suspend fun getEmployeeTasks(
        @Header("Authorization") token: String,
        @Query("employeeUserId") employeeUserId: String
    ): Response<List<Task>>
    
    @GET("employee/attendance/today")
    suspend fun getTodayAttendance(
        @Header("Authorization") token: String
    ): Response<AttendanceRecord>
    
    @POST("employee/check-in")
    suspend fun checkIn(
        @Header("Authorization") token: String,
        @Body request: CheckInRequest
    ): Response<CheckInResponse>
    
    @POST("employee/check-out")
    suspend fun checkOut(
        @Header("Authorization") token: String
    ): Response<Unit>
    
    @POST("employee/work-description")
    suspend fun saveWorkDescription(
        @Header("Authorization") token: String,
        @Body request: WorkDescriptionRequest
    ): Response<Unit>
    
    @GET("employee/performance")
    suspend fun getPerformance(
        @Header("Authorization") token: String,
        @Query("month") month: Int,
        @Query("year") year: Int
    ): Response<PerformanceSnapshot>
    
    @GET("employee/daily-commits")
    suspend fun getDailyCommits(
        @Header("Authorization") token: String
    ): Response<List<DailyCommit>>
    
    @POST("employee/daily-commits")
    suspend fun createDailyCommit(
        @Header("Authorization") token: String,
        @Body request: DailyCommitRequest
    ): Response<DailyCommit>
    
    // Sub-admin endpoints
    @GET("subadmin/customers")
    suspend fun getCustomers(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int?,
        @Query("city") city: String?
    ): Response<List<Customer>>
    
    @GET("subadmin/customers/{customerId}/summary")
    suspend fun getCustomerSummary(
        @Header("Authorization") token: String,
        @Path("customerId") customerId: Int
    ): Response<CustomerSummary>
    
    @GET("subadmin/customers/{customerId}/inverter-generation")
    suspend fun getCustomerInverterGeneration(
        @Header("Authorization") token: String,
        @Path("customerId") customerId: Int
    ): Response<InverterGeneration>
    
    @GET("subadmin/customers/{customerId}/inverter-generation-history")
    suspend fun getCustomerInverterGenerationHistory(
        @Header("Authorization") token: String,
        @Path("customerId") customerId: Int,
        @Query("period") period: String
    ): Response<List<GenerationHistory>>
    
    @PATCH("subadmin/customers/{customerId}")
    suspend fun updateCustomerCredentials(
        @Header("Authorization") token: String,
        @Path("customerId") customerId: Int,
        @Body request: UpdateCredentialsRequest
    ): Response<Customer>
    
    @GET("subadmin/complaints")
    suspend fun getComplaints(
        @Header("Authorization") token: String
    ): Response<List<ServiceRequest>>
    
    @GET("subadmin/employees")
    suspend fun getSubAdminEmployees(
        @Header("Authorization") token: String
    ): Response<List<User>>
    
    // Task endpoints
    @POST("tasks")
    suspend fun createTask(
        @Header("Authorization") token: String,
        @Body request: CreateTaskRequest
    ): Response<Task>
    
    @PATCH("tasks/{taskId}")
    suspend fun updateTask(
        @Header("Authorization") token: String,
        @Path("taskId") taskId: Int,
        @Body request: UpdateTaskRequest
    ): Response<Task>
    
    @POST("tasks/{taskId}/assign")
    suspend fun assignTask(
        @Header("Authorization") token: String,
        @Path("taskId") taskId: Int,
        @Body request: AssignTaskRequest
    ): Response<Task>
    
    @POST("tasks/{taskId}/complete")
    suspend fun completeTask(
        @Header("Authorization") token: String,
        @Path("taskId") taskId: Int,
        @Body request: CompleteTaskRequest
    ): Response<Task>
    
    // AMC endpoints
    @GET("amc/visits")
    suspend fun getAmcVisits(
        @Header("Authorization") token: String,
        @Query("employeeId") employeeId: String?
    ): Response<List<AmcVisit>>
    
    @PATCH("amc/visits/{visitId}")
    suspend fun updateAmcVisit(
        @Header("Authorization") token: String,
        @Path("visitId") visitId: String,
        @Body request: UpdateAmcVisitRequest
    ): Response<AmcVisit>
    
    // Inventory endpoints
    @GET("inventory")
    suspend fun getInventory(
        @Header("Authorization") token: String
    ): Response<List<InventoryItem>>
    
    @POST("inventory/dispatch")
    suspend fun createDispatch(
        @Header("Authorization") token: String,
        @Body request: DispatchRequest
    ): Response<DispatchRecord>
}
