package com.swayog.employee.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val authRepository: AuthRepository
) : ViewModel() {

    val isLoggedIn: StateFlow<Boolean?> = dataStoreManager.isLoggedIn
        .map<Boolean, Boolean?> { it }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.Eagerly,
            initialValue = null
        )

    val userRole: StateFlow<String?> = dataStoreManager.userRole.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = null
    )

    val jobRole: StateFlow<String?> = dataStoreManager.jobRole.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = null
    )

    val darkMode: StateFlow<Boolean> = dataStoreManager.darkMode.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = false
    )

    val compactViewEnabled: StateFlow<Boolean> = dataStoreManager.compactViewEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = false
    )

    val animationsEnabled: StateFlow<Boolean> = dataStoreManager.animationsEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = true
    )

    init {
        viewModelScope.launch {
            // Keep session alive and track activity timestamp without logging out automatically
            dataStoreManager.recordUserActive()
        }
        // Fetch latest designation from server periodically so web changes propagate in real time
        startPeriodicProfileSync()
    }

    /**
     * Fetches the latest user profile (including jobRole / designation) from the backend
     * and persists it into DataStore. The [userRole] and [jobRole] StateFlows then emit
     * the new values, causing recomposition and automatic re-routing if the role changed.
     */
    fun refreshUserProfile() {
        viewModelScope.launch {
            try {
                // Only refresh when the user is actually logged in
                if (isLoggedIn.value == true) {
                    authRepository.getCurrentUser()
                }
            } catch (_: Exception) {
                // Silently ignore network errors during background sync
            }
        }
    }

    /**
     * Runs [refreshUserProfile] every 5 minutes while the app is alive.
     * This ensures designation changes made from the web dashboard are reflected
     * in the app without requiring a logout/login cycle.
     */
    private fun startPeriodicProfileSync() {
        viewModelScope.launch {
            while (true) {
                delay(5 * 60 * 1000L) // 5 minutes
                refreshUserProfile()
            }
        }
    }

    fun onAppForegrounded() {
        viewModelScope.launch {
            dataStoreManager.recordUserActive()
        }
        // Immediately refresh profile when app comes to foreground so designation
        // changes made on the web propagate as soon as the user opens the app
        refreshUserProfile()
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
