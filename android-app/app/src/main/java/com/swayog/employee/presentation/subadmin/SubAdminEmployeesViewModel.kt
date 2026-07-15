package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.Task
import com.swayog.employee.data.repository.EmployeeRepository
import com.swayog.employee.data.repository.TaskRepository
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
            taskRepository.getAllTasksFlow().collect { tasks ->
                _uiState.update { it.copy(tasks = tasks) }
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Trigger background refresh
            val employeeResult = employeeRepository.getInternalUsers("EMPLOYEE")
            val taskResult = taskRepository.getAllTasks()
            
            val error = if (employeeResult.isFailure || taskResult.isFailure) {
                val empErr = employeeResult.exceptionOrNull()?.message ?: ""
                val taskErr = taskResult.exceptionOrNull()?.message ?: ""
                
                // If we already have data in DB, maybe just show a subtle warning?
                // For now, keep the error display but it will be overlayed on cached data
                if (empErr.contains("401") || taskErr.contains("401")) {
                    "Session Expired. Please login again. (Showing cached data)"
                } else {
                    "Sync Failed: $empErr $taskErr".trim()
                }
            } else {
                null
            }

            _uiState.update { 
                it.copy(
                    isLoading = false,
                    error = error
                )
            }
        }
    }
}
