package com.swayog.employee.presentation.inventory

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.*
import com.swayog.employee.data.repository.CustomerRepository
import com.swayog.employee.data.repository.InventoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class InventoryViewModel @Inject constructor(
    private val inventoryRepository: InventoryRepository,
    private val customerRepository: CustomerRepository
) : ViewModel() {

    private val _inventoryState = MutableStateFlow<InventoryState>(InventoryState.Initial)
    val inventoryState: StateFlow<InventoryState> = _inventoryState.asStateFlow()

    private val _inventoryItems = MutableStateFlow<List<InventoryItem>>(emptyList())
    val inventoryItems: StateFlow<List<InventoryItem>> = _inventoryItems.asStateFlow()

    private val _dispatches = MutableStateFlow<List<DispatchRecord>>(emptyList())
    val dispatches: StateFlow<List<DispatchRecord>> = _dispatches.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    // Filters for Stock Ledger
    val searchQuery = MutableStateFlow("")
    val selectedCategory = MutableStateFlow("all")
    val showOnlyLowStock = MutableStateFlow(false)

    // Filter for Customers
    val customerSearchQuery = MutableStateFlow("")

    // Settings state
    val lowStockNotifications = MutableStateFlow(true)
    val dailyDigest = MutableStateFlow(true)
    val supplierAlerts = MutableStateFlow(false)
    val autoApproveAdjustments = MutableStateFlow(false)
    val requireReasonForAdjustments = MutableStateFlow(true)
    val allowNegativeStock = MutableStateFlow(false)
    val defaultThreshold = MutableStateFlow(10)

    val filteredInventoryItems: StateFlow<List<InventoryItem>> = combine(
        _inventoryItems,
        searchQuery,
        selectedCategory,
        showOnlyLowStock
    ) { items, query, category, onlyLow ->
        items.filter { item ->
            val matchesSearch = query.isBlank() ||
                    item.name.contains(query, ignoreCase = true) ||
                    item.sku.contains(query, ignoreCase = true) ||
                    (item.supplier?.contains(query, ignoreCase = true) == true)
            val matchesCategory = category == "all" || item.category == category
            val matchesLowStock = !onlyLow || (item.inStock <= item.minThreshold)
            matchesSearch && matchesCategory && matchesLowStock
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val filteredCustomers: StateFlow<List<Customer>> = combine(
        _customers,
        customerSearchQuery
    ) { custList, query ->
        if (query.isBlank()) custList
        else {
            custList.filter { c ->
                c.fullName.contains(query, ignoreCase = true) ||
                        c.customerCode.contains(query, ignoreCase = true) ||
                        c.phoneNumber.contains(query, ignoreCase = true) ||
                        (c.city?.contains(query, ignoreCase = true) == true)
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        refreshAll()
        observeLocalCustomers()
    }

    private fun observeLocalCustomers() {
        viewModelScope.launch {
            customerRepository.getAllCustomers().collect { dbCustomers ->
                if (dbCustomers.isNotEmpty()) {
                    _customers.value = dbCustomers
                }
            }
        }
    }

    fun refreshAll() {
        loadInventoryItems()
        loadDispatches()
        loadCustomers()
    }

    fun loadInventoryItems() {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.getInventoryItems()
                .onSuccess { items ->
                    _inventoryItems.value = items
                    _inventoryState.value = InventoryState.Success
                }
                .onFailure { error ->
                    _inventoryState.value = InventoryState.Error(error.message ?: "Failed to load inventory")
                }
        }
    }

    fun loadDispatches() {
        viewModelScope.launch {
            inventoryRepository.getDispatches()
                .onSuccess { list ->
                    _dispatches.value = list
                }
        }
    }

    fun loadCustomers() {
        viewModelScope.launch {
            customerRepository.refreshCustomers(limit = 200, city = null)
        }
    }

    fun createInventoryItem(
        request: CreateInventoryRequest,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.createInventoryItem(request)
                .onSuccess {
                    onSuccess()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    val msg = error.message ?: "Failed to create item"
                    _inventoryState.value = InventoryState.Error(msg)
                    onError(msg)
                }
        }
    }

    fun updateInventoryItem(
        id: String,
        request: UpdateInventoryRequest,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.updateInventoryItem(id, request)
                .onSuccess {
                    onSuccess()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    val msg = error.message ?: "Failed to update item"
                    _inventoryState.value = InventoryState.Error(msg)
                    onError(msg)
                }
        }
    }

    fun deleteInventoryItem(
        id: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.deleteInventoryItem(id)
                .onSuccess {
                    onSuccess()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    val msg = error.message ?: "Failed to delete item"
                    _inventoryState.value = InventoryState.Error(msg)
                    onError(msg)
                }
        }
    }

    fun createDispatches(
        requests: List<DispatchRequest>,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            var failedCount = 0
            var firstError = ""
            for (req in requests) {
                inventoryRepository.createDispatch(req)
                    .onFailure { err ->
                        failedCount++
                        if (firstError.isBlank()) firstError = err.message ?: "Dispatch failed"
                    }
            }
            if (failedCount == 0) {
                onSuccess()
            } else {
                onError("$failedCount dispatches could not be recorded: $firstError")
            }
            // Refresh both dispatches and inventory items so stock is immediately in sync
            loadDispatches()
            loadInventoryItems()
        }
    }

    fun updateDispatch(
        id: String,
        request: UpdateDispatchRequest,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            inventoryRepository.updateDispatch(id, request)
                .onSuccess {
                    onSuccess()
                    loadDispatches()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    onError(error.message ?: "Failed to update dispatch")
                }
        }
    }

    fun deleteDispatch(
        id: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            inventoryRepository.deleteDispatch(id)
                .onSuccess {
                    onSuccess()
                    loadDispatches()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    onError(error.message ?: "Failed to delete dispatch")
                }
        }
    }

    fun getDispatchesForCustomer(customerId: Int): List<DispatchRecord> {
        return _dispatches.value.filter { it.customerId == customerId }
    }

    fun exportInventoryCsv(context: Context, onDone: (String) -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val items = _inventoryItems.value
                if (items.isEmpty()) {
                    onError("No inventory items to export.")
                    return@launch
                }
                val sb = StringBuilder()
                sb.append("SKU,Item Name,Category,Unit,In Stock,Min Threshold,Price Per Unit (INR),Supplier,Entry Date\n")
                items.forEach { item ->
                    sb.append("\"${item.sku}\",")
                    sb.append("\"${item.name.replace("\"", "\"\"")}\",")
                    sb.append("\"${item.category}\",")
                    sb.append("\"${item.unit ?: "unit"}\",")
                    sb.append("${item.inStock},")
                    sb.append("${item.minThreshold},")
                    sb.append("${item.pricePerUnit},")
                    sb.append("\"${(item.supplier ?: "").replace("\"", "\"\"")}\",")
                    sb.append("\"${item.entryDate ?: ""}\"\n")
                }

                val dateStr = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                val file = File(context.cacheDir, "inventory_report_$dateStr.csv")
                FileOutputStream(file).use { it.write(sb.toString().toByteArray()) }

                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )

                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/csv"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    putExtra(Intent.EXTRA_SUBJECT, "Swayog Inventory Report")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                val chooser = Intent.createChooser(intent, "Share Inventory Report")
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(chooser)
                onDone("Report generated successfully")
            } catch (e: Exception) {
                onError("Failed to export report: ${e.message}")
            }
        }
    }
}

sealed class InventoryState {
    object Initial : InventoryState()
    object Loading : InventoryState()
    object Success : InventoryState()
    data class Error(val message: String) : InventoryState()
}
