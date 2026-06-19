package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: MainViewModel,
    onLoginSuccess: (EmployeeSessionEntity) -> Unit
) {
    var isOtpMode by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("") }
    var securityCode by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isAuthenticating by remember { mutableStateOf(false) }

    // Preconfigured Mock accounts for testing
    val mockProfiles = listOf(
        MockProfile("coordinator@swayog.com", "123456", "Service Coordinator", "SUB_ADMIN"),
        MockProfile("surveyor@swayog.com", "123456", "Site Survey Engineer", "EMPLOYEE"),
        MockProfile("designer@swayog.com", "123456", "Solar Design Engineer", "EMPLOYEE"),
        MockProfile("electrical@swayog.com", "123456", "Electrical Engineer", "EMPLOYEE"),
        MockProfile("inventory@swayog.com", "123456", "Inventory Executive", "EMPLOYEE"),
        MockProfile("technician@swayog.com", "123456", "O&M Technician", "EMPLOYEE"),
        MockProfile("service@swayog.com", "123456", "Service Engineer", "EMPLOYEE"),
        MockProfile("analyst@swayog.com", "123456", "Monitoring Analyst", "EMPLOYEE"),
        MockProfile("intern@swayog.com", "123456", "Intern", "EMPLOYEE")
    )

    Scaffold(
        containerColor = BackgroundDark
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(32.dp))

            // Logo & Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.FlashOn,
                    contentDescription = "Solar Energy Logo",
                    tint = PrimaryAmber,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "SWAYOG",
                    style = Typography.displayLarge,
                    color = PrimaryAmber,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Text(
                text = "CleanTech Engineering Solutions",
                style = Typography.bodyMedium,
                color = MutedText,
                modifier = Modifier.padding(bottom = 40.dp)
            )

            // Auth Card
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "SWAYOG ENTERPRISE LOGON",
                        style = Typography.titleMedium,
                        color = NeutralText,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 20.dp)
                    )

                    // Select Access Mode tabs
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(BackgroundDark)
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (!isOtpMode) PrimaryAmber else Color.Transparent)
                                .clickable { isOtpMode = false },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Passcode/Email",
                                color = if (!isOtpMode) BackgroundDark else MutedText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isOtpMode) PrimaryAmber else Color.Transparent)
                                .clickable { isOtpMode = true },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Mobile OTP",
                                color = if (isOtpMode) BackgroundDark else MutedText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Username Input
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text(if (isOtpMode) "Mobile Number" else "Username / Email", color = MutedText) },
                        leadingIcon = {
                            Icon(
                                imageVector = if (isOtpMode) Icons.Default.Phone else Icons.Default.Person,
                                contentDescription = "User Icon",
                                tint = EngineeringBlue
                            )
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray,
                            cursorColor = PrimaryAmber
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Password/OTP Input
                    OutlinedTextField(
                        value = securityCode,
                        onValueChange = { securityCode = it },
                        label = { Text(if (isOtpMode) "SMS OTP Code" else "Security Password", color = MutedText) },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Lock Icon",
                                tint = EngineeringBlue
                            )
                        },
                        visualTransformation = PasswordVisualTransformation(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray,
                            cursorColor = PrimaryAmber
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Error Message
                    errorMessage?.let {
                        Text(
                            text = it,
                            color = Color(0xFFEF4444),
                            style = Typography.bodyMedium,
                            modifier = Modifier.padding(bottom = 16.dp),
                            textAlign = TextAlign.Center
                        )
                    }

                    // Submit Button
                    Button(
                        onClick = {
                            if (username.isBlank() || securityCode.isBlank()) {
                                errorMessage = "Please enter both credentials."
                                return@Button
                            }
                            isAuthenticating = true
                            errorMessage = null
                            viewModel.login(username, securityCode, isOtpMode) { result ->
                                isAuthenticating = false
                                result.fold(
                                    onSuccess = { onLoginSuccess(it) },
                                    onFailure = { errorMessage = it.message }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (isAuthenticating) {
                            CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
                        } else {
                            Text(
                                text = "SIGN IN NOW",
                                color = BackgroundDark,
                                fontWeight = FontWeight.Bold,
                                style = Typography.bodyLarge
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Biometrics bypass
                    IconButton(
                        onClick = {
                            // Simulator bypass: log in Surveyor by default if using fingerprint
                            isAuthenticating = true
                            viewModel.login("surveyor@swayog.com", "123456", false) { result ->
                                isAuthenticating = false
                                result.fold(
                                    onSuccess = { onLoginSuccess(it) },
                                    onFailure = { errorMessage = it.message }
                                )
                            }
                        },
                        modifier = Modifier.size(50.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Fingerprint,
                            contentDescription = "Fingerprint Login Bypass",
                            tint = SuccessGreen,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                    Text(
                        text = "Touch to bypass (Biometrics Mock)",
                        style = Typography.labelSmall,
                        color = MutedText
                    )
                }
            }

            // Reviewer's Profiles switch panel
            Text(
                text = "REVIEWER DEMO: TAP PROFILE TO LOGIN INSTANTLY",
                style = Typography.labelSmall,
                color = PrimaryAmber,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            mockProfiles.forEach { profile ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                        .clickable {
                            username = profile.email
                            securityCode = profile.code
                            isOtpMode = false
                            isAuthenticating = true
                            viewModel.login(profile.email, profile.code, false) { result ->
                                isAuthenticating = false
                                result.fold(
                                    onSuccess = { onLoginSuccess(it) },
                                    onFailure = { errorMessage = it.message }
                                )
                            }
                        }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = profile.jobRole,
                                style = Typography.titleMedium,
                                color = NeutralText,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = profile.email,
                                style = Typography.bodyMedium,
                                color = MutedText
                            )
                        }
                        Badge(
                            containerColor = if (profile.role == "SUB_ADMIN") EngineeringBlue else PrimaryAmber
                        ) {
                            Text(
                                text = profile.role,
                                color = BackgroundDark,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

data class MockProfile(
    val email: String,
    val code: String,
    val jobRole: String,
    val role: String
)
