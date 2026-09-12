package com.swayog.employee.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val dataStoreManager: DataStoreManager
) : ViewModel() {
    
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Initial)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()
    
    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email.asStateFlow()
    
    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password.asStateFlow()
    
    private val _isPasswordVisible = MutableStateFlow(false)
    val isPasswordVisible: StateFlow<Boolean> = _isPasswordVisible.asStateFlow()
    
    private val _isBiometricAvailable = MutableStateFlow(false)
    val isBiometricAvailable: StateFlow<Boolean> = _isBiometricAvailable.asStateFlow()
    
    private val _savePassword = MutableStateFlow(true)
    val savePassword: StateFlow<Boolean> = _savePassword.asStateFlow()

    private val _selectedRole = MutableStateFlow("EMPLOYEE")
    val selectedRole: StateFlow<String> = _selectedRole.asStateFlow()

    val serverUrl: Flow<String?> = dataStoreManager.serverUrl

    init {
        viewModelScope.launch {
            val remember = dataStoreManager.rememberCredentials.first()
            _savePassword.value = remember
            if (remember) {
                val savedId = dataStoreManager.savedLoginId.first()
                val savedPass = dataStoreManager.savedPassword.first()
                if (!savedId.isNullOrBlank()) {
                    _email.value = savedId
                }
                if (!savedPass.isNullOrBlank()) {
                    _password.value = savedPass
                }
            }
        }
    }

    fun onSavePasswordChange(save: Boolean) {
        _savePassword.value = save
        if (!save) {
            viewModelScope.launch {
                dataStoreManager.clearSavedLoginCredentials()
            }
        }
    }

    fun saveServerUrl(url: String) {
        viewModelScope.launch {
            dataStoreManager.saveServerUrl(url)
        }
    }
    
    fun onEmailChange(newEmail: String) {
        _email.value = newEmail
    }
    
    fun onPasswordChange(newPassword: String) {
        _password.value = newPassword
    }

    fun onRoleChange(newRole: String) {
        _selectedRole.value = newRole
    }
    
    fun togglePasswordVisibility() {
        _isPasswordVisible.value = !_isPasswordVisible.value
    }
    
    fun checkBiometricAvailability() {
        viewModelScope.launch {
            val hasToken = dataStoreManager.authToken.first() != null
            val isEnabled = dataStoreManager.biometricEnabled.first()
            _isBiometricAvailable.value = hasToken && isEnabled
        }
    }
    
    fun login() {
        val emailValue = _email.value.trim()
        val passwordValue = _password.value
        val roleValue = _selectedRole.value

        if (emailValue.isBlank() || passwordValue.isBlank()) {
            _loginState.value = LoginState.Error("Please enter email / login ID and password")
            return
        }

        _loginState.value = LoginState.Loading

        viewModelScope.launch {
            authRepository.login(emailValue, passwordValue, roleValue)
                .onSuccess { authResponse ->
                    if (_savePassword.value) {
                        dataStoreManager.saveLoginCredentials(emailValue, passwordValue, true)
                    } else {
                        dataStoreManager.clearSavedLoginCredentials()
                    }
                    _loginState.value = LoginState.Success(authResponse)
                }
                .onFailure { error ->
                    _loginState.value = LoginState.Error(
                        error.message ?: "Login failed. Please try again."
                    )
                }
        }
    }
    
    fun loginWithBiometricSuccess() {
        _loginState.value = LoginState.Loading
        viewModelScope.launch {
            authRepository.refreshToken()
                .onSuccess { authResponse ->
                    _loginState.value = LoginState.Success(authResponse)
                }
                .onFailure { _ ->
                    _loginState.value = LoginState.Error(
                        "Session expired. Please log in with your credentials."
                    )
                }
        }
    }

    fun resetState() {
        _loginState.value = LoginState.Initial
    }
}

sealed class LoginState {
    object Initial : LoginState()
    object Loading : LoginState()
    data class Success(val authResponse: com.swayog.employee.data.model.AuthResponse) : LoginState()
    data class Error(val message: String) : LoginState()
}
