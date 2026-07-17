package com.swayog.employee.presentation.subadmin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AmcManagementViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val employeeRepository: EmployeeRepository
) : ViewModel() {
    
    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()
    
    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()
    
    private val _amcVisits = MutableStateFlow<List<com.swayog.employee.data.model.AmcVisit>>(emptyList())
    val amcVisits: StateFlow<List<com.swayog.employee.data.model.AmcVisit>> = _amcVisits.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    init {
        loadData()
    }
    
    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Load AMC customers
                val customersResult = customerRepository.getAmcCustomers()
                if (customersResult.isSuccess) {
                    _customers.value = customersResult.getOrNull() ?: emptyList()
                } else {
                    _errorMessage.value = "Failed to load AMC customers: ${customersResult.exceptionOrNull()?.message}"
                }
                
                // Load employees
                 val employeesResult = employeeRepository.getInternalUsers()
                if (employeesResult.isSuccess) {
                    _employees.value = employeesResult.getOrNull() ?: emptyList()
                } else {
                    _errorMessage.value = "Failed to load employees: ${employeesResult.exceptionOrNull()?.message}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error loading data: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun updateAmcSettings(
        customerId: Int,
        settings: com.swayog.employee.data.model.UpdateAmcSettingsRequest,
        onComplete: (Result<Unit>) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val result = customerRepository.updateAmcSettings(customerId, settings)
                onComplete(result.map { })
                if (result.isSuccess) {
                    loadData() // Refresh data after update
                }
            } catch (e: Exception) {
                onComplete(Result.failure(e))
            }
        }
    }
    
    fun updateApartmentAmcSettings(
        apartmentId: Int,
        settings: com.swayog.employee.data.model.ApartmentAmcSettingsRequest,
        onComplete: (Result<Unit>) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val result = customerRepository.updateApartmentAmcSettings(apartmentId, settings)
                onComplete(result)
                if (result.isSuccess) {
                    loadData() // Refresh data after update
                }
            } catch (e: Exception) {
                onComplete(Result.failure(e))
            }
        }
    }
    
    fun loadAmcVisits(customerId: Int? = null) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val visitsResult = if (customerId != null) {
                    customerRepository.getSubAdminAmcVisits(customerId)
                } else {
                    customerRepository.getAmcVisits()
                }
                
                if (visitsResult.isSuccess) {
                    _amcVisits.value = visitsResult.getOrNull() ?: emptyList()
                } else {
                    _errorMessage.value = "Failed to load AMC visits: ${visitsResult.exceptionOrNull()?.message}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error loading AMC visits: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun updateAmcVisit(visitId: String, request: com.swayog.employee.data.model.UpdateAmcVisitRequest, onComplete: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            try {
                val result = customerRepository.updateAmcVisit(visitId, request)
                onComplete(result.map { })
                if (result.isSuccess) {
                    loadAmcVisits()
                }
            } catch (e: Exception) {
                onComplete(Result.failure(e))
            }
        }
    }
    
    fun markAmcVisitDone(visitId: String, visitNotes: String?, beforeImageUrl: String?, afterImageUrl: String?, onComplete: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            try {
                val result = customerRepository.markAmcVisitDone(visitId, visitNotes, beforeImageUrl, afterImageUrl)
                onComplete(result.map { })
                if (result.isSuccess) {
                    loadAmcVisits()
                }
            } catch (e: Exception) {
                onComplete(Result.failure(e))
            }
        }
    }
    
    fun importCustomersFromExcel(
        data: List<Map<String, String>>,
        onComplete: (Result<Unit>) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val result = customerRepository.importCustomersFromExcel(data)
                onComplete(result)
                if (result.isSuccess) {
                    loadData() // Refresh data after import
                }
            } catch (e: Exception) {
                onComplete(Result.failure(e))
            }
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
}
