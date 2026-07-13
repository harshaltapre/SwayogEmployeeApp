package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.*
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubAdminComplaintsViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository
) : ViewModel() {

    private val _state = MutableStateFlow<SubAdminComplaintsState>(SubAdminComplaintsState.Initial)
    val state: StateFlow<SubAdminComplaintsState> = _state.asStateFlow()

    private val _complaints = MutableStateFlow<List<ServiceRequest>>(emptyList())
    val complaints: StateFlow<List<ServiceRequest>> = _complaints.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    private val _actionState = MutableStateFlow<ComplaintActionState>(ComplaintActionState.Idle)
    val actionState: StateFlow<ComplaintActionState> = _actionState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _state.value = SubAdminComplaintsState.Loading
            customerRepository.getComplaints()
                .onSuccess {
                    _complaints.value = it
                    _state.value = SubAdminComplaintsState.Success
                }
                .onFailure {
                    _state.value = SubAdminComplaintsState.Error(it.message ?: "Failed to fetch complaints")
                }
        }

        viewModelScope.launch {
            employeeRepository.getInternalUsers("EMPLOYEE")
                .onSuccess {
                    _employees.value = it
                }
        }
    }

    fun scheduleComplaint(
        requestId: Int,
        date: String,
        time: String?,
        technicianId: String
    ) {
        viewModelScope.launch {
            _actionState.value = ComplaintActionState.Loading
            val request = UpdateServiceRequestRequest(
                status = "scheduled",
                scheduledDate = date,
                scheduledTime = time,
                assignedEmployeeId = technicianId
            )
            customerRepository.updateServiceRequest(requestId, request)
                .onSuccess {
                    _actionState.value = ComplaintActionState.Success("Ticket scheduled successfully")
                    loadData()
                }
                .onFailure {
                    _actionState.value = ComplaintActionState.Error(it.message ?: "Failed to schedule ticket")
                }
        }
    }

    fun resolveComplaint(requestId: Int) {
        viewModelScope.launch {
            _actionState.value = ComplaintActionState.Loading
            val request = UpdateServiceRequestRequest(
                status = "resolved"
            )
            customerRepository.updateServiceRequest(requestId, request)
                .onSuccess {
                    _actionState.value = ComplaintActionState.Success("Ticket marked as resolved")
                    loadData()
                }
                .onFailure {
                    _actionState.value = ComplaintActionState.Error(it.message ?: "Failed to resolve ticket")
                }
        }
    }

    fun resetActionState() {
        _actionState.value = ComplaintActionState.Idle
    }
}

sealed class SubAdminComplaintsState {
    object Initial : SubAdminComplaintsState()
    object Loading : SubAdminComplaintsState()
    object Success : SubAdminComplaintsState()
    data class Error(val message: String) : SubAdminComplaintsState()
}

sealed class ComplaintActionState {
    object Idle : ComplaintActionState()
    object Loading : ComplaintActionState()
    data class Success(val message: String) : ComplaintActionState()
    data class Error(val message: String) : ComplaintActionState()
}
