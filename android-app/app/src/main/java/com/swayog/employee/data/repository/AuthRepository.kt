package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.UserDao
import com.swayog.employee.data.local.entity.UserEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.*
import kotlinx.coroutines.flow.first
import retrofit2.Response
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body()?.data != null) {
                val authResponse = response.body()!!.data!!
                
                // Save tokens
                dataStoreManager.saveAuthToken(authResponse.token)
                dataStoreManager.saveRefreshToken(authResponse.refreshToken)
                
                // Save user info
                val user = authResponse.user
                dataStoreManager.saveUserInfo(
                    userId = user.id,
                    email = user.email,
                    name = user.fullName,
                    role = user.role,
                    jobRole = user.employeeProfile?.jobRole
                )
                
                // Save user to local database
                val userEntity = UserEntity(
                    id = user.id,
                    loginId = user.loginId ?: "",
                    employeeCode = user.employeeCode,
                    email = user.email,
                    phoneNumber = user.phoneNumber,
                    fullName = user.fullName,
                    role = user.role,
                    designationTitle = user.designationTitle,
                    departmentId = user.departmentId,
                    reportingManagerId = user.reportingManagerId,
                    isActive = user.isActive,
                    createdAt = user.createdAt ?: "",
                    jobRole = user.employeeProfile?.jobRole,
                    zone = user.employeeProfile?.zone,
                    monthlySalaryInr = user.employeeProfile?.monthlySalaryInr,
                    profilePhotoUrl = null
                )
                userDao.insertUser(userEntity)
                
                Result.success(authResponse)
            } else {
                val errorMsg = response.body()?.message ?: parseErrorMessage(response)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun loginWithPhone(phoneNumber: String, otp: String): Result<AuthResponse> {
        return try {
            val response = apiService.loginWithPhone(LoginWithPhoneRequest(phoneNumber, otp))
            if (response.isSuccessful && response.body()?.data != null) {
                val authResponse = response.body()!!.data!!
                
                // Save tokens
                dataStoreManager.saveAuthToken(authResponse.token)
                dataStoreManager.saveRefreshToken(authResponse.refreshToken)
                
                // Save user info
                val user = authResponse.user
                dataStoreManager.saveUserInfo(
                    userId = user.id,
                    email = user.email,
                    name = user.fullName,
                    role = user.role,
                    jobRole = user.employeeProfile?.jobRole
                )
                
                Result.success(authResponse)
            } else {
                val errorMsg = response.body()?.message ?: parseErrorMessage(response)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun register(
        email: String,
        password: String,
        fullName: String,
        phoneNumber: String?
    ): Result<AuthResponse> {
        return try {
            val response = apiService.register(RegisterRequest(email, password, fullName, phoneNumber))
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                val errorMsg = response.body()?.message ?: parseErrorMessage(response)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout(): Result<Unit> {
        return try {
            apiService.logout()
            
            // Clear local data
            dataStoreManager.clearAll()
            userDao.deleteAllUsers()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun refreshToken(): Result<AuthResponse> {
        return try {
            val refreshToken = dataStoreManager.refreshToken.first()
            if (refreshToken != null) {
                val response = apiService.refreshToken(RefreshTokenRequest(refreshToken))
                if (response.isSuccessful && response.body()?.data != null) {
                    val authResponse = response.body()!!.data!!
                    dataStoreManager.saveAuthToken(authResponse.token)
                    dataStoreManager.saveRefreshToken(authResponse.refreshToken)
                    Result.success(authResponse)
                } else {
                    Result.failure(Exception("Token refresh failed"))
                }
            } else {
                Result.failure(Exception("No refresh token available"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = apiService.getCurrentUser()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to get user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun mockLogin(): Result<AuthResponse> {
        val mockUser = User(
            id = "mock-123",
            loginId = "testuser",
            employeeCode = "EMP-001",
            email = "test@swayog.com",
            phoneNumber = "+91 9876543210",
            fullName = "Test User",
            role = "employee",
            designationTitle = "Software Engineer",
            departmentId = "DEPT-01",
            reportingManagerId = "MGR-01",
            isActive = true,
            createdAt = "2024-01-01T00:00:00Z",
            employeeProfile = EmployeeProfile(
                id = "prof-123",
                userId = "mock-123",
                jobRole = "Developer",
                zone = "Pune",
                monthlySalaryInr = 50000,
                isActive = true
            )
        )
        val mockResponse = AuthResponse(
            user = mockUser,
            token = "mock-token",
            refreshToken = "mock-refresh-token"
        )

        // Save tokens
        dataStoreManager.saveAuthToken(mockResponse.token)
        dataStoreManager.saveRefreshToken(mockResponse.refreshToken)

        // Save user info
        dataStoreManager.saveUserInfo(
            userId = mockUser.id,
            email = mockUser.email,
            name = mockUser.fullName,
            role = mockUser.role,
            jobRole = mockUser.employeeProfile?.jobRole
        )

        // Save user to local database
        val userEntity = UserEntity(
            id = mockUser.id,
            loginId = mockUser.loginId ?: "",
            employeeCode = mockUser.employeeCode,
            email = mockUser.email,
            phoneNumber = mockUser.phoneNumber,
            fullName = mockUser.fullName,
            role = mockUser.role,
            designationTitle = mockUser.designationTitle,
            departmentId = mockUser.departmentId,
            reportingManagerId = mockUser.reportingManagerId,
            isActive = mockUser.isActive,
            createdAt = mockUser.createdAt ?: "",
            jobRole = mockUser.employeeProfile?.jobRole,
            zone = mockUser.employeeProfile?.zone,
            monthlySalaryInr = mockUser.employeeProfile?.monthlySalaryInr,
            profilePhotoUrl = null
        )
        userDao.insertUser(userEntity)

        return Result.success(mockResponse)
    }

    private fun parseErrorMessage(response: Response<*>): String {
        return try {
            val errorBody = response.errorBody()?.string()
            if (!errorBody.isNullOrEmpty()) {
                val jsonObject = JSONObject(errorBody)
                jsonObject.optString("error", response.message())
            } else {
                response.message()
            }
        } catch (e: Exception) {
            response.message()
        }
    }
}
