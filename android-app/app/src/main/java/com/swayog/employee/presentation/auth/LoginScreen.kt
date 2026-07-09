package com.swayog.employee.presentation.auth

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.common.components.*

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val loginState by viewModel.loginState.collectAsState()
    val email by viewModel.email.collectAsState()
    val password by viewModel.password.collectAsState()
    val credentialMode by viewModel.credentialMode.collectAsState()
    val phoneNumber by viewModel.phoneNumber.collectAsState()
    val otp by viewModel.otp.collectAsState()
    val isPasswordVisible by viewModel.isPasswordVisible.collectAsState()
    val isBiometricAvailable by viewModel.isBiometricAvailable.collectAsState()
    val context = LocalContext.current
    
    fun triggerBiometricPrompt() {
        val activity = context as? androidx.fragment.app.FragmentActivity
        if (activity == null) {
            Toast.makeText(context, "Biometric authentication not supported in this context", Toast.LENGTH_SHORT).show()
            return
        }
        val executor = androidx.core.content.ContextCompat.getMainExecutor(context)
        val biometricPrompt = androidx.biometric.BiometricPrompt(
            activity,
            executor,
            object : androidx.biometric.BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    Toast.makeText(context, "Authentication error: $errString", Toast.LENGTH_SHORT).show()
                }
                
                override fun onAuthenticationSucceeded(result: androidx.biometric.BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    viewModel.loginWithBiometricSuccess()
                }
            }
        )
        
        val promptInfo = androidx.biometric.BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Login")
            .setSubtitle("Log in using biometric authentication")
            .setNegativeButtonText("Use Credentials")
            .build()
            
        biometricPrompt.authenticate(promptInfo)
    }

    LaunchedEffect(Unit) {
        viewModel.checkBiometricAvailability()
    }
    
    LaunchedEffect(loginState) {
        if (loginState is LoginState.Success) {
            onLoginSuccess()
        }
    }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "SWAYOG Employee",
                modifier = Modifier.fillMaxWidth()
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Spacer(modifier = Modifier.height(16.dp))
                
                // Logo/Icon placeholder
                Card(
                    modifier = Modifier.size(100.dp),
                    shape = MaterialTheme.shapes.extraLarge,
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF386FA4) // BrandBlue
                    )
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Text(
                            text = "SE",
                            style = MaterialTheme.typography.headlineLarge,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Text(
                    text = "Sign in to access your dashboard",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                
                // Login Mode Tabs
                TabRow(
                    selectedTabIndex = if (credentialMode == "email_passcode") 0 else 1,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp))
                ) {
                    Tab(
                        selected = credentialMode == "email_passcode",
                        onClick = { viewModel.setCredentialMode("email_passcode") },
                        text = { Text("Email / ID") }
                    )
                    Tab(
                        selected = credentialMode == "mobile_otp",
                        onClick = { viewModel.setCredentialMode("mobile_otp") },
                        text = { Text("Phone OTP") }
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                if (credentialMode == "email_passcode") {
                    // Email Field
                    SwayogTextField(
                        value = email,
                        onValueChange = viewModel::onEmailChange,
                        label = "Email / Login ID",
                        placeholder = "Enter email or EMP-XXXXXX",
                        keyboardType = KeyboardType.Email,
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.Default.Email,
                                contentDescription = "Email",
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    )
                    
                    // Password Field
                    SwayogTextField(
                        value = password,
                        onValueChange = viewModel::onPasswordChange,
                        label = "Password",
                        placeholder = "Enter your password",
                        keyboardType = KeyboardType.Password,
                        visualTransformation = if (isPasswordVisible) {
                            VisualTransformation.None
                        } else {
                            PasswordVisualTransformation()
                        },
                        trailingIcon = {
                            IconButton(onClick = viewModel::togglePasswordVisibility) {
                                Icon(
                                    imageVector = if (isPasswordVisible) {
                                        Icons.Default.VisibilityOff
                                    } else {
                                        Icons.Default.Visibility
                                    },
                                    contentDescription = if (isPasswordVisible) "Hide password" else "Show password",
                                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                        }
                    )
                } else {
                    // Phone Field
                    SwayogTextField(
                        value = phoneNumber,
                        onValueChange = viewModel::onPhoneNumberChange,
                        label = "Phone Number",
                        placeholder = "Enter phone number",
                        keyboardType = KeyboardType.Phone,
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = "Phone",
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    )
                    
                    // OTP Field
                    SwayogTextField(
                        value = otp,
                        onValueChange = viewModel::onOtpChange,
                        label = "OTP Code",
                        placeholder = "Enter OTP code",
                        keyboardType = KeyboardType.Number,
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "OTP",
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    )
                }
                
                // Login Button
                SwayogButton(
                    text = "Login",
                    onClick = viewModel::login,
                    isLoading = loginState is LoginState.Loading,
                    enabled = if (credentialMode == "email_passcode") {
                        email.isNotBlank() && password.isNotBlank()
                    } else {
                        phoneNumber.isNotBlank() && otp.isNotBlank()
                    }
                )
                
                // Biometric Login
                if (isBiometricAvailable) {
                    SwayogButton(
                        text = "Login with Biometric",
                        onClick = { triggerBiometricPrompt() },
                        variant = ButtonVariant.Secondary
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Error Message
                if (loginState is LoginState.Error) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = (loginState as LoginState.Error).message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Version Info
                Text(
                    text = "Version 1.0.0",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
            }
        }
    }
}
