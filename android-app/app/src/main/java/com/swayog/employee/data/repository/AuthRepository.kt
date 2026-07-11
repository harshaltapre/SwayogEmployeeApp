package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import java.util.UUID
import com.swayog.employee.data.local.dao.UserDao
import com.swayog.employee.data.local.database.AppDatabase
import com.swayog.employee.data.local.entity.UserEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import retrofit2.Response
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val appDatabase: AppDatabase,
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    
    suspend fun login(email: String, password: String, role: String = "EMPLOYEE"): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(identifier = email, password = password, role = role))
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
            val errMsg = if (e is com.google.gson.JsonSyntaxException || e.message?.contains("MalformedJsonException") == true || e.message?.contains("BEGIN_OBJECT but was") == true) {
                "Server returned HTML instead of JSON. This is likely a tunnel warning page or network issue."
            } else {
                e.message ?: "An unexpected connection error occurred."
            }
            Result.failure(Exception(errMsg, e))
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
            val errMsg = if (e is com.google.gson.JsonSyntaxException || e.message?.contains("MalformedJsonException") == true || e.message?.contains("BEGIN_OBJECT but was") == true) {
                "Server returned HTML instead of JSON. This is likely a tunnel warning page or network issue."
            } else {
                e.message ?: "An unexpected connection error occurred."
            }
            Result.failure(Exception(errMsg, e))
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
            withContext(Dispatchers.IO) {
                appDatabase.clearAllTables()
            }
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

    suspend fun checkHealth(): Result<Unit> {
        return try {
            val response = apiService.checkHealth()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMsg = if (response.code() == 503) {
                    "Database connection failure on the server."
                } else {
                    "Server returned an error status: ${response.code()}"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val errMsg = if (e is com.google.gson.JsonSyntaxException || e.message?.contains("MalformedJsonException") == true || e.message?.contains("BEGIN_OBJECT but was") == true) {
                "Server returned HTML instead of JSON. This is likely a tunnel warning page or network issue."
            } else {
                e.message ?: "Server is unreachable. Please check your network connection."
            }
            Result.failure(Exception(errMsg, e))
        }
    }



    private fun parseErrorMessage(response: Response<*>): String {
        return try {
            val contentType = response.headers().get("Content-Type")
            if (contentType != null && contentType.contains("text/html")) {
                return "Server returned HTML instead of JSON. This is likely a tunnel warning page or network issue."
            }
            val errorBody = response.errorBody()?.string()
            if (!errorBody.isNullOrEmpty()) {
                if (errorBody.trim().startsWith("<")) {
                    return "Server returned HTML instead of JSON. This is likely a tunnel warning page or network issue."
                }
                val jsonObject = JSONObject(errorBody)
                val errorCode = jsonObject.optString("errorCode", "")
                val errorMessage = jsonObject.optString("error", response.message())
                if (errorCode.isNotEmpty()) {
                    "$errorMessage [$errorCode]"
                } else {
                    errorMessage
                }
            } else {
                response.message()
            }
        } catch (e: Exception) {
            response.message()
        }
    }
}

