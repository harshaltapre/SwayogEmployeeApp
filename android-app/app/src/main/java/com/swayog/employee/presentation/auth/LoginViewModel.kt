package com.swayog.employee.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
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
    
    fun onEmailChange(newEmail: String) {
        _email.value = newEmail
    }
    
    fun onPasswordChange(newPassword: String) {
        _password.value = newPassword
    }
    
    fun togglePasswordVisibility() {
        _isPasswordVisible.value = !_isPasswordVisible.value
    }
    
    fun checkBiometricAvailability() {
        // This will be implemented with BiometricPrompt
        _isBiometricAvailable.value = true
    }
    
    fun login() {
        val emailValue = _email.value.trim()
        val passwordValue = _password.value
        
        if (emailValue.isBlank()) {
            _loginState.value = LoginState.Error("Please enter your email")
            return
        }
        
        if (!isValidEmail(emailValue)) {
            _loginState.value = LoginState.Error("Please enter a valid email address")
            return
        }
        
        if (passwordValue.isBlank()) {
            _loginState.value = LoginState.Error("Please enter your password")
            return
        }
        
        if (passwordValue.length < 6) {
            _loginState.value = LoginState.Error("Password must be at least 6 characters")
            return
        }
        
        // Handle mock login for testing
        if (emailValue == "test@swayog.com" && passwordValue == "password123") {
            mockLogin()
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
    
    private fun isValidEmail(email: String): Boolean {
        val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        return email.matches(emailRegex.toRegex())
    }
    
    fun loginWithBiometric() {
        // This will be implemented with BiometricPrompt
        _loginState.value = LoginState.Error("Biometric authentication not yet implemented")
    }
    
    private fun mockLogin() {
        _loginState.value = LoginState.Loading
        viewModelScope.launch {
            authRepository.mockLogin()
                .onSuccess { authResponse ->
                    _loginState.value = LoginState.Success(authResponse)
                }
                .onFailure { error ->
                    _loginState.value = LoginState.Error(
                        error.message ?: "Mock login failed"
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
