package com.swayog.employee.presentation.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.*
import com.swayog.employee.data.repository.WorkforceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class WorkforceViewModel @Inject constructor(
    private val workforceRepository: WorkforceRepository
) : ViewModel() {

    private val calendar = Calendar.getInstance()

    private val _currentMonth = MutableStateFlow(calendar.get(Calendar.MONTH) + 1)
    val currentMonth: StateFlow<Int> = _currentMonth.asStateFlow()

    private val _currentYear = MutableStateFlow(calendar.get(Calendar.YEAR))
    val currentYear: StateFlow<Int> = _currentYear.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _dashboardData = MutableStateFlow<WorkforceDashboardResponse?>(null)
    val dashboardData: StateFlow<WorkforceDashboardResponse?> = _dashboardData.asStateFlow()

    private val _calendarData = MutableStateFlow<AuthoritativeCalendarResponse?>(null)
    val calendarData: StateFlow<AuthoritativeCalendarResponse?> = _calendarData.asStateFlow()

    private val _selectedDay = MutableStateFlow<CalendarDayDto?>(null)
    val selectedDay: StateFlow<CalendarDayDto?> = _selectedDay.asStateFlow()

    private val _leaveBalance = MutableStateFlow<LeaveBalanceResponse?>(null)
    val leaveBalance: StateFlow<LeaveBalanceResponse?> = _leaveBalance.asStateFlow()

    private val _leaveHistory = MutableStateFlow<List<LeaveRequestDto>>(emptyList())
    val leaveHistory: StateFlow<List<LeaveRequestDto>> = _leaveHistory.asStateFlow()

    private val _overtimeSummary = MutableStateFlow<OvertimeSummaryResponse?>(null)
    val overtimeSummary: StateFlow<OvertimeSummaryResponse?> = _overtimeSummary.asStateFlow()

    private val _overtimeHistory = MutableStateFlow<List<OvertimeRequestDto>>(emptyList())
    val overtimeHistory: StateFlow<List<OvertimeRequestDto>> = _overtimeHistory.asStateFlow()

    private val _activeOvertimeSession = MutableStateFlow<OvertimeSessionDto?>(null)
    val activeOvertimeSession: StateFlow<OvertimeSessionDto?> = _activeOvertimeSession.asStateFlow()

    private val _liveSessionDurationText = MutableStateFlow("00:00:00")
    val liveSessionDurationText: StateFlow<String> = _liveSessionDurationText.asStateFlow()

    private val _earnings = MutableStateFlow<EarningsSummary?>(null)
    val earnings: StateFlow<EarningsSummary?> = _earnings.asStateFlow()

    private val _salaryHistory = MutableStateFlow<List<SalaryRevisionDto>>(emptyList())
    val salaryHistory: StateFlow<List<SalaryRevisionDto>> = _salaryHistory.asStateFlow()

    private val _advances = MutableStateFlow<AdvanceSummaryDto?>(null)
    val advances: StateFlow<AdvanceSummaryDto?> = _advances.asStateFlow()

    private val _incentives = MutableStateFlow<List<IncentiveDto>>(emptyList())
    val incentives: StateFlow<List<IncentiveDto>> = _incentives.asStateFlow()

    private val _corrections = MutableStateFlow<List<AttendanceCorrectionDto>>(emptyList())
    val corrections: StateFlow<List<AttendanceCorrectionDto>> = _corrections.asStateFlow()

    private val _unifiedRequests = MutableStateFlow<List<UnifiedRequestDto>>(emptyList())
    val unifiedRequests: StateFlow<List<UnifiedRequestDto>> = _unifiedRequests.asStateFlow()

    init {
        refreshAll()
        startLiveSessionTimer()
    }

    fun setMonthYear(month: Int, year: Int) {
        _currentMonth.value = month
        _currentYear.value = year
        refreshAll()
    }

    fun selectDay(day: CalendarDayDto?) {
        _selectedDay.value = day
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun refreshAll() {
        viewModelScope.launch {
            _isLoading.value = true
            val month = _currentMonth.value
            val year = _currentYear.value

            withContext(Dispatchers.IO) {
                // Fetch Dashboard
                workforceRepository.getWorkforceDashboard(month, year).onSuccess { res ->
                    _dashboardData.value = res
                    _leaveBalance.value = res.leaveBalance
                    _earnings.value = res.earnings
                    _activeOvertimeSession.value = res.activeOvertimeSession
                }.onFailure { err ->
                    _errorMessage.value = err.message
                }

                // Fetch Calendar
                workforceRepository.getAuthoritativeCalendar(month, year).onSuccess { res ->
                    _calendarData.value = res
                }

                // Fetch Leave History
                workforceRepository.getLeaveHistory().onSuccess { res ->
                    _leaveHistory.value = res
                }

                // Fetch Overtime Summary & History
                workforceRepository.getOvertimeSummary(month, year).onSuccess { res ->
                    _overtimeSummary.value = res
                    if (res.activeSession != null) {
                        _activeOvertimeSession.value = res.activeSession
                    }
                }
                workforceRepository.getOvertimeHistory().onSuccess { res ->
                    _overtimeHistory.value = res
                }

                // Fetch Earnings & Salary History
                workforceRepository.getEarnings(month, year).onSuccess { res ->
                    _earnings.value = res
                }
                workforceRepository.getSalaryHistory().onSuccess { res ->
                    _salaryHistory.value = res
                }

                // Fetch Advances
                workforceRepository.getAdvances().onSuccess { res ->
                    _advances.value = res
                }

                // Fetch Incentives
                workforceRepository.getIncentives().onSuccess { res ->
                    _incentives.value = res
                }

                // Fetch Corrections
                workforceRepository.getAttendanceCorrections().onSuccess { res ->
                    _corrections.value = res
                }

                // Fetch Unified Requests
                workforceRepository.getUnifiedRequests().onSuccess { res ->
                    _unifiedRequests.value = res
                }
            }
            _isLoading.value = false
        }
    }

    private fun startLiveSessionTimer() {
        viewModelScope.launch {
            while (isActive) {
                val session = _activeOvertimeSession.value
                if (session != null && session.status == "ACTIVE") {
                    try {
                        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                        format.timeZone = TimeZone.getTimeZone("UTC")
                        val cleanStartedAt = session.startedAt.substringBefore(".")
                        val startDate = format.parse(cleanStartedAt)
                        if (startDate != null) {
                            val diffMs = Math.max(0, System.currentTimeMillis() - startDate.time)
                            val hours = diffMs / (1000 * 60 * 60)
                            val minutes = (diffMs / (1000 * 60)) % 60
                            val seconds = (diffMs / 1000) % 60
                            _liveSessionDurationText.value = String.format(Locale.getDefault(), "%02d:%02d:%02d", hours, minutes, seconds)
                        }
                    } catch (e: Exception) {
                        _liveSessionDurationText.value = "Active"
                    }
                } else {
                    _liveSessionDurationText.value = "00:00:00"
                }
                delay(1000)
            }
        }
    }

    // ── Actions ─────────────────────────────────────────────────────────────

    fun submitLeaveRequest(request: SubmitLeaveRequest, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = workforceRepository.submitLeaveRequest(request)
            _isLoading.value = false
            result.onSuccess {
                refreshAll()
                onResult(Result.success(Unit))
            }.onFailure { err ->
                onResult(Result.failure(err))
            }
        }
    }

    fun submitOvertimeRequest(request: SubmitOvertimeRequest, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = workforceRepository.submitOvertimeRequest(request)
            _isLoading.value = false
            result.onSuccess {
                refreshAll()
                onResult(Result.success(Unit))
            }.onFailure { err ->
                onResult(Result.failure(err))
            }
        }
    }

    fun startOvertimeSession(requestId: String? = null, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = workforceRepository.startOvertimeSession(requestId)
            _isLoading.value = false
            result.onSuccess { session ->
                _activeOvertimeSession.value = session
                refreshAll()
                onResult(Result.success(Unit))
            }.onFailure { err ->
                onResult(Result.failure(err))
            }
        }
    }

    fun stopOvertimeSession(notes: String? = null, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = workforceRepository.stopOvertimeSession(notes)
            _isLoading.value = false
            result.onSuccess { session ->
                _activeOvertimeSession.value = null
                refreshAll()
                onResult(Result.success(Unit))
            }.onFailure { err ->
                onResult(Result.failure(err))
            }
        }
    }

    fun submitAdvanceRequest(amount: Double, reason: String, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = workforceRepository.submitAdvanceRequest(amount, reason)
            _isLoading.value = false
            result.onSuccess {
                refreshAll()
                onResult(Result.success(Unit))
            }.onFailure { err ->
                onResult(Result.failure(err))
            }
        }
    }

    fun submitAttendanceCorrection(request: SubmitAttendanceCorrectionRequest, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = workforceRepository.submitAttendanceCorrection(request)
            _isLoading.value = false
            result.onSuccess {
                refreshAll()
                onResult(Result.success(Unit))
            }.onFailure { err ->
                onResult(Result.failure(err))
            }
        }
    }
}
