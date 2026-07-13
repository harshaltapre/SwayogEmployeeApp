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
)

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
                "Failed to load employees and tasks."
            } else if (employeeResult.isFailure) {
                "Failed to load employees."
            } else if (taskResult.isFailure) {
                "Failed to load tasks."
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
}
