package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.Task
import com.swayog.employee.data.repository.EmployeeRepository
import com.swayog.employee.data.repository.TaskRepository
import com.swayog.employee.core.util.ErrorUtils
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
    private val taskRepository: TaskRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubAdminEmployeesUiState())
    val uiState: StateFlow<SubAdminEmployeesUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Load employees
            val employeeResult = employeeRepository.getInternalUsers("EMPLOYEE")
            val employees = employeeResult.getOrNull() ?: emptyList()
            
            // Load tasks
            val taskResult = taskRepository.getAllTasks()
            val tasks = taskResult.getOrNull() ?: emptyList()
            
            val error = if (employeeResult.isFailure && taskResult.isFailure) {
                val empExc = employeeResult.exceptionOrNull()
                val taskExc = taskResult.exceptionOrNull()
                
                if (ErrorUtils.isUnauthorized(empExc) || ErrorUtils.isUnauthorized(taskExc)) {
                    "Session expired. Redirecting to login..."
                } else {
                    val empError = empExc?.let { formatException(it) } ?: "Unknown error"
                    val taskError = taskExc?.let { formatException(it) } ?: "Unknown error"
                    "Failed: Emp[$empError] Task[$taskError]"
                }
            } else if (employeeResult.isFailure) {
                val empExc = employeeResult.exceptionOrNull()
                if (ErrorUtils.isUnauthorized(empExc)) {
                    "Session expired. Redirecting to login..."
                } else {
                    "Failed to load employees: ${empExc?.let { formatException(it) } ?: "Unknown error"}"
                }
            } else if (taskResult.isFailure) {
                val taskExc = taskResult.exceptionOrNull()
                if (ErrorUtils.isUnauthorized(taskExc)) {
                    "Session expired. Redirecting to login..."
                } else {
                    "Failed to load tasks: ${taskExc?.let { formatException(it) } ?: "Unknown error"}"
                }
            } else {
                null
            }

            _uiState.update { 
                it.copy(
                    isLoading = false,
                    employees = employees,
                    tasks = tasks,
                    error = error
                )
            }
        }
    }

    private fun formatException(e: Throwable): String {
        return ErrorUtils.formatException(e)
    }
}
