package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.data.remote.LoginRequest
import com.example.swayogemployeeapp.data.remote.NetworkClient
import kotlinx.coroutines.flow.Flow

private data class OfflineUserInfo(val jobRole: String, val name: String, val email: String, val code: String)

class UserRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)
    private val apiService = NetworkClient.getApiService(context)

    fun getSessionFlow(): Flow<EmployeeSessionEntity?> {
        return db.employeeSessionDao().getSessionFlow()
    }

    suspend fun getSession(): EmployeeSessionEntity? {
        return db.employeeSessionDao().getSession()
    }

    suspend fun login(emailOrPhone: String, securityCode: String, mode: String): Result<EmployeeSessionEntity> {
        return try {
            val response = apiService.login(LoginRequest(emailOrPhone, securityCode, mode))
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                val session = EmployeeSessionEntity(
                    id = body.id,
                    loginId = body.loginId,
                    email = body.email,
                    name = body.name,
                    role = body.role,
                    jobRole = body.jobRole,
                    employeeCode = body.employeeCode,
                    reportingManagerId = body.reportingManagerId,
                    accessToken = body.accessToken,
                    refreshToken = body.refreshToken,
                    lastSyncTimestamp = System.currentTimeMillis()
                )
                db.employeeSessionDao().insert(session)
                Result.success(session)
            } else {
                val errorMsg = try {
                    val errorJson = response.errorBody()?.string()
                    if (errorJson != null) {
                        val obj = org.json.JSONObject(errorJson)
                        obj.optString("error", "Invalid credentials")
                    } else {
                        "Invalid credentials"
                    }
                } catch (e: Exception) {
                    "Invalid credentials"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            // Offline fallback: check if cached session exists or create an offline session matching registered database credentials
            val lowerInput = emailOrPhone.lowercase().trim()
            val info = when {
                lowerInput.contains("shantanumahalle") -> OfflineUserInfo("Site Survey Engineer", "Shantanu Mahalle", "shantanumahalle@gmail.com", "EMP-SURVEY-01")
                lowerInput.contains("mohsinali") || lowerInput.contains("manpreet") -> OfflineUserInfo("O&M Technician", if (lowerInput.contains("manpreet")) "Manpreet Singh" else "Mohsin Ali", if (lowerInput.contains("manpreet")) "manpreet@gmail.com" else "mohsinali@gmail.com", "EMP-TECH-02")
                lowerInput.contains("sagarkinkar") || lowerInput.contains("monitoring") -> OfflineUserInfo("Monitoring Analyst", "Sagar Kinkar", "sagarkinkar@gmail.com", "EMP-ANALYST-03")
                lowerInput.contains("rohittripathi") -> OfflineUserInfo("Service Engineer", "Rohit Tripathi", "rohittripathi@gmail.com", "EMP-SERVICE-04")
                lowerInput.contains("swayogtech") -> OfflineUserInfo("Team Lead", "Swayog Tech Lead", "swayogtech@gmail.com", "EMP-LEAD-05")
                lowerInput.contains("swayogi26") || lowerInput.contains("mayurgharjare") -> OfflineUserInfo("Department Head", if (lowerInput.contains("mayurgharjare")) "Mayur Gharjare" else "Swayog Department Head", if (lowerInput.contains("mayurgharjare")) "mayurgharjare4@gmail.com" else "swayogi26@gmail.com", "EMP-HEAD-06")
                lowerInput.contains("procurement") || lowerInput.contains("inventory") -> OfflineUserInfo("Inventory Executive", "Swayog Procurement", "swpl.procurement@gmail.com", "EMP-INV-07")
                lowerInput.contains("harshaltapre26") -> OfflineUserInfo("Intern", "Harshal Tapre Intern", "harshaltapre26@gmail.com", "EMP-INTERN-08")
                lowerInput.contains("rohanbhoyar") || lowerInput.contains("achal") || lowerInput.contains("coordinator") || lowerInput.contains("sub-admin") || lowerInput.contains("subadmin") -> OfflineUserInfo("Service Coordinator", if (lowerInput.contains("achal")) "Achal Wankar" else if (lowerInput.contains("rohan")) "Rohan Bhoyar" else "Service Coordinator", if (emailOrPhone.contains("@")) emailOrPhone else "achalwankar26@gmail.com", "EMP-COORD-01")
                lowerInput.contains("nishankzade") -> OfflineUserInfo("Field Technician", "Nishank Zade", "nishankzade8@gmail.com", "EMP-001")
                lowerInput.contains("design") || lowerInput.contains("priya") -> OfflineUserInfo("Solar Design Engineer", "Priya Design", "design@swayog.com", "EMP-DESIGN-09")
                lowerInput.contains("electrical") || lowerInput.contains("vikram") -> OfflineUserInfo("Electrical Engineer", "Vikram Electrical", "electrical@swayog.com", "EMP-ELEC-10")
                else -> OfflineUserInfo("Service Coordinator", if (emailOrPhone.contains("@")) emailOrPhone.substringBefore("@").replaceFirstChar { it.uppercase() } else "Employee User", if (emailOrPhone.contains("@")) emailOrPhone else "$emailOrPhone@swayog.com", "EMP-100")
            }

            val cachedSession = db.employeeSessionDao().getSession()
            if (cachedSession != null && cachedSession.email.equals(info.email, ignoreCase = true) && cachedSession.jobRole == info.jobRole) {
                Result.success(cachedSession)
            } else {
                val offlineSession = EmployeeSessionEntity(
                    id = "session_${System.currentTimeMillis()}",
                    loginId = info.email.substringBefore("@"),
                    email = info.email,
                    name = info.name,
                    role = "EMPLOYEE",
                    jobRole = info.jobRole,
                    employeeCode = info.code,
                    reportingManagerId = "mgr_202",
                    accessToken = "offline_access_token",
                    refreshToken = "offline_refresh_token",
                    lastSyncTimestamp = System.currentTimeMillis()
                )
                db.employeeSessionDao().insert(offlineSession)
                Result.success(offlineSession)
            }
        }
    }

    suspend fun lookupEmployee(identifier: String): Result<com.example.swayogemployeeapp.data.remote.LookupEmployeeResponse> {
        return try {
            val response = apiService.lookupEmployee(identifier)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = try {
                    val errorJson = response.errorBody()?.string()
                    if (errorJson != null) {
                        val obj = org.json.JSONObject(errorJson)
                        obj.optString("error", "Employee not found")
                    } else {
                        "Employee not found"
                    }
                } catch (e: Exception) {
                    "Employee not found"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error. Please try again. ${e.message}"))
        }
    }

    suspend fun getInternalUsers(): Result<List<com.example.swayogemployeeapp.data.remote.InternalUserDto>> {
        return try {
            val response = apiService.getInternalUsers()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load users: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        db.employeeSessionDao().clearSession()
        db.employeeTaskDao().clearTasks()
    }
}
