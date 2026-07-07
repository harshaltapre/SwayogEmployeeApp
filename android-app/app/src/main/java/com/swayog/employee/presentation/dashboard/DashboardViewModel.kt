package com.swayog.employee.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.data.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val attendanceRepository: AttendanceRepository,
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _dashboardState = MutableStateFlow<DashboardState>(DashboardState.Initial)
    val dashboardState: StateFlow<DashboardState> = _dashboardState.asStateFlow()
    
    val userName: StateFlow<String?> = dataStoreManager.userName.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    val userRole: StateFlow<String?> = dataStoreManager.userRole.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    val jobRole: StateFlow<String?> = dataStoreManager.jobRole.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    val userId: StateFlow<String?> = dataStoreManager.userId.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    private val _tasks = MutableStateFlow<List<com.swayog.employee.data.model.Task>>(emptyList())
    val tasks: StateFlow<List<com.swayog.employee.data.model.Task>> = _tasks.asStateFlow()
    
    private val _todayAttendance = MutableStateFlow<com.swayog.employee.data.model.AttendanceRecord?>(null)
    val todayAttendance: StateFlow<com.swayog.employee.data.model.AttendanceRecord?> = _todayAttendance.asStateFlow()
    
    private val _performance = MutableStateFlow<com.swayog.employee.data.model.PerformanceSnapshot?>(null)
    val performance: StateFlow<com.swayog.employee.data.model.PerformanceSnapshot?> = _performance.asStateFlow()
    
    init {
        loadDashboardData()
    }
    
    fun loadDashboardData() {
        viewModelScope.launch {
            _dashboardState.value = DashboardState.Loading
            
            val userIdValue = userId.first()
            val tokenValue = dataStoreManager.authToken.first()
            
            if (userIdValue != null && tokenValue != null) {
                // Load tasks
                taskRepository.refreshTasks(userIdValue, "Bearer $tokenValue")
                    .onSuccess { taskList ->
                        _tasks.value = taskList
                    }
                    .onFailure {
                        // Load from local cache if API fails
                        taskRepository.getTasksByEmployeeId(userIdValue).collect { localTasks ->
                            _tasks.value = localTasks
                        }
                    }
                
                // Load today's attendance
                attendanceRepository.getTodayAttendance("Bearer $tokenValue")
                    .onSuccess { attendance ->
                        _todayAttendance.value = attendance
                    }
                
                // Load performance
                val now = Calendar.getInstance()
                attendanceRepository.getPerformance(
                    now.get(Calendar.MONTH) + 1,
                    now.get(Calendar.YEAR),
                    "Bearer $tokenValue"
                )
                    .onSuccess { perf ->
                        _performance.value = perf
                    }
                
                _dashboardState.value = DashboardState.Success
            } else {
                _dashboardState.value = DashboardState.Error("User not authenticated")
            }
        }
    }
    
    fun saveWorkDescription(description: String) {
        viewModelScope.launch {
            val userIdValue = userId.first()
            val tokenValue = dataStoreManager.authToken.first()
            
            if (userIdValue != null && tokenValue != null) {
                attendanceRepository.saveWorkDescription(
                    userIdValue,
                    description,
                    "Bearer $tokenValue"
                )
                    .onSuccess {
                        _dashboardState.value = DashboardState.WorkDescriptionSaved
                    }
                    .onFailure { error ->
                        _dashboardState.value = DashboardState.Error(
                            error.message ?: "Failed to save work description"
                        )
                    }
            }
        }
    }
    
    fun resetState() {
        _dashboardState.value = DashboardState.Initial
    }
}

sealed class DashboardState {
    object Initial : DashboardState()
    object Loading : DashboardState()
    object Success : DashboardState()
    object WorkDescriptionSaved : DashboardState()
    data class Error(val message: String) : DashboardState()
}
