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
