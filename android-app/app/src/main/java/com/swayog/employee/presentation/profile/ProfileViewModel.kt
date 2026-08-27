package com.swayog.employee.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.dao.UserDao
import com.swayog.employee.data.local.entity.UserEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.swayog.employee.data.repository.AuthRepository

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val userDao: UserDao,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _currentUser = MutableStateFlow<UserEntity?>(null)
    val currentUser: StateFlow<UserEntity?> = _currentUser.asStateFlow()

    val serverUrl: StateFlow<String?> = dataStoreManager.serverUrl.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val profilePhotoUrl: StateFlow<String?> = dataStoreManager.profilePhotoUrl.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    private val _profilePhotoCacheKey = MutableStateFlow(0L)
    val profilePhotoCacheKey: StateFlow<Long> = _profilePhotoCacheKey.asStateFlow()

    private val _uploadingPhoto = MutableStateFlow(false)
    val uploadingPhoto: StateFlow<Boolean> = _uploadingPhoto.asStateFlow()

    private val _uploadError = MutableStateFlow<String?>(null)
    val uploadError: StateFlow<String?> = _uploadError.asStateFlow()

    fun clearUploadError() {
        _uploadError.value = null
    }

    init {
        viewModelScope.launch {
            dataStoreManager.userId.filterNotNull().collectLatest { id ->
                userDao.observeUserById(id).collect { userEntity ->
                    if (userEntity != null) {
                        _currentUser.value = userEntity
                    }
                }
            }
        }
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            authRepository.getCurrentUser()
        }
    }

    fun uploadProfilePhotoFile(file: java.io.File) {
        viewModelScope.launch {
            _uploadingPhoto.value = true
            _uploadError.value = null

            val result = authRepository.uploadProfilePhotoFile(file)
            if (result.isSuccess) {
                _profilePhotoCacheKey.value = System.currentTimeMillis()
                authRepository.getCurrentUser()
            } else {
                _uploadError.value = result.exceptionOrNull()?.message ?: "Failed to upload photo"
            }

            _uploadingPhoto.value = false
        }
    }
}
