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
    
    suspend fun fetchProfilePhoto(): Result<String?> {
        val TAG = "PROFILE_FETCH"
        return try {
            val response = apiService.getProfilePhoto()
            if (response.isSuccessful && response.body() != null) {
                val photo = response.body()?.photo
                android.util.Log.d(TAG, "getProfilePhoto response SUCCESS: photo len=${photo?.length}")
                if (!photo.isNullOrEmpty()) {
                    dataStoreManager.saveProfilePhoto(photo)
                    val userId = dataStoreManager.userId.first()
                    if (!userId.isNullOrEmpty()) {
                        userDao.updateProfilePhotoUrl(userId, photo)
                    }
                }
                Result.success(photo)
            } else {
                android.util.Log.e(TAG, "getProfilePhoto failed: HTTP ${response.code()}")
                Result.failure(Exception("Failed to fetch profile photo"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "getProfilePhoto exception: ${e.message}")
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
                var finalPhoto = user.profileImageUrl
                if (finalPhoto.isNullOrEmpty()) {
                    val photoResult = fetchProfilePhoto()
                    if (photoResult.isSuccess && !photoResult.getOrNull().isNullOrEmpty()) {
                        finalPhoto = photoResult.getOrNull()
                    }
                } else {
                    val photoUrlWithCacheBuster = if (finalPhoto.startsWith("http")) {
                        val separator = if (finalPhoto.contains("?")) "&" else "?"
                        "${finalPhoto}${separator}v=${System.currentTimeMillis()}"
                    } else {
                        finalPhoto
                    }
                    dataStoreManager.saveProfilePhoto(photoUrlWithCacheBuster)
                }
                dataStoreManager.saveUserInfo(
                    userId = user.id,
                    email = user.email ?: "",
                    name = user.fullName ?: "",
                    role = user.role ?: "EMPLOYEE",
                    jobRole = user.employeeProfile?.jobRole,
                    profilePhotoUrl = dataStoreManager.profilePhotoUrl.first() // Keep existing photo url if not updated
                )
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
                    profilePhotoUrl = finalPhoto ?: existingUser?.profilePhotoUrl,
                    rating = existingUser?.rating
                )
                userDao.insertUser(userEntity)
                Result.success(user.copy(profileImageUrl = finalPhoto ?: existingUser?.profilePhotoUrl))
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

            val requestBody = file.asRequestBody(mimeType.toMediaTypeOrNull())
            val multipartBody = okhttp3.MultipartBody.Part.createFormData("file", file.name, requestBody)

            android.util.Log.d(TAG, "[STEP 2] Target endpoint: MULTIPART POST /api/v1/users/me/profile-image")
            
            var uploadResponse = try {
                apiService.uploadProfileImageMultipart(multipartBody)
            } catch (e: Exception) {
                android.util.Log.d(TAG, "[STEP 2.5] Primary endpoint failed, attempting fallback...")
                apiService.uploadProfilePhotoMultipart(multipartBody)
            }

            if (!uploadResponse.isSuccessful && uploadResponse.code() == 404) {
                android.util.Log.d(TAG, "[STEP 2.5] Primary endpoint returned 404, attempting fallback...")
                try {
                    uploadResponse = apiService.uploadProfilePhotoMultipart(multipartBody)
                } catch (e: Exception) {
                    android.util.Log.e(TAG, "[STEP 2.5 ERROR] Fallback also failed: ${e.message}")
                }
            }
            android.util.Log.d(TAG, "[STEP 3] Upload response received: HTTP status code = ${uploadResponse.code()}, message = ${uploadResponse.message()}")

            if (uploadResponse.isSuccessful && uploadResponse.body() != null) {
                val apiBody = uploadResponse.body()!!
                val serverUser = apiBody.data
                val rawPhoto = serverUser?.profileImageUrl ?: apiBody.photo ?: ""
                val returnedPhoto = if (rawPhoto.startsWith("http")) {
                    val sep = if (rawPhoto.contains("?")) "&" else "?"
                    "${rawPhoto}${sep}v=${System.currentTimeMillis()}"
                } else {
                    rawPhoto
                }
                android.util.Log.d(TAG, "[STEP 4] Returned image URL = ${returnedPhoto.take(60)}...")

                if (returnedPhoto.isNotEmpty()) {
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

                getCurrentUser()
                
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
                android.util.Log.d(TAG, "[STEP 3] Raw response body: success=${apiBody.success}, hasData=${apiBody.data != null}, hasPhoto=${apiBody.photo != null}")


                val serverUser = apiBody.data
                // Priority: server-echoed photo > server user profileImageUrl > locally-prepared base64
                // The backend now returns `photo` field with the saved image data URL.
                val returnedPhoto: String = when {
                    !apiBody.photo.isNullOrEmpty() -> {
                        android.util.Log.d(TAG, "[STEP 4] Using photo from apiBody.photo (len=${apiBody.photo!!.length})")
                        apiBody.photo!!
                    }
                    !serverUser?.profileImageUrl.isNullOrEmpty() -> {
                        android.util.Log.d(TAG, "[STEP 4] Using photo from serverUser.profileImageUrl (len=${serverUser!!.profileImageUrl!!.length})")
                        serverUser!!.profileImageUrl!!
                    }
                    else -> {
                        android.util.Log.w(TAG, "[STEP 4] Backend returned no photo/data, using locally-prepared base64 as fallback (len=${base64Data.length})")
                        base64Data
                    }
                }
                android.util.Log.d(TAG, "[STEP 4] returnedPhoto starts with: ${returnedPhoto.take(40)}...")
                android.util.Log.d(TAG, "[STEP 5] PostgreSQL update confirmed (backend returned updated user record).")

                // CRITICAL: Save to DataStore IMMEDIATELY — do NOT wait for getCurrentUser()
                dataStoreManager.saveProfilePhoto(returnedPhoto)
                android.util.Log.d(TAG, "[STEP 6] DataStore saved profile photo URL immediately after upload.")

                // Also update Room DB so the photo persists on next cold-start
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
                    android.util.Log.d(TAG, "[STEP 6] Room DB updated with new profile photo for userId=$userIdToUse")
                }

                // Secondary sync: fetch /auth/me to keep other user fields in sync.
                // Crucially, we do NOT let this overwrite the photo we just saved above —
                // getCurrentUser() only writes to DataStore if profileImageUrl is non-empty,
                // which will be the same value we just saved. This is safe.
                val meResult = getCurrentUser()
                android.util.Log.d(TAG, "[STEP 7] Background profile sync status: isSuccess=${meResult.isSuccess}")

                val resultUser = serverUser ?: User(
                    id = dataStoreManager.userId.first() ?: "",
                    fullName = dataStoreManager.userName.first() ?: "",
                    email = dataStoreManager.userEmail.first() ?: "",
                    role = dataStoreManager.userRole.first() ?: "EMPLOYEE",
                    isActive = true,
                    profileImageUrl = returnedPhoto
                )
                android.util.Log.d(TAG, "[STEP 8] Returning success. profileImageUrl starts with: ${resultUser.profileImageUrl?.take(40)}...")
                Result.success(resultUser)
            } else {
                val errorMsg = parseErrorMessage(uploadResponse)
                android.util.Log.e(TAG, "[STEP 3 ERROR] Backend upload failed: HTTP ${uploadResponse.code()} — $errorMsg")
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

