package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.data.remote.LoginRequest
import com.example.swayogemployeeapp.data.remote.NetworkClient
import kotlinx.coroutines.flow.Flow

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
                Result.failure(Exception(response.body()?.email ?: "Invalid credentials"))
            }
        } catch (e: Exception) {
            // Offline fallback: check if cached session matches
            val cachedSession = db.employeeSessionDao().getSession()
            if (cachedSession != null && (cachedSession.email == emailOrPhone || cachedSession.loginId == emailOrPhone)) {
                Result.success(cachedSession)
            } else {
                Result.failure(Exception("Offline login failed. Please connect to internet to sign in first."))
            }
        }
    }

    suspend fun logout() {
        db.employeeSessionDao().clearSession()
        db.employeeTaskDao().clearTasks()
    }
}
