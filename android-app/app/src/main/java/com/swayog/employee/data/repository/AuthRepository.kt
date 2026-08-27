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
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody
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
                val user = authResponse.user

                withContext(Dispatchers.IO) {
                    dataStoreManager.saveAuthToken(authResponse.token)
                    dataStoreManager.saveRefreshToken(authResponse.refreshToken)
                    dataStoreManager.saveUserInfo(
                        userId = user.id,
                        email = user.email,
                        name = user.fullName,
                        role = user.role,
                        jobRole = user.employeeProfile?.jobRole,
                        profilePhotoUrl = user.profileImageUrl
                    )

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
                        profilePhotoUrl = user.profileImageUrl
                    )
                    userDao.insertUser(userEntity)
                }

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
                    jobRole = user.employeeProfile?.jobRole,
                    profilePhotoUrl = user.profileImageUrl
                )
                
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
                    profilePhotoUrl = user.profileImageUrl
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
        val TAG = "PROFILE_FETCH"
        return try {
            val response = try {
                apiService.getMyProfile()
            } catch (e: Exception) {
                apiService.getCurrentUser()
            }
            if (response.isSuccessful && response.body()?.data != null) {
                val user = response.body()!!.data!!
                android.util.Log.d(TAG, "Profile fetch response SUCCESS: user=${user.fullName}, profilePhotoUrl=${user.profileImageUrl}")
                if (!user.profileImageUrl.isNullOrEmpty()) {
                    val photoUrlWithCacheBuster = if (user.profileImageUrl.startsWith("http")) {
                        val separator = if (user.profileImageUrl.contains("?")) "&" else "?"
                        "${user.profileImageUrl}${separator}v=${System.currentTimeMillis()}"
                    } else {
                        user.profileImageUrl
                    }
                    dataStoreManager.saveProfilePhoto(photoUrlWithCacheBuster)
                }
                val existingUser = userDao.getUserById(user.id)
                val userEntity = UserEntity(
                    id = user.id,
                    loginId = user.loginId ?: existingUser?.loginId ?: user.id,
                    employeeCode = user.employeeCode ?: existingUser?.employeeCode,
                    email = user.email ?: existingUser?.email ?: "",
                    phoneNumber = user.phoneNumber ?: existingUser?.phoneNumber,
                    fullName = user.fullName ?: existingUser?.fullName ?: "",
                    role = user.role ?: existingUser?.role ?: "EMPLOYEE",
                    designationTitle = user.designationTitle ?: existingUser?.designationTitle,
                    departmentId = user.departmentId ?: existingUser?.departmentId,
                    reportingManagerId = user.reportingManagerId ?: existingUser?.reportingManagerId,
                    isActive = user.isActive,
                    createdAt = user.createdAt ?: existingUser?.createdAt ?: "",
                    jobRole = user.employeeProfile?.jobRole ?: existingUser?.jobRole,
                    zone = user.employeeProfile?.zone ?: existingUser?.zone,
                    monthlySalaryInr = user.employeeProfile?.monthlySalaryInr ?: existingUser?.monthlySalaryInr,
                    profilePhotoUrl = user.profileImageUrl ?: existingUser?.profilePhotoUrl,
                    rating = existingUser?.rating
                )
                userDao.insertUser(userEntity)
                Result.success(user)
            } else {
                android.util.Log.e(TAG, "Profile fetch failed: ${response.message()}")
                Result.failure(Exception("Failed to get user"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Profile fetch exception: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun uploadProfilePhotoFile(file: java.io.File): Result<User> {
        val TAG = "PROFILE_UPLOAD"
        return try {
            val path = file.absolutePath
            val size = file.length()
            val exists = file.exists()
            android.util.Log.d(TAG, "[STEP 1] Selected image path = $path | File size = $size bytes | Exists = $exists")

            if (!exists || size <= 0) {
                android.util.Log.e(TAG, "[STEP 1 ERROR] Selected image file does not exist or is empty!")
                return Result.failure(Exception("Selected image file does not exist or is empty!"))
            }

            val extension = file.extension.lowercase()
            val mimeType = when (extension) {
                "png" -> "image/png"
                "webp" -> "image/webp"
                else -> "image/jpeg"
            }
            android.util.Log.d(TAG, "[STEP 1] Image MIME type detected = $mimeType")

            val bytes = file.readBytes()
            val base64Str = "data:$mimeType;base64," + android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            android.util.Log.d(TAG, "[STEP 1] Base64 image created successfully, total string length = ${base64Str.length}")

            updateProfilePhoto(base64Str)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Profile photo file upload failed: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updateProfilePhoto(base64Image: String): Result<User> {
        val TAG = "PROFILE_UPLOAD"
        return try {
            val base64Data = if (base64Image.startsWith("data:")) base64Image else "data:image/jpeg;base64,$base64Image"
            android.util.Log.d(TAG, "[STEP 2] Upload request payload prepared (length=${base64Data.length})")

            val token = dataStoreManager.authToken.first()
            android.util.Log.d(TAG, "[STEP 2] Target endpoint: POST /api/v1/users/me/profile-image")
            android.util.Log.d(TAG, "[STEP 2] Headers: Authorization = Bearer ${token?.take(15)}...")

            val request = com.swayog.employee.data.model.UpdateProfilePhotoRequest(photoDataUrl = base64Data, photo = base64Data)
            val uploadResponse = try {
                apiService.uploadProfileImageJson(request)
            } catch (e: Exception) {
                apiService.uploadProfilePhotoJson(request)
            }
            android.util.Log.d(TAG, "[STEP 3] Upload response received: HTTP status code = ${uploadResponse.code()}, message = ${uploadResponse.message()}")

            if (uploadResponse.isSuccessful && uploadResponse.body() != null) {
                val apiBody = uploadResponse.body()!!
                val serverUser = apiBody.data
                val rawPhoto = serverUser?.profileImageUrl ?: apiBody.photo ?: base64Data
                val returnedPhoto = if (rawPhoto.startsWith("http")) {
                    val sep = if (rawPhoto.contains("?")) "&" else "?"
                    "${rawPhoto}${sep}v=${System.currentTimeMillis()}"
                } else {
                    rawPhoto
                }
                android.util.Log.d(TAG, "[STEP 4] Returned image URL/Data = ${returnedPhoto.take(60)}...")
                android.util.Log.d(TAG, "[STEP 5] Database update result: SUCCESS - PostgreSQL user profileImageUrl updated via R2!")

                if (!returnedPhoto.isNullOrEmpty()) {
                    dataStoreManager.saveProfilePhoto(returnedPhoto)
                    val userIdToUse = serverUser?.id ?: dataStoreManager.userId.first() ?: ""
                    if (userIdToUse.isNotEmpty()) {
                        val existingUser = userDao.getUserById(userIdToUse)
                        userDao.insertUser(
                            UserEntity(
                                id = userIdToUse,
                                loginId = serverUser?.loginId ?: existingUser?.loginId ?: userIdToUse,
                                employeeCode = serverUser?.employeeCode ?: existingUser?.employeeCode,
                                email = serverUser?.email ?: existingUser?.email ?: "",
                                phoneNumber = serverUser?.phoneNumber ?: existingUser?.phoneNumber,
                                fullName = serverUser?.fullName ?: existingUser?.fullName ?: "",
                                role = serverUser?.role ?: existingUser?.role ?: "EMPLOYEE",
                                designationTitle = serverUser?.designationTitle ?: existingUser?.designationTitle,
                                departmentId = serverUser?.departmentId ?: existingUser?.departmentId,
                                reportingManagerId = serverUser?.reportingManagerId ?: existingUser?.reportingManagerId,
                                isActive = serverUser?.isActive ?: existingUser?.isActive ?: true,
                                createdAt = serverUser?.createdAt ?: existingUser?.createdAt ?: "",
                                jobRole = serverUser?.employeeProfile?.jobRole ?: existingUser?.jobRole,
                                zone = serverUser?.employeeProfile?.zone ?: existingUser?.zone,
                                monthlySalaryInr = serverUser?.employeeProfile?.monthlySalaryInr ?: existingUser?.monthlySalaryInr,
                                profilePhotoUrl = returnedPhoto,
                                rating = existingUser?.rating
                            )
                        )
                    }
                    android.util.Log.d(TAG, "[STEP 6] Local DataStore & Room DB saved profile photo successfully!")
                }

                // Force fetch current user profile to verify synchronization
                val meResult = getCurrentUser()
                android.util.Log.d(TAG, "[STEP 7] Profile fetch response status: isSuccess=${meResult.isSuccess}")

                Result.success(serverUser ?: User(
                    id = dataStoreManager.userId.first() ?: "",
                    fullName = dataStoreManager.userName.first() ?: "",
                    email = dataStoreManager.userEmail.first() ?: "",
                    role = dataStoreManager.userRole.first() ?: "EMPLOYEE",
                    isActive = true,
                    profileImageUrl = returnedPhoto
                ))
            } else {
                val errorMsg = parseErrorMessage(uploadResponse)
                android.util.Log.e(TAG, "[STEP 3 ERROR] Backend upload failed = $errorMsg")
                Result.failure(Exception("Failed to upload profile photo: $errorMsg"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error in updateProfilePhoto: ${e.message}", e)
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

