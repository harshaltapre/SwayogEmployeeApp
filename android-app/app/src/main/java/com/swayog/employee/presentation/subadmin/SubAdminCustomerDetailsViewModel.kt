package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.*
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import com.swayog.employee.data.local.preferences.DataStoreManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubAdminCustomerDetailsViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository,
    private val dataStoreManager: DataStoreManager,
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

    private val _customerUpdateState = MutableStateFlow<CustomerUpdateState>(CustomerUpdateState.Idle)
    val customerUpdateState: StateFlow<CustomerUpdateState> = _customerUpdateState.asStateFlow()

    private val _invoicesState = MutableStateFlow<CustomerDetailsState<List<Invoice>>>(CustomerDetailsState.Loading)
    val invoicesState: StateFlow<CustomerDetailsState<List<Invoice>>> = _invoicesState.asStateFlow()

    private val _createInvoiceState = MutableStateFlow<CreateInvoiceState>(CreateInvoiceState.Idle)
    val createInvoiceState: StateFlow<CreateInvoiceState> = _createInvoiceState.asStateFlow()

    private val _amcSettingsUpdateState = MutableStateFlow<AmcSettingsUpdateState>(AmcSettingsUpdateState.Idle)
    val amcSettingsUpdateState: StateFlow<AmcSettingsUpdateState> = _amcSettingsUpdateState.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    init {
        android.util.Log.d("SubAdminDetails", "ViewModel init. customerId: $customerId")
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            if (customerId == null) {
                _summaryState.value = CustomerDetailsState.Error("Invalid Customer ID")
                return@launch
            }
            _summaryState.value = CustomerDetailsState.Loading
            customerRepository.getCustomerSummary(customerId)
                .onSuccess {
                    _summaryState.value = CustomerDetailsState.Success(it)
                }
                .onFailure {
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
            if (customerId == null) return@launch
            _amcVisitsState.value = CustomerDetailsState.Loading
            customerRepository.getSubAdminAmcVisits(customerId)
                .onSuccess {
                    _amcVisitsState.value = CustomerDetailsState.Success(it)
                }
                .onFailure {
                    _amcVisitsState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch AMC visits")
                }
        }

        viewModelScope.launch {
            val currentUserId = dataStoreManager.userId.firstOrNull()
            val userRole = dataStoreManager.userRole.firstOrNull()?.uppercase() ?: ""

            employeeRepository.getInternalUsers("EMPLOYEE")
                .onSuccess { list ->
                    val isTopAdmin = userRole == "SUPER_ADMIN" || userRole == "ADMIN" || userRole == "SUB_ADMIN"
                    val reportees = if (!currentUserId.isNullOrEmpty()) {
                        list.filter { it.reportingManagerId == currentUserId }
                    } else emptyList()

                    if (!isTopAdmin && reportees.isNotEmpty()) {
                        _employees.value = reportees
                    } else {
                        _employees.value = list.filter { emp ->
                            val role = emp.role.lowercase()
                            val jobRole = emp.employeeProfile?.jobRole?.lowercase() ?: ""
                            role.contains("technician") || role.contains("engineer") ||
                                    jobRole.contains("technician") || jobRole.contains("engineer") ||
                                    jobRole.contains("field") || jobRole.contains("intern") || role.contains("employee")
                        }
                    }
                }
                .onFailure { error ->
                    android.util.Log.e("SubAdminDetails", "Failed to fetch employees: ${error.message}")
                }
        }

        loadHistory("monthly")
        loadInvoices()
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
                    _historyState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch generation history")
                }
        }
    }

    private fun loadInvoices() {
        viewModelScope.launch {
            if (customerId == null) return@launch
            _invoicesState.value = CustomerDetailsState.Loading
            customerRepository.getInvoices(customerId)
                .onSuccess {
                    _invoicesState.value = CustomerDetailsState.Success(it)
                }
                .onFailure {
                    _invoicesState.value = CustomerDetailsState.Error(it.message ?: "Failed to fetch invoices")
                }
        }
    }

    fun updateCustomer(request: UpdateCustomerRequest) {
        viewModelScope.launch {
            if (customerId == null) {
                _customerUpdateState.value = CustomerUpdateState.Error("Invalid Customer ID")
                return@launch
            }
            _customerUpdateState.value = CustomerUpdateState.Loading
            customerRepository.updateCustomer(customerId, request)
                .onSuccess {
                    _customerUpdateState.value = CustomerUpdateState.Success(it)
                    loadData()
                }
                .onFailure {
                    _customerUpdateState.value = CustomerUpdateState.Error(it.message ?: "Failed to update customer")
                }
        }
    }

    fun resetUpdateState() {
        _customerUpdateState.value = CustomerUpdateState.Idle
    }
    
    fun createInvoice(request: CreateInvoiceRequest) {
        viewModelScope.launch {
            _createInvoiceState.value = CreateInvoiceState.Loading
            customerRepository.createInvoice(request)
                .onSuccess {
                    _createInvoiceState.value = CreateInvoiceState.Success(it)
                    loadInvoices()
                }
                .onFailure {
                    _createInvoiceState.value = CreateInvoiceState.Error(it.message ?: "Failed to create invoice")
                }
        }
    }

    fun resetCreateInvoiceState() {
        _createInvoiceState.value = CreateInvoiceState.Idle
    }

    fun updateAmcSettings(request: UpdateAmcSettingsRequest) {
        viewModelScope.launch {
            if (customerId == null) {
                _amcSettingsUpdateState.value = AmcSettingsUpdateState.Error("Invalid Customer ID")
                return@launch
            }
            _amcSettingsUpdateState.value = AmcSettingsUpdateState.Loading
            customerRepository.updateAmcSettings(customerId, request)
                .onSuccess {
                    _amcSettingsUpdateState.value = AmcSettingsUpdateState.Success(it)
                    loadData()
                }
                .onFailure {
                    _amcSettingsUpdateState.value = AmcSettingsUpdateState.Error(it.message ?: "Failed to update AMC settings")
                }
        }
    }
    
    fun resetAmcSettingsUpdateState() {
        _amcSettingsUpdateState.value = AmcSettingsUpdateState.Idle
    }
}

sealed class CustomerDetailsState<out T> {
    object Loading : CustomerDetailsState<Nothing>()
    data class Success<out T>(val data: T) : CustomerDetailsState<T>()
    data class Error(val message: String) : CustomerDetailsState<Nothing>()
}

sealed class CustomerUpdateState {
    object Idle : CustomerUpdateState()
    object Loading : CustomerUpdateState()
    data class Success(val customer: Customer) : CustomerUpdateState()
    data class Error(val message: String) : CustomerUpdateState()
}

sealed class CreateInvoiceState {
    object Idle : CreateInvoiceState()
    object Loading : CreateInvoiceState()
    data class Success(val invoice: Invoice) : CreateInvoiceState()
    data class Error(val message: String) : CreateInvoiceState()
}

sealed class AmcSettingsUpdateState {
    object Idle : AmcSettingsUpdateState()
    object Loading : AmcSettingsUpdateState()
    data class Success(val customer: Customer) : AmcSettingsUpdateState()
    data class Error(val message: String) : AmcSettingsUpdateState()
}
