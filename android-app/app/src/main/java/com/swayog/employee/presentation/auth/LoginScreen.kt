package com.swayog.employee.presentation.auth

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Settings
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
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.BuildConfig
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.presentation.common.components.*
import kotlinx.coroutines.launch

import androidx.compose.foundation.clickable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.autofill.AutofillType

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val loginState by viewModel.loginState.collectAsState()
    val email by viewModel.email.collectAsState()
    val password by viewModel.password.collectAsState()
    val selectedRole by viewModel.selectedRole.collectAsState()
    val savePassword by viewModel.savePassword.collectAsState()
    val isPasswordVisible by viewModel.isPasswordVisible.collectAsState()
    val isBiometricAvailable by viewModel.isBiometricAvailable.collectAsState()
    val context = LocalContext.current

    // Server URL configuration state
    var showServerDialog by remember { mutableStateOf(false) }
    var serverUrlInput by remember { mutableStateOf("") }
    
    LaunchedEffect(Unit) {
        viewModel.serverUrl.collect { saved ->
            serverUrlInput = saved ?: BuildConfig.API_BASE_URL
        }
    }
    
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
            try {
                val autofillManager = context.getSystemService(android.view.autofill.AutofillManager::class.java)
                autofillManager?.commit()
            } catch (e: Exception) {
                // Ignore if autofill service unavailable
            }
            onLoginSuccess()
        }
    }
    
    val windowSize = com.swayog.employee.presentation.common.responsive.LocalWindowSizeInfo.current

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "SWAYOG Employee",
                modifier = Modifier.fillMaxWidth(),
                actions = {
                    IconButton(onClick = { showServerDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Server Settings",
                            tint = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .imePadding(),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = if (windowSize.isTablet || windowSize.isLandscape) 520.dp else androidx.compose.ui.unit.Dp.Unspecified),
                contentAlignment = Alignment.TopCenter
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = windowSize.contentPadding, vertical = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(if (windowSize.isCompact) 12.dp else 16.dp)
                ) {
                    Spacer(modifier = Modifier.height(if (windowSize.isLandscape) 8.dp else 20.dp))
                    
                    // App Logo
                    androidx.compose.foundation.Image(
                        painter = androidx.compose.ui.res.painterResource(id = com.swayog.employee.R.drawable.app_logo),
                        contentDescription = "SWAYOG Logo",
                        modifier = Modifier
                            .size(if (windowSize.isCompact) 84.dp else if (windowSize.isLandscape) 90.dp else 110.dp)
                            .clip(RoundedCornerShape(22.dp))
                    )
                    
                    Text(
                        text = "Welcome Back",
                        style = if (windowSize.isCompact) MaterialTheme.typography.titleLarge else MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Text(
                        text = "Sign in to access your dashboard",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    
                    Spacer(modifier = Modifier.height(4.dp))

                    // Role Selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(
                            "EMPLOYEE" to "Employee",
                            "SUB_ADMIN" to "AMC Mgmt",
                            "AMC_COORDINATOR" to "Coordinator"
                        ).forEach { (role, label) ->
                            val isSelected = selectedRole == role
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.onRoleChange(role) },
                                label = { Text(label, fontSize = 12.sp) },
                                modifier = Modifier.weight(1f),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFF386FA4).copy(alpha = 0.15f),
                                    selectedLabelColor = Color(0xFF386FA4)
                                )
                            )
                        }
                    }
                    
                    // Email / Login ID Field
                    SwayogTextField(
                        value = email,
                        onValueChange = viewModel::onEmailChange,
                        label = "Email / Login ID",
                        placeholder = "Enter email or EMP-XXXXXX",
                        keyboardType = KeyboardType.Email,
                        autofillTypes = listOf(AutofillType.EmailAddress, AutofillType.Username),
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
                        autofillTypes = listOf(AutofillType.Password),
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

                    // Save Password / Remember Credentials Option
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.onSavePasswordChange(!savePassword) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = savePassword,
                            onCheckedChange = viewModel::onSavePasswordChange,
                            colors = CheckboxDefaults.colors(
                                checkedColor = Color(0xFF386FA4)
                            )
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text(
                                text = "Save password",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Save credentials for easy access",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    
                    // Login Button
                    SwayogButton(
                        text = "Login",
                        onClick = viewModel::login,
                        isLoading = loginState is LoginState.Loading,
                        enabled = (loginState !is LoginState.Loading) && email.isNotBlank() && password.isNotBlank()
                    )
                    
                    // Biometric Login
                    if (isBiometricAvailable) {
                        SwayogButton(
                            text = "Login with Biometric",
                            onClick = { triggerBiometricPrompt() },
                            variant = ButtonVariant.Secondary
                        )
                    }
                    
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
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
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

    // Server URL Configuration Dialog
    if (showServerDialog) {
        Dialog(onDismissRequest = { showServerDialog = false }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Server Configuration",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Connected Production Server:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    OutlinedTextField(
                        value = com.swayog.employee.core.config.AppConfig.API_BASE_URL,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Production Server URL") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(onClick = {
                            showServerDialog = false
                        }) {
                            Text("Close")
                        }
                    }
                }
            }
        }
    }
}
