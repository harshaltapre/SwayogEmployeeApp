package com.swayog.employee.data.repository

import android.content.Context
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WorkforceRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val attendanceRepository: AttendanceRepository
) {

    suspend fun getWorkforceDashboard(month: Int, year: Int): Result<WorkforceDashboardResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getWorkforceDashboard(month, year)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch workforce dashboard"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getAuthoritativeCalendar(month: Int, year: Int): Result<AuthoritativeCalendarResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getAuthoritativeCalendar(month, year)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch calendar"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getLeaveBalance(): Result<LeaveBalanceResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getLeaveBalance()
                if (response.isSuccessful && response.body()?.balance != null) {
                    Result.success(response.body()!!.balance!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch leave balance"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getLeaveHistory(): Result<List<LeaveRequestDto>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getLeaveHistory()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.leaves)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch leave history"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun submitLeaveRequest(request: SubmitLeaveRequest): Result<LeaveRequestDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.submitLeaveRequest(request)
                if (response.isSuccessful && response.body()?.request != null) {
                    Result.success(response.body()!!.request!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to submit leave request"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getOvertimeSummary(month: Int, year: Int): Result<OvertimeSummaryResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getOvertimeSummary(month, year)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch overtime summary"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getOvertimeHistory(): Result<List<OvertimeRequestDto>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getOvertimeHistory()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.history)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch overtime history"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun submitOvertimeRequest(request: SubmitOvertimeRequest): Result<OvertimeRequestDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.submitOvertimeRequest(request)
                if (response.isSuccessful && response.body()?.request != null) {
                    Result.success(response.body()!!.request!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to submit overtime request"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getActiveOvertimeSession(): Result<OvertimeSessionDto?> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getActiveOvertimeSession()
                if (response.isSuccessful) {
                    Result.success(response.body()?.session)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to get active overtime session"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun startOvertimeSession(requestId: String? = null): Result<OvertimeSessionDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.startOvertimeSession(StartOvertimeSessionRequest(requestId))
                if (response.isSuccessful && response.body()?.session != null) {
                    Result.success(response.body()!!.session!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to start overtime session"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun stopOvertimeSession(notes: String? = null): Result<OvertimeSessionDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.stopOvertimeSession(StopOvertimeSessionRequest(notes))
                if (response.isSuccessful && response.body()?.session != null) {
                    Result.success(response.body()!!.session!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to stop overtime session"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getEarnings(month: Int, year: Int): Result<EarningsSummary> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getEarnings(month, year)
                if (response.isSuccessful && response.body()?.earnings != null) {
                    Result.success(response.body()!!.earnings!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch earnings"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getSalaryHistory(): Result<List<SalaryRevisionDto>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getSalaryHistory()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.history)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch salary history"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getAdvances(): Result<AdvanceSummaryDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getAdvances()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.summary)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch advances"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun submitAdvanceRequest(amount: Double, reason: String): Result<AdvanceRecordDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.submitAdvanceRequest(SubmitAdvanceRequest(amount, reason))
                if (response.isSuccessful && response.body()?.request != null) {
                    Result.success(response.body()!!.request!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to submit advance request"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getIncentives(): Result<List<IncentiveDto>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getIncentives()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.incentives)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch incentives"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getAttendanceCorrections(): Result<List<AttendanceCorrectionDto>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getAttendanceCorrections()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.history)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch attendance corrections"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun submitAttendanceCorrection(request: SubmitAttendanceCorrectionRequest): Result<AttendanceCorrectionDto> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.submitAttendanceCorrection(request)
                if (response.isSuccessful && response.body()?.correction != null) {
                    Result.success(response.body()!!.correction!!)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to submit attendance correction"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getUnifiedRequests(): Result<List<UnifiedRequestDto>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getUnifiedRequests()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!.requests)
                } else {
                    Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch requests"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
