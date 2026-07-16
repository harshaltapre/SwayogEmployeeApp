package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.SavedStateHandle
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
class SubAdminCustomerDetailsViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val customerId: Int? = when (val id = savedStateHandle.get<Any>("customerId")) {
        is Int -> id
        is String -> id.toIntOrNull()
        else -> null
    }

    private val _summaryState = MutableStateFlow<CustomerDetailsState<CustomerSummary>>(CustomerDetailsState.Loading)
    val summaryState: StateFlow<CustomerDetailsState<CustomerSummary>> = _summaryState.asStateFlow()

    private val _generationState = MutableStateFlow<CustomerDetailsState<InverterGeneration>>(CustomerDetailsState.Loading)
    val generationState: StateFlow<CustomerDetailsState<InverterGeneration>> = _generationState.asStateFlow()

    private val _historyState = MutableStateFlow<CustomerDetailsState<List<GenerationHistory>>>(CustomerDetailsState.Loading)
    val historyState: StateFlow<CustomerDetailsState<List<GenerationHistory>>> = _historyState.asStateFlow()

    private val _amcVisitsState = MutableStateFlow<CustomerDetailsState<List<AmcVisit>>>(CustomerDetailsState.Loading)
    val amcVisitsState: StateFlow<CustomerDetailsState<List<AmcVisit>>> = _amcVisitsState.asStateFlow()

    private val _credentialsUpdateState = MutableStateFlow<CredentialsUpdateState>(CredentialsUpdateState.Idle)
    val credentialsUpdateState: StateFlow<CredentialsUpdateState> = _credentialsUpdateState.asStateFlow()

    private val _scheduleActionState = MutableStateFlow<ScheduleActionState>(ScheduleActionState.Idle)
    val scheduleActionState: StateFlow<ScheduleActionState> = _scheduleActionState.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    init {
        android.util.Log.d("SubAdminDetails", "ViewModel init. customerId: $customerId")
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            if (customerId == null) {
                android.util.Log.e("SubAdminDetails", "Invalid Customer ID: null")
                _summaryState.value = CustomerDetailsState.Error("Invalid Customer ID")
                return@launch
            }
            android.util.Log.d("SubAdminDetails", "Fetching summary for customerId: $customerId")
            _summaryState.value = CustomerDetailsState.Loading
            customerRepository.getCustomerSummary(customerId)
                .onSuccess {
                    android.util.Log.d("SubAdminDetails", "Summary fetch success: $it")
                    _summaryState.value = CustomerDetailsState.Success(it)
                }
                .onFailure {
                    android.util.Log.e("SubAdminDetails", "Summary fetch failed: ${it.message}", it)
                    _summaryState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch summary")
                }
        }

        viewModelScope.launch {
            if (customerId == null) return@launch
            _generationState.value = CustomerDetailsState.Loading
            customerRepository.getCustomerInverterGeneration(customerId)
                .onSuccess {
                    _generationState.value = CustomerDetailsState.Success(it)
                }
                .onFailure {
                    _generationState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch generation data")
                }
        }

        viewModelScope.launch {
            employeeRepository.getInternalUsers("EMPLOYEE")
                .onSuccess { list ->
                    _employees.value = list.filter { emp ->
                        val role = emp.role.lowercase()
                        val jobRole = emp.employeeProfile?.jobRole?.lowercase() ?: ""
                        role.contains("technician") || role.contains("engineer") ||
                                jobRole.contains("technician") || jobRole.contains("engineer") ||
                                jobRole.contains("field") || jobRole.contains("intern") || role.contains("employee")
                    }
                }
                .onFailure { error ->
                    android.util.Log.e("SubAdminDetails", "Failed to fetch employees: ${error.message}")
                }

            if (customerId != null) {
                _amcVisitsState.value = CustomerDetailsState.Loading
                customerRepository.getSubAdminAmcVisits(customerId)
                    .onSuccess {
                        _amcVisitsState.value = CustomerDetailsState.Success(it)
                    }
                    .onFailure {
                        _amcVisitsState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch AMC visits")
                    }
            }
        }

        loadHistory("monthly")
    }

    fun loadHistory(period: String) {
        viewModelScope.launch {
            if (customerId == null) {
                _historyState.value = CustomerDetailsState.Error("Invalid Customer ID")
                return@launch
            }
            _historyState.value = CustomerDetailsState.Loading
            customerRepository.getCustomerInverterGenerationHistory(customerId, period)
                .onSuccess {
                    _historyState.value = CustomerDetailsState.Success(it)
                }
                .onFailure {
                    android.util.Log.e("TelemetryFetch", "ViewModel caught fetch error", it)
                    _historyState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch generation history")
                }
        }
    }

    fun updateCredentials(
        inverterBrand: String?,
        inverterLoginId: String?,
        inverterPassword: String?,
        inverterApiKey: String?,
        inverterDeviceSn: String?,
        city: String?,
        address: String?,
        projectStage: Int?
    ) {
        viewModelScope.launch {
            if (customerId == null) {
                _credentialsUpdateState.value = CredentialsUpdateState.Error("Invalid Customer ID")
                return@launch
            }
            _credentialsUpdateState.value = CredentialsUpdateState.Loading
            val request = UpdateCredentialsRequest(
                inverterBrand = inverterBrand,
                inverterLoginId = inverterLoginId,
                inverterPassword = inverterPassword,
                inverterApiKey = inverterApiKey,
                inverterDeviceSn = inverterDeviceSn,
                city = city,
                address = address,
                projectStage = projectStage
            )
            customerRepository.updateCustomerCredentials(customerId, request)
                .onSuccess {
                    _credentialsUpdateState.value = CredentialsUpdateState.Success(it)
                    loadData()
                }
                .onFailure {
                    _credentialsUpdateState.value = CredentialsUpdateState.Error(it.message ?: "Failed to update credentials")
                }
        }
    }

    fun resetUpdateState() {
        _credentialsUpdateState.value = CredentialsUpdateState.Idle
    }

    fun scheduleAmcVisit(
        scheduledDate: String,
        timeSlot: String?,
        assignedEmployeeId: String?,
        notes: String?
    ) {
        viewModelScope.launch {
            _scheduleActionState.value = ScheduleActionState.Loading
            val request = CreateAmcVisitRequest(
                customerId = customerId ?: 0,
                scheduledDate = scheduledDate,
                timeSlot = timeSlot,
                assignedEmployeeId = assignedEmployeeId,
                notes = notes
            )
            customerRepository.createAmcVisit(request)
                .onSuccess {
                    _scheduleActionState.value = ScheduleActionState.Success("AMC visit scheduled successfully!")
                    loadData()
                }
                .onFailure {
                    _scheduleActionState.value = ScheduleActionState.Error(it.message ?: "Failed to schedule AMC visit")
                }
        }
    }

    fun resetScheduleActionState() {
        _scheduleActionState.value = ScheduleActionState.Idle
    }
}

sealed class CustomerDetailsState<out T> {
    object Loading : CustomerDetailsState<Nothing>()
    data class Success<out T>(val data: T) : CustomerDetailsState<T>()
    data class Error(val message: String) : CustomerDetailsState<Nothing>()
}

sealed class CredentialsUpdateState {
    object Idle : CredentialsUpdateState()
    object Loading : CredentialsUpdateState()
    data class Success(val customer: Customer) : CredentialsUpdateState()
    data class Error(val message: String) : CredentialsUpdateState()
}

sealed class ScheduleActionState {
    object Idle : ScheduleActionState()
    object Loading : ScheduleActionState()
    data class Success(val message: String) : ScheduleActionState()
    data class Error(val message: String) : ScheduleActionState()
}

