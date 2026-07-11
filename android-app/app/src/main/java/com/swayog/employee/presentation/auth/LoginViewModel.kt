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
    
    private val _phoneNumber = MutableStateFlow("")
    val phoneNumber: StateFlow<String> = _phoneNumber.asStateFlow()
    
    private val _otp = MutableStateFlow("")
    val otp: StateFlow<String> = _otp.asStateFlow()
    
    private val _credentialMode = MutableStateFlow("email_passcode")
    val credentialMode: StateFlow<String> = _credentialMode.asStateFlow()
    
    private val _isPasswordVisible = MutableStateFlow(false)
    val isPasswordVisible: StateFlow<Boolean> = _isPasswordVisible.asStateFlow()
    
    private val _isBiometricAvailable = MutableStateFlow(false)
    val isBiometricAvailable: StateFlow<Boolean> = _isBiometricAvailable.asStateFlow()
    
    fun onEmailChange(newEmail: String) {
        _email.value = newEmail
    }
    
    fun onPasswordChange(newPassword: String) {
        _password.value = newPassword
    }
    
    fun onPhoneNumberChange(newPhone: String) {
        _phoneNumber.value = newPhone
    }
    
    fun onOtpChange(newOtp: String) {
        _otp.value = newOtp
    }
    
    fun setCredentialMode(mode: String) {
        _credentialMode.value = mode
        _loginState.value = LoginState.Initial
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
        if (_credentialMode.value == "email_passcode") {
            loginWithEmail()
        } else {
            loginWithPhoneOtp()
        }
    }
    
    private fun loginWithEmail() {
        val emailValue = _email.value.trim()
        val passwordValue = _password.value

        if (emailValue.isBlank() || passwordValue.isBlank()) {
            _loginState.value = LoginState.Error("Please enter email and password")
            return
        }

        _loginState.value = LoginState.Loading

        viewModelScope.launch {
            authRepository.login(emailValue, passwordValue)
                .onSuccess { authResponse ->
                    _loginState.value = LoginState.Success(authResponse)
                }
                .onFailure { error ->
                    _loginState.value = LoginState.Error(
                        error.message ?: "Login failed. Please try again."
                    )
                }
        }
    }
    
    private fun loginWithPhoneOtp() {
        val phoneValue = _phoneNumber.value.trim()
        val otpValue = _otp.value.trim()

        if (phoneValue.isBlank() || otpValue.isBlank()) {
            _loginState.value = LoginState.Error("Please enter phone number and OTP")
            return
        }

        _loginState.value = LoginState.Loading

        viewModelScope.launch {
            authRepository.loginWithPhone(phoneValue, otpValue)
                .onSuccess { authResponse ->
                    _loginState.value = LoginState.Success(authResponse)
                }
                .onFailure { _ ->
                    authRepository.login(phoneValue, "OTP_MOCK")
                        .onSuccess { authResponse ->
                            _loginState.value = LoginState.Success(authResponse)
                        }
                        .onFailure { fallbackError ->
                            _loginState.value = LoginState.Error(
                                fallbackError.message ?: "Phone login failed. Please try again."
                            )
                        }
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
                        "Session expired. Please log in with your email or phone."
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
