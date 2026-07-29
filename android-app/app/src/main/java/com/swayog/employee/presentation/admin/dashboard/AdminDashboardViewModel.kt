package com.swayog.employee.presentation.admin.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.DashboardStats
import com.swayog.employee.data.repository.AdminDashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AdminDashboardViewModel @Inject constructor(
    private val dashboardRepository: AdminDashboardRepository
) : ViewModel() {

    private val _dashboardState = MutableStateFlow<DashboardState>(DashboardState.Initial)
    val dashboardState: StateFlow<DashboardState> = _dashboardState.asStateFlow()

    private val _dashboardStats = MutableStateFlow<DashboardStats?>(null)
    val dashboardStats: StateFlow<DashboardStats?> = _dashboardStats.asStateFlow()

    init {
        loadDashboardStats()
    }

    fun loadDashboardStats() {
        viewModelScope.launch {
            _dashboardState.value = DashboardState.Loading
            dashboardRepository.getDashboardStats()
                .onSuccess { stats ->
                    _dashboardStats.value = stats
                    _dashboardState.value = DashboardState.Success
                }
                .onFailure { error ->
                    _dashboardState.value = DashboardState.Error(error.message ?: "Failed to load dashboard stats")
                }
        }
    }
}

sealed class DashboardState {
    object Initial : DashboardState()
    object Loading : DashboardState()
    object Success : DashboardState()
    data class Error(val message: String) : DashboardState()
}
