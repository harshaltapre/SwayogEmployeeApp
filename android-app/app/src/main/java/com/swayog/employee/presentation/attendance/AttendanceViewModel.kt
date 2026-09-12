package com.swayog.employee.presentation.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.HolidayItem
import com.swayog.employee.data.model.MonthlyAttendanceResponse
import com.swayog.employee.data.model.PerformanceSnapshot
import com.swayog.employee.data.model.Task
import com.swayog.employee.data.model.INDIAN_FESTIVALS_2026
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
import java.util.Calendar
import javax.inject.Inject

@HiltViewModel
class AttendanceViewModel @Inject constructor(
    private val attendanceRepository: AttendanceRepository,
    private val taskRepository: TaskRepository,
    private val dataStoreManager: DataStoreManager
) : ViewModel() {

    private val _attendanceState = MutableStateFlow<AttendanceState>(AttendanceState.Initial)
    val attendanceState: StateFlow<AttendanceState> = _attendanceState.asStateFlow()

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

    val attendanceRules: StateFlow<com.swayog.employee.data.model.AttendanceRule> = attendanceRepository.attendanceRuleFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = com.swayog.employee.data.model.AttendanceRule()
        )

    init {
        loadData()
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

    fun loadMonth(month: Int, year: Int) {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                try {
                    val result = attendanceRepository.getMonthlyAttendanceData(month, year)
                    val monthStr = String.format("%04d-%02d", year, month)

                    // Convert matching festivals from INDIAN_FESTIVALS_2026 into HolidayItem
                    val staticFestivals = INDIAN_FESTIVALS_2026
                        .filter { it.date.startsWith(monthStr) }
                        .map { f ->
                            HolidayItem(
                                id = f.id,
                                date = f.date,
                                dateStr = f.date,
                                name = f.name,
                                description = f.type
                            )
                        }

                    val combinedMap = linkedMapOf<String, HolidayItem>()
                    // Static festivals first
                    staticFestivals.forEach { item ->
                        item.dateStr?.let { combinedMap[it] = item }
                    }

                    result.onSuccess { data ->
                        _monthlySummary.value = data
                        // Backend declared holidays take priority
                        data.holidays.forEach { item ->
                            val key = item.dateStr ?: item.date?.take(10)
                            if (key != null) {
                                combinedMap[key] = item
                            }
                        }
                    }

                    _holidays.value = combinedMap.values.toList()
                } catch (e: Exception) {
                    android.util.Log.e("AttendanceViewModel", "loadMonth error: ${e.message}")
                }
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Success
            
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
