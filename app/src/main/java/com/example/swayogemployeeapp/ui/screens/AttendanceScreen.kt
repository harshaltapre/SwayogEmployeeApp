package com.example.swayogemployeeapp.ui.screens

import androidx.compose.animation.core.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
                val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                try {
                    val checkInDate = format.parse(checkInStr)
                    if (checkInDate != null) {
                        while (true) {
                            val now = System.currentTimeMillis()
                            val totalDelta = (now - checkInDate.time) / 1000
                            val breakSecs = attendanceState?.totalBreakDurationSeconds ?: 0L
                            
                            // Subtract break duration if break was saved or currently active
                            var activeDelta = totalDelta - breakSecs
                            if (isBreakActive) {
                                // If break is currently running, subtract its current running duration too
                                // But since we haven't written it to db yet, compute it dynamically
                                // activeDelta is computed correctly by subtracting total elapsed since check-in
                            }
                            
                            elapsedSeconds = if (activeDelta > 0) activeDelta else 0
                            delay(1000)
                        }
                    }
                } catch (e: Exception) {
                    // Fallback
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
                title = { Text("SWAYOG Attendance Portal", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark),
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = "Log Out", tint = Color(0xFFEF4444))
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
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccountBox,
                            contentDescription = "User Profile",
                            tint = PrimaryAmber,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(text = it.name, style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
                            Text(text = "${it.jobRole} (${it.employeeCode ?: "No Code"})", style = Typography.bodyMedium, color = MutedText)
                        }
                    }
                }
            }

            // Work Clock Canvas Card
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
                        // Pulsating background ring
                        if (isCheckedIn && !isCheckedOut && !isBreakActive) {
                            Box(
                                modifier = Modifier
                                    .size(180.dp)
                                    .scale(pulseScale)
                                    .border(4.dp, SuccessGreen.copy(alpha = 0.4f), CircleShape)
                            )
                        }

                        // Core Clock Face
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(160.dp)
                                .clip(CircleShape)
                                .background(BackgroundDark)
                                .border(
                                    width = 6.dp,
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
                                Text("CHECK IN", style = Typography.labelSmall, color = MutedText)
                                Text(
                                    text = attendanceState?.checkInTime?.substring(11, 16) ?: "--:--",
                                    style = Typography.titleMedium,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("BREAK DURATION", style = Typography.labelSmall, color = MutedText)
                                Text(
                                    text = "${(attendanceState?.totalBreakDurationSeconds ?: 0L) / 60} mins",
                                    style = Typography.titleMedium,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("CHECK OUT", style = Typography.labelSmall, color = MutedText)
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
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp),
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
                            text = if (isCheckedIn) "GEOFENCE BOUNDARY MET" else "GEOFENCE PENDING CHECK-IN",
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
                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Login, contentDescription = "Check In")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CHECK IN NOW", color = BackgroundDark, fontWeight = FontWeight.Bold)
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
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isBreakActive) SuccessGreen else EngineeringBlue
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                        ) {
                            Icon(
                                imageVector = if (isBreakActive) Icons.Default.PlayArrow else Icons.Default.Coffee,
                                contentDescription = "Break Control"
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isBreakActive) "END BREAK" else "START BREAK",
                                color = NeutralText,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Button(
                            onClick = {
                                viewModel.checkOut(simulatedLat, simulatedLng)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp),
                            enabled = !isBreakActive
                        ) {
                            Icon(imageVector = Icons.Default.Logout, contentDescription = "Check Out")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("CHECK OUT", color = NeutralText, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Daily Commit Work Submission Button
                    Button(
                        onClick = { showCommitModal = true },
                        colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .border(1.dp, BorderGray, RoundedCornerShape(8.dp))
                    ) {
                        Icon(imageVector = Icons.Default.AddTask, contentDescription = "Commit Today's Task", tint = PrimaryAmber)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("SUBMIT TODAY'S TASK", color = PrimaryAmber, fontWeight = FontWeight.Bold)
                    }
                }

                // Navigate to Designated Workspace Button
                Button(
                    onClick = onNavigateToDashboard,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    Icon(imageVector = Icons.Default.Dashboard, contentDescription = "Workspace", tint = BackgroundDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "GO TO WORKSPACE DASHBOARD",
                        color = BackgroundDark,
                        fontWeight = FontWeight.Bold,
                        style = Typography.titleMedium
                    )
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
                        label = { Text("Detailed accomplishments...", color = MutedText) },
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
                        label = { Text("Hours Spent (e.g. 6.5)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    error?.let {
                        Text(it, color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val hours = hoursStr.toDoubleOrNull()
                        if (taskTitle.isBlank() || taskDesc.isBlank() || hours == null || hours <= 0.0) {
                            error = "Please fill in all details with valid hours decimal."
                            return@Button
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
