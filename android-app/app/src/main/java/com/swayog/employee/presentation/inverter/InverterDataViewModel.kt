package com.swayog.employee.presentation.inverter

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.WaareeInverterDataResponse
import com.swayog.employee.data.model.WaareePowerGraphResponse
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.InverterDataRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InverterDataViewModel @Inject constructor(
    private val inverterDataRepository: InverterDataRepository,
    private val customerRepository: CustomerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<InverterDataUiState>(InverterDataUiState.Loading)
    val uiState: StateFlow<InverterDataUiState> = _uiState.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _selectedPeriod = MutableStateFlow("realtime")
    val selectedPeriod: StateFlow<String> = _selectedPeriod.asStateFlow()

    private var _selectedCustomerId: Int? = null

    init {
        loadCustomers()
    }

    fun loadCustomers() {
        viewModelScope.launch {
            _uiState.value = InverterDataUiState.Loading
            try {
                val response = customerRepository.refreshCustomers(null, null)
                if (response.isSuccess) {
                    _customers.value = response.getOrNull() ?: emptyList()
                    _uiState.value = InverterDataUiState.CustomersLoaded(_customers.value)
                } else {
                    _uiState.value = InverterDataUiState.Error("Failed to load customers")
                }
            } catch (e: Exception) {
                _uiState.value = InverterDataUiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun loadInverterData(customerId: Int? = null) {
        viewModelScope.launch {
            _uiState.value = InverterDataUiState.Loading
            try {
                val response = inverterDataRepository.getInverterData(customerId)
                if (response.isSuccess) {
                    _uiState.value = InverterDataUiState.DataLoaded(response.getOrNull()!!)
                } else {
                    _uiState.value = InverterDataUiState.Error("Failed to load inverter data")
                }
            } catch (e: Exception) {
                _uiState.value = InverterDataUiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun selectCustomer(customer: Customer) {
        _selectedCustomerId = customer.id
        loadInverterData(customer.id)
    }

    fun refresh() {
        val currentState = _uiState.value
        when (currentState) {
            is InverterDataUiState.DataLoaded -> {
                loadInverterData(_selectedCustomerId)
            }
            else -> {
                loadCustomers()
            }
        }
    }

    fun loadPowerGraph(period: String = "realtime") {
        viewModelScope.launch {
            _selectedPeriod.value = period
            try {
                val response = inverterDataRepository.getPowerGraph(period)
                if (response.isSuccess) {
                    val currentState = _uiState.value
                    if (currentState is InverterDataUiState.DataLoaded) {
                        _uiState.value = currentState.copy(graphData = response.getOrNull())
                    }
                }
            } catch (e: Exception) {
                // Don't update UI state on graph error, just log it
                // TODO: Add proper error logging here
            }
        }
    }
}

sealed class InverterDataUiState {
    object Loading : InverterDataUiState()
    data class CustomersLoaded(val customers: List<Customer>) : InverterDataUiState()
    data class DataLoaded(
        val data: WaareeInverterDataResponse,
        val graphData: WaareePowerGraphResponse? = null
    ) : InverterDataUiState()
    data class Error(val message: String) : InverterDataUiState()
}
