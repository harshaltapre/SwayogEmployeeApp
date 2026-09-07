package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AmcVisit
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.ServiceRequest
import com.swayog.employee.data.model.UpdateAmcVisitRequest
import com.swayog.employee.data.model.CreateAmcVisitRequest
import com.swayog.employee.data.model.User
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.coroutines.supervisorScope
import javax.inject.Inject

@HiltViewModel
class SubAdminCalendarViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository,
    private val taskRepository: com.swayog.employee.data.repository.TaskRepository
) : ViewModel() {

    private val _state = MutableStateFlow<SubAdminCalendarState>(SubAdminCalendarState.Initial)
    val state: StateFlow<SubAdminCalendarState> = _state.asStateFlow()

    private val _events = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val events: StateFlow<List<CalendarEvent>> = _events.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _actionState = MutableStateFlow<CalendarActionState>(CalendarActionState.Idle)
    val actionState: StateFlow<CalendarActionState> = _actionState.asStateFlow()

    init {
        loadEvents()
        viewModelScope.launch {
            try {
                customerRepository.getAllCustomers().collect {
                    _customers.value = it
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadEvents() {
        viewModelScope.launch {
            _state.value = SubAdminCalendarState.Loading

            try {
                supervisorScope {
                    val complaintsDeferred = async {
                        try {
                            customerRepository.getComplaints().getOrNull() ?: emptyList()
                        } catch (e: Exception) {
                            emptyList()
                        }
                    }

                    val visitsDeferred = async {
                        try {
                            customerRepository.getAmcVisits().getOrNull() ?: emptyList()
                        } catch (e: Exception) {
                            emptyList()
                        }
                    }

                    val tasksDeferred = async {
                        try {
                            taskRepository.getAllTasks().getOrNull() ?: emptyList()
                        } catch (e: Exception) {
                            emptyList()
                        }
                    }

                    val employeesDeferred = async {
                        try {
                            employeeRepository.getInternalUsers(null).getOrNull() ?: emptyList()
                        } catch (e: Exception) {
                            emptyList()
                        }
                    }

                    val complaints = complaintsDeferred.await()
                    val visits = visitsDeferred.await()
                    val tasks = tasksDeferred.await()
                    val employeesList = employeesDeferred.await()

                    if (employeesList.isNotEmpty()) {
                        _employees.value = employeesList
                    }

                    val list = mutableListOf<CalendarEvent>()

                    // 1. Complaint Tickets
                    complaints.filter { it.scheduledDate != null }.forEach { complaint ->
                        val scheduled = complaint.scheduledDate!!
                        val date = if (scheduled.contains("T")) scheduled.substringBefore("T") else scheduled
                        list.add(
                            CalendarEvent(
                                id = "complaint_${complaint.id}",
                                type = "Complaint Ticket",
                                title = complaint.title,
                                description = complaint.description,
                                date = date,
                                time = complaint.scheduledTime,
                                address = complaint.address ?: "No Address Listed",
                                rawId = complaint.id.toString(),
                                assignedEmployeeId = null,
                                status = complaint.status
                            )
                        )
                    }

                    // 2. AMC Visits
                    visits.filter { !it.scheduledDate.isNullOrBlank() }.forEach { visit ->
                        val scheduled = visit.scheduledDate
                        val date = if (scheduled.contains("T")) scheduled.substringBefore("T") else scheduled
                        list.add(
                            CalendarEvent(
                                id = "amc_${visit.id}",
                                type = "AMC Cleaning Visit",
                                title = "Cleaning: ${visit.customer?.fullName ?: ("Customer #" + visit.customerId)}",
                                description = visit.notes ?: "Routine AMC cleaning visit",
                                date = date,
                                time = visit.timeSlot,
                                address = visit.customer?.let { c -> "${c.fullName} (${c.city ?: "No City"})" } ?: "Customer ID: ${visit.customerId}",
                                rawId = visit.id,
                                assignedEmployeeId = visit.assignedEmployeeId,
                                status = visit.status,
                                beforeImageUrl = visit.beforeImageUrl,
                                afterImageUrl = visit.afterImageUrl,
                                visitNotes = visit.visitNotes,
                                completedByEmployeeId = visit.completedByEmployeeId,
                                completedAt = visit.completedAt
                            )
                        )
                    }

                    // 3. Tasks
                    tasks.filter { !it.scheduledTime.isNullOrBlank() }.forEach {
                        val scheduledTime = it.scheduledTime!!
                        list.add(
                            CalendarEvent(
                                id = "task_${it.id}",
                                type = "Task Assignment",
                                title = it.jobType ?: "Task Assignment",
                                description = it.description ?: "Task assignment details",
                                date = scheduledTime.substringBefore("T"),
                                time = if (scheduledTime.contains("T")) scheduledTime.substringAfter("T").substringBefore(".") else null,
                                address = it.address ?: "No Location Specified",
                                rawId = it.id,
                                assignedEmployeeId = it.employeeUserId,
                                status = it.status ?: "PENDING"
                            )
                        )
                    }

                    // Sort by date ascending
                    _events.value = list.sortedBy { it.date }
                    _state.value = SubAdminCalendarState.Success
                }
            } catch (e: Exception) {
                _state.value = SubAdminCalendarState.Error(e.message ?: "Failed to load calendar events")
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

    fun markAmcVisitDone(visitId: String, visitNotes: String?, beforeImageUrl: String?, afterImageUrl: String?, onComplete: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            try {
                val result = customerRepository.markAmcVisitDone(visitId, visitNotes, beforeImageUrl, afterImageUrl)
                onComplete(result.map { })
                if (result.isSuccess) {
                    loadEvents()
                }
            } catch (e: Exception) {
                onComplete(Result.failure(e))
            }
        }
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
    val assignedEmployeeId: String?,
    val status: String?,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val sitePhotos: List<String>? = null,
    val images: List<String>? = null,
    val visitNotes: String? = null,
    val completedByEmployeeId: String? = null,
    val completedAt: String? = null
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
