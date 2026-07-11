package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.repository.CustomerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubAdminCustomersViewModel @Inject constructor(
    private val customerRepository: CustomerRepository
) : ViewModel() {

    private val _state = MutableStateFlow<SubAdminCustomersState>(SubAdminCustomersState.Initial)
    val state: StateFlow<SubAdminCustomersState> = _state.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCity = MutableStateFlow("")
    val selectedCity: StateFlow<String> = _selectedCity.asStateFlow()

    val filteredCustomers: StateFlow<List<Customer>> = combine(
        _customers,
        _searchQuery,
        _selectedCity
    ) { list, query, city ->
        list.filter { customer ->
            val matchesQuery = query.isBlank() || 
                    customer.fullName.contains(query, ignoreCase = true) ||
                    customer.customerCode.contains(query, ignoreCase = true) ||
                    customer.phoneNumber.contains(query, ignoreCase = true)
            val matchesCity = city.isBlank() || customer.city.equals(city, ignoreCase = true)
            matchesQuery && matchesCity
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val cities: StateFlow<List<String>> = _customers.map { list ->
        list.map { it.city }.distinct().sorted()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            customerRepository.getAllCustomers().collect { dbCustomers ->
                _customers.value = dbCustomers
            }
        }
        refresh()
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setSelectedCity(city: String) {
        _selectedCity.value = city
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = SubAdminCustomersState.Loading
            customerRepository.refreshCustomers(limit = 200, city = null)
                .onSuccess {
                    _state.value = SubAdminCustomersState.Success
                }
                .onFailure { error ->
                    _state.value = SubAdminCustomersState.Error(error.message ?: "Failed to load customers")
                }
        }
    }
}

sealed class SubAdminCustomersState {
    object Initial : SubAdminCustomersState()
    object Loading : SubAdminCustomersState()
    object Success : SubAdminCustomersState()
    data class Error(val message: String) : SubAdminCustomersState()
}
