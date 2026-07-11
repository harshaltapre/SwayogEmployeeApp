package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Task
import com.swayog.employee.data.model.User
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubAdminEmployeesViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val taskRepository: TaskRepository
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _employees = MutableStateFlow<List<User>>(emptyList())
    val employees: StateFlow<List<User>> = _employees.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedEmployee = MutableStateFlow<User?>(null)
    val selectedEmployee: StateFlow<User?> = _selectedEmployee.asStateFlow()

    private val _selectedEmployeeTasks = MutableStateFlow<List<Task>>(emptyList())
    val selectedEmployeeTasks: StateFlow<List<Task>> = _selectedEmployeeTasks.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private var tasksJob: Job? = null

    init {
        loadEmployees()
    }

    fun loadEmployees() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            customerRepository.getSubAdminEmployees()
                .onSuccess { list ->
                    _employees.value = list
                    _isLoading.value = false
                }
                .onFailure { error ->
                    _errorMessage.value = error.message ?: "Failed to fetch staff directory"
                    _isLoading.value = false
                }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun selectEmployee(employee: User?) {
        _selectedEmployee.value = employee
        tasksJob?.cancel()
        if (employee != null) {
            _selectedEmployeeTasks.value = emptyList()
            tasksJob = viewModelScope.launch {
                // Fetch tasks from API first
                taskRepository.refreshTasks(employee.id)
                // Collect local DB flow for tasks of this employee
                taskRepository.getTasksByEmployeeId(employee.id).collect { list ->
                    _selectedEmployeeTasks.value = list
                }
            }
        } else {
            _selectedEmployeeTasks.value = emptyList()
        }
    }
}
