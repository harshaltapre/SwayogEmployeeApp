package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.*
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceScreen(
    viewModel: MainViewModel,
    onNavigateToDashboard: () -> Unit,
    onLogout: () -> Unit
) {
    val attendanceState by viewModel.todayAttendance.collectAsState()
    val isBreakActive by viewModel.isBreakActive.collectAsState()
    val session by viewModel.session.collectAsState()

    var elapsedSeconds by remember { mutableLongStateOf(0L) }
    var showCommitModal by remember { mutableStateOf(false) }

    // Lat/Lng Simulation state (HQ coordinates by default)
    val simulatedLat = 19.123456
    val simulatedLng = 72.890123
    val geofenceDistanceMeters = 12

    val isCheckedIn = attendanceState != null && attendanceState?.checkInTime != null
    val isCheckedOut = attendanceState != null && attendanceState?.checkOutTime != null

    // Infinite transition for pulsating circle animation
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Elapsed timer logic
    LaunchedEffect(attendanceState, isBreakActive) {
        if (attendanceState != null && !isCheckedOut) {
            val checkInStr = attendanceState?.checkInTime
            if (checkInStr != null) {
                val checkInTimeMs = try {
                    val f1 = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply { timeZone = TimeZone.getTimeZone("UTC") }
                    f1.parse(checkInStr)?.time
                } catch (e: Exception) {
                    try {
                        val f2 = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()).apply { timeZone = TimeZone.getTimeZone("UTC") }
                        f2.parse(checkInStr)?.time
                    } catch (e2: Exception) {
                        null
                    }
                }
                
                if (checkInTimeMs != null) {
                    while (true) {
                        val now = System.currentTimeMillis()
                        val totalDelta = (now - checkInTimeMs) / 1000
                        val breakSecs = attendanceState?.totalBreakDurationSeconds ?: 0L
                        var activeDelta = totalDelta - breakSecs
                        elapsedSeconds = if (activeDelta > 0) activeDelta else 0
                        delay(1000)
                    }
                }
            }
        } else if (isCheckedOut) {
            // Compute static elapsed time
            val checkInStr = attendanceState?.checkInTime
            val checkOutStr = attendanceState?.checkOutTime
            if (checkInStr != null && checkOutStr != null) {
                val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                try {
                    val checkInDate = format.parse(checkInStr)
                    val checkOutDate = format.parse(checkOutStr)
                    if (checkInDate != null && checkOutDate != null) {
                        val breakSecs = attendanceState?.totalBreakDurationSeconds ?: 0L
                        elapsedSeconds = ((checkOutDate.time - checkInDate.time) / 1000) - breakSecs
                    }
                } catch (e: Exception) {}
            }
        } else {
            elapsedSeconds = 0
        }
    }

    // Helper to convert seconds to HH:MM:SS
    fun formatElapsedTime(seconds: Long): String {
        val hrs = seconds / 3600
        val mins = (seconds % 3600) / 60
        val secs = seconds % 60
        return String.format("%02d:%02d:%02d", hrs, mins, secs)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = "WorkForce Attendance", 
                        color = NeutralText, 
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        letterSpacing = 0.5.sp
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundDark.copy(alpha = 0.85f),
                    titleContentColor = NeutralText
                ),
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = "Log Out", tint = BrandError)
                    }
                }
            )
        },
        containerColor = BackgroundDark
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Top
        ) {
            // Session Profile Banner
            session?.let {
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark.copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, BorderGray.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Monogram Avatar
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(BrandPrimary)
                                .border(1.dp, BrandSecondary.copy(alpha = 0.4f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            val initial = if (it.name.isNotEmpty()) it.name[0].uppercaseChar() else 'E'
                            Text(
                                text = initial.toString(),
                                color = NeutralText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(text = it.name, style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
                            Text(text = "${it.jobRole} • ${it.employeeCode ?: "No Code"}", style = Typography.bodyMedium, color = MutedText)
                        }
                    }
                }
            }

            // Work Clock Canvas Card
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, BorderGray),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = if (isCheckedOut) "WORK DAY COMPLETED" else if (isBreakActive) "CURRENTLY ON BREAK" else if (isCheckedIn) "ACTIVE WORK LOG TIME" else "AWAITING CHECK IN",
                        style = Typography.labelSmall,
                        color = if (isBreakActive) EngineeringBlue else if (isCheckedIn && !isCheckedOut) SuccessGreen else MutedText,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Pulsating Work Clock Circle
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(200.dp)
                    ) {
                        // Pulsating background rings
                        if (isCheckedIn && !isCheckedOut && !isBreakActive) {
                            Box(
                                modifier = Modifier
                                    .size(190.dp)
                                    .scale(pulseScale)
                                    .border(3.dp, SuccessGreen.copy(alpha = 0.3f), CircleShape)
                            )
                            Box(
                                modifier = Modifier
                                    .size(175.dp)
                                    .scale(1f + (pulseScale - 1f) * 0.5f)
                                    .border(1.5.dp, BrandSecondary.copy(alpha = 0.2f), CircleShape)
                            )
                        }

                        // Core Clock Face
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(150.dp)
                                .clip(CircleShape)
                                .background(
                                    Brush.radialGradient(
                                        colors = listOf(SurfaceDarkElevated, BackgroundDark),
                                        radius = 250f
                                    )
                                )
                                .border(
                                    width = 5.dp,
                                    color = if (isCheckedOut) MutedText else if (isBreakActive) EngineeringBlue else if (isCheckedIn) SuccessGreen else BorderGray,
                                    shape = CircleShape
                                )
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = if (isCheckedOut) Icons.Default.DoneAll else if (isBreakActive) Icons.Default.Coffee else Icons.Default.Timer,
                                    contentDescription = "Clock Mode",
                                    tint = if (isCheckedOut) MutedText else if (isBreakActive) EngineeringBlue else if (isCheckedIn) SuccessGreen else MutedText,
                                    modifier = Modifier.size(32.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = formatElapsedTime(elapsedSeconds),
                                    style = Typography.displayLarge,
                                    color = NeutralText,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 22.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Check-in and check-out logs timestamps
                    if (isCheckedIn) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(SuccessGreen))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("CHECK IN", style = Typography.labelSmall, color = MutedText)
                                }
                                Text(
                                    text = attendanceState?.checkInTime?.substring(11, 16) ?: "--:--",
                                    style = Typography.titleMedium,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(EngineeringBlue))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("BREAK", style = Typography.labelSmall, color = MutedText)
                                }
                                Text(
                                    text = "${(attendanceState?.totalBreakDurationSeconds ?: 0L) / 60} mins",
                                    style = Typography.titleMedium,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(MutedText))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("CHECK OUT", style = Typography.labelSmall, color = MutedText)
                                }
                                Text(
                                    text = attendanceState?.checkOutTime?.substring(11, 16) ?: "--:--",
                                    style = Typography.titleMedium,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            // GPS Lock Status Panel
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, if (isCheckedIn) SuccessGreen.copy(alpha = 0.4f) else BorderGray),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.GpsFixed,
                        contentDescription = "GPS Geofencing Lock",
                        tint = if (isCheckedIn) SuccessGreen else MutedText,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = if (isCheckedIn) "GEOFENCE BOUNDARY VALIDATED" else "GEOFENCE PENDING CHECK-IN",
                            style = Typography.titleMedium,
                            color = if (isCheckedIn) SuccessGreen else NeutralText,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "HQ Lat: $simulatedLat, Lng: $simulatedLng. Dist: ${geofenceDistanceMeters}m (Limit: 100m)",
                            style = Typography.bodyMedium,
                            color = MutedText
                        )
                    }
                }
            }

            // Attendance Action buttons
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (!isCheckedIn) {
                    Button(
                        onClick = {
                            viewModel.checkIn(simulatedLat, simulatedLng) {}
                        },
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .graphicsLayer {
                                shadowElevation = 6f
                                shape = RoundedCornerShape(14.dp)
                                clip = true
                            }
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.horizontalGradient(
                                        colors = listOf(SuccessGreen, Color(0xFF059669))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Login, contentDescription = "Check In", tint = BackgroundDark)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("CHECK IN NOW", color = BackgroundDark, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }
                } else if (!isCheckedOut) {
                    // Check Out & Break Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = {
                                if (isBreakActive) {
                                    viewModel.endBreak()
                                } else {
                                    viewModel.startBreak()
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .graphicsLayer {
                                    shadowElevation = 4f
                                    shape = RoundedCornerShape(12.dp)
                                    clip = true
                                }
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.horizontalGradient(
                                            colors = if (isBreakActive) {
                                                listOf(SuccessGreen, Color(0xFF059669))
                                            } else {
                                                listOf(EngineeringBlue, Color(0xFF1D4ED8))
                                            }
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (isBreakActive) Icons.Default.PlayArrow else Icons.Default.Coffee,
                                        contentDescription = "Break Control",
                                        tint = if (isBreakActive) BackgroundDark else Color.White
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = if (isBreakActive) "END BREAK" else "START BREAK",
                                        color = if (isBreakActive) BackgroundDark else Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = {
                                viewModel.checkOut(simulatedLat, simulatedLng)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .graphicsLayer {
                                    shadowElevation = 4f
                                    shape = RoundedCornerShape(12.dp)
                                    clip = true
                                },
                            enabled = !isBreakActive
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.horizontalGradient(
                                            colors = listOf(Color(0xFFEF4444), Color(0xFFB91C1C))
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.Logout, contentDescription = "Check Out", tint = Color.White)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("CHECK OUT", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // Daily Commit Work Submission Button
                    Button(
                        onClick = { showCommitModal = true },
                        colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .border(1.dp, BorderGray, RoundedCornerShape(12.dp))
                    ) {
                        Icon(imageVector = Icons.Default.AddTask, contentDescription = "Commit Today's Task", tint = PrimaryAmber)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("SUBMIT TODAY'S TASK", color = PrimaryAmber, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Navigate to Designated Workspace Button
                Button(
                    onClick = onNavigateToDashboard,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .graphicsLayer {
                            shadowElevation = 6f
                            shape = RoundedCornerShape(14.dp)
                            clip = true
                        }
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(PrimaryAmber, Color(0xFFD97706))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Dashboard, contentDescription = "Workspace", tint = BackgroundDark)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "GO TO WORKSPACE DASHBOARD",
                                color = BackgroundDark,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }

    // Modal dialogue for daily achievements / commitments log submission
    if (showCommitModal) {
        var taskTitle by remember { mutableStateOf("") }
        var taskDesc by remember { mutableStateOf("") }
        var hoursStr by remember { mutableStateOf("") }
        var blockersText by remember { mutableStateOf("") }
        var tomorrowPlan by remember { mutableStateOf("") }
        var attachedFilePath by remember { mutableStateOf<String?>(null) }
        var error by remember { mutableStateOf<String?>(null) }
        var submitting by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showCommitModal = false },
            title = { Text("Log Today's Work Accomplishments", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Describe what task was accomplished and enter the decimal hours spent.", color = NeutralText)
                    
                    OutlinedTextField(
                        value = taskTitle,
                        onValueChange = { taskTitle = it },
                        label = { Text("Task Title (e.g. Surveying SW-101)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = taskDesc,
                        onValueChange = { taskDesc = it },
                        label = { Text("Detailed accomplishments (≥10 chars)...", color = MutedText) },
                        supportingText = {
                            Text("${taskDesc.length}/10 min characters", color = if (taskDesc.length >= 10) SuccessGreen else MutedText, fontSize = 10.sp)
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        maxLines = 4,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = hoursStr,
                        onValueChange = { hoursStr = it },
                        label = { Text("Hours Spent (0.25 – 24.0)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Blockers field for manager escalation
                    OutlinedTextField(
                        value = blockersText,
                        onValueChange = { blockersText = it },
                        label = { Text("Blockers / Escalations (optional)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = EngineeringBlue,
                            unfocusedBorderColor = BorderGray
                        ),
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Tomorrow's plan for next-day coordination
                    OutlinedTextField(
                        value = tomorrowPlan,
                        onValueChange = { tomorrowPlan = it },
                        label = { Text("Tomorrow's Plan (optional)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = EngineeringBlue,
                            unfocusedBorderColor = BorderGray
                        ),
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = {
                            attachedFilePath = "work_receipt_log_${System.currentTimeMillis() % 10000}.pdf"
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(imageVector = Icons.Default.AttachFile, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(attachedFilePath ?: "Attach PDF/Receipt Log", color = Color.White)
                    }

                    error?.let {
                        Text(it, color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val hours = hoursStr.toDoubleOrNull()
                        when {
                            taskTitle.isBlank() -> {
                                error = "Task title is required."
                                return@Button
                            }
                            taskDesc.length < 10 -> {
                                error = "Description must be at least 10 characters."
                                return@Button
                            }
                            hours == null || hours < 0.25 || hours > 24.0 -> {
                                error = "Hours must be between 0.25 and 24.0."
                                return@Button
                            }
                        }
                        error = null
                        submitting = true
                        viewModel.submitDailyWork(taskTitle, taskDesc, hours, "local_task") {
                            submitting = false
                            showCommitModal = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
                ) {
                    if (submitting) {
                        CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(16.dp))
                    } else {
                        Text("SUBMIT", color = BackgroundDark, fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showCommitModal = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}
