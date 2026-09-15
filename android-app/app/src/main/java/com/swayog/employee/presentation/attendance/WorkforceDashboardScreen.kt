package com.swayog.employee.presentation.attendance

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import android.location.Location
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.swayog.employee.core.util.OfflinePendingException
import com.swayog.employee.data.model.*
import com.swayog.employee.presentation.attendance.components.*
import com.swayog.employee.presentation.common.components.PendingSyncBanner
import com.swayog.employee.presentation.common.components.SwayogTopBar
import com.swayog.employee.presentation.common.utils.WatermarkHelper
import kotlinx.coroutines.delay
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.*

enum class WorkforceTab(val label: String) {
    OVERVIEW("Overview"),
    CALENDAR("Calendar"),
    HOURS("Work Hours"),
    LEAVE("Leave"),
    OVERTIME("Overtime"),
    EARNINGS("Earnings"),
    ADVANCES("Advances"),
    INCENTIVES("Incentives"),
    PERFORMANCE("Performance"),
    REQUESTS("Requests"),
    HISTORY("History")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkforceDashboardScreen(
    onNavigateBack: () -> Unit,
    workforceViewModel: WorkforceViewModel = hiltViewModel(),
    attendanceViewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Observe Workforce State
    val month by workforceViewModel.currentMonth.collectAsState()
    val year by workforceViewModel.currentYear.collectAsState()
    val dashboardData by workforceViewModel.dashboardData.collectAsState()
    val calendarData by workforceViewModel.calendarData.collectAsState()
    val selectedDay by workforceViewModel.selectedDay.collectAsState()
    val leaveBalance by workforceViewModel.leaveBalance.collectAsState()
    val leaveHistory by workforceViewModel.leaveHistory.collectAsState()
    val overtimeSummary by workforceViewModel.overtimeSummary.collectAsState()
    val overtimeHistory by workforceViewModel.overtimeHistory.collectAsState()
    val activeOtSession by workforceViewModel.activeOvertimeSession.collectAsState()
    val liveOtDurationText by workforceViewModel.liveSessionDurationText.collectAsState()
    val earnings by workforceViewModel.earnings.collectAsState()
    val salaryHistory by workforceViewModel.salaryHistory.collectAsState()
    val advances by workforceViewModel.advances.collectAsState()
    val incentives by workforceViewModel.incentives.collectAsState()
    val corrections by workforceViewModel.corrections.collectAsState()
    val unifiedRequests by workforceViewModel.unifiedRequests.collectAsState()
    val isLoading by workforceViewModel.isLoading.collectAsState()
    val errorMessage by workforceViewModel.errorMessage.collectAsState()

    // Observe Attendance Base State (for Check-in/Check-out and Map/Face)
    val todayAttendance by attendanceViewModel.todayAttendance.collectAsState()
    val pendingSyncCount by attendanceViewModel.pendingSyncCount.collectAsState()
    val faceDescriptors by attendanceViewModel.faceDescriptors.collectAsState()
    val isFaceEnrolled by attendanceViewModel.isFaceEnrolled.collectAsState()
    val attendanceRules by attendanceViewModel.attendanceRules.collectAsState()
    val performance by attendanceViewModel.performance.collectAsState()

    // UI Tab State
    var selectedTab by remember { mutableStateOf(WorkforceTab.OVERVIEW) }

    // Dialog States
    var showRequestLeaveDialog by remember { mutableStateOf(false) }
    var showRequestOtDialog by remember { mutableStateOf(false) }
    var selectedOtDate by remember { mutableStateOf<String?>(null) }
    var showRequestAdvanceDialog by remember { mutableStateOf(false) }
    var showCorrectionDialog by remember { mutableStateOf(false) }
    var selectedCorrectionDate by remember { mutableStateOf<String?>(null) }
    var showCamera by remember { mutableStateOf(false) }
    var showEnrollmentBlocker by remember { mutableStateOf(false) }
    var showFullScreenMap by remember { mutableStateOf(false) }
    var isSatelliteView by remember { mutableStateOf(true) }
    var useGoogleMaps by remember { mutableStateOf(false) }
    var currentLatitude by remember { mutableStateOf<Double?>(null) }
    var currentLongitude by remember { mutableStateOf<Double?>(null) }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    // Permission Launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val cameraGranted = permissions[Manifest.permission.CAMERA] == true
        if (fineGranted && cameraGranted) {
            try {
                fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
                    currentLatitude = loc?.latitude ?: 18.5204
                    currentLongitude = loc?.longitude ?: 73.8567
                    showCamera = true
                }.addOnFailureListener {
                    currentLatitude = 18.5204
                    currentLongitude = 73.8567
                    showCamera = true
                }
            } catch (_: SecurityException) {
                showCamera = true
            }
        } else {
            Toast.makeText(context, "Location and Camera permissions are required to check-in", Toast.LENGTH_LONG).show()
        }
    }

    // Auto-refresh when screen resumes
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                workforceViewModel.refreshAll()
                attendanceViewModel.loadData()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Show Error Toast
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            workforceViewModel.clearError()
        }
    }

    // Face camera dialog
    if (showCamera) {
        FaceVerificationScreen(
            faceDescriptors = faceDescriptors,
            onVerificationSuccess = { bitmap, matchConfidence ->
                showCamera = false
                val format = SimpleDateFormat("EEEE, dd/MM/yyyy hh:mm a", Locale.getDefault())
                val timestamp = format.format(Date())
                val watermarkedBitmap = WatermarkHelper.addWatermark(bitmap, currentLatitude, currentLongitude, "Attendance Check-in", "Self", "N/A", timestamp)
                val outputStream = ByteArrayOutputStream()
                watermarkedBitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
                val base64String = "data:image/jpeg;base64," + Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

                attendanceViewModel.checkIn(base64String, currentLatitude, currentLongitude, matchConfidence) { result ->
                    if (result.isSuccess) {
                        Toast.makeText(context, "Checked in successfully!", Toast.LENGTH_SHORT).show()
                        workforceViewModel.refreshAll()
                    } else {
                        val ex = result.exceptionOrNull()
                        if (ex is OfflinePendingException) {
                            Toast.makeText(context, ex.message, Toast.LENGTH_LONG).show()
                        } else {
                            Toast.makeText(context, "Check-in failed: ${ex?.message}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            },
            onVerificationFailed = { error ->
                showCamera = false
                Toast.makeText(context, "Verification failed: $error", Toast.LENGTH_LONG).show()
            },
            onCancel = { showCamera = false }
        )
        return
    }

    if (showEnrollmentBlocker) {
        AlertDialog(
            onDismissRequest = { showEnrollmentBlocker = false },
            title = { Text("Face Enrollment Required") },
            text = { Text("You must enroll your face before you can check in.") },
            confirmButton = {
                TextButton(onClick = { showEnrollmentBlocker = false }) { Text("OK") }
            }
        )
    }

    if (showFullScreenMap) {
        val isCheckedIn = todayAttendance?.checkInTime != null
        FullScreenAttendanceMapDialog(
            onDismiss = { showFullScreenMap = false },
            isCheckedIn = isCheckedIn,
            checkInTimeFormatted = todayAttendance?.checkInTime?.substringAfter("T")?.take(5),
            checkInLat = todayAttendance?.latitude,
            checkInLng = todayAttendance?.longitude,
            currentLat = currentLatitude,
            currentLng = currentLongitude,
            resolvedAddress = null,
            attendanceRules = attendanceRules,
            useGoogleMaps = useGoogleMaps,
            isSatelliteView = isSatelliteView,
            onToggleSatelliteView = { isSatelliteView = !isSatelliteView },
            onToggleMapProvider = { useGoogleMaps = !useGoogleMaps },
            onRefreshLocation = {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    try {
                        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null).addOnSuccessListener { loc: Location? ->
                            if (loc != null) {
                                currentLatitude = loc.latitude
                                currentLongitude = loc.longitude
                                Toast.makeText(context, "GPS location updated", Toast.LENGTH_SHORT).show()
                            }
                        }
                    } catch (_: SecurityException) {}
                } else {
                    permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CAMERA))
                }
            }
        )
    }

    // Day Details Dialog
    selectedDay?.let { day ->
        DayDetailsDialog(
            day = day,
            onDismiss = { workforceViewModel.selectDay(null) },
            onRequestOvertime = { d ->
                selectedOtDate = d.date
                showRequestOtDialog = true
            },
            onRequestCorrection = { d ->
                selectedCorrectionDate = d.date
                showCorrectionDialog = true
            }
        )
    }

    // Leave Dialog
    if (showRequestLeaveDialog) {
        RequestLeaveDialog(
            onDismiss = { showRequestLeaveDialog = false },
            onSubmit = { req ->
                workforceViewModel.submitLeaveRequest(req) { result ->
                    if (result.isSuccess) {
                        Toast.makeText(context, "Leave request submitted successfully!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Overtime Dialog
    if (showRequestOtDialog) {
        RequestOvertimeDialog(
            initialDate = selectedOtDate,
            onDismiss = {
                showRequestOtDialog = false
                selectedOtDate = null
            },
            onSubmit = { req ->
                workforceViewModel.submitOvertimeRequest(req) { result ->
                    if (result.isSuccess) {
                        Toast.makeText(context, "Overtime request submitted for review!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Advance Dialog
    if (showRequestAdvanceDialog) {
        RequestAdvanceDialog(
            onDismiss = { showRequestAdvanceDialog = false },
            onSubmit = { amount, reason ->
                workforceViewModel.submitAdvanceRequest(amount, reason) { result ->
                    if (result.isSuccess) {
                        Toast.makeText(context, "Advance request submitted for approval!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Attendance Correction Dialog
    if (showCorrectionDialog) {
        AttendanceCorrectionDialog(
            initialDate = selectedCorrectionDate,
            onDismiss = {
                showCorrectionDialog = false
                selectedCorrectionDate = null
            },
            onSubmit = { req ->
                workforceViewModel.submitAttendanceCorrection(req) { result ->
                    if (result.isSuccess) {
                        Toast.makeText(context, "Correction request submitted for review!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    val monthNames = listOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )
    val monthName = monthNames.getOrElse(month - 1) { "Month" }
    val summary = dashboardData?.summary ?: WorkforceSummary()

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Workforce & Attendance",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = {
                        workforceViewModel.refreshAll()
                        attendanceViewModel.loadData()
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            PendingSyncBanner(
                pendingCount = pendingSyncCount,
                onClick = {
                    workforceViewModel.refreshAll()
                    attendanceViewModel.loadData()
                }
            )

            // Scrollable Navigation Tabs
            ScrollableTabRow(
                selectedTabIndex = selectedTab.ordinal,
                edgePadding = 16.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                WorkforceTab.values().forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = { Text(tab.label, fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal) }
                    )
                }
            }

            // Main Content Area
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Section-specific views
                when (selectedTab) {
                    WorkforceTab.OVERVIEW -> {
                        item {
                            WorkforceSummaryCard(
                                monthName = monthName,
                                year = year,
                                summary = summary
                            )
                        }
                        item {
                            val todayCalendarDay = dashboardData?.todayCalendarDay 
                                ?: calendarData?.days?.find { it.date == java.time.LocalDate.now().toString() }

                            WorkforceTodayCard(
                                todayAttendance = todayAttendance ?: dashboardData?.today,
                                todayCalendarDay = todayCalendarDay,
                                activeOtSession = activeOtSession,
                                liveOtDurationText = liveOtDurationText,
                                onCheckInClick = {
                                    val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
                                    val cam = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED
                                    if (!fine || !cam) {
                                        permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CAMERA))
                                    } else {
                                        try {
                                            fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
                                                currentLatitude = loc?.latitude ?: 18.5204
                                                currentLongitude = loc?.longitude ?: 73.8567
                                                showCamera = true
                                            }.addOnFailureListener {
                                                currentLatitude = 18.5204
                                                currentLongitude = 73.8567
                                                showCamera = true
                                            }
                                        } catch (_: SecurityException) {
                                            showCamera = true
                                        }
                                    }
                                },
                                onCheckOutClick = {
                                    attendanceViewModel.checkOut { res ->
                                        if (res.isSuccess) {
                                            Toast.makeText(context, "Checked out successfully!", Toast.LENGTH_SHORT).show()
                                            workforceViewModel.refreshAll()
                                        } else {
                                            Toast.makeText(context, "Check-out failed: ${res.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                                        }
                                    }
                                },
                                onRequestOtClick = {
                                    selectedOtDate = java.time.LocalDate.now().toString()
                                    showRequestOtDialog = true
                                },
                                onStopOtClick = {
                                    workforceViewModel.stopOvertimeSession("Session completed") { res ->
                                        if (res.isSuccess) {
                                            Toast.makeText(context, "Overtime session stopped.", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                onOpenMapClick = {
                                    showFullScreenMap = true
                                }
                            )
                        }
                        item {
                            WorkforceCalendarView(
                                month = month,
                                year = year,
                                days = calendarData?.days ?: emptyList(),
                                onPreviousMonth = {
                                    val newMonth = if (month == 1) 12 else month - 1
                                    val newYear = if (month == 1) year - 1 else year
                                    workforceViewModel.setMonthYear(newMonth, newYear)
                                },
                                onNextMonth = {
                                    val newMonth = if (month == 12) 1 else month + 1
                                    val newYear = if (month == 12) year + 1 else year
                                    workforceViewModel.setMonthYear(newMonth, newYear)
                                },
                                onDayClick = { day ->
                                    workforceViewModel.selectDay(day)
                                }
                            )
                        }
                    }

                    WorkforceTab.CALENDAR -> {
                        item {
                            WorkforceCalendarView(
                                month = month,
                                year = year,
                                days = calendarData?.days ?: emptyList(),
                                onPreviousMonth = {
                                    val newMonth = if (month == 1) 12 else month - 1
                                    val newYear = if (month == 1) year - 1 else year
                                    workforceViewModel.setMonthYear(newMonth, newYear)
                                },
                                onNextMonth = {
                                    val newMonth = if (month == 12) 1 else month + 1
                                    val newYear = if (month == 12) year + 1 else year
                                    workforceViewModel.setMonthYear(newMonth, newYear)
                                },
                                onDayClick = { day ->
                                    workforceViewModel.selectDay(day)
                                }
                            )
                        }
                    }

                    WorkforceTab.HOURS -> {
                        item {
                            WorkforceWorkHoursSection(summary = summary)
                        }
                    }

                    WorkforceTab.LEAVE -> {
                        item {
                            WorkforceLeaveSection(
                                leaveBalance = leaveBalance,
                                leaveHistory = leaveHistory,
                                onRequestLeaveClick = { showRequestLeaveDialog = true }
                            )
                        }
                    }

                    WorkforceTab.OVERTIME -> {
                        item {
                            WorkforceOvertimeSection(
                                overtimeSummary = overtimeSummary,
                                overtimeHistory = overtimeHistory,
                                activeSession = activeOtSession,
                                liveDurationText = liveOtDurationText,
                                onRequestOvertimeClick = {
                                    selectedOtDate = java.time.LocalDate.now().toString()
                                    showRequestOtDialog = true
                                },
                                onStartSessionClick = {
                                    workforceViewModel.startOvertimeSession { res ->
                                        if (res.isSuccess) {
                                            Toast.makeText(context, "Overtime session started!", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                onStopSessionClick = {
                                    workforceViewModel.stopOvertimeSession("Completed") { res ->
                                        if (res.isSuccess) {
                                            Toast.makeText(context, "Overtime session stopped!", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                }
                            )
                        }
                    }

                    WorkforceTab.EARNINGS -> {
                        item {
                            WorkforceEarningsSection(
                                earnings = earnings,
                                salaryHistory = salaryHistory
                            )
                        }
                    }

                    WorkforceTab.ADVANCES -> {
                        item {
                            WorkforceAdvancesSection(
                                advances = advances,
                                onRequestAdvanceClick = { showRequestAdvanceDialog = true }
                            )
                        }
                    }

                    WorkforceTab.INCENTIVES -> {
                        item {
                            WorkforceIncentivesSection(incentives = incentives)
                        }
                    }

                    WorkforceTab.PERFORMANCE -> {
                        item {
                            WorkforcePerformanceSection(
                                summary = summary,
                                performance = performance
                            )
                        }
                    }

                    WorkforceTab.REQUESTS -> {
                        item {
                            WorkforceRequestsSection(
                                requests = unifiedRequests,
                                onRequestCorrectionClick = {
                                    selectedCorrectionDate = java.time.LocalDate.now().toString()
                                    showCorrectionDialog = true
                                }
                            )
                        }
                    }

                    WorkforceTab.HISTORY -> {
                        item {
                            WorkforceHistorySection(
                                days = calendarData?.days ?: emptyList(),
                                onRequestCorrection = { d ->
                                    selectedCorrectionDate = d.date
                                    showCorrectionDialog = true
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
