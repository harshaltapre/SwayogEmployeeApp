package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AmcVisit
import com.swayog.employee.data.model.CreateAmcVisitRequest
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.ServiceRequest
import com.swayog.employee.data.model.UpdateAmcVisitRequest
import com.swayog.employee.data.model.User
import com.swayog.employee.data.model.Customer
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
            customerRepository.getAllCustomers().collect {
                _customers.value = it
            }
        }
    }

    fun loadEvents() {
        viewModelScope.launch {
            _state.value = SubAdminCalendarState.Loading
            
            var complaintsResult: Result<List<ServiceRequest>> = Result.failure(Exception())
            var visitsResult: Result<List<AmcVisit>> = Result.failure(Exception())
            var tasksResult: Result<List<com.swayog.employee.data.model.Task>> = Result.failure(Exception())
 
            val jobs = listOf(
                viewModelScope.launch {
                    complaintsResult = customerRepository.getComplaints()
                },
                viewModelScope.launch {
                    visitsResult = customerRepository.getAmcVisits()
                },
                viewModelScope.launch {
                    tasksResult = taskRepository.getAllTasks()
                },
                viewModelScope.launch {
                    employeeRepository.getInternalUsers(null).onSuccess { _employees.value = it }
                },
                viewModelScope.launch {
                    customerRepository.refreshCustomers(null, null)
                }
            )
            
            // Wait for all to finish
            jobs.forEach { it.join() }

            if (complaintsResult.isSuccess || visitsResult.isSuccess || tasksResult.isSuccess) {
                val list = mutableListOf<CalendarEvent>()
                
                complaintsResult.onSuccess { requests ->
                    requests.filter { it.scheduledDate != null }.forEach {
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
                                assignedEmployeeId = null,
                            status = "PENDING"
                            )
                        )
                    }
                }

                visitsResult.onSuccess { visits ->
                    visits.filter { !it.scheduledDate.isNullOrBlank() }.forEach {
                        list.add(
                            CalendarEvent(
                                id = "amc_${it.id}",
                                type = "AMC Cleaning Visit",
                                title = "Cleaning: ${it.customer?.fullName ?: "Customer #" + it.customerId}",
                                description = it.notes ?: "Routine AMC cleaning visit",
                                date = it.scheduledDate,
                                time = it.timeSlot,
                                address = it.customer?.let { c -> "${c.fullName} (${c.city ?: "No City"})" } ?: "Customer ID: ${it.customerId}",
                                rawId = it.id,
                                assignedEmployeeId = it.assignedEmployeeId,
                                status = it.status ?: "PENDING",
                                beforeImageUrl = it.beforeImageUrl,
                                afterImageUrl = it.afterImageUrl,
                                visitNotes = it.visitNotes
                            )
                        )
                    }
                }

                tasksResult.onSuccess { tasks ->
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
                }

                // Add Indian Festivals for 2026 to sync with web
                val festivals = listOf(
                    Pair("New Year's Day", "2026-01-01"),
                    Pair("Makar Sankranti", "2026-01-14"),
                    Pair("Republic Day", "2026-01-26"),
                    Pair("Maha Shivaratri", "2026-02-15"),
                    Pair("Holi", "2026-03-04"),
                    Pair("Gudi Padwa", "2026-03-19"),
                    Pair("Ram Navami", "2026-03-27"),
                    Pair("Eid-ul-Fitr", "2026-03-20"),
                    Pair("Dr. Ambedkar Jayanti", "2026-04-14"),
                    Pair("Buddha Purnima", "2026-05-01"),
                    Pair("Independence Day", "2026-08-15"),
                    Pair("Raksha Bandhan", "2026-08-28"),
                    Pair("Janmashtami", "2026-09-04"),
                    Pair("Ganesh Chaturthi", "2026-09-14"),
                    Pair("Gandhi Jayanti", "2026-10-02"),
                    Pair("Dussehra", "2026-10-20"),
                    Pair("Diwali", "2026-11-08"),
                    Pair("Guru Nanak Jayanti", "2026-11-24"),
                    Pair("Christmas Day", "2026-12-25")
                )
                
                festivals.forEach { (name, date) ->
                    list.add(
                        CalendarEvent(
                            id = "festival_${name.replace(" ", "_")}",
                            type = "Holiday/Festival",
                            title = name,
                            description = "Indian Festival / Public Holiday",
                            date = date,
                            time = null,
                            address = "India",
                            rawId = name,
                            assignedEmployeeId = null,
                            status = "PENDING"
                        )
                    )
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
    val visitNotes: String? = null
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
