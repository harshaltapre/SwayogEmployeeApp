package com.swayog.employee.presentation.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.PerformanceSnapshot
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

    private val _todayAttendance = MutableStateFlow<AttendanceRecord?>(null)
    val todayAttendance: StateFlow<AttendanceRecord?> = _todayAttendance.asStateFlow()

    private val _performance = MutableStateFlow<PerformanceSnapshot?>(null)
    val performance: StateFlow<PerformanceSnapshot?> = _performance.asStateFlow()
    
    val pendingSyncCount: StateFlow<Int> = attendanceRepository.pendingSyncCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    private val _monthlyRecords = MutableStateFlow<List<AttendanceRecord>>(emptyList())
    val monthlyRecords: StateFlow<List<AttendanceRecord>> = _monthlyRecords.asStateFlow()

    private val _currentTask = MutableStateFlow<Task?>(null)
    val currentTask: StateFlow<Task?> = _currentTask.asStateFlow()

    val faceDescriptors: StateFlow<List<List<Float>>> = dataStoreManager.faceDescriptors.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
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

    fun loadData() {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            
            // 1. Fetch today's record
            attendanceRepository.getTodayAttendance()
                .onSuccess { record ->
                    _todayAttendance.value = record
                }
                .onFailure {
                    // Fallback
                    _todayAttendance.value = null
                }
                
            // 2. Fetch monthly performance details
            val calendar = Calendar.getInstance()
            val month = calendar.get(Calendar.MONTH) + 1
            val year = calendar.get(Calendar.YEAR)
            
            // Sync monthly attendance history to Room cache in the background
            attendanceRepository.syncMonthlyAttendance(month, year)

            attendanceRepository.getPerformance(month, year)
                .onSuccess { snapshot ->
                    _performance.value = snapshot
                    _attendanceState.value = AttendanceState.Success
                }
                .onFailure { error ->
                    _attendanceState.value = AttendanceState.Error(error.message ?: "Failed to load performance stats")
                }
        }
    }

    fun checkIn(selfie: String?, latitude: Double?, longitude: Double?, matchConfidence: Float? = null, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            attendanceRepository.checkIn(selfie, latitude, longitude, matchConfidence)
                .onSuccess { response ->
                    _todayAttendance.value = response.attendanceRecord
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
