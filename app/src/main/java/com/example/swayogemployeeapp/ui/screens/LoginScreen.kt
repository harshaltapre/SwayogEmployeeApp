package com.example.swayogemployeeapp.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.ui.theme.*

data class PresetRole(
    val label: String,
    val email: String,
    val code: String,
    val isOtp: Boolean
)

enum class LoginTab { EMPLOYEE_ID, EMAIL, MOBILE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: MainViewModel,
    onLoginSuccess: (EmployeeSessionEntity) -> Unit
) {
    var selectedTab by remember { mutableStateOf(LoginTab.EMPLOYEE_ID) }
    var username by remember { mutableStateOf("") }
    var securityCode by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isAuthenticating by remember { mutableStateOf(false) }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var showPresets by remember { mutableStateOf(false) }
    var keepMeLoggedIn by remember { mutableStateOf(false) }

    var lookupResult by remember { mutableStateOf<com.example.swayogemployeeapp.data.remote.LookupEmployeeResponse?>(null) }
    var isLookingUp by remember { mutableStateOf(false) }
    var lookupError by remember { mutableStateOf<String?>(null) }

    val employeeTabBg by animateColorAsState(if (selectedTab == LoginTab.EMPLOYEE_ID) BrandSecondary else Color.Transparent, label = "employeeTabBg")
    val employeeTabText by animateColorAsState(if (selectedTab == LoginTab.EMPLOYEE_ID) NeutralText else MutedText, label = "employeeTabText")
    val emailTabBg by animateColorAsState(if (selectedTab == LoginTab.EMAIL) BrandSecondary else Color.Transparent, label = "emailTabBg")
    val emailTabText by animateColorAsState(if (selectedTab == LoginTab.EMAIL) NeutralText else MutedText, label = "emailTabText")
    val mobileTabBg by animateColorAsState(if (selectedTab == LoginTab.MOBILE) BrandSecondary else Color.Transparent, label = "mobileTabBg")
    val mobileTabText by animateColorAsState(if (selectedTab == LoginTab.MOBILE) NeutralText else MutedText, label = "mobileTabText")

    Scaffold(
        containerColor = BackgroundDark
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            BrandPrimary.copy(alpha = 0.35f),
                            BackgroundDark
                        ),
                        radius = 2000f
                    )
                )
                .padding(innerPadding),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Spacer(modifier = Modifier.height(20.dp))

                // WorkForce Logo and Monogram
                Box(
                    modifier = Modifier.padding(bottom = 16.dp)
                ) {
                    WorkForceLogo(size = 96.dp)
                }

                Text(
                    text = "WorkForce Pro",
                    color = NeutralText,
                    fontWeight = FontWeight.Black,
                    fontSize = 32.sp,
                    letterSpacing = 1.5.sp
                )

                Text(
                    text = "Empowering Teams • Simplifying Workflows",
                    color = NeutralText.copy(alpha = 0.6f),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(bottom = 28.dp)
                )

                // Glassmorphism login card
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White.copy(alpha = 0.06f)
                    ),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(
                        1.dp,
                        Brush.linearGradient(
                            listOf(
                                Color.White.copy(alpha = 0.18f),
                                Color.White.copy(alpha = 0.02f)
                            )
                        )
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Title
                        Text(
                            text = "EMPLOYEE PORTAL ACCESS",
                            fontSize = 14.sp,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Role Selector - Restricted Employee Only Badge
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(GoogleBlue.copy(alpha = 0.1f))
                                .border(1.dp, GoogleBlue.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .padding(vertical = 8.dp, horizontal = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Authorized Lock Icon",
                                tint = GoogleBlue,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "RESTRICTED ACCESS • EMPLOYEES ONLY",
                                color = GoogleBlue,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Select Access Mode tabs (Material 3 Segmented Control)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .clip(PillShape)
                                .background(SurfaceDark)
                                .border(1.dp, DividerDark, PillShape)
                                .padding(4.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(PillShape)
                                    .background(if (selectedTab == LoginTab.EMPLOYEE_ID) GoogleBlue else Color.Transparent)
                                    .clickable { selectedTab = LoginTab.EMPLOYEE_ID; lookupResult = null; lookupError = null },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Emp ID",
                                    color = if (selectedTab == LoginTab.EMPLOYEE_ID) Color.White else SecondaryTextDark,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(PillShape)
                                    .background(if (selectedTab == LoginTab.EMAIL) GoogleBlue else Color.Transparent)
                                    .clickable { selectedTab = LoginTab.EMAIL; lookupResult = null; lookupError = null },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Email",
                                    color = if (selectedTab == LoginTab.EMAIL) Color.White else SecondaryTextDark,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(PillShape)
                                    .background(if (selectedTab == LoginTab.MOBILE) GoogleBlue else Color.Transparent)
                                    .clickable { selectedTab = LoginTab.MOBILE; lookupResult = null; lookupError = null },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Mobile",
                                    color = if (selectedTab == LoginTab.MOBILE) Color.White else SecondaryTextDark,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Username Input
                        OutlinedTextField(
                            value = username,
                            onValueChange = { username = it },
                            label = {
                                Text(
                                    when (selectedTab) {
                                        LoginTab.EMPLOYEE_ID -> "Employee ID (e.g. EMP-XXXXXX)"
                                        LoginTab.EMAIL -> "Email Address"
                                        LoginTab.MOBILE -> "Mobile Number"
                                    },
                                    color = SecondaryTextDark
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = when (selectedTab) {
                                        LoginTab.EMPLOYEE_ID -> Icons.Default.Person
                                        LoginTab.EMAIL -> Icons.Default.Email
                                        LoginTab.MOBILE -> Icons.Default.Phone
                                    },
                                    contentDescription = "User Icon",
                                    tint = if (username.isNotEmpty()) GoogleBlue else SecondaryTextDark
                                )
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = PrimaryTextDark,
                                unfocusedTextColor = PrimaryTextDark,
                                focusedLabelColor = GoogleBlue,
                                unfocusedLabelColor = SecondaryTextDark,
                                focusedBorderColor = GoogleBlue,
                                unfocusedBorderColor = DividerDark,
                                cursorColor = GoogleBlue,
                                focusedContainerColor = SurfaceVariantDark.copy(alpha = 0.5f),
                                unfocusedContainerColor = SurfaceDark
                            ),
                            shape = InputFieldShape,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Profile lookup trigger for Employee ID or Mobile
                        if (username.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                if (isLookingUp) {
                                    CircularProgressIndicator(
                                        color = BrandAccent,
                                        modifier = Modifier.size(16.dp),
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Text(
                                        text = "🔍 Verify & Look up Registered Details",
                                        color = BrandAccent,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier
                                            .clickable {
                                                isLookingUp = true
                                                lookupError = null
                                                lookupResult = null
                                                viewModel.lookupEmployee(username) { result ->
                                                    isLookingUp = false
                                                    result.fold(
                                                        onSuccess = { lookupResult = it },
                                                        onFailure = { lookupError = it.message }
                                                    )
                                                }
                                            }
                                            .padding(4.dp)
                                    )
                                }
                            }
                        }

                        // Display lookup result
                        lookupResult?.let { result ->
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = Color.White.copy(alpha = 0.05f)
                                ),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, BrandAccent.copy(alpha = 0.3f)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "Verified: ${result.fullName}",
                                        color = NeutralText,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Registered Email: ${result.email}", color = NeutralText.copy(alpha = 0.7f), fontSize = 11.sp)
                                    Text("Registered Mobile: ${result.phoneNumber ?: "Not set"}", color = NeutralText.copy(alpha = 0.7f), fontSize = 11.sp)
                                    Text("Employee ID: ${result.loginId}", color = NeutralText.copy(alpha = 0.7f), fontSize = 11.sp)
                                }
                            }
                        }

                        // Display lookup error
                        lookupError?.let { err ->
                            Text(
                                text = "⚠️ $err",
                                color = BrandError,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Password Input
                        OutlinedTextField(
                            value = securityCode,
                            onValueChange = { securityCode = it },
                            label = { Text("Security Password", color = SecondaryTextDark) },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Lock Icon",
                                    tint = if (securityCode.isNotEmpty()) GoogleBlue else SecondaryTextDark
                                )
                            },
                            trailingIcon = {
                                val image = if (isPasswordVisible) {
                                    Icons.Filled.Visibility
                                } else {
                                    Icons.Filled.VisibilityOff
                                }
                                IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                    Icon(imageVector = image, contentDescription = "Toggle Password", tint = SecondaryTextDark)
                                }
                            },
                            visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = PrimaryTextDark,
                                unfocusedTextColor = PrimaryTextDark,
                                focusedLabelColor = GoogleBlue,
                                unfocusedLabelColor = SecondaryTextDark,
                                focusedBorderColor = GoogleBlue,
                                unfocusedBorderColor = DividerDark,
                                cursorColor = GoogleBlue,
                                focusedContainerColor = SurfaceVariantDark.copy(alpha = 0.5f),
                                unfocusedContainerColor = SurfaceDark
                            ),
                            shape = InputFieldShape,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        // Custom Spring Toggle Switch: "Keep me logged in"
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { keepMeLoggedIn = !keepMeLoggedIn }
                                .padding(vertical = 4.dp)
                        ) {
                            Text(
                                text = "Keep me logged in",
                                color = PrimaryTextDark.copy(alpha = 0.9f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.weight(1f)
                            )
                            val thumbOffset by animateDpAsState(
                                targetValue = if (keepMeLoggedIn) 24.dp else 2.dp,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                    stiffness = Spring.StiffnessLow
                                ),
                                label = "switchThumb"
                            )
                            val trackColor by animateColorAsState(
                                targetValue = if (keepMeLoggedIn) GoogleBlue else SurfaceVariantDark,
                                label = "switchTrack"
                            )
                            Box(
                                modifier = Modifier
                                    .size(width = 48.dp, height = 26.dp)
                                    .clip(CircleShape)
                                    .background(trackColor)
                                    .border(1.dp, DividerDark, CircleShape)
                                    .padding(2.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .offset(x = thumbOffset)
                                        .size(22.dp)
                                        .clip(CircleShape)
                                        .background(Color.White)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(22.dp))

                        // Error Message Banner (Google Red container)
                        errorMessage?.let {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 14.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(GoogleRed.copy(alpha = 0.15f))
                                    .border(1.dp, GoogleRed.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = it,
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Submit Button (Google Material 3 Pill Button: Google Blue with White Text)
                        Button(
                            onClick = {
                                if (username.isBlank() || securityCode.isBlank()) {
                                    errorMessage = "Please enter both credentials."
                                    return@Button
                                }
                                isAuthenticating = true
                                errorMessage = null
                                viewModel.login(username, securityCode, selectedTab == LoginTab.MOBILE) { result ->
                                    isAuthenticating = false
                                    result.fold(
                                        onSuccess = { onLoginSuccess(it) },
                                        onFailure = { errorMessage = it.message }
                                    )
                                }
                            },
                            shape = PillShape,
                            colors = ButtonDefaults.buttonColors(containerColor = GoogleBlue),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            if (isAuthenticating) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.5.dp)
                            } else {
                                Text(
                                    text = "SIGN IN NOW",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    letterSpacing = 1.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Forgot Password button
                        Text(
                            text = "Forgot Password?",
                            color = GoogleBlue,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier
                                .clickable { /* Forgot Password clicked */ }
                                .padding(vertical = 4.dp)
                        )
                    }
                }

                // Biometric Login Pulse Concentric Rings
                val pulseTransition = rememberInfiniteTransition(label = "pulse")
                val pulseScale by pulseTransition.animateFloat(
                    initialValue = 1.0f,
                    targetValue = 1.3f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(1800, easing = EaseOutQuad),
                        repeatMode = RepeatMode.Restart
                    ),
                    label = "biometricPulse"
                )
                val pulseAlpha by pulseTransition.animateFloat(
                    initialValue = 0.6f,
                    targetValue = 0.0f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(1800, easing = EaseOutQuad),
                        repeatMode = RepeatMode.Restart
                    ),
                    label = "biometricAlpha"
                )

                Text(
                    text = "Authorized Biometrics Login",
                    color = MutedText,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .padding(bottom = 28.dp)
                        .size(76.dp)
                        .clickable {
                            // Prefill and login directly with default role
                            username = "harshaltapre26@gmail.com"
                            securityCode = "Password@123"
                            selectedTab = LoginTab.EMAIL
                            isAuthenticating = true
                            viewModel.login(username, securityCode, false) { result ->
                                isAuthenticating = false
                                result.fold(
                                    onSuccess = { onLoginSuccess(it) },
                                    onFailure = { errorMessage = it.message }
                                )
                            }
                        }
                ) {
                    // Outer Ring
                    Box(
                        modifier = Modifier
                            .size(62.dp)
                            .graphicsLayer {
                                scaleX = pulseScale
                                scaleY = pulseScale
                                alpha = pulseAlpha
                            }
                            .border(2.dp, BrandAccent.copy(alpha = 0.6f), CircleShape)
                    )
                    // Inner Ring
                    Box(
                        modifier = Modifier
                            .size(62.dp)
                            .graphicsLayer {
                                scaleX = 1f + (pulseScale - 1f) * 0.5f
                                scaleY = 1f + (pulseScale - 1f) * 0.5f
                                alpha = pulseAlpha * 0.8f
                            }
                            .border(1.5.dp, BrandSecondary.copy(alpha = 0.5f), CircleShape)
                    )
                    // Core scanning pad
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.1f))
                            .border(1.dp, Color.White.copy(alpha = 0.25f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Fingerprint,
                            contentDescription = "Biometric Login",
                            tint = BrandAccent,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }

                // Expandable Developer Presets Card (Diagnostic view)
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, BorderGray),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showPresets = !showPresets },
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Build, contentDescription = null, tint = BrandSecondary, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Diagnostic Quick-Fill Tools",
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                            Icon(
                                imageVector = if (showPresets) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                tint = MutedText,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        
                        if (showPresets) {
                            Text(
                                text = "Pre-fill dynamic mock employee profiles for sandbox diagnostics:",
                                color = MutedText,
                                fontSize = 11.sp
                            )
                            
                            val presetsList = listOf(
                                PresetRole("Survey Eng", "shantanumahalle@gmail.com", "Password@123", false),
                                PresetRole("O&M Tech", "mohsinali@gmail.com", "Password@123", false),
                                PresetRole("Monitoring", "sagarkinkar@gmail.com", "Password@123", false),
                                PresetRole("Service Eng", "rohittripathi@gmail.com", "Password@123", false),
                                PresetRole("Team Lead", "swayogtech@gmail.com", "Password@123", false),
                                PresetRole("Dept Head", "swayogi26@gmail.com", "Password@123", false),
                                PresetRole("Inventory", "swpl.procurement@gmail.com", "Password@123", false),
                                PresetRole("Intern", "harshaltapre26@gmail.com", "Password@123", false)
                            )
                            
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                presetsList.chunked(3).forEach { rowPresets ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        rowPresets.forEach { preset ->
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(SurfaceDark.copy(alpha = 0.6f))
                                                    .border(1.dp, BorderGray, RoundedCornerShape(8.dp))
                                                    .clickable {
                                                        username = preset.email
                                                        securityCode = preset.code
                                                        selectedTab = LoginTab.EMAIL
                                                        lookupResult = null
                                                        lookupError = null
                                                        errorMessage = null
                                                    }
                                                    .padding(vertical = 10.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = preset.label,
                                                    color = NeutralText,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    textAlign = TextAlign.Center
                                                )
                                            }
                                        }
                                        if (rowPresets.size < 3) {
                                            repeat(3 - rowPresets.size) {
                                                Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))
                
                Text(
                    text = "Swayog CleanTech WorkForce Pro",
                    color = MutedText.copy(alpha = 0.6f),
                    fontSize = 11.sp,
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }
        }
    }
}
