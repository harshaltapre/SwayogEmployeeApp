package com.swayog.employee.presentation.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.UserSettingsDto
import com.swayog.employee.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val authRepository: AuthRepository,
    private val apiService: ApiService,
    @ApplicationContext private val context: Context
) : ViewModel() {

    init {
        syncWithServer()
    }

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

    val serverUrl: StateFlow<String?> = dataStoreManager.serverUrl.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    private val _uploadingPhoto = kotlinx.coroutines.flow.MutableStateFlow(false)
    val uploadingPhoto: StateFlow<Boolean> = _uploadingPhoto

    private val _uploadError = kotlinx.coroutines.flow.MutableStateFlow<String?>(null)
    val uploadError: StateFlow<String?> = _uploadError

    // Cache-busting key: incremented (as current timestamp) after every successful photo upload.
    // The UI passes this to Coil's ImageRequest so stale cached images are discarded immediately.
    private val _profilePhotoCacheKey = kotlinx.coroutines.flow.MutableStateFlow(0L)
    val profilePhotoCacheKey: StateFlow<Long> = _profilePhotoCacheKey

    fun syncWithServer() {
        viewModelScope.launch {
            try {
                authRepository.getCurrentUser()
            } catch (e: Exception) {
                android.util.Log.e("SETTINGS_VIEWMODEL", "Error syncing user profile on init: ${e.message}")
            }
            syncFaceEnrollmentWithServer()
            syncUserSettingsWithServer()
        }
    }

    private suspend fun syncFaceEnrollmentWithServer() {
        try {
            val response = apiService.getFaceEnrollmentStatus()
            if (response.isSuccessful) {
                val status = response.body()
                if (status != null && status.enrolled) {
                    val e = status.enrollment
                    if (e != null && e.descriptor1.isNotEmpty() && e.descriptor2.isNotEmpty() && e.descriptor3.isNotEmpty()) {
                        dataStoreManager.saveFaceEnrollment(e.descriptor1, e.descriptor2, e.descriptor3)
                    } else {
                        dataStoreManager.saveFaceEnrollment(emptyList(), emptyList(), emptyList())
                    }
                } else if (status != null && !status.enrolled) {
                    dataStoreManager.clearFaceEnrollment()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private suspend fun syncUserSettingsWithServer() {
        try {
            val response = try {
                apiService.getUserPreferences()
            } catch (e: Exception) {
                apiService.getUserSettings()
            }
            if (response.isSuccessful) {
                val settings = response.body()?.data
                if (settings != null) {
                    dataStoreManager.updateSettingsFromServer(settings)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun pushUserSettingsToServer(
        darkMode: Boolean? = null,
        biometricEnabled: Boolean? = null,
        notificationsEnabled: Boolean? = null,
        compactViewEnabled: Boolean? = null,
        animationsEnabled: Boolean? = null,
        profileVisibilityEnabled: Boolean? = null,
        showStatusEnabled: Boolean? = null,
        activitySharingEnabled: Boolean? = null,
        language: String? = null
    ) {
        viewModelScope.launch {
            try {
                val dto = UserSettingsDto(
                    darkMode = darkMode,
                    biometricEnabled = biometricEnabled,
                    notificationsEnabled = notificationsEnabled,
                    compactViewEnabled = compactViewEnabled,
                    animationsEnabled = animationsEnabled,
                    profileVisibilityEnabled = profileVisibilityEnabled,
                    showStatusEnabled = showStatusEnabled,
                    activitySharingEnabled = activitySharingEnabled,
                    language = language
                )
                try {
                    apiService.updatePreferences(dto)
                } catch (e: Exception) {
                    apiService.updateUserSettings(dto)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun uploadProfilePhoto(base64Image: String) {
        viewModelScope.launch {
            _uploadingPhoto.value = true
            _uploadError.value = null

            val result = authRepository.updateProfilePhoto(base64Image)
            if (result.isSuccess) {
                // Bump cache key so Coil discards its cached (stale) image immediately
                _profilePhotoCacheKey.value = System.currentTimeMillis()
                android.util.Log.d("SETTINGS_VM", "Photo upload succeeded — bumping cache key to ${_profilePhotoCacheKey.value}")
            } else {
                _uploadError.value = result.exceptionOrNull()?.message ?: "Failed to upload photo"
                android.util.Log.e("SETTINGS_VM", "Photo upload failed: ${result.exceptionOrNull()?.message}")
            }

            _uploadingPhoto.value = false
        }
    }

    fun uploadProfilePhotoFile(file: java.io.File) {
        viewModelScope.launch {
            _uploadingPhoto.value = true
            _uploadError.value = null

            val result = authRepository.uploadProfilePhotoFile(file)
            if (result.isSuccess) {
                // Bump cache key so Coil discards its cached (stale) image immediately
                _profilePhotoCacheKey.value = System.currentTimeMillis()
                android.util.Log.d("SETTINGS_VM", "Photo file upload succeeded — bumping cache key to ${_profilePhotoCacheKey.value}")
            } else {
                _uploadError.value = result.exceptionOrNull()?.message ?: "Failed to upload photo"
                android.util.Log.e("SETTINGS_VM", "Photo file upload failed: ${result.exceptionOrNull()?.message}")
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
            pushUserSettingsToServer(darkMode = enabled)
        }
    }

    fun setBiometricEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setBiometricEnabled(enabled)
            pushUserSettingsToServer(biometricEnabled = enabled)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setNotificationsEnabled(enabled)
            pushUserSettingsToServer(notificationsEnabled = enabled)
        }
    }

    fun setCompactViewEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setCompactViewEnabled(enabled)
            pushUserSettingsToServer(compactViewEnabled = enabled)
        }
    }

    fun setAnimationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setAnimationsEnabled(enabled)
            pushUserSettingsToServer(animationsEnabled = enabled)
        }
    }

    fun setProfileVisibilityEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setProfileVisibilityEnabled(enabled)
            pushUserSettingsToServer(profileVisibilityEnabled = enabled)
        }
    }

    fun setShowStatusEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setShowStatusEnabled(enabled)
            pushUserSettingsToServer(showStatusEnabled = enabled)
        }
    }

    fun setActivitySharingEnabled(enabled: Boolean) {
        viewModelScope.launch {
            dataStoreManager.setActivitySharingEnabled(enabled)
            pushUserSettingsToServer(activitySharingEnabled = enabled)
        }
    }

    fun setLanguage(lang: String) {
        viewModelScope.launch {
            dataStoreManager.setLanguage(lang)
            pushUserSettingsToServer(language = lang)
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

    fun saveServerUrl(url: String) {
        viewModelScope.launch {
            dataStoreManager.saveServerUrl(url)
            syncWithServer()
        }
    }

    fun deleteFaceEnrollment() {
        viewModelScope.launch {
            try {
                val userId = dataStoreManager.userId.first()
                if (!userId.isNullOrEmpty()) {
                    apiService.deleteFaceEnrollment(userId)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                dataStoreManager.clearFaceEnrollment()
            }
        }
    }
}

