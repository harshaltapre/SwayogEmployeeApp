package com.swayog.employee.presentation.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.HolidayItem
import com.swayog.employee.data.model.MonthlyAttendanceResponse
import com.swayog.employee.data.model.PerformanceSnapshot
import com.swayog.employee.data.model.RegularizationItem
import com.swayog.employee.data.model.RegularizationRequestPayload
import com.swayog.employee.data.model.Task

import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.data.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.async
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.OvertimeRequestDto
import com.swayog.employee.data.model.OvertimeSessionDto
import com.swayog.employee.data.model.SubmitOvertimeRequest
import com.swayog.employee.data.model.WorkforceSummary
import com.swayog.employee.data.model.AuthoritativeCalendarResponse
import com.swayog.employee.data.repository.WorkforceRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import java.text.SimpleDateFormat
import java.util.TimeZone
import java.util.Locale
import java.util.Calendar
import javax.inject.Inject

@HiltViewModel
class AttendanceViewModel @Inject constructor(
    private val attendanceRepository: AttendanceRepository,
    private val taskRepository: TaskRepository,
    private val dataStoreManager: DataStoreManager,
    private val workforceRepository: WorkforceRepository
) : ViewModel() {

    private val _attendanceState = MutableStateFlow<AttendanceState>(AttendanceState.Initial)
    val attendanceState: StateFlow<AttendanceState> = _attendanceState.asStateFlow()

    private val _overtimeHistory = MutableStateFlow<List<OvertimeRequestDto>>(emptyList())
    val overtimeHistory: StateFlow<List<OvertimeRequestDto>> = _overtimeHistory.asStateFlow()

    private val _activeOvertimeSession = MutableStateFlow<OvertimeSessionDto?>(null)
    val activeOvertimeSession: StateFlow<OvertimeSessionDto?> = _activeOvertimeSession.asStateFlow()

    private val _liveSessionDurationText = MutableStateFlow("00:00:00")
    val liveSessionDurationText: StateFlow<String> = _liveSessionDurationText.asStateFlow()

    private val _workforceSummary = MutableStateFlow<WorkforceSummary?>(null)
    val workforceSummary: StateFlow<WorkforceSummary?> = _workforceSummary.asStateFlow()

    private val _authoritativeCalendar = MutableStateFlow<AuthoritativeCalendarResponse?>(null)
    val authoritativeCalendar: StateFlow<AuthoritativeCalendarResponse?> = _authoritativeCalendar.asStateFlow()

    val profilePhotoUrl: StateFlow<String?> = dataStoreManager.profilePhotoUrl.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val todayAttendance: StateFlow<AttendanceRecord?> = attendanceRepository.getTodayAttendanceFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val _performance = MutableStateFlow<PerformanceSnapshot?>(null)
    val performance: StateFlow<PerformanceSnapshot?> = _performance.asStateFlow()
    
    val pendingSyncCount: StateFlow<Int> = attendanceRepository.pendingSyncCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    private val _monthlyRecords = MutableStateFlow<List<AttendanceRecord>>(emptyList())
    val monthlyRecords: StateFlow<List<AttendanceRecord>> = _monthlyRecords.asStateFlow()

    private val _holidays = MutableStateFlow<List<HolidayItem>>(emptyList())
    val holidays: StateFlow<List<HolidayItem>> = _holidays.asStateFlow()

    private val _monthlySummary = MutableStateFlow<MonthlyAttendanceResponse?>(null)
    val monthlySummary: StateFlow<MonthlyAttendanceResponse?> = _monthlySummary.asStateFlow()

    private val _currentTask = MutableStateFlow<Task?>(null)
    val currentTask: StateFlow<Task?> = _currentTask.asStateFlow()

    val isFaceEnrolled: StateFlow<Boolean> = dataStoreManager.isFaceEnrolled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    val faceDescriptors: StateFlow<List<List<Float>>> = dataStoreManager.faceDescriptors.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _myRegularizationRequests = MutableStateFlow<List<RegularizationItem>>(emptyList())
    val myRegularizationRequests: StateFlow<List<RegularizationItem>> = _myRegularizationRequests.asStateFlow()

    private val _isLoadingRegularization = MutableStateFlow<Boolean>(false)
    val isLoadingRegularization: StateFlow<Boolean> = _isLoadingRegularization.asStateFlow()

    val attendanceRules: StateFlow<com.swayog.employee.data.model.AttendanceRule> = attendanceRepository.attendanceRuleFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = com.swayog.employee.data.model.AttendanceRule()
        )

    init {
        loadData()
        refreshOvertime()
        startLiveSessionTimer()
        viewModelScope.launch {
            dataStoreManager.userId.filterNotNull().collect { id ->
                attendanceRepository.getAttendanceByEmployeeId(id).collect { records ->
                    _monthlyRecords.value = records
                }
            }
        }

        viewModelScope.launch {
            dataStoreManager.userId.filterNotNull().collect { id ->
                taskRepository.getActiveTasksByEmployeeId(id).collect { tasks ->
                    _currentTask.value = tasks.firstOrNull()
                }
            }
        }
    }

    private fun startLiveSessionTimer() {
        viewModelScope.launch {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            while (isActive) {
                val session = _activeOvertimeSession.value
                if (session != null && session.status == "ACTIVE") {
                    try {
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

    fun refreshOvertime() {
        val calendar = Calendar.getInstance()
        val month = calendar.get(Calendar.MONTH) + 1
        val year = calendar.get(Calendar.YEAR)

        viewModelScope.launch(Dispatchers.IO) {
            launch {
                workforceRepository.getOvertimeHistory().onSuccess {
                    _overtimeHistory.value = it
                }
            }
            launch {
                workforceRepository.getActiveOvertimeSession().onSuccess {
                    _activeOvertimeSession.value = it
                }
            }
            launch {
                workforceRepository.getWorkforceDashboard(month, year).onSuccess {
                    _workforceSummary.value = it.summary
                }
            }
            launch {
                workforceRepository.getAuthoritativeCalendar(month, year).onSuccess {
                    _authoritativeCalendar.value = it
                }
            }
        }
    }

    fun submitOvertimeRequest(request: SubmitOvertimeRequest, onResult: (Result<Unit>) -> Unit = {}) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            workforceRepository.submitOvertimeRequest(request)
                .onSuccess {
                    refreshOvertime()
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.success(Unit))
                }
                .onFailure {
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(it))
                }
        }
    }

    fun startOvertimeSession(requestId: String? = null, onResult: (Result<Unit>) -> Unit = {}) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            workforceRepository.startOvertimeSession(requestId)
                .onSuccess { session ->
                    _activeOvertimeSession.value = session
                    refreshOvertime()
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.success(Unit))
                }
                .onFailure {
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(it))
                }
        }
    }

    fun stopOvertimeSession(notes: String? = null, onResult: (Result<Unit>) -> Unit = {}) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            workforceRepository.stopOvertimeSession(notes)
                .onSuccess {
                    _activeOvertimeSession.value = null
                    refreshOvertime()
                    loadData()
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.success(Unit))
                }
                .onFailure {
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(it))
                }
        }
    }

    fun loadMonth(month: Int, year: Int) {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                try {
                    // Only use holidays declared by admin via the backend.
                    // Static government festivals (INDIAN_FESTIVALS_2026) are intentionally
                    // excluded — the calendar must stay in sync with the web attendance
                    // calendar, which only shows admin-declared holidays from the database.
                    val result = attendanceRepository.getMonthlyAttendanceData(month, year)

                    result.onSuccess { data ->
                        _monthlySummary.value = data
                        // Use only admin-declared holidays returned by the backend
                        _holidays.value = data.holidays
                    }.onFailure {
                        // If monthly data fetch failed, try fetching holidays directly
                        // as a fallback so the calendar still reflects declared holidays.
                        val holidayResult = attendanceRepository.getHolidays(month, year)
                        holidayResult.onSuccess { holidayList ->
                            _holidays.value = holidayList
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("AttendanceViewModel", "loadMonth error: ${e.message}")
                }
            }
        }
    }

    fun loadRegularizationRequests() {
        viewModelScope.launch {
            _isLoadingRegularization.value = true
            withContext(Dispatchers.IO) {
                attendanceRepository.getMyRegularizationRequests()
                    .onSuccess { list ->
                        _myRegularizationRequests.value = list
                    }
                    .onFailure { e ->
                        android.util.Log.e("AttendanceViewModel", "Failed to load regularization requests: ${e.message}")
                    }
            }
            _isLoadingRegularization.value = false
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Success
            loadRegularizationRequests()
            
            withContext(Dispatchers.IO) {
                try {
                    val calendar = Calendar.getInstance()
                    val month = calendar.get(Calendar.MONTH) + 1
                    val year = calendar.get(Calendar.YEAR)

                    loadMonth(month, year)

                    val faceDeferred = async { attendanceRepository.syncFaceEnrollment() }
                    val rulesDeferred = async { attendanceRepository.getAttendanceRules() }
                    val todayDeferred = async { attendanceRepository.getTodayAttendance() }
                    val perfDeferred = async { attendanceRepository.getPerformance(month, year) }

                    todayDeferred.await()
                    rulesDeferred.await()
                    faceDeferred.await()
                    
                    val perfResult = perfDeferred.await()
                    perfResult.onSuccess { snapshot ->
                        _performance.value = snapshot
                    }
                } catch (e: Exception) {
                    android.util.Log.e("AttendanceViewModel", "Attendance background sync error: ${e.message}")
                }
            }
        }
    }

    fun submitRegularizationRequest(
        payload: RegularizationRequestPayload,
        onResult: (Result<RegularizationItem>) -> Unit
    ) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            val result = withContext(Dispatchers.IO) {
                attendanceRepository.submitRegularizationRequest(payload)
            }
            _attendanceState.value = AttendanceState.Success
            result.onSuccess { item ->
                loadRegularizationRequests()
                val cal = Calendar.getInstance()
                loadMonth(cal.get(Calendar.MONTH) + 1, cal.get(Calendar.YEAR))
                onResult(Result.success(item))
            }.onFailure { error ->
                onResult(Result.failure(error))
            }
        }
    }

    fun checkIn(selfie: String?, latitude: Double?, longitude: Double?, matchConfidence: Float? = null, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            attendanceRepository.checkIn(selfie, latitude, longitude, matchConfidence)
                .onSuccess { response ->
                    loadData()
                    onResult(Result.success(Unit))
                }
                .onFailure { error ->
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(error))
                }
        }
    }

    fun checkOut(onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            attendanceRepository.checkOut()
                .onSuccess {
                    loadData()
                    onResult(Result.success(Unit))
                }
                .onFailure { error ->
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(error))
                }
        }
    }
}

sealed class AttendanceState {
    object Initial : AttendanceState()
    object Loading : AttendanceState()
    object Success : AttendanceState()
    data class Error(val message: String) : AttendanceState()
}
