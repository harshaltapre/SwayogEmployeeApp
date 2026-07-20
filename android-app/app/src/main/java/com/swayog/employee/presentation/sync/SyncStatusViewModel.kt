package com.swayog.employee.presentation.sync

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.dao.OutboxQueueDao
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SyncStatusViewModel @Inject constructor(
    private val outboxQueueDao: OutboxQueueDao
) : ViewModel() {
    
    private val _pendingCount = MutableStateFlow(0)
    val pendingCount: StateFlow<Int> = _pendingCount.asStateFlow()
    
    init {
        refreshPendingCount()
    }
    
    fun refreshPendingCount() {
        viewModelScope.launch {
            try {
                val count = outboxQueueDao.getPendingCount()
                _pendingCount.value = count
            } catch (e: Exception) {
                _pendingCount.value = 0
            }
        }
    }
}
