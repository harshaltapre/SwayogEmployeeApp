package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AttendanceRule
import com.swayog.employee.data.model.CreateEmployeeRequest
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.EmployeeFaceEnrollmentItem
import com.swayog.employee.data.model.Task
import com.swayog.employee.data.model.UpdateEmployeeRequest
import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.data.repository.EmployeeRepository
import com.swayog.employee.data.repository.TaskRepository
import com.swayog.employee.core.util.ErrorUtils
import com.swayog.employee.data.local.preferences.DataStoreManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SubAdminEmployeesUiState(
    val isLoading: Boolean = true,
    val employees: List<Employee> = emptyList(),
    val faceEnrollments: List<EmployeeFaceEnrollmentItem> = emptyList(),
    val attendanceRules: AttendanceRule = AttendanceRule(),
    val tasks: List<Task> = emptyList(),
    val error: String? = null
) {
    val filteredEmployees: List<Employee>
        get() = employees.filter { emp ->
            val role = (emp.role ?: "").lowercase()
            val jobRole = (emp.employeeProfile?.jobRole ?: "").lowercase()
            val allowedRoles = setOf(
                "electrical engineer", "electrical_engineer",
                "site survey engineer", "site_survey_engineer",
                "o&m technician", "om_technician",
                "service engineer", "service_engineer",
                "field technician", "field_technician",
                "technician", "intern", "employee", "service coordinator", "service_coordinator"
            )
            allowedRoles.contains(role) || allowedRoles.contains(jobRole)
        }

    val avgRating: Double
        get() = if (filteredEmployees.isEmpty()) 0.0 else filteredEmployees.map { it.rating ?: 0.0 }.average()
}

@HiltViewModel
class SubAdminEmployeesViewModel @Inject constructor(
    private val employeeRepository: EmployeeRepository,
    private val taskRepository: TaskRepository,
    private val attendanceRepository: AttendanceRepository,
    val dataStoreManager: DataStoreManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubAdminEmployeesUiState())
    val uiState: StateFlow<SubAdminEmployeesUiState> = _uiState.asStateFlow()

    init {
        observeData()
        loadData()
    }

    private fun observeData() {
        viewModelScope.launch {
            employeeRepository.getInternalUsersFlow("EMPLOYEE").collect { employees ->
                _uiState.update { it.copy(employees = employees) }
            }
        }
        viewModelScope.launch {
            attendanceRepository.attendanceRuleFlow.collect { rules ->
                _uiState.update { it.copy(attendanceRules = rules) }
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Trigger background refreshes
            val employeeResult = employeeRepository.getInternalUsers(null)
            val taskResult = taskRepository.getAllTasks()
            val faceResult = attendanceRepository.getAllFaceEnrollments()
            val ruleResult = attendanceRepository.getAttendanceRules()
            
            val error = if (employeeResult.isFailure || taskResult.isFailure) {
                val empExc = employeeResult.exceptionOrNull()
                val taskExc = taskResult.exceptionOrNull()
                
                if (ErrorUtils.isUnauthorized(empExc) || ErrorUtils.isUnauthorized(taskExc)) {
                    viewModelScope.launch { dataStoreManager.clearAll() }
                    "Session expired. Redirecting to login..."
                } else {
                    val empErr = empExc?.let { ErrorUtils.formatException(it) } ?: ""
                    val taskErr = taskExc?.let { ErrorUtils.formatException(it) } ?: ""
                    "Sync failed: $empErr $taskErr".trim()
                }
            } else {
                null
            }

            // Populate tasks directly from API response
            taskResult.onSuccess { tasks ->
                _uiState.update { it.copy(tasks = tasks) }
            }

            faceResult.onSuccess { enrollments ->
                _uiState.update { it.copy(faceEnrollments = enrollments) }
            }

            ruleResult.onSuccess { rules ->
                _uiState.update { it.copy(attendanceRules = rules) }
            }

            _uiState.update { 
                it.copy(
                    isLoading = false,
                    error = error
                )
            }
        }
    }

    fun saveAttendanceRules(rules: AttendanceRule, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val result = attendanceRepository.updateAttendanceRules(rules)
            if (result.isSuccess) {
                _uiState.update { it.copy(attendanceRules = result.getOrNull() ?: rules) }
                onResult(true)
            } else {
                onResult(false)
            }
        }
    }


    fun assignTask(taskId: String, employeeUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            val result = taskRepository.assignTask(taskId, employeeUserId)
            result.onSuccess {
                loadData()
                onSuccess()
            }.onFailure {
                onError(it.message ?: "Failed to assign task")
            }
        }
    }

    fun createEmployee(
        request: CreateEmployeeRequest,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            employeeRepository.createEmployee(request)
                .onSuccess {
                    onSuccess()
                    loadData()
                }
                .onFailure { error ->
                    onError(error.message ?: "Failed to create employee")
                }
        }
    }

    fun updateEmployee(
        employeeId: String,
        request: UpdateEmployeeRequest,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            employeeRepository.updateEmployee(employeeId, request)
                .onSuccess {
                    onSuccess()
                    loadData()
                }
                .onFailure { error ->
                    onError(error.message ?: "Failed to update employee")
                }
        }
    }

    fun deleteEmployee(
        employeeId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            employeeRepository.deleteEmployee(employeeId)
                .onSuccess {
                    onSuccess()
                    loadData()
                }
                .onFailure { error ->
                    onError(error.message ?: "Failed to delete employee")
                }
        }
    }

    fun importEmployeesFromExcel(
        data: List<Map<String, String>>,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            employeeRepository.importEmployeesFromExcel(data)
                .onSuccess {
                    onSuccess()
                    loadData()
                }
                .onFailure { error ->
                    onError(error.message ?: "Failed to import employees")
                }
        }
    }
}
