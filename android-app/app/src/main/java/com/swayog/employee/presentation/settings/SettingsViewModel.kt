package com.swayog.employee.presentation.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import com.swayog.employee.data.repository.AuthRepository
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val authRepository: AuthRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    val darkMode: StateFlow<Boolean> = dataStoreManager.darkMode.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    val biometricEnabled: StateFlow<Boolean> = dataStoreManager.biometricEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    val isFaceEnrolled: StateFlow<Boolean> = dataStoreManager.isFaceEnrolled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    val notificationsEnabled: StateFlow<Boolean> = dataStoreManager.notificationsEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = true
    )

    val compactViewEnabled: StateFlow<Boolean> = dataStoreManager.compactViewEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    val animationsEnabled: StateFlow<Boolean> = dataStoreManager.animationsEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = true
    )

    val profileVisibilityEnabled: StateFlow<Boolean> = dataStoreManager.profileVisibilityEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = true
    )

    val showStatusEnabled: StateFlow<Boolean> = dataStoreManager.showStatusEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = true
    )

    val activitySharingEnabled: StateFlow<Boolean> = dataStoreManager.activitySharingEnabled.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = true
    )


    val language: StateFlow<String> = dataStoreManager.language.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = "en"
    )

    val userName: StateFlow<String?> = dataStoreManager.userName.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val userEmail: StateFlow<String?> = dataStoreManager.userEmail.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val userRole: StateFlow<String?> = dataStoreManager.userRole.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val jobRole: StateFlow<String?> = dataStoreManager.jobRole.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    val profilePhotoUrl: StateFlow<String?> = dataStoreManager.profilePhotoUrl.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    private val _uploadingPhoto = kotlinx.coroutines.flow.MutableStateFlow(false)
    val uploadingPhoto: StateFlow<Boolean> = _uploadingPhoto

    private val _uploadError = kotlinx.coroutines.flow.MutableStateFlow<String?>(null)
    val uploadError: StateFlow<String?> = _uploadError

    fun uploadProfilePhoto(base64Image: String) {
        viewModelScope.launch {
            _uploadingPhoto.value = true
            _uploadError.value = null
            
            val result = authRepository.updateProfilePhoto(base64Image)
            if (result.isFailure) {
                _uploadError.value = result.exceptionOrNull()?.message ?: "Failed to upload photo"
            }
            
            _uploadingPhoto.value = false
        }
    }

    fun clearUploadError() {
        _uploadError.value = null
    }

    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setDarkMode(enabled)
        }
    }

    fun setBiometricEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setBiometricEnabled(enabled)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setNotificationsEnabled(enabled)
        }
    }

    fun setCompactViewEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setCompactViewEnabled(enabled)
        }
    }

    fun setAnimationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setAnimationsEnabled(enabled)
        }
    }

    fun setProfileVisibilityEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setProfileVisibilityEnabled(enabled)
        }
    }

    fun setShowStatusEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setShowStatusEnabled(enabled)
        }
    }

    fun setActivitySharingEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setActivitySharingEnabled(enabled)
        }
    }

    fun setLanguage(lang: String) {
        viewModelScope.launch {
            dataStoreManager.setLanguage(lang)
        }
    }

    fun getCacheSize(): String {
        val cacheDir = context.cacheDir
        val size = getDirSize(cacheDir)
        return formatFileSize(size)
    }

    fun clearCache() {
        context.cacheDir.deleteRecursively()
    }

    private fun getDirSize(dir: java.io.File): Long {
        var size = 0L
        if (dir.isDirectory) {
            dir.listFiles()?.forEach { file ->
                size += if (file.isDirectory) getDirSize(file) else file.length()
            }
        }
        return size
    }

    private fun formatFileSize(size: Long): String {
        return when {
            size < 1024 -> "$size B"
            size < 1024 * 1024 -> "${size / 1024} KB"
            else -> String.format("%.1f MB", size / (1024.0 * 1024.0))
        }
    }

    fun logout(onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                authRepository.logout()
            } finally {
                onSuccess()
            }
        }
    }

    fun deleteFaceEnrollment() {
        viewModelScope.launch {
            dataStoreManager.clearFaceEnrollment()
        }
    }
}
