package com.swayog.employee.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.*
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ServiceCoordinatorViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository,
    private val dataStoreManager: DataStoreManager
) : ViewModel() {

    private val _selectedCustomerId = MutableStateFlow<Int?>(null)
    val selectedCustomerId: StateFlow<Int?> = _selectedCustomerId.asStateFlow()

    private val _selectedCity = MutableStateFlow("")
    val selectedCity: StateFlow<String> = _selectedCity.asStateFlow()

    private val _selectedPeriod = MutableStateFlow("realtime")
    val selectedPeriod: StateFlow<String> = _selectedPeriod.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    // Loaded states
    private val _selectedCustomerSummary = MutableStateFlow<CustomerSummary?>(null)
    val selectedCustomerSummary: StateFlow<CustomerSummary?> = _selectedCustomerSummary.asStateFlow()

    private val _inverterSummary = MutableStateFlow<InverterGeneration?>(null)
    val inverterSummary: StateFlow<InverterGeneration?> = _inverterSummary.asStateFlow()

    private val _inverterHistory = MutableStateFlow<List<GenerationHistory>>(emptyList())
    val inverterHistory: StateFlow<List<GenerationHistory>> = _inverterHistory.asStateFlow()

    private val _amcVisits = MutableStateFlow<List<AmcVisit>>(emptyList())
    val amcVisits: StateFlow<List<AmcVisit>> = _amcVisits.asStateFlow()

    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    // Loading & Error States
    private val _isLoadingTelemetry = MutableStateFlow(false)
    val isLoadingTelemetry: StateFlow<Boolean> = _isLoadingTelemetry.asStateFlow()

    private val _isLoadingHistory = MutableStateFlow(false)
    val isLoadingHistory: StateFlow<Boolean> = _isLoadingHistory.asStateFlow()

    private val _isLoadingAmc = MutableStateFlow(false)
    val isLoadingAmc: StateFlow<Boolean> = _isLoadingAmc.asStateFlow()

    private val _inverterSummaryError = MutableStateFlow<String?>(null)
    val inverterSummaryError: StateFlow<String?> = _inverterSummaryError.asStateFlow()

    private val _inverterHistoryError = MutableStateFlow<String?>(null)
    val inverterHistoryError: StateFlow<String?> = _inverterHistoryError.asStateFlow()

    private val _isUpdatingCredentials = MutableStateFlow(false)
    val isUpdatingCredentials: StateFlow<Boolean> = _isUpdatingCredentials.asStateFlow()

    private val _updateError = MutableStateFlow<String?>(null)
    val updateError: StateFlow<String?> = _updateError.asStateFlow()

    // Local DB customers source
    val customers: StateFlow<List<Customer>> = customerRepository.getAllCustomers()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val cities: StateFlow<List<String>> = customers.map { list ->
        list.mapNotNull { it.city?.trim()?.ifEmpty { null } }.distinct().sorted()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private var telemetryPollingJob: Job? = null
    private var customerDetailsJob: Job? = null
    private var historyJob: Job? = null

    init {
        refreshCustomerList()
        loadEmployeesList()

        // Automatically load data when customer changes
        viewModelScope.launch {
            _selectedCustomerId.collect { customerId ->
                customerDetailsJob?.cancel()
                if (customerId != null) {
                    customerDetailsJob = launch {
                        loadCustomerDetails(customerId)
                        startTelemetryPolling(customerId)
                    }
                } else {
                    stopTelemetryPolling()
                    _selectedCustomerSummary.value = null
                    _inverterSummary.value = null
                    _inverterHistory.value = emptyList()
                    _amcVisits.value = emptyList()
                }
            }
        }

        // Automatically load history when period changes
        viewModelScope.launch {
            combine(_selectedCustomerId, _selectedPeriod) { id, period -> id to period }
                .collect { (id, period) ->
                    historyJob?.cancel()
                    if (id != null) {
                        historyJob = launch {
                            loadHistory(id, period)
                        }
                    }
                }
        }
    }

    fun selectCustomer(id: Int?) {
        _selectedCustomerId.value = id
    }

    fun setCityFilter(city: String) {
        _selectedCity.value = city
    }

    fun setPeriod(period: String) {
        _selectedPeriod.value = period
    }

    fun refreshAll() {
        viewModelScope.launch {
            _isRefreshing.value = true
            val customerId = _selectedCustomerId.value
            
            val jobs = mutableListOf(
                launch { refreshCustomerList() },
                launch { loadEmployeesList() }
            )

            if (customerId != null) {
                jobs.add(launch { loadCustomerDetails(customerId) })
                jobs.add(launch { loadHistory(customerId, _selectedPeriod.value) })
                jobs.add(launch { loadAmcVisits(customerId) })
            }

            jobs.forEach { it.join() }
            _isRefreshing.value = false
        }
    }

    private fun refreshCustomerList() {
        viewModelScope.launch {
            customerRepository.refreshCustomers(limit = 200, city = null)
        }
    }

    private fun loadEmployeesList() {
        viewModelScope.launch {
            employeeRepository.getInternalUsers(null)
                .onSuccess { _employees.value = it }
        }
    }

    private suspend fun loadCustomerDetails(customerId: Int) {
        // Load customer summary (includes serviceRequestStats)
        customerRepository.getCustomerSummary(customerId)
            .onSuccess {
                _selectedCustomerSummary.value = it
            }
            .onFailure {
                _selectedCustomerSummary.value = null
            }

        // Load telemetry inverter summary
        loadTelemetry(customerId)
        
        // Load AMC visits
        loadAmcVisits(customerId)
    }

    private suspend fun loadTelemetry(customerId: Int) {
        _isLoadingTelemetry.value = true
        _inverterSummaryError.value = null
        customerRepository.getCustomerInverterGeneration(customerId)
            .onSuccess {
                _inverterSummary.value = it
                _isLoadingTelemetry.value = false
            }
            .onFailure { error ->
                _inverterSummary.value = null
                _inverterSummaryError.value = error.message ?: "Failed to connect to telemetry"
                _isLoadingTelemetry.value = false
            }
    }

    private suspend fun loadHistory(customerId: Int, period: String) {
        _isLoadingHistory.value = true
        _inverterHistoryError.value = null
        customerRepository.getCustomerInverterGenerationHistory(customerId, period)
            .onSuccess {
                _inverterHistory.value = it
                _isLoadingHistory.value = false
            }
            .onFailure { error ->
                _inverterHistory.value = emptyList()
                _inverterHistoryError.value = error.message ?: "Failed to load telemetry history"
                _isLoadingHistory.value = false
            }
    }

    private suspend fun loadAmcVisits(customerId: Int) {
        _isLoadingAmc.value = true
        customerRepository.getSubAdminAmcVisits(customerId)
            .onSuccess {
                _amcVisits.value = it
                _isLoadingAmc.value = false
            }
            .onFailure {
                _amcVisits.value = emptyList()
                _isLoadingAmc.value = false
            }
    }

    fun updateCredentials(
        customerId: Int,
        brand: String?,
        loginId: String?,
        passwordVal: String?,
        apiKey: String?,
        deviceSn: String?,
        city: String?,
        address: String?,
        projectStage: Int?,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isUpdatingCredentials.value = true
            _updateError.value = null
            val request = UpdateCredentialsRequest(
                inverterBrand = brand,
                inverterLoginId = loginId,
                inverterPassword = passwordVal,
                inverterApiKey = apiKey,
                inverterDeviceSn = deviceSn,
                city = city,
                address = address,
                projectStage = projectStage
            )
            customerRepository.updateCustomerCredentials(customerId, request)
                .onSuccess {
                    _isUpdatingCredentials.value = false
                    // Re-sync local state
                    refreshAll()
                    onSuccess()
                }
                .onFailure { error ->
                    _updateError.value = error.message ?: "Failed to update credentials"
                    _isUpdatingCredentials.value = false
                }
        }
    }

    private fun startTelemetryPolling(customerId: Int) {
        stopTelemetryPolling()
        telemetryPollingJob = viewModelScope.launch {
            while (true) {
                delay(60000L) // 1 minute polling interval
                loadTelemetry(customerId)
            }
        }
    }

    private fun stopTelemetryPolling() {
        telemetryPollingJob?.cancel()
        telemetryPollingJob = null
    }

    override fun onCleared() {
        super.onCleared()
        stopTelemetryPolling()
    }
}
