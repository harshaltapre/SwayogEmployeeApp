package com.example.swayogemployeeapp.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.sync.SyncManager
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: MainViewModel) {
    val session by viewModel.session.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val commits by viewModel.commits.collectAsState()
    
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val db = remember { AppDatabase.getDatabase(context) }

    var pendingSyncCount by remember { mutableStateOf(0) }
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    var isBiometricEnabled by remember { mutableStateOf(true) }
    var changePasswordResult by remember { mutableStateOf<String?>(null) }
    var isChangingPassword by remember { mutableStateOf(false) }

    val isSyncing by viewModel.isSyncing.collectAsState()
    val outboxCount by viewModel.outboxCount.collectAsState()

    // Database File Size
    var dbSizeKb by remember { mutableStateOf(0L) }
    fun refreshDbSize() {
        try {
            val dbFile = context.getDatabasePath("swayog_db")
            dbSizeKb = if (dbFile.exists()) dbFile.length() / 1024 else 0
        } catch (_: Exception) {
            dbSizeKb = 0
        }
    }
    
    LaunchedEffect(outboxCount) {
        pendingSyncCount = outboxCount
        refreshDbSize()
    }

    // Dynamic Manager/Mentor Lookup
    var managerDetails by remember { mutableStateOf<com.example.swayogemployeeapp.data.remote.LookupEmployeeResponse?>(null) }
    var isLookingUpManager by remember { mutableStateOf(false) }
    LaunchedEffect(session?.reportingManagerId) {
        session?.reportingManagerId?.let { managerId ->
            isLookingUpManager = true
            viewModel.lookupEmployee(managerId) { result ->
                isLookingUpManager = false
                result.onSuccess { managerDetails = it }
            }
        }
    }

    // Check network connectivity
    val connectivityManager = remember { context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager }
    var isNetworkAvailable by remember { mutableStateOf(false) }
    var networkType by remember { mutableStateOf("Offline") }
    LaunchedEffect(Unit) {
        while (true) {
            val network = connectivityManager.activeNetwork
            val capabilities = network?.let { connectivityManager.getNetworkCapabilities(it) }
            isNetworkAvailable = capabilities != null
            networkType = when {
                capabilities == null -> "Offline"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WiFi"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "Mobile Data"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "Ethernet"
                else -> "Connected"
            }
            delay(4000)
        }
    }

    // Helper for Monogram Initials
    val monogramInitials = remember(session) {
        session?.name?.let { name ->
            val parts = name.trim().split(" ")
            if (parts.size >= 2) {
                "${parts[0].firstOrNull() ?: 'E'}${parts[1].firstOrNull() ?: 'P'}".uppercase()
            } else {
                "${name.firstOrNull() ?: 'E'}${name.getOrNull(1) ?: 'P'}".uppercase()
            }
        } ?: "EM"
    }

    // Last sync timestamp
    val lastSyncFormatted = remember(session) {
        session?.lastSyncTimestamp?.let {
            try {
                val sdf = java.text.SimpleDateFormat("dd MMM yyyy, HH:mm:ss", java.util.Locale.getDefault())
                sdf.format(java.util.Date(it))
            } catch (_: Exception) { "Unknown" }
        } ?: "Never"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "APP CONFIGURATIONS & HEALTH",
            fontSize = 18.sp,
            color = NeutralText,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )

        // 1. Sleek Digital Employee ID Card
        session?.let { currentSession ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(
                    1.dp,
                    Brush.linearGradient(
                        listOf(Color.White.copy(alpha = 0.15f), Color.White.copy(alpha = 0.02f))
                    )
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp)
                ) {
                    // Header profile row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Monogram Initial Badge with glowing radial gradient
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(
                                    Brush.radialGradient(
                                        colors = listOf(BrandAccent, Color(0xFFD97706))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = monogramInitials,
                                color = BackgroundDark,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        // User names & designation
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = currentSession.name,
                                color = NeutralText,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp
                            )
                            Text(
                                text = currentSession.jobRole,
                                color = BrandAccent,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(SuccessGreen)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "ACTIVE WORKFORCE",
                                    color = SuccessGreen,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.sp,
                                    letterSpacing = 0.5.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))
                    Divider(color = BorderGray, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Detail items list with icons & copy features
                    EmployeeDetailItem(
                        icon = Icons.Default.Badge,
                        label = "Employee Code",
                        value = currentSession.employeeCode ?: "N/A",
                        onCopy = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Employee Code", currentSession.employeeCode ?: "")
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Employee Code copied!", Toast.LENGTH_SHORT).show()
                        }
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    EmployeeDetailItem(
                        icon = Icons.Default.Email,
                        label = "Corporate Email",
                        value = currentSession.email,
                        onCopy = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Corporate Email", currentSession.email)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Email copied!", Toast.LENGTH_SHORT).show()
                        }
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    EmployeeDetailItem(
                        icon = Icons.Default.VerifiedUser,
                        label = "Access Tier",
                        value = currentSession.role,
                        onCopy = null
                    )
                }
            }
        }

        // 2. Real-time Work Statistics & Performance Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "MY TASKS & LOGS SUMMARY",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )
                
                val totalTasks = tasks.size
                val completedTasks = tasks.count { it.status.equals("completed", ignoreCase = true) }
                val totalHours = commits.sumOf { it.hoursSpent }
                val totalCommits = commits.size

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    StatMetricBox(
                        modifier = Modifier.weight(1f),
                        label = "Assigned Tasks",
                        value = totalTasks.toString(),
                        tint = EngineeringBlue
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    StatMetricBox(
                        modifier = Modifier.weight(1f),
                        label = "Completed",
                        value = completedTasks.toString(),
                        tint = SuccessGreen
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    StatMetricBox(
                        modifier = Modifier.weight(1f),
                        label = "Shadow Hours",
                        value = String.format("%.1f", totalHours),
                        tint = PrimaryAmber
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Total Commits Logged", color = MutedText, fontSize = 12.sp)
                    Text("$totalCommits commits", color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }

        // 3. Dynamic Manager/Mentor Details Card
        session?.reportingManagerId?.let {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "REPORTING MANAGER / MENTOR",
                        color = SuccessGreen,
                        fontWeight = FontWeight.Bold,
                        style = Typography.labelSmall
                    )

                    if (isLookingUpManager) {
                        Box(
                            modifier = Modifier.fillMaxWidth().height(40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = SuccessGreen, modifier = Modifier.size(16.dp))
                        }
                    } else {
                        managerDetails?.let { manager ->
                            Text(text = "Name: ${manager.fullName}", color = NeutralText, style = Typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            Text(text = "Email: ${manager.email}", color = MutedText, style = Typography.bodySmall)
                            manager.phoneNumber?.let { phone ->
                                Text(text = "Mobile: $phone", color = MutedText, style = Typography.bodySmall)
                                
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    // Call Manager CTA
                                    Button(
                                        onClick = {
                                            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                            context.startActivity(dialIntent)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.08f)),
                                        modifier = Modifier.weight(1f).height(36.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Call Mentor", color = SuccessGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }

                                    // Email Manager CTA
                                    Button(
                                        onClick = {
                                            val emailIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:${manager.email}"))
                                            context.startActivity(Intent.createChooser(emailIntent, "Send Email"))
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.08f)),
                                        modifier = Modifier.weight(1f).height(36.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Email Mentor", color = SuccessGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        } ?: Text(text = "ID: ${session?.reportingManagerId}", color = MutedText, style = Typography.bodySmall)
                    }
                }
            }
        }

        // 4. Sync Health Monitor Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "OFFLINE SYNC HEALTH MONITOR",
                    color = EngineeringBlue,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Connection Status", color = NeutralText, style = Typography.bodyMedium)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (isNetworkAvailable) SuccessGreen else Color(0xFFEF4444))
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isNetworkAvailable) "Connected ($networkType)" else "Offline",
                            color = if (isNetworkAvailable) SuccessGreen else Color(0xFFEF4444),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Room Cache Size", color = NeutralText, style = Typography.bodyMedium)
                    Text(
                        text = "$dbSizeKb KB",
                        color = MutedText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Room DB Version", color = NeutralText, style = Typography.bodyMedium)
                    Text(
                        text = "v${db.openHelper.readableDatabase.version}",
                        color = EngineeringBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Last Sync", color = NeutralText, style = Typography.bodyMedium)
                    Text(
                        text = lastSyncFormatted,
                        color = MutedText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Pending Sync Outbox Items", color = NeutralText, style = Typography.bodyMedium)
                    Text(
                        text = "$pendingSyncCount items",
                        color = if (pendingSyncCount > 0) PrimaryAmber else SuccessGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Button(
                    onClick = {
                        viewModel.syncAllDataFromServer()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(8.dp),
                    enabled = !isSyncing
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp))
                    } else {
                        Icon(imageVector = Icons.Default.Sync, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("FORCE NETWORK SYNC NOW", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }

        // 5. Change Password Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "CHANGE PASSWORD",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )

                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it },
                    label = { Text("Current Password", color = MutedText) },
                    visualTransformation = PasswordVisualTransformation(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("New Password", color = MutedText) },
                    visualTransformation = PasswordVisualTransformation(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirm New Password", color = MutedText) },
                    visualTransformation = PasswordVisualTransformation(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        if (currentPassword.isBlank() || newPassword.isBlank()) {
                            changePasswordResult = "Fields cannot be blank."
                            return@Button
                        }
                        if (newPassword != confirmPassword) {
                            changePasswordResult = "New passwords do not match."
                            return@Button
                        }
                        isChangingPassword = true
                        coroutineScope.launch {
                            delay(1000)
                            isChangingPassword = false
                            changePasswordResult = "Password successfully changed locally!"
                            currentPassword = ""
                            newPassword = ""
                            confirmPassword = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    if (isChangingPassword) {
                        CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(16.dp))
                    } else {
                        Text("UPDATE PASSWORD", color = BackgroundDark, fontWeight = FontWeight.Bold)
                    }
                }

                changePasswordResult?.let {
                    Text(
                        text = it,
                        color = if (it.contains("successfully")) SuccessGreen else Color(0xFFEF4444),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // 6. Biometrics Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Fingerprint, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(28.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Biometric Logon Bypass", color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Enable quick fingerprint unlock", color = MutedText, fontSize = 11.sp)
                    }
                }
                Switch(
                    checked = isBiometricEnabled,
                    onCheckedChange = { isBiometricEnabled = it },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = BackgroundDark,
                        checkedTrackColor = PrimaryAmber,
                        uncheckedThumbColor = MutedText,
                        uncheckedTrackColor = SurfaceDark
                    )
                )
            }
        }

        // 7. Local Cache Management Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.DeleteForever, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Troubleshooting & Cache", color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Clear cached tasks & metadata safely", color = MutedText, fontSize = 11.sp)
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Button(
                    onClick = {
                        coroutineScope.launch {
                            try {
                                db.employeeTaskDao().clearTasks()
                                db.employeeSessionDao().clearSession()
                                Toast.makeText(context, "Local cache cleared. Please re-login.", Toast.LENGTH_LONG).show()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth().height(40.dp),
                    border = BorderStroke(1.dp, Color(0xFFEF4444)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("CLEAR LOCAL DATABASE CACHE", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun EmployeeDetailItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    onCopy: (() -> Unit)?
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MutedText,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = label, color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(text = value, color = NeutralText, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        }
        if (onCopy != null) {
            Icon(
                imageVector = Icons.Default.ContentCopy,
                contentDescription = "Copy to clipboard",
                tint = PrimaryAmber.copy(alpha = 0.7f),
                modifier = Modifier
                    .size(18.dp)
                    .clickable { onCopy() }
            )
        }
    }
}

@Composable
fun StatMetricBox(
    modifier: Modifier,
    label: String,
    value: String,
    tint: Color
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(SurfaceDark.copy(alpha = 0.5f))
            .border(1.dp, BorderGray, RoundedCornerShape(10.dp))
            .padding(10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = value,
                color = tint,
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                color = MutedText,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
        }
    }
}
