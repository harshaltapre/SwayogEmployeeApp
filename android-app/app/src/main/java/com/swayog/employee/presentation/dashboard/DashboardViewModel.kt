package com.swayog.employee.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.data.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
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
        viewModelScope.launch {
            combine(
                dataStoreManager.userId,
                dataStoreManager.authToken,
                dataStoreManager.userRole,
                dataStoreManager.jobRole
            ) { id, token, role, job ->
                Triple(id, token, role to job)
            }.filter { it.first != null && it.second != null }
                .distinctUntilChanged()
                .collect { (id, _, roles) ->
                    val (role, job) = roles
                    val isServiceCoordinator = role?.uppercase() == "SUB_ADMIN" || job?.replace(" ", "")?.lowercase() == "servicecoordinator"
                    if (isServiceCoordinator) {
                        _dashboardState.value = DashboardState.Success
                    } else {
                        loadDashboardData(id!!)
                    }
                }
        }
    }
    
    fun loadDashboardData(userIdValue: String) {
        viewModelScope.launch {
            _dashboardState.value = DashboardState.Loading
            var hasError = false
            var errorMessage = ""

            withContext(Dispatchers.IO) {
                val tasksDeferred = async { taskRepository.refreshTasks(userIdValue) }
                val attendanceDeferred = async { attendanceRepository.getTodayAttendance() }
                
                val now = Calendar.getInstance()
                val perfDeferred = async { 
                    attendanceRepository.getPerformance(
                        now.get(Calendar.MONTH) + 1,
                        now.get(Calendar.YEAR)
                    )
                }

                val taskRes = tasksDeferred.await()
                val attendanceRes = attendanceDeferred.await()
                val perfRes = perfDeferred.await()

                taskRes.onSuccess { taskList ->
                    _tasks.value = taskList
                }.onFailure { error ->
                    hasError = true
                    errorMessage += "Tasks: ${error.message}. "
                    _tasks.value = emptyList()
                }

                attendanceRes.onSuccess { attendance ->
                    _todayAttendance.value = attendance
                }.onFailure { error ->
                    hasError = true
                    errorMessage += "Attendance: ${error.message}. "
                    _todayAttendance.value = null
                }

                perfRes.onSuccess { perf ->
                    _performance.value = perf
                }.onFailure { error ->
                    hasError = true
                    errorMessage += "Performance: ${error.message}. "
                }
            }

            if (hasError) {
                _dashboardState.value = DashboardState.Error(errorMessage.trim())
            } else {
                _dashboardState.value = DashboardState.Success
            }
        }
    }
    
    fun retryLoading() {
        viewModelScope.launch {
            val id = dataStoreManager.userId.first()
            if (id != null) {
                loadDashboardData(id)
            } else {
                _dashboardState.value = DashboardState.Error("User not authenticated")
            }
        }
    }
    
    fun saveWorkDescription(description: String) {
        viewModelScope.launch {
            val userIdValue = dataStoreManager.userId.first()
            if (userIdValue != null) {
                attendanceRepository.saveWorkDescription(
                    userIdValue,
                    description
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

    fun submitWork(
        title: String,
        description: String,
        hoursSpent: Double,
        taskId: Int?,
        onResult: (Result<Unit>) -> Unit
    ) {
        viewModelScope.launch {
            val res = taskRepository.submitWork(title, description, hoursSpent, taskId)
            onResult(res)
        }
    }

    fun submitSurvey(
        taskId: Int?,
        customerId: Int?,
        roofType: String,
        lengthFt: Double,
        widthFt: Double,
        obstacleNotes: String?,
        shadowFactors: String?,
        recommendedCapacityKw: Double,
        latitude: Double?,
        longitude: Double?,
        onResult: (Result<com.swayog.employee.data.model.SurveySubmissionResponse>) -> Unit
    ) {
        viewModelScope.launch {
            val res = taskRepository.submitSurvey(
                taskId, customerId, roofType, lengthFt, widthFt,
                obstacleNotes, shadowFactors, recommendedCapacityKw, latitude, longitude
            )
            onResult(res)
        }
    }

    fun submitDesign(
        customerId: Int?,
        panelCount: Int,
        inverterModel: String,
        systemCapacityKw: Double,
        tiltAngle: Double,
        onResult: (Result<com.swayog.employee.data.model.DesignSubmissionResponse>) -> Unit
    ) {
        viewModelScope.launch {
            val res = taskRepository.submitDesign(customerId, panelCount, inverterModel, systemCapacityKw, tiltAngle)
            onResult(res)
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
