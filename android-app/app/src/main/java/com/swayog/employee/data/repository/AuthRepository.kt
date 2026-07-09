package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import java.util.UUID
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
        try {
            apiService.logout()
        } catch (e: Exception) {
            // Ignore API exceptions so local logout always completes
        }
        return try {
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

