package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AmcVisit
import com.swayog.employee.data.model.CreateAmcVisitRequest
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.ServiceRequest
import com.swayog.employee.data.model.UpdateAmcVisitRequest
import com.swayog.employee.data.model.User
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubAdminCalendarViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository
) : ViewModel() {

    private val _state = MutableStateFlow<SubAdminCalendarState>(SubAdminCalendarState.Initial)
    val state: StateFlow<SubAdminCalendarState> = _state.asStateFlow()

    private val _events = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val events: StateFlow<List<CalendarEvent>> = _events.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    private val _actionState = MutableStateFlow<CalendarActionState>(CalendarActionState.Idle)
    val actionState: StateFlow<CalendarActionState> = _actionState.asStateFlow()

    init {
        loadEvents()
    }

    fun loadEvents() {
        viewModelScope.launch {
            _state.value = SubAdminCalendarState.Loading
            
            var complaintsResult: Result<List<ServiceRequest>> = Result.failure(Exception())
            var visitsResult: Result<List<AmcVisit>> = Result.failure(Exception())

            val jobs = listOf(
                viewModelScope.launch {
                    complaintsResult = customerRepository.getComplaints()
                },
                viewModelScope.launch {
                    visitsResult = customerRepository.getAmcVisits()
                },
                viewModelScope.launch {
                    employeeRepository.getInternalUsers("EMPLOYEE").onSuccess { _employees.value = it }
                }
            )
            
            // Wait for both to finish
            jobs.forEach { it.join() }

            if (complaintsResult.isSuccess || visitsResult.isSuccess) {
                val list = mutableListOf<CalendarEvent>()
                
                complaintsResult.onSuccess { requests ->
                    requests.filter { it.status.lowercase() == "scheduled" && it.scheduledDate != null }.forEach {
                        list.add(
                            CalendarEvent(
                                id = "complaint_${it.id}",
                                type = "Complaint Ticket",
                                title = it.title,
                                description = it.description,
                                date = it.scheduledDate!!,
                                time = it.scheduledTime,
                                address = it.address ?: "No Address Listed",
                                rawId = it.id.toString(),
                                assignedEmployeeId = null
                            )
                        )
                    }
                }

                visitsResult.onSuccess { visits ->
                    visits.filter { it.status.lowercase() == "scheduled" }.forEach {
                        list.add(
                            CalendarEvent(
                                id = "amc_${it.id}",
                                type = "AMC Cleaning Visit",
                                title = "Cleaning Visit #${it.cleaningNumber ?: 1}",
                                description = it.notes ?: "Routine AMC cleaning visit",
                                date = it.scheduledDate,
                                time = it.timeSlot,
                                address = "Customer ID: ${it.customerId}",
                                rawId = it.id,
                                assignedEmployeeId = it.assignedEmployeeId
                            )
                        )
                    }
                }

                // Sort by date ascending
                _events.value = list.sortedBy { it.date }
                _state.value = SubAdminCalendarState.Success
            } else {
                _state.value = SubAdminCalendarState.Error("Failed to fetch calendar events.")
            }
        }
    }

    fun createAmcVisit(request: CreateAmcVisitRequest) {
        viewModelScope.launch {
            _actionState.value = CalendarActionState.Loading
            val result = customerRepository.createAmcVisit(request)
            result.onSuccess {
                _actionState.value = CalendarActionState.Success("AMC visit created successfully")
                loadEvents() // Refresh the calendar
            }.onFailure { error ->
                _actionState.value = CalendarActionState.Error(error.message ?: "Failed to create AMC visit")
            }
        }
    }

    fun updateAmcVisit(visitId: String, request: UpdateAmcVisitRequest) {
        viewModelScope.launch {
            _actionState.value = CalendarActionState.Loading
            val result = customerRepository.updateAmcVisit(visitId, request)
            result.onSuccess {
                _actionState.value = CalendarActionState.Success("AMC visit updated successfully")
                loadEvents() // Refresh the calendar
            }.onFailure { error ->
                _actionState.value = CalendarActionState.Error(error.message ?: "Failed to update AMC visit")
            }
        }
    }

    fun resetActionState() {
        _actionState.value = CalendarActionState.Idle
    }
}

data class CalendarEvent(
    val id: String,
    val type: String,
    val title: String,
    val description: String,
    val date: String,
    val time: String?,
    val address: String,
    val rawId: String,
    val assignedEmployeeId: String?
)

sealed class SubAdminCalendarState {
    object Initial : SubAdminCalendarState()
    object Loading : SubAdminCalendarState()
    object Success : SubAdminCalendarState()
    data class Error(val message: String) : SubAdminCalendarState()
}

sealed class CalendarActionState {
    object Idle : CalendarActionState()
    object Loading : CalendarActionState()
    data class Success(val message: String) : CalendarActionState()
    data class Error(val message: String) : CalendarActionState()
}
