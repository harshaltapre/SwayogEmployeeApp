package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.ServiceRequest
import com.swayog.employee.data.model.UpdateServiceRequestRequest
import com.swayog.employee.data.model.User
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubAdminMapViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _complaints = MutableStateFlow<List<ServiceRequest>>(emptyList())
    val complaints: StateFlow<List<ServiceRequest>> = _complaints.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // Local DB customers stream
    val customers: StateFlow<List<Customer>> = customerRepository.getAllCustomers()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            // Refresh customer cache in background
            launch {
                customerRepository.refreshCustomers(limit = 200, city = null)
            }

            // Fetch complaints & employees in parallel
            val jobs = listOf(
                launch {
                    customerRepository.getComplaints()
                        .onSuccess { _complaints.value = it }
                        .onFailure { error ->
                            if (com.swayog.employee.core.util.ErrorUtils.isUnauthorized(error)) {
                                _errorMessage.value = "Session expired. Redirecting..."
                            } else {
                                _errorMessage.value = com.swayog.employee.core.util.ErrorUtils.formatException(error)
                            }
                        }
                },
                launch {
                    employeeRepository.getInternalUsers("EMPLOYEE")
                        .onSuccess { _employees.value = it }
                }
            )
            jobs.forEach { it.join() }
            _isLoading.value = false
        }
    }

    fun scheduleVisit(requestId: Int, date: String, time: String?, technicianId: String, onResult: (Result<ServiceRequest>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val request = UpdateServiceRequestRequest(
                status = "scheduled",
                scheduledDate = date,
                scheduledTime = time,
                assignedEmployeeId = technicianId
            )
            val result = customerRepository.updateServiceRequest(requestId, request)
            result.onSuccess {
                loadData()
            }
            onResult(result)
            _isLoading.value = false
        }
    }

    fun resolveComplaint(requestId: Int, onResult: (Result<ServiceRequest>) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val request = UpdateServiceRequestRequest(status = "completed")
            val result = customerRepository.updateServiceRequest(requestId, request)
            result.onSuccess {
                loadData()
            }
            onResult(result)
            _isLoading.value = false
        }
    }
}
