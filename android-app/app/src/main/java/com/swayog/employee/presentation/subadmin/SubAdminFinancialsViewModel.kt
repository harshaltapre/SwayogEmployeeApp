package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.CreateInvoiceRequest
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Invoice
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.FinancialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class FinancialsActionState {
    object Idle : FinancialsActionState()
    object Loading : FinancialsActionState()
    data class Success(val message: String) : FinancialsActionState()
    data class Error(val message: String) : FinancialsActionState()
}

@HiltViewModel
class SubAdminFinancialsViewModel @Inject constructor(
    private val financialRepository: FinancialRepository,
    private val customerRepository: CustomerRepository
) : ViewModel() {

    private val _invoices = MutableStateFlow<List<Invoice>>(emptyList())
    val invoices: StateFlow<List<Invoice>> = _invoices.asStateFlow()

    private val _filteredInvoices = MutableStateFlow<List<Invoice>>(emptyList())
    val filteredInvoices: StateFlow<List<Invoice>> = _filteredInvoices.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _actionState = MutableStateFlow<FinancialsActionState>(FinancialsActionState.Idle)
    val actionState: StateFlow<FinancialsActionState> = _actionState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            
            // Load invoices
            financialRepository.getInvoices(invoiceType = "amc").onSuccess { data ->
                _invoices.value = data
                _filteredInvoices.value = data
            }.onFailure {
                _actionState.value = FinancialsActionState.Error(it.message ?: "Failed to load invoices")
            }

            // Load customers for dropdowns
            customerRepository.refreshCustomers(null, null).onSuccess { list ->
                _customers.value = list
            }

            _isLoading.value = false
        }
    }

    fun searchInvoices(query: String) {
        val lowerQuery = query.lowercase()
        _filteredInvoices.value = if (query.isBlank()) {
            _invoices.value
        } else {
            _invoices.value.filter { inv ->
                inv.invoiceNumber?.lowercase()?.contains(lowerQuery) == true ||
                inv.description.lowercase().contains(lowerQuery)
            }
        }
    }

    fun logPayment(request: CreateInvoiceRequest) {
        viewModelScope.launch {
            _actionState.value = FinancialsActionState.Loading
            financialRepository.createInvoice(request).onSuccess {
                _actionState.value = FinancialsActionState.Success("Payment logged successfully")
                loadData()
            }.onFailure {
                _actionState.value = FinancialsActionState.Error(it.message ?: "Failed to log payment")
            }
        }
    }

    fun resetActionState() {
        _actionState.value = FinancialsActionState.Idle
    }
}
