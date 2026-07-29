package com.swayog.employee.presentation.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.CreateInventoryRequest
import com.swayog.employee.data.model.InventoryItem
import com.swayog.employee.data.model.UpdateInventoryRequest
import com.swayog.employee.data.repository.InventoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InventoryViewModel @Inject constructor(
    private val inventoryRepository: InventoryRepository
) : ViewModel() {

    private val _inventoryState = MutableStateFlow<InventoryState>(InventoryState.Initial)
    val inventoryState: StateFlow<InventoryState> = _inventoryState.asStateFlow()

    private val _inventoryItems = MutableStateFlow<List<InventoryItem>>(emptyList())
    val inventoryItems: StateFlow<List<InventoryItem>> = _inventoryItems.asStateFlow()

    init {
        loadInventoryItems()
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

    fun createInventoryItem(
        request: CreateInventoryRequest,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.createInventoryItem(request)
                .onSuccess {
                    onSuccess()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    _inventoryState.value = InventoryState.Error(error.message ?: "Failed to create item")
                    onError(error.message ?: "Failed to create item")
                }
        }
    }

    fun updateInventoryItem(
        id: String,
        request: UpdateInventoryRequest,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.updateInventoryItem(id, request)
                .onSuccess {
                    onSuccess()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    _inventoryState.value = InventoryState.Error(error.message ?: "Failed to update item")
                    onError(error.message ?: "Failed to update item")
                }
        }
    }

    fun deleteInventoryItem(
        id: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _inventoryState.value = InventoryState.Loading
            inventoryRepository.deleteInventoryItem(id)
                .onSuccess {
                    onSuccess()
                    loadInventoryItems()
                }
                .onFailure { error ->
                    _inventoryState.value = InventoryState.Error(error.message ?: "Failed to delete item")
                    onError(error.message ?: "Failed to delete item")
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
