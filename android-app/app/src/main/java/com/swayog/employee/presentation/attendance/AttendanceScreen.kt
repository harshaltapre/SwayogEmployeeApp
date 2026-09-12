package com.swayog.employee.presentation.attendance

import android.Manifest
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.location.Geocoder
import android.location.Location
import android.net.Uri
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.swayog.employee.presentation.common.components.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import com.swayog.employee.core.util.OfflinePendingException
import com.swayog.employee.presentation.common.utils.WatermarkHelper

@Composable
fun AttendanceScreen(
    onNavigateBack: () -> Unit,
    viewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val monthlyRecords by viewModel.monthlyRecords.collectAsState()
    val holidays by viewModel.holidays.collectAsState()
    val monthlySummary by viewModel.monthlySummary.collectAsState()
    val state by viewModel.attendanceState.collectAsState()
    val faceDescriptors by viewModel.faceDescriptors.collectAsState()
    val performance by viewModel.performance.collectAsState()
    val currentTask by viewModel.currentTask.collectAsState()
    val pendingSyncCount by viewModel.pendingSyncCount.collectAsState()
    
    // UI State
    var showCamera by remember { mutableStateOf(false) }
    var showEnrollmentBlocker by remember { mutableStateOf(false) }
    var showFullScreenMap by remember { mutableStateOf(false) }
    var isSatelliteView by remember { mutableStateOf(true) }
    var currentLatitude by remember { mutableStateOf<Double?>(null) }
    var currentLongitude by remember { mutableStateOf<Double?>(null) }
    var resolvedAddress by remember { mutableStateOf<String?>(null) }

    // Calendar month navigation state
    var calendarMonth by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.MONTH)) }
    var calendarYear by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.YEAR)) }

    LaunchedEffect(calendarMonth, calendarYear) {
        viewModel.loadMonth(calendarMonth + 1, calendarYear)
    }

    val attendanceRules by viewModel.attendanceRules.collectAsState()
    var useGoogleMaps by remember { mutableStateOf(false) }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    // Proactively fetch current high-accuracy GPS location if location permission is already granted
    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            try {
                fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
                    if (loc != null) {
                        currentLatitude = loc.latitude
                        currentLongitude = loc.longitude
                    }
                }
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null).addOnSuccessListener { loc: Location? ->
                    if (loc != null) {
                        currentLatitude = loc.latitude
                        currentLongitude = loc.longitude
                    }
                }
            } catch (_: SecurityException) {}
        }
    }

    val isCheckedIn = todayAttendance?.checkInTime != null
    val checkInLat = todayAttendance?.latitude
    val checkInLng = todayAttendance?.longitude
    val displayLat = checkInLat ?: currentLatitude ?: attendanceRules.officeLat
    val displayLng = checkInLng ?: currentLongitude ?: attendanceRules.officeLng

    // Reverse geocode to resolve street address asynchronously
    LaunchedEffect(displayLat, displayLng) {
        withContext(Dispatchers.IO) {
            try {
                val geocoder = Geocoder(context, Locale.getDefault())
                if (android.os.Build.VERSION.SDK_INT >= 33) {
                    geocoder.getFromLocation(displayLat, displayLng, 1) { list ->
                        if (list.isNotEmpty()) {
                            val addr = list[0]
                            val parts = listOfNotNull(
                                addr.featureName?.takeIf { it.isNotBlank() && it != addr.subLocality },
                                addr.subLocality?.takeIf { it.isNotBlank() },
                                addr.locality?.takeIf { it.isNotBlank() },
                                addr.adminArea?.takeIf { it.isNotBlank() }
                            )
                            resolvedAddress = if (parts.isNotEmpty()) parts.distinct().joinToString(", ") else addr.getAddressLine(0)
                        }
                    }
                } else {
                    @Suppress("DEPRECATION")
                    val list = geocoder.getFromLocation(displayLat, displayLng, 1)
                    if (!list.isNullOrEmpty()) {
                        val addr = list[0]
                        val parts = listOfNotNull(
                            addr.featureName?.takeIf { it.isNotBlank() && it != addr.subLocality },
                            addr.subLocality?.takeIf { it.isNotBlank() },
                            addr.locality?.takeIf { it.isNotBlank() },
                            addr.adminArea?.takeIf { it.isNotBlank() }
                        )
                        resolvedAddress = if (parts.isNotEmpty()) parts.distinct().joinToString(", ") else addr.getAddressLine(0)
                    }
                }
            } catch (_: Exception) {}
        }
    }

    // Live clock
    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            currentTime = System.currentTimeMillis()
            delay(1000L)
        }
    }
    val timeFormat = remember { SimpleDateFormat("hh:mm:ss a", Locale.getDefault()) }
    val formattedTime = timeFormat.format(Date(currentTime))

    // Permission launchers
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false

        if (fineGranted && cameraGranted) {
            try {
                fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
                    if (loc != null) {
                        currentLatitude = loc.latitude
                        currentLongitude = loc.longitude
                    } else {
                        currentLatitude = 18.5204
                        currentLongitude = 73.8567
                    }
                    showCamera = true
                }.addOnFailureListener {
                    currentLatitude = 18.5204
                    currentLongitude = 73.8567
                    showCamera = true
                }
            } catch (_: SecurityException) {
                Toast.makeText(context, "Location permission missing", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context, "Location and Camera permissions are required to check-in", Toast.LENGTH_LONG).show()
        }
    }

    LaunchedEffect(state) {
        val currentState = state
        if (currentState is AttendanceState.Error) {
            Toast.makeText(context, currentState.message, Toast.LENGTH_LONG).show()
        }
    }

    if (showCamera) {
        FaceVerificationScreen(
            faceDescriptors = faceDescriptors,
            onVerificationSuccess = { bitmap, matchConfidence ->
                showCamera = false
                // Apply Watermark
                val format = java.text.SimpleDateFormat("EEEE, dd/MM/yyyy hh:mm a", java.util.Locale.getDefault())
                val timestamp = format.format(java.util.Date())
                val watermarkedBitmap = WatermarkHelper.addWatermark(bitmap, currentLatitude, currentLongitude, "Attendance Check-in", "Self", "N/A", timestamp)
                
                // Convert to Base64
                val outputStream = ByteArrayOutputStream()
                watermarkedBitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
                val base64String = "data:image/jpeg;base64," + Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
                
                // Call checkIn
                viewModel.checkIn(base64String, currentLatitude, currentLongitude, matchConfidence) { result ->
                    if (result.isSuccess) {
                        Toast.makeText(context, "Checked in successfully!", Toast.LENGTH_SHORT).show()
                    } else {
                        val exception = result.exceptionOrNull()
                        if (exception is OfflinePendingException) {
                            Toast.makeText(context, exception.message, Toast.LENGTH_LONG).show()
                        } else {
                            Toast.makeText(context, "Check-in failed: ${exception?.message}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            },
            onVerificationFailed = { error ->
                showCamera = false
                Toast.makeText(context, "Verification failed: $error", Toast.LENGTH_LONG).show()
            },
            onCancel = {
                showCamera = false
            }
        )
        return
    }

    if (showEnrollmentBlocker) {
        AlertDialog(
            onDismissRequest = { showEnrollmentBlocker = false },
            title = { Text("Face Enrollment Required") },
            text = { Text("You must enroll your face in Settings before you can check in.") },
            confirmButton = {
                TextButton(onClick = {
                    showEnrollmentBlocker = false
                    Toast.makeText(context, "Please go to Settings to enroll your face.", Toast.LENGTH_LONG).show()
                }) {
                    Text("OK")
                }
            }
        )
    }

    if (showFullScreenMap) {
        FullScreenAttendanceMapDialog(
            onDismiss = { showFullScreenMap = false },
            isCheckedIn = isCheckedIn,
            checkInTimeFormatted = if (isCheckedIn) formatUtcToLocalTime(todayAttendance?.checkInTime) else null,
            checkInLat = checkInLat,
            checkInLng = checkInLng,
            currentLat = currentLatitude,
            currentLng = currentLongitude,
            resolvedAddress = resolvedAddress,
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

    val windowSize = com.swayog.employee.presentation.common.responsive.LocalWindowSizeInfo.current

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Attendance Tracking",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            PendingSyncBanner(
                pendingCount = pendingSyncCount,
                onClick = {
                    Toast.makeText(context, "Refreshing attendance records...", Toast.LENGTH_SHORT).show()
                    viewModel.loadData()
                }
            )
            
            com.swayog.employee.presentation.common.responsive.ResponsiveContentContainer(
                maxWidth = if (windowSize.isTablet) 840.dp else androidx.compose.ui.unit.Dp.Unspecified
            ) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = windowSize.contentPadding, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(windowSize.cardSpacing)
                ) {
                    // Live Clock Card
                    item {
                        SwayogCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Start,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = formattedTime,
                                        style = MaterialTheme.typography.headlineLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary,
                                        letterSpacing = 2.sp
                                    )
                                    Text(
                                        text = "Current Time",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                    }

                    // Today's Status Card
                    item {
                        SwayogCard {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    text = "Today's Status",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(12.dp))

                                val record = todayAttendance
                                val statusText = when {
                                    record == null -> "Not Checked In"
                                    record.checkOutTime != null -> "Checked Out"
                                    else -> "Checked In"
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = statusText,
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = when {
                                                record == null -> MaterialTheme.colorScheme.error
                                                record.checkOutTime != null -> MaterialTheme.colorScheme.tertiary
                                                else -> MaterialTheme.colorScheme.primary
                                            }
                                        )
                                        if (record != null) {
                                            Text(
                                                text = "In: ${formatUtcToLocalTime(record.checkInTime)}",
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                            if (record.checkOutTime != null) {
                                                Text(
                                                    text = "Out: ${formatUtcToLocalTime(record.checkOutTime)}",
                                                    style = MaterialTheme.typography.bodyMedium
                                                )
                                            }
                                            if (record.totalMinutes != null && record.totalMinutes > 0) {
                                                val hrs = record.totalMinutes / 60
                                                val mins = record.totalMinutes % 60
                                                Text(
                                                    text = "Total: ${hrs}h ${mins}m",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                            }
                                        }
                                    }

                                    val statusIcon = when {
                                        record == null -> Icons.Default.Cancel
                                        record.checkOutTime != null -> Icons.Default.Logout
                                        else -> Icons.Default.CheckCircle
                                    }
                                    Icon(
                                        imageVector = statusIcon,
                                        contentDescription = null,
                                        tint = when {
                                            record == null -> MaterialTheme.colorScheme.error
                                            record.checkOutTime != null -> MaterialTheme.colorScheme.tertiary
                                            else -> MaterialTheme.colorScheme.primary
                                        },
                                        modifier = Modifier.size(48.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Maps / GPS Verification Card (Clickable to open Full Screen Map)
                    item {
                        val loginTimeFormatted = if (isCheckedIn) formatUtcToLocalTime(todayAttendance?.checkInTime) else null
                        val pinLat = checkInLat ?: currentLatitude ?: attendanceRules.officeLat
                        val pinLng = checkInLng ?: currentLongitude ?: attendanceRules.officeLng

                        val distFromOffice = remember(pinLat, pinLng, attendanceRules) {
                            val results = FloatArray(1)
                            Location.distanceBetween(
                                pinLat, pinLng,
                                attendanceRules.officeLat, attendanceRules.officeLng,
                                results
                            )
                            results[0]
                        }

                        SwayogCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showFullScreenMap = true }
                        ) {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = "Attendance Location",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f)
                                            ) {
                                                Text(
                                                    text = "Tap to expand ↗",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.primary,
                                                    fontWeight = FontWeight.SemiBold,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                        Text(
                                            text = if (isCheckedIn) "Checked In at $loginTimeFormatted" else "Live GPS verification ready",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                            fontWeight = if (isCheckedIn) FontWeight.SemiBold else FontWeight.Normal
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        // Satellite / Street View Toggle Button
                                        IconButton(
                                            onClick = { isSatelliteView = !isSatelliteView },
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (isSatelliteView) Icons.Default.Satellite else Icons.Default.Map,
                                                contentDescription = if (isSatelliteView) "Switch to Street Map" else "Switch to Satellite View",
                                                tint = if (isSatelliteView) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }

                                        // Refresh location button
                                        IconButton(
                                            onClick = {
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
                                            },
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.MyLocation,
                                                contentDescription = "My Location",
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }

                                        // Fullscreen expand icon
                                        IconButton(
                                            onClick = { showFullScreenMap = true },
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Fullscreen,
                                                contentDescription = "Open Full Screen Map",
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                val cameraPositionState = rememberCameraPositionState {
                                    position = CameraPosition.fromLatLngZoom(LatLng(pinLat, pinLng), 16f)
                                }

                                LaunchedEffect(pinLat, pinLng) {
                                    cameraPositionState.position = CameraPosition.fromLatLngZoom(
                                        LatLng(pinLat, pinLng), 16f
                                    )
                                }

                                val leafletHtml = remember(pinLat, pinLng, isCheckedIn, loginTimeFormatted, checkInLat, checkInLng, currentLatitude, currentLongitude, attendanceRules, isSatelliteView) {
                                    buildAttendanceLeafletHtml(
                                        isCheckedIn = isCheckedIn,
                                        loginTimeFormatted = loginTimeFormatted,
                                        checkInLat = checkInLat,
                                        checkInLng = checkInLng,
                                        liveLat = currentLatitude,
                                        liveLng = currentLongitude,
                                        fallbackLat = pinLat,
                                        fallbackLng = pinLng,
                                        attendanceRules = attendanceRules,
                                        isInteractive = false,
                                        isSatelliteView = isSatelliteView
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(230.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFFE2E8F0))
                                ) {
                                    if (!useGoogleMaps) {
                                        AndroidView(
                                            factory = { ctx ->
                                                android.webkit.WebView(ctx).apply {
                                                    setBackgroundColor(android.graphics.Color.parseColor("#E2E8F0"))
                                                    settings.javaScriptEnabled = true
                                                    settings.domStorageEnabled = true
                                                    settings.allowFileAccess = true
                                                    settings.allowContentAccess = true
                                                    @Suppress("DEPRECATION")
                                                    settings.allowFileAccessFromFileURLs = true
                                                    @Suppress("DEPRECATION")
                                                    settings.allowUniversalAccessFromFileURLs = true
                                                    settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                                                    settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                                                    settings.userAgentString = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36 SwayogApp/1.0"
                                                    webChromeClient = object : android.webkit.WebChromeClient() {
                                                        override fun onConsoleMessage(msg: android.webkit.ConsoleMessage?): Boolean {
                                                            android.util.Log.d("AttendanceMap", "${msg?.message()} [${msg?.sourceId()}:${msg?.lineNumber()}]")
                                                            return true
                                                        }
                                                    }
                                                    webViewClient = object : android.webkit.WebViewClient() {
                                                        override fun onReceivedError(view: android.webkit.WebView?, request: android.webkit.WebResourceRequest?, error: android.webkit.WebResourceError?) {
                                                            android.util.Log.e("AttendanceMap", "Error: ${error?.description} on ${request?.url}")
                                                        }
                                                    }
                                                    loadDataWithBaseURL("file:///android_asset/leaflet/", leafletHtml, "text/html", "UTF-8", null)
                                                }
                                            },
                                            update = { webView ->
                                                webView.loadDataWithBaseURL("file:///android_asset/leaflet/", leafletHtml, "text/html", "UTF-8", null)
                                            },
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        val markerState = rememberMarkerState(position = LatLng(pinLat, pinLng))
                                        LaunchedEffect(pinLat, pinLng) {
                                            markerState.position = LatLng(pinLat, pinLng)
                                            markerState.showInfoWindow()
                                        }

                                        GoogleMap(
                                            modifier = Modifier.fillMaxSize(),
                                            cameraPositionState = cameraPositionState,
                                            properties = MapProperties(
                                                mapType = if (isSatelliteView) MapType.HYBRID else MapType.NORMAL
                                            ),
                                            uiSettings = MapUiSettings(
                                                zoomControlsEnabled = false,
                                                compassEnabled = true
                                            )
                                        ) {
                                            Marker(
                                                state = markerState,
                                                title = if (isCheckedIn) "Login Time: $loginTimeFormatted" else "Current Location",
                                                snippet = "📍 %.4f, %.4f".format(pinLat, pinLng)
                                            )

                                            if (attendanceRules.geofenceEnabled) {
                                                Circle(
                                                    center = LatLng(attendanceRules.officeLat, attendanceRules.officeLng),
                                                    radius = attendanceRules.officeRadius,
                                                    strokeColor = Color(0xFF10B981),
                                                    fillColor = Color(0x2210B981),
                                                    strokeWidth = 2f
                                                )
                                            }
                                        }
                                    }

                                    // Top-left floating badge over map
                                    Surface(
                                        modifier = Modifier
                                            .align(Alignment.TopStart)
                                            .padding(8.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                                        shadowElevation = 3.dp
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (isCheckedIn) Icons.Default.CheckCircle else Icons.Default.LocationOn,
                                                contentDescription = null,
                                                tint = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Text(
                                                text = if (isCheckedIn) "Check-In: $loginTimeFormatted" else "Live GPS",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }

                                    // Bottom-right tap overlay hint
                                    Surface(
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .padding(8.dp),
                                        shape = RoundedCornerShape(6.dp),
                                        color = Color.Black.copy(alpha = 0.65f)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(3.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Fullscreen,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.size(12.dp)
                                            )
                                            Text(
                                                text = "Tap to open map",
                                                color = Color.White,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Address row if available
                                if (!resolvedAddress.isNullOrBlank()) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Place,
                                            contentDescription = null,
                                            tint = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = resolvedAddress ?: "",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurface,
                                            maxLines = 2
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.MyLocation,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Text(
                                            text = "${"%.5f".format(pinLat)}° N, ${"%.5f".format(pinLng)}° E",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                        )
                                    }

                                    if (attendanceRules.geofenceEnabled) {
                                        val isInside = distFromOffice <= attendanceRules.officeRadius
                                        Surface(
                                            shape = RoundedCornerShape(12.dp),
                                            color = if (isInside) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                                        ) {
                                            Text(
                                                text = if (isInside) "Inside Office Zone (${distFromOffice.toInt()}m)" else "${distFromOffice.toInt()}m away (Limit: ${attendanceRules.officeRadius.toInt()}m)",
                                                color = if (isInside) Color(0xFF2E7D32) else Color(0xFFC62828),
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
                                        }
                                    } else {
                                        Text(
                                            text = if (isCheckedIn) "GPS Check-In Verified" else "GPS Signal Ready",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Clock-in/Clock-out Actions Card
                    item {
                        SwayogCard {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    text = "Actions",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    SwayogButton(
                                        text = "Check In",
                                        onClick = {
                                            if (faceDescriptors.isEmpty()) {
                                                showEnrollmentBlocker = true
                                            } else {
                                                permissionLauncher.launch(
                                                    arrayOf(
                                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                                        Manifest.permission.ACCESS_COARSE_LOCATION,
                                                        Manifest.permission.CAMERA
                                                    )
                                                )
                                            }
                                        },
                                        enabled = todayAttendance == null,
                                        modifier = Modifier.weight(1f)
                                    )

                                    SwayogButton(
                                        text = "Check Out",
                                        onClick = {
                                            viewModel.checkOut { result ->
                                                if (result.isSuccess) {
                                                    Toast.makeText(context, "Checked out successfully!", Toast.LENGTH_SHORT).show()
                                                } else {
                                                    Toast.makeText(context, "Check-out failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                                                }
                                            }
                                        },
                                        enabled = todayAttendance != null && todayAttendance?.checkOutTime == null,
                                        variant = ButtonVariant.Secondary,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }

                    // Monthly Performance Stats
                    item {
                        val currentYear = calendarYear
                        val currentMonth = calendarMonth

                        // Calculate working days up to today for the displayed month
                        // Company works 6 days/week (Mon–Sat); Sundays and declared holidays are off
                        val workingDays: Int = remember(currentYear, currentMonth, holidays) {
                            var count = 0
                            val today = Calendar.getInstance()
                            val target = Calendar.getInstance()
                            target.set(Calendar.YEAR, currentYear)
                            target.set(Calendar.MONTH, currentMonth)
                            target.set(Calendar.DAY_OF_MONTH, 1)
                            val daysInMonth = target.getActualMaximum(Calendar.DAY_OF_MONTH)
                            val holidayDateSet = holidays.mapNotNull { it.dateStr ?: it.date?.take(10) }.toSet()
                            var day = 1
                            while (day <= daysInMonth) {
                                target.set(Calendar.DAY_OF_MONTH, day)
                                if (target.after(today)) break
                                val dow = target.get(Calendar.DAY_OF_WEEK)
                                val dateStr = String.format(Locale.getDefault(), "%04d-%02d-%02d", currentYear, currentMonth + 1, day)
                                if (dow != Calendar.SUNDAY && !holidayDateSet.contains(dateStr)) count++
                                day++
                            }
                            count
                        }

                        // Filter monthly records to the displayed month
                        val monthStr = String.format("%04d-%02d", currentYear, currentMonth + 1)
                        val filteredRecords: List<com.swayog.employee.data.model.AttendanceRecord> =
                            remember(monthlyRecords, currentYear, currentMonth) {
                                monthlyRecords.filter { rec -> rec.date.startsWith(monthStr) }
                            }

                        val presentCount: Int = remember(filteredRecords) {
                            filteredRecords.count { rec ->
                                val s = rec.status.uppercase()
                                s == "PRESENT" || s == "LATE" || s == "HALF_DAY" || s == "HALF-DAY"
                            }
                        }
                        val fullPresentCount: Int = remember(filteredRecords) {
                            filteredRecords.count { rec ->
                                val s = rec.status.uppercase()
                                s == "PRESENT" || s == "LATE"
                            }
                        }
                        val halfDaysCount: Int = remember(filteredRecords) {
                            filteredRecords.count { rec ->
                                val s = rec.status.uppercase()
                                s == "HALF_DAY" || s == "HALF-DAY"
                            }
                        }
                        val absentCount: Int = maxOf(0, workingDays - fullPresentCount - halfDaysCount)
                        val attendancePercent: Int = if (workingDays > 0) {
                            Math.round(((fullPresentCount + halfDaysCount * 0.5) / workingDays.toDouble()) * 100).toInt()
                        } else 0
                        val totalHours: Double = remember(filteredRecords) {
                            filteredRecords.sumOf { rec -> (rec.totalMinutes ?: 0) / 60.0 }
                        }

                        SwayogCard {
                            Text(
                                text = "This Month's Summary",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = presentCount.toString(),
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = Color(0xFF0B6E4F),
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(text = "Present", style = MaterialTheme.typography.bodySmall)
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = absentCount.toString(),
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = MaterialTheme.colorScheme.error,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(text = "Absent", style = MaterialTheme.typography.bodySmall)
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${attendancePercent}%",
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = Color(0xFF386FA4),
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(text = "Rate", style = MaterialTheme.typography.bodySmall)
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = String.format("%.1f", totalHours),
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = Color(0xFFD1603D),
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(text = "Hours", style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }

                    // Calendar Heatmap View
                    item {
                        SwayogCard {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    IconButton(onClick = {
                                        if (calendarMonth == 0) {
                                            calendarMonth = 11
                                            calendarYear--
                                        } else {
                                            calendarMonth--
                                        }
                                        viewModel.loadMonth(calendarMonth + 1, calendarYear)
                                    }) {
                                        Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Month")
                                    }
                                    val monthNames = arrayOf(
                                        "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                    )
                                    Text(
                                        text = "${monthNames[calendarMonth]} $calendarYear",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    IconButton(onClick = {
                                        if (calendarMonth == 11) {
                                            calendarMonth = 0
                                            calendarYear++
                                        } else {
                                            calendarMonth++
                                        }
                                        viewModel.loadMonth(calendarMonth + 1, calendarYear)
                                    }) {
                                        Icon(Icons.Default.ChevronRight, contentDescription = "Next Month")
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                // Weekday headers
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa").forEach { day ->
                                        Text(
                                            text = day,
                                            modifier = Modifier.weight(1f),
                                            textAlign = TextAlign.Center,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                // Calendar grid
                                val cal = Calendar.getInstance().apply {
                                    set(Calendar.YEAR, calendarYear)
                                    set(Calendar.MONTH, calendarMonth)
                                    set(Calendar.DAY_OF_MONTH, 1)
                                }
                                val firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1
                                val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
                                val todayCal = Calendar.getInstance()
                                val todayDay = todayCal.get(Calendar.DAY_OF_MONTH)
                                val todayMonth = todayCal.get(Calendar.MONTH)
                                val todayYear = todayCal.get(Calendar.YEAR)

                                val dateFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }

                                val totalCells = firstDayOfWeek + daysInMonth
                                val rows = (totalCells + 6) / 7

                                for (row in 0 until rows) {
                                    Row(modifier = Modifier.fillMaxWidth()) {
                                        for (col in 0..6) {
                                            val cellIndex = row * 7 + col
                                            val day = cellIndex - firstDayOfWeek + 1
                                            if (day in 1..daysInMonth) {
                                                val isToday = day == todayDay && calendarMonth == todayMonth && calendarYear == todayYear
                                                val cellCal = Calendar.getInstance().apply {
                                                    set(calendarYear, calendarMonth, day)
                                                }
                                                val isSunday = col == 0 || cellCal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
                                                val dateStr = dateFormat.format(cellCal.time)
                                                val record = monthlyRecords.find { it.date.substringBefore("T") == dateStr }
                                                val matchedHoliday = holidays.find { (it.dateStr ?: it.date?.take(10)) == dateStr }
                                                val isHoliday = matchedHoliday != null

                                                val hasRecord = record != null
                                                val recordStatus = record?.status?.uppercase()

                                                val dotColor = when {
                                                    recordStatus == "PRESENT" -> Color(0xFF0B6E4F)
                                                    recordStatus == "LATE" -> Color(0xFFD1603D)
                                                    recordStatus == "ABSENT" -> Color(0xFFF44336)
                                                    recordStatus == "LEAVE" -> Color(0xFF386FA4)
                                                    recordStatus == "HALF_DAY" || recordStatus == "HALF-DAY" -> Color(0xFF7E22CE)
                                                    !hasRecord && isHoliday -> Color(0xFFF43F5E) // Festival Holiday
                                                    !hasRecord && isSunday -> Color(0xFFF59E0B) // Sunday Holiday
                                                    else -> null
                                                }

                                                val subtitleText = when {
                                                    isHoliday -> {
                                                        val name = matchedHoliday?.name.orEmpty()
                                                        if (name.isNotBlank()) "🎉 $name" else "🎉 Holiday"
                                                    }
                                                    isSunday -> "Sun Off"
                                                    else -> null
                                                }

                                                val cellBgColor = when {
                                                    isHoliday -> Color(0xFFFFF1F2)
                                                    isSunday -> Color(0xFFFFFBEB)
                                                    hasRecord -> Color(0xFFF8FAFC).copy(alpha = 0.5f)
                                                    else -> Color.Transparent
                                                }

                                                val cellBorderColor = when {
                                                    isToday -> Color(0xFFD1603D)
                                                    isHoliday -> Color(0xFFFECDD3)
                                                    isSunday -> Color(0xFFFDE68A)
                                                    else -> Color.Transparent
                                                }

                                                val dayTextColor = when {
                                                    isToday -> Color(0xFFD1603D)
                                                    isHoliday -> Color(0xFFBE123C)
                                                    isSunday -> Color(0xFFB45309)
                                                    else -> MaterialTheme.colorScheme.onSurface
                                                }

                                                val subtitleColor = when {
                                                    isHoliday -> Color(0xFFE11D48)
                                                    isSunday -> Color(0xFFD97706)
                                                    else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                                }

                                                Box(
                                                    modifier = Modifier
                                                        .weight(1f)
                                                        .height(52.dp)
                                                        .padding(1.5.dp)
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(cellBgColor)
                                                        .border(
                                                            width = if (isToday) 2.dp else if (cellBorderColor != Color.Transparent) 1.dp else 0.dp,
                                                            color = cellBorderColor,
                                                            shape = RoundedCornerShape(6.dp)
                                                        ),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Column(
                                                        horizontalAlignment = Alignment.CenterHorizontally,
                                                        verticalArrangement = Arrangement.Center,
                                                        modifier = Modifier.fillMaxSize().padding(horizontal = 1.dp, vertical = 2.dp)
                                                    ) {
                                                        Text(
                                                            text = day.toString(),
                                                            fontSize = 11.sp,
                                                            fontWeight = if (isToday || isSunday || isHoliday) FontWeight.Bold else FontWeight.Medium,
                                                            color = dayTextColor,
                                                            lineHeight = 13.sp
                                                        )
                                                        if (subtitleText != null) {
                                                            Text(
                                                                text = subtitleText,
                                                                fontSize = 7.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = subtitleColor,
                                                                maxLines = 1,
                                                                overflow = TextOverflow.Ellipsis,
                                                                textAlign = TextAlign.Center,
                                                                lineHeight = 8.sp
                                                            )
                                                        }
                                                        if (dotColor != null) {
                                                            Spacer(modifier = Modifier.height(1.dp))
                                                            Box(
                                                                modifier = Modifier
                                                                    .size(5.dp)
                                                                    .clip(CircleShape)
                                                                    .background(dotColor)
                                                            )
                                                        }
                                                    }
                                                }
                                            } else {
                                                Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))
                                // Legend (matches web dashboard statusConfig)
                                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        CalendarLegendItem(color = Color(0xFF0B6E4F), label = "Present")
                                        CalendarLegendItem(color = Color(0xFFD1603D), label = "Late")
                                        CalendarLegendItem(color = Color(0xFFF44336), label = "Absent")
                                        CalendarLegendItem(color = Color(0xFF386FA4), label = "Leave")
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        CalendarLegendItem(color = Color(0xFF7E22CE), label = "Half Day")
                                        CalendarLegendItem(color = Color(0xFFF59E0B), label = "Sunday Holiday")
                                        CalendarLegendItem(color = Color(0xFFF43F5E), label = "Festival Holiday")
                                    }
                                }
                            }
                        }
                    }

                    // Attendance Logs / History
                    item {
                        Text(
                            text = "Recent Attendance Logs",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (monthlyRecords.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        Icons.Default.EventBusy,
                                        contentDescription = null,
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "No attendance logs this month",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                    } else {
                        items(monthlyRecords.reversed().take(15), key = { it.id }) { log ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = formatUtcToLocalDate(log.date),
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "In: ${formatUtcToLocalTime(log.checkInTime)} | Out: ${formatUtcToLocalTime(log.checkOutTime)}",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                        if (log.totalMinutes != null && log.totalMinutes > 0) {
                                            Text(
                                                text = "${log.totalMinutes / 60}h ${log.totalMinutes % 60}m worked",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.primary,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                    }

                                    val badgeColor = when (log.status.uppercase()) {
                                        "PRESENT" -> Color(0xFF0B6E4F) // BrandGreen
                                        "ABSENT" -> Color(0xFFF44336)
                                        "LATE" -> Color(0xFFD1603D) // BrandOrange
                                        "LEAVE" -> Color(0xFF386FA4) // BrandBlue
                                        else -> MaterialTheme.colorScheme.tertiary
                                    }
                                    Surface(
                                        color = badgeColor.copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            text = log.status,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = badgeColor
                                        )
                                    }
                                }
                            }
                        }
                    }

                    item { Spacer(modifier = Modifier.height(16.dp)) }
                }

            // Loading Overlay
            if (state is AttendanceState.Loading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

            // CameraX Dialog Capture Overlay
            if (showCamera) {
                Dialog(
                    onDismissRequest = { showCamera = false }
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(450.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            var imageCapture: ImageCapture? by remember { mutableStateOf(null) }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                                    .background(Color.Black)
                            ) {
                                AndroidView(
                                    factory = { ctx ->
                                        val previewView = PreviewView(ctx)
                                        val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                                        cameraProviderFuture.addListener({
                                            val cameraProvider = cameraProviderFuture.get()
                                            val preview = androidx.camera.core.Preview.Builder().build().also {
                                                it.surfaceProvider = previewView.surfaceProvider
                                            }
                                            imageCapture = ImageCapture.Builder().build()

                                            try {
                                                cameraProvider.unbindAll()
                                                cameraProvider.bindToLifecycle(
                                                    lifecycleOwner,
                                                    CameraSelector.DEFAULT_FRONT_CAMERA,
                                                    preview,
                                                    imageCapture
                                                )
                                            } catch (_: Exception) {
                                                Toast.makeText(ctx, "Failed to bind camera", Toast.LENGTH_SHORT).show()
                                            }
                                        }, ContextCompat.getMainExecutor(ctx))
                                        previewView
                                    },
                                    modifier = Modifier.fillMaxSize()
                                )
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(MaterialTheme.colorScheme.surface)
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceEvenly,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                IconButton(
                                    onClick = { showCamera = false },
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(MaterialTheme.colorScheme.errorContainer, CircleShape)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onErrorContainer)
                                }

                                Button(
                                    onClick = {
                                        val photoFile = File(
                                            context.cacheDir,
                                            "selfie_${System.currentTimeMillis()}.jpg"
                                        )
                                        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

                                        imageCapture?.takePicture(
                                            outputOptions,
                                            ContextCompat.getMainExecutor(context),
                                            object : ImageCapture.OnImageSavedCallback {
                                                override fun onError(exc: ImageCaptureException) {
                                                    Toast.makeText(context, "Selfie failed: ${exc.message}", Toast.LENGTH_SHORT).show()
                                                    showCamera = false
                                                }

                                                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                                                    val bitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                                                    val stream = ByteArrayOutputStream()
                                                    bitmap.compress(Bitmap.CompressFormat.JPEG, 70, stream)
                                                    val byteArray = stream.toByteArray()
                                                    val base64Selfie = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)

                                                    viewModel.checkIn(base64Selfie, currentLatitude, currentLongitude) { result ->
                                                        if (result.isSuccess) {
                                                            Toast.makeText(context, "Checked in successfully!", Toast.LENGTH_SHORT).show()
                                                        } else {
                                                            val exception = result.exceptionOrNull()
                                                            if (exception is OfflinePendingException) {
                                                                Toast.makeText(context, exception.message, Toast.LENGTH_LONG).show()
                                                            } else {
                                                                Toast.makeText(context, "Check-in failed: ${exception?.message}", Toast.LENGTH_LONG).show()
                                                            }
                                                        }
                                                    }
                                                    showCamera = false
                                                }
                                            }
                                        )
                                    },
                                    modifier = Modifier.height(48.dp)
                                ) {
                                    Icon(Icons.Default.CameraAlt, contentDescription = "Capture")
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Snap Selfie")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    }
}

@Composable
fun CalendarLegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}

private fun formatUtcToLocalTime(isoString: String?): String {
    if (isoString.isNullOrBlank()) return "N/A"
    return try {
        val cleanIso = if (isoString.contains(".")) isoString.substringBefore(".") else isoString.substringBefore("Z")
        val cleanIsoTime = if (cleanIso.contains("T")) cleanIso else "${cleanIso}T00:00:00"
        
        val utcFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val date = utcFormat.parse(cleanIsoTime) ?: return "N/A"
        
        val localFormat = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).apply {
            timeZone = java.util.TimeZone.getDefault()
        }
        localFormat.format(date)
    } catch (e: Exception) {
        isoString.substringAfter("T").substringBefore(".")
    }
}

private fun formatUtcToLocalDate(isoString: String?): String {
    if (isoString.isNullOrBlank()) return "N/A"
    return try {
        val cleanIso = isoString.substringBefore("T")
        val utcFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val date = utcFormat.parse(cleanIso) ?: return "N/A"
        
        val localFormat = java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault())
        localFormat.format(date)
    } catch (e: Exception) {
        isoString.substringBefore("T")
    }
}

@Composable
fun FullScreenAttendanceMapDialog(
    onDismiss: () -> Unit,
    isCheckedIn: Boolean,
    checkInTimeFormatted: String?,
    checkInLat: Double?,
    checkInLng: Double?,
    currentLat: Double?,
    currentLng: Double?,
    resolvedAddress: String?,
    attendanceRules: com.swayog.employee.data.model.AttendanceRule,
    useGoogleMaps: Boolean,
    isSatelliteView: Boolean,
    onToggleSatelliteView: () -> Unit,
    onToggleMapProvider: () -> Unit,
    onRefreshLocation: () -> Unit
) {
    val context = LocalContext.current
    val effectiveLat = checkInLat ?: currentLat ?: attendanceRules.officeLat
    val effectiveLng = checkInLng ?: currentLng ?: attendanceRules.officeLng

    val distFromOffice = remember(effectiveLat, effectiveLng, attendanceRules) {
        val results = FloatArray(1)
        Location.distanceBetween(
            effectiveLat, effectiveLng,
            attendanceRules.officeLat, attendanceRules.officeLng,
            results
        )
        results[0]
    }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(effectiveLat, effectiveLng), 17f)
    }

    LaunchedEffect(effectiveLat, effectiveLng) {
        cameraPositionState.position = CameraPosition.fromLatLngZoom(
            LatLng(effectiveLat, effectiveLng), 17f
        )
    }

    val fullScreenLeafletHtml = remember(effectiveLat, effectiveLng, isCheckedIn, checkInTimeFormatted, checkInLat, checkInLng, currentLat, currentLng, attendanceRules, isSatelliteView) {
        buildAttendanceLeafletHtml(
            isCheckedIn = isCheckedIn,
            loginTimeFormatted = checkInTimeFormatted,
            checkInLat = checkInLat,
            checkInLng = checkInLng,
            liveLat = currentLat,
            liveLng = currentLng,
            fallbackLat = effectiveLat,
            fallbackLng = effectiveLng,
            attendanceRules = attendanceRules,
            isInteractive = true,
            isSatelliteView = isSatelliteView
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Main Map View (Fill entire screen)
            if (!useGoogleMaps) {
                AndroidView(
                    factory = { ctx ->
                        android.webkit.WebView(ctx).apply {
                            setBackgroundColor(android.graphics.Color.parseColor("#E2E8F0"))
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.allowFileAccess = true
                            settings.allowContentAccess = true
                            @Suppress("DEPRECATION")
                            settings.allowFileAccessFromFileURLs = true
                            @Suppress("DEPRECATION")
                            settings.allowUniversalAccessFromFileURLs = true
                            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                            settings.userAgentString = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36 SwayogApp/1.0"
                            webChromeClient = object : android.webkit.WebChromeClient() {
                                override fun onConsoleMessage(msg: android.webkit.ConsoleMessage?): Boolean {
                                    android.util.Log.d("AttendanceMapFull", "${msg?.message()} [${msg?.sourceId()}:${msg?.lineNumber()}]")
                                    return true
                                }
                            }
                            webViewClient = object : android.webkit.WebViewClient() {
                                override fun onReceivedError(view: android.webkit.WebView?, request: android.webkit.WebResourceRequest?, error: android.webkit.WebResourceError?) {
                                    android.util.Log.e("AttendanceMapFull", "Error: ${error?.description} on ${request?.url}")
                                }
                            }
                            loadDataWithBaseURL("file:///android_asset/leaflet/", fullScreenLeafletHtml, "text/html", "UTF-8", null)
                        }
                    },
                    update = { webView ->
                        webView.loadDataWithBaseURL("file:///android_asset/leaflet/", fullScreenLeafletHtml, "text/html", "UTF-8", null)
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = cameraPositionState,
                    properties = MapProperties(
                        mapType = if (isSatelliteView) MapType.HYBRID else MapType.NORMAL
                    ),
                    uiSettings = MapUiSettings(
                        zoomControlsEnabled = true,
                        compassEnabled = true,
                        myLocationButtonEnabled = false
                    )
                ) {
                    if (checkInLat != null && checkInLng != null) {
                        Marker(
                            state = rememberMarkerState(position = LatLng(checkInLat, checkInLng)),
                            title = "Check-In Location: $checkInTimeFormatted",
                            snippet = "📍 %.5f, %.5f".format(checkInLat, checkInLng)
                        )
                    }
                    if (currentLat != null && currentLng != null && (currentLat != checkInLat || currentLng != checkInLng)) {
                        Marker(
                            state = rememberMarkerState(position = LatLng(currentLat, currentLng)),
                            title = "Live GPS Location",
                            snippet = "📍 %.5f, %.5f".format(currentLat, currentLng)
                        )
                    }
                    if (attendanceRules.geofenceEnabled) {
                        Circle(
                            center = LatLng(attendanceRules.officeLat, attendanceRules.officeLng),
                            radius = attendanceRules.officeRadius,
                            strokeColor = Color(0xFF10B981),
                            fillColor = Color(0x2210B981),
                            strokeWidth = 2f
                        )
                    }
                }
            }

            // Top Control Bar
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .statusBarsPadding()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                shadowElevation = 6.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Close Map", tint = MaterialTheme.colorScheme.onSurface)
                        }
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = if (isCheckedIn) "Check-In Location" else "Live GPS Location",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = if (isSatelliteView) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Text(
                                        text = if (isSatelliteView) "🛰️ Satellite" else "🗺️ Street",
                                        color = if (isSatelliteView) Color.White else MaterialTheme.colorScheme.primary,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text(
                                text = if (isCheckedIn) "Recorded at $checkInTimeFormatted" else "Current Position",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Toggle Satellite / Street view
                        IconButton(onClick = onToggleSatelliteView) {
                            Icon(
                                imageVector = if (isSatelliteView) Icons.Default.Satellite else Icons.Default.Map,
                                contentDescription = "Toggle Satellite View",
                                tint = if (isSatelliteView) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary
                            )
                        }
                        // Refresh GPS button
                        IconButton(onClick = onRefreshLocation) {
                            Icon(Icons.Default.MyLocation, contentDescription = "Refresh GPS", tint = MaterialTheme.colorScheme.primary)
                        }
                        // Toggle map engine (Leaflet / Google Maps)
                        IconButton(onClick = onToggleMapProvider) {
                            Icon(
                                imageVector = if (useGoogleMaps) Icons.Default.Layers else Icons.Default.Public,
                                contentDescription = "Switch Map Engine",
                                tint = MaterialTheme.colorScheme.secondary
                            )
                        }
                        // Close button
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }

            // Floating Navigation Actions
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Open in External Google Maps
                FloatingActionButton(
                    onClick = {
                        val geoUri = Uri.parse("geo:$effectiveLat,$effectiveLng?q=$effectiveLat,$effectiveLng(Swayog Check-In)")
                        val mapIntent = Intent(Intent.ACTION_VIEW, geoUri).apply {
                            setPackage("com.google.android.apps.maps")
                        }
                        try {
                            context.startActivity(mapIntent)
                        } catch (_: Exception) {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=$effectiveLat,$effectiveLng"))
                            context.startActivity(browserIntent)
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = Color.White,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = "Open in Google Maps", modifier = Modifier.size(22.dp))
                }

                // Toggle Satellite / Street View floating FAB
                FloatingActionButton(
                    onClick = onToggleSatelliteView,
                    containerColor = if (isSatelliteView) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.surface,
                    contentColor = if (isSatelliteView) Color.White else MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = if (isSatelliteView) Icons.Default.Satellite else Icons.Default.Map,
                        contentDescription = "Toggle Satellite",
                        modifier = Modifier.size(22.dp)
                    )
                }

                // Center GPS Location
                FloatingActionButton(
                    onClick = {
                        onRefreshLocation()
                    },
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(Icons.Default.MyLocation, contentDescription = "Center GPS", modifier = Modifier.size(22.dp))
                }
            }

            // Bottom Detail Floating Card
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(16.dp),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                shadowElevation = 8.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isCheckedIn) Color(0xFFE8F5E9) else Color(0xFFE0F2FE)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = if (isCheckedIn) Icons.Default.CheckCircle else Icons.Default.MyLocation,
                                    contentDescription = null,
                                    tint = if (isCheckedIn) Color(0xFF2E7D32) else Color(0xFF0284C7),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (isCheckedIn) "Check-In Verified: $checkInTimeFormatted" else "Live Device Location",
                                    color = if (isCheckedIn) Color(0xFF2E7D32) else Color(0xFF0284C7),
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        if (attendanceRules.geofenceEnabled) {
                            val isInside = distFromOffice <= attendanceRules.officeRadius
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isInside) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                            ) {
                                Text(
                                    text = if (isInside) "Inside Zone (${distFromOffice.toInt()}m)" else "${distFromOffice.toInt()}m from Office",
                                    color = if (isInside) Color(0xFF2E7D32) else Color(0xFFC62828),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    // Resolved human-readable address
                    if (!resolvedAddress.isNullOrBlank()) {
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Place,
                                contentDescription = null,
                                tint = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary,
                                modifier = Modifier
                                    .size(20.dp)
                                    .padding(top = 2.dp)
                            )
                            Text(
                                text = resolvedAddress ?: "",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    // Precise coordinates
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "GPS: ${"%.6f".format(effectiveLat)}° N, ${"%.6f".format(effectiveLng)}° E",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                            fontWeight = FontWeight.Medium
                        )

                        TextButton(
                            onClick = {
                                val geoUri = Uri.parse("geo:$effectiveLat,$effectiveLng?q=$effectiveLat,$effectiveLng(Swayog Check-In)")
                                val mapIntent = Intent(Intent.ACTION_VIEW, geoUri).apply {
                                    setPackage("com.google.android.apps.maps")
                                }
                                try {
                                    context.startActivity(mapIntent)
                                } catch (_: Exception) {
                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=$effectiveLat,$effectiveLng"))
                                    context.startActivity(browserIntent)
                                }
                            }
                        ) {
                            Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Open in Maps", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        }
    }
}

/**
 * Builds high-definition, interactive Leaflet HTML template with Esri World Imagery (Satellite) &
 * CartoDB Voyager tiles, dual markers (Check-In point and live GPS point), and geofence circle.
 */
private fun buildAttendanceLeafletHtml(
    isCheckedIn: Boolean,
    loginTimeFormatted: String?,
    checkInLat: Double?,
    checkInLng: Double?,
    liveLat: Double?,
    liveLng: Double?,
    fallbackLat: Double,
    fallbackLng: Double,
    attendanceRules: com.swayog.employee.data.model.AttendanceRule,
    isInteractive: Boolean,
    isSatelliteView: Boolean = true
): String {
    val centerLat = checkInLat ?: liveLat ?: fallbackLat
    val centerLng = checkInLng ?: liveLng ?: fallbackLng

    val hasCheckIn = isCheckedIn && checkInLat != null && checkInLng != null
    val hasLive = liveLat != null && liveLng != null

    val geofenceScript = if (attendanceRules.geofenceEnabled) {
        """
        L.circle([${attendanceRules.officeLat}, ${attendanceRules.officeLng}], {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.18,
            weight: 2,
            radius: ${attendanceRules.officeRadius},
            dashArray: '6, 6'
        }).addTo(map).bindPopup('<b>Office Geofence Zone</b><br>Radius: ${attendanceRules.officeRadius.toInt()}m');
        """.trimIndent()
    } else ""

    val markersScript = buildString {
        if (hasCheckIn) {
            appendLine("""
                var checkInPinHtml = '' +
                    '<div class="swayog-pin-wrap">' +
                        '<div class="swayog-time-pill checkin">⏰ Login: ${loginTimeFormatted ?: ""}</div>' +
                        '<div class="swayog-pin-head checkin"><div class="swayog-pin-core"></div></div>' +
                        '<div class="swayog-pin-pulse"></div>' +
                    '</div>';
                var checkInIcon = L.divIcon({
                    html: checkInPinHtml,
                    className: '',
                    iconSize: [140, 68],
                    iconAnchor: [70, 68],
                    popupAnchor: [0, -64]
                });
                var checkInMarker = L.marker([$checkInLat, $checkInLng], { icon: checkInIcon, zIndexOffset: 1000 }).addTo(map);
                checkInMarker.bindPopup('<div class="popup-title green">✅ Check-In Location Verified</div><div class="popup-body"><b>Time:</b> ${loginTimeFormatted ?: "N/A"}<br><b>Coordinates:</b> ${"%.5f".format(checkInLat)}, ${"%.5f".format(checkInLng)}</div>');
                boundsList.push([$checkInLat, $checkInLng]);
            """.trimIndent())
        }

        if (hasLive && (!hasCheckIn || Math.abs(liveLat!! - checkInLat!!) > 0.0001 || Math.abs(liveLng!! - checkInLng!!) > 0.0001)) {
            appendLine("""
                var livePinHtml = '' +
                    '<div class="swayog-pin-wrap">' +
                        '<div class="swayog-time-pill live">📍 You are here</div>' +
                        '<div class="live-radar-container">' +
                            '<div class="live-radar-wave"></div>' +
                            '<div class="live-radar-dot"></div>' +
                        '</div>' +
                    '</div>';
                var liveIcon = L.divIcon({
                    html: livePinHtml,
                    className: '',
                    iconSize: [120, 60],
                    iconAnchor: [60, 48],
                    popupAnchor: [0, -48]
                });
                var liveMarker = L.marker([$liveLat, $liveLng], { icon: liveIcon, zIndexOffset: 500 }).addTo(map);
                liveMarker.bindPopup('<div class="popup-title blue">📍 Current GPS Location</div><div class="popup-body"><b>Live Coordinates:</b> ${"%.5f".format(liveLat)}, ${"%.5f".format(liveLng)}</div>');
                boundsList.push([$liveLat, $liveLng]);
            """.trimIndent())
        }

        if (!hasCheckIn && !hasLive) {
            appendLine("""
                var defaultPinHtml = '' +
                    '<div class="swayog-pin-wrap">' +
                        '<div class="swayog-time-pill live">📍 GPS Signal Ready</div>' +
                        '<div class="swayog-pin-head live"><div class="swayog-pin-core"></div></div>' +
                        '<div class="swayog-pin-pulse"></div>' +
                    '</div>';
                var defaultIcon = L.divIcon({
                    html: defaultPinHtml,
                    className: '',
                    iconSize: [140, 68],
                    iconAnchor: [70, 68],
                    popupAnchor: [0, -64]
                });
                var defaultMarker = L.marker([$fallbackLat, $fallbackLng], { icon: defaultIcon }).addTo(map);
                boundsList.push([$fallbackLat, $fallbackLng]);
            """.trimIndent())
        }
    }

    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
            html, body, #map { width: 100%; height: 100%; background: #e2e8f0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .swayog-pin-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: auto;
                cursor: pointer;
            }
            .swayog-time-pill {
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 14px;
                box-shadow: 0 4px 14px rgba(0,0,0,0.5);
                border: 2px solid #ffffff;
                white-space: nowrap;
                margin-bottom: 2px;
                letter-spacing: 0.2px;
            }
            .swayog-time-pill.checkin { background: #0B6E4F; }
            .swayog-time-pill.live { background: #0284c7; }
            .swayog-pin-head {
                width: 32px;
                height: 32px;
                border: 2.5px solid #ffffff;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .swayog-pin-head.checkin { background: radial-gradient(circle at 50% 35%, #34d399, #0B6E4F 80%); }
            .swayog-pin-head.live { background: radial-gradient(circle at 50% 35%, #60a5fa, #0284c7 80%); }
            .swayog-pin-core {
                width: 10px;
                height: 10px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
            }
            .swayog-pin-pulse {
                width: 14px;
                height: 5px;
                background: rgba(0,0,0,0.3);
                border-radius: 50%;
                margin-top: -1px;
            }
            .live-radar-container {
                position: relative;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .live-radar-dot {
                width: 14px;
                height: 14px;
                background: #0284c7;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 10px rgba(2,132,199,0.7);
                z-index: 2;
            }
            .live-radar-wave {
                position: absolute;
                width: 28px;
                height: 28px;
                background: rgba(2,132,199,0.45);
                border-radius: 50%;
                animation: pulseRadar 1.8s infinite ease-out;
            }
            @keyframes pulseRadar {
                0% { transform: scale(0.6); opacity: 1; }
                100% { transform: scale(1.7); opacity: 0; }
            }
            .leaflet-popup-content-wrapper {
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                padding: 4px;
            }
            .popup-title { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
            .popup-title.green { color: #0B6E4F; }
            .popup-title.blue { color: #0284c7; }
            .popup-body { font-size: 12px; line-height: 1.4; color: #334155; }
            .leaflet-control-layers {
                border-radius: 10px;
                box-shadow: 0 4px 14px rgba(0,0,0,0.35);
                font-weight: 600;
                font-size: 12px;
                padding: 6px 10px;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="leaflet.js"></script>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            function initAttendanceMap() {
                if (typeof L === 'undefined') {
                    console.error("Leaflet not ready yet");
                    setTimeout(initAttendanceMap, 100);
                    return;
                }

                var map = L.map('map', {
                    zoomControl: ${if (isInteractive) "true" else "false"},
                    attributionControl: false,
                    dragging: ${if (isInteractive) "true" else "false"},
                    touchZoom: ${if (isInteractive) "true" else "false"},
                    doubleClickZoom: ${if (isInteractive) "true" else "false"},
                    scrollWheelZoom: ${if (isInteractive) "true" else "false"}
                }).setView([$centerLat, $centerLng], 17);

                ${if (isInteractive) "L.control.zoom({ position: 'bottomright' }).addTo(map);" else ""}

                // Ultra High-Resolution Satellite Layer (Google Hybrid Satellite with Roads & Labels)
                var googleSatHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    attribution: 'Google Satellite'
                });

                // Standard Streets Layer (Google Maps Streets)
                var googleStreets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    attribution: 'Google Maps'
                });

                // Fallback OpenStreetMap Layer
                var osmStreets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                });

                if ($isSatelliteView) {
                    googleSatHybrid.addTo(map);
                } else {
                    googleStreets.addTo(map);
                }

                ${if (isInteractive) """
                var baseLayers = {
                    "🛰️ Satellite View": googleSatHybrid,
                    "🗺️ Streets View": googleStreets,
                    "🌐 OpenStreetMap": osmStreets
                };
                L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);
                """ else ""}

                $geofenceScript

                var boundsList = [];
                $markersScript

                if (boundsList.length > 1) {
                    try {
                        map.fitBounds(L.latLngBounds(boundsList), { padding: [40, 40], maxZoom: 17 });
                    } catch(e) {}
                }

                function triggerInvalidate() {
                    if (map) { map.invalidateSize(); }
                }
                setTimeout(triggerInvalidate, 100);
                setTimeout(triggerInvalidate, 300);
                setTimeout(triggerInvalidate, 600);
                setTimeout(triggerInvalidate, 1200);
                window.addEventListener('resize', triggerInvalidate);
            }

            initAttendanceMap();
        </script>
    </body>
    </html>
    """.trimIndent()
}
