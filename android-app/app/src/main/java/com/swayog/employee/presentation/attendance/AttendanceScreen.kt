package com.swayog.employee.presentation.attendance

import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.location.Location
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.swayog.employee.presentation.common.components.*
import kotlinx.coroutines.delay
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
    val state by viewModel.attendanceState.collectAsState()
    val faceDescriptors by viewModel.faceDescriptors.collectAsState()
    val performance by viewModel.performance.collectAsState()
    val currentTask by viewModel.currentTask.collectAsState()
    val pendingSyncCount by viewModel.pendingSyncCount.collectAsState()
    
    // UI State
    var showCamera by remember { mutableStateOf(false) }
    var showEnrollmentBlocker by remember { mutableStateOf(false) }
    var currentLatitude by remember { mutableStateOf<Double?>(null) }
    var currentLongitude by remember { mutableStateOf<Double?>(null) }

    // Calendar month navigation state
    var calendarMonth by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.MONTH)) }
    var calendarYear by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.YEAR)) }

    val attendanceRules by viewModel.attendanceRules.collectAsState()
    var useGoogleMaps by remember { mutableStateOf(false) }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    // Proactively fetch current GPS location if location permission is already granted
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
            } catch (_: SecurityException) {}
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

    // Work duration timer
    val workDurationText = remember(todayAttendance, currentTime) {
        val attendance = todayAttendance ?: return@remember null
        val checkInStr = attendance.checkInTime ?: return@remember null
        try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val checkInDate = isoFormat.parse(checkInStr.substringBefore(".")) ?: return@remember null
            val endTime = if (attendance.checkOutTime != null) {
                isoFormat.parse(attendance.checkOutTime.substringBefore("."))?.time ?: currentTime
            } else {
                currentTime
            }
            val diffMs = endTime - checkInDate.time
            val hours = (diffMs / 3600000).toInt()
            val minutes = ((diffMs % 3600000) / 60000).toInt()
            val seconds = ((diffMs % 60000) / 1000).toInt()
            Triple(hours, minutes, seconds)
        } catch (_: Exception) { null }
    }

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
                .padding(paddingValues)
        ) {
            PendingSyncBanner(
                pendingCount = pendingSyncCount,
                onClick = {
                    Toast.makeText(context, "Refreshing attendance records...", Toast.LENGTH_SHORT).show()
                    viewModel.loadData()
                }
            )
            
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                    // Live Clock + Work Timer Card
                    item {
                        SwayogCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
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
                                if (workDurationText != null) {
                                    Column(horizontalAlignment = Alignment.End) {
                                        val (h, m, s) = workDurationText
                                        Text(
                                            text = String.format("%02d:%02d:%02d", h, m, s),
                                            style = MaterialTheme.typography.headlineMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = if (todayAttendance?.checkOutTime != null)
                                                Color(0xFF0B6E4F) // BrandGreen
                                            else
                                                Color(0xFF386FA4) // BrandBlue
                                        )
                                        Text(
                                            text = if (todayAttendance?.checkOutTime != null) "Total Worked" else "Working...",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
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

                    // Maps / GPS Verification Card
                    item {
                        SwayogCard {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                val isCheckedIn = todayAttendance?.checkInTime != null
                                val loginTimeFormatted = if (isCheckedIn) formatUtcToLocalTime(todayAttendance?.checkInTime) else null
                                val pinLat = todayAttendance?.latitude ?: currentLatitude ?: attendanceRules.officeLat
                                val pinLng = todayAttendance?.longitude ?: currentLongitude ?: attendanceRules.officeLng

                                val distFromOffice = remember(pinLat, pinLng, attendanceRules) {
                                    val results = FloatArray(1)
                                    Location.distanceBetween(
                                        pinLat, pinLng,
                                        attendanceRules.officeLat, attendanceRules.officeLng,
                                        results
                                    )
                                    results[0]
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Geofenced Location Verification",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = if (isCheckedIn) "Checked In at $loginTimeFormatted" else "Live GPS Location Verification",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                            fontWeight = if (isCheckedIn) FontWeight.SemiBold else FontWeight.Normal
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        // Refresh location button
                                        IconButton(
                                            onClick = {
                                                if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                                                    try {
                                                        fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
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

                                        // Toggle between Leaflet OSM & Google Maps
                                        IconButton(
                                            onClick = { useGoogleMaps = !useGoogleMaps },
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (useGoogleMaps) Icons.Default.Layers else Icons.Default.Public,
                                                contentDescription = if (useGoogleMaps) "Google Maps Active" else "OpenStreetMap Active",
                                                tint = MaterialTheme.colorScheme.secondary,
                                                modifier = Modifier.size(20.dp)
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

                                val leafletHtml = remember(pinLat, pinLng, isCheckedIn, loginTimeFormatted, attendanceRules) {
                                    val geofenceScript = if (attendanceRules.geofenceEnabled) {
                                        """
                                        L.circle([${attendanceRules.officeLat}, ${attendanceRules.officeLng}], {
                                            color: '#10b981',
                                            fillColor: '#10b981',
                                            fillOpacity: 0.15,
                                            radius: ${attendanceRules.officeRadius},
                                            dashArray: '5, 5'
                                        }).addTo(map).bindPopup('<b>Office Geofence Zone</b><br>Radius: ${attendanceRules.officeRadius.toInt()}m');
                                        """.trimIndent()
                                    } else ""

                                    val pinBadge = if (isCheckedIn) "Login: $loginTimeFormatted" else "Current Location"
                                    val pinColor = if (isCheckedIn) "#0B6E4F" else "#0284c7"

                                    """
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                        <link rel="stylesheet" href="file:///android_asset/leaflet/leaflet.css" />
                                        <style>
                                            * { box-sizing: border-box; margin: 0; padding: 0; }
                                            html, body, #map { width: 100%; height: 100%; background: #e2e8f0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                                            .swayog-pin-wrap {
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                pointer-events: auto;
                                                cursor: pointer;
                                            }
                                            .swayog-time-pill {
                                                background: $pinColor;
                                                color: #ffffff;
                                                font-size: 11px;
                                                font-weight: 700;
                                                padding: 4px 10px;
                                                border-radius: 14px;
                                                box-shadow: 0 4px 12px rgba(0,0,0,0.35);
                                                border: 2px solid #ffffff;
                                                white-space: nowrap;
                                                margin-bottom: 2px;
                                                letter-spacing: 0.2px;
                                                display: flex;
                                                align-items: center;
                                                gap: 4px;
                                            }
                                            .swayog-pin-head {
                                                width: 32px;
                                                height: 32px;
                                                background: radial-gradient(circle at 50% 35%, #60a5fa, $pinColor 75%);
                                                border: 2.5px solid #ffffff;
                                                border-radius: 50% 50% 50% 0;
                                                transform: rotate(-45deg);
                                                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            }
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
                                                background: rgba(0,0,0,0.25);
                                                border-radius: 50%;
                                                margin-top: -1px;
                                            }
                                            .leaflet-popup-content-wrapper {
                                                border-radius: 12px;
                                                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                                                padding: 4px;
                                            }
                                            .popup-title { font-weight: 700; font-size: 13px; color: $pinColor; margin-bottom: 4px; }
                                            .popup-body { font-size: 12px; line-height: 1.4; color: #334155; }
                                        </style>
                                    </head>
                                    <body>
                                        <div id="map"></div>
                                        <script src="file:///android_asset/leaflet/leaflet.js"></script>
                                        <script>
                                            var map = L.map('map', {
                                                zoomControl: false,
                                                attributionControl: false
                                            }).setView([$pinLat, $pinLng], 16);

                                            L.control.zoom({ position: 'bottomright' }).addTo(map);

                                            L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
                                                maxZoom: 19
                                            }).addTo(map);

                                            $geofenceScript

                                            var pinHtml = '' +
                                                '<div class="swayog-pin-wrap">' +
                                                    '<div class="swayog-time-pill">⏰ $pinBadge</div>' +
                                                    '<div class="swayog-pin-head"><div class="swayog-pin-core"></div></div>' +
                                                    '<div class="swayog-pin-pulse"></div>' +
                                                '</div>';

                                            var customIcon = L.divIcon({
                                                html: pinHtml,
                                                className: '',
                                                iconSize: [140, 68],
                                                iconAnchor: [70, 68],
                                                popupAnchor: [0, -64]
                                            });

                                            var marker = L.marker([$pinLat, $pinLng], { icon: customIcon }).addTo(map);

                                            var popupContent = '<div class="popup-title">${if (isCheckedIn) "✅ Check-In Location Verified" else "📍 Current GPS Location"}</div>' +
                                                '<div class="popup-body">' +
                                                '<b>Login Time:</b> ${loginTimeFormatted ?: "Not Checked In Yet"}<br>' +
                                                '<b>Coordinates:</b> ${"%.5f".format(pinLat)}, ${"%.5f".format(pinLng)}' +
                                                '</div>';

                                            marker.bindPopup(popupContent);

                                            setTimeout(function() {
                                                map.invalidateSize();
                                            }, 250);
                                        </script>
                                    </body>
                                    </html>
                                    """.trimIndent()
                                }

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(230.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color.LightGray)
                                ) {
                                    if (!useGoogleMaps) {
                                        androidx.compose.ui.viewinterop.AndroidView(
                                            factory = { ctx ->
                                                android.webkit.WebView(ctx).apply {
                                                    settings.javaScriptEnabled = true
                                                    settings.domStorageEnabled = true
                                                    settings.allowFileAccess = true
                                                    settings.allowContentAccess = true
                                                    webViewClient = android.webkit.WebViewClient()
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
                                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
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
                                                text = if (isCheckedIn) "Login: $loginTimeFormatted" else "Live GPS",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isCheckedIn) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }

                                    // Bottom-right Map Engine Badge
                                    Surface(
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .padding(8.dp),
                                        shape = RoundedCornerShape(6.dp),
                                        color = Color.Black.copy(alpha = 0.6f)
                                    ) {
                                        Text(
                                            text = if (useGoogleMaps) "Google Maps" else "OpenStreetMap",
                                            color = Color.White,
                                            fontSize = 9.sp,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

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
                                            imageVector = Icons.Default.Place,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "${"%.4f".format(pinLat)}° N, ${"%.4f".format(pinLng)}° E",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
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
                                            text = if (isCheckedIn) "GPS Verified Pin" else "GPS Signal Ready",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary,
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
                        // Company works 6 days/week (Mon–Sat); only Sunday is a day off
                        val workingDays: Int = remember(currentYear, currentMonth) {
                            var count = 0
                            val today = Calendar.getInstance()
                            val target = Calendar.getInstance()
                            target.set(Calendar.YEAR, currentYear)
                            target.set(Calendar.MONTH, currentMonth)
                            target.set(Calendar.DAY_OF_MONTH, 1)
                            val daysInMonth = target.getActualMaximum(Calendar.DAY_OF_MONTH)
                            var day = 1
                            while (day <= daysInMonth) {
                                target.set(Calendar.DAY_OF_MONTH, day)
                                if (target.after(today)) break
                                val dow = target.get(Calendar.DAY_OF_WEEK)
                                if (dow != Calendar.SUNDAY) count++ // only Sunday off
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
                                                val dateStr = dateFormat.format(cellCal.time)
                                                val record = monthlyRecords.find { it.date.substringBefore("T") == dateStr }

                                                val dotColor = when (record?.status?.uppercase()) {
                                                    "PRESENT" -> Color(0xFF0B6E4F) // BrandGreen
                                                    "ABSENT" -> Color(0xFFF44336)
                                                    "LATE" -> Color(0xFFD1603D) // BrandOrange
                                                    "LEAVE" -> Color(0xFF386FA4) // BrandBlue
                                                    "HALF_DAY", "HALF-DAY" -> Color(0xFF3A2417) // BrandBrown
                                                    else -> null
                                                }

                                                Box(
                                                    modifier = Modifier
                                                        .weight(1f)
                                                        .aspectRatio(1f)
                                                        .padding(2.dp)
                                                        .then(
                                                            if (isToday) Modifier.border(
                                                                2.dp,
                                                                Color(0xFFD1603D), // BrandOrange
                                                                RoundedCornerShape(8.dp)
                                                            ) else Modifier
                                                        ),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                        Text(
                                                            text = day.toString(),
                                                            style = MaterialTheme.typography.labelSmall,
                                                            fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                                                            color = if (isToday) Color(0xFFD1603D) else MaterialTheme.colorScheme.onSurface
                                                        )
                                                        if (dotColor != null) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .size(6.dp)
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

                                Spacer(modifier = Modifier.height(8.dp))
                                // Legend
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    CalendarLegendItem(color = Color(0xFF0B6E4F), label = "Present")
                                    CalendarLegendItem(color = Color(0xFFF44336), label = "Absent")
                                    CalendarLegendItem(color = Color(0xFFD1603D), label = "Late")
                                    CalendarLegendItem(color = Color(0xFF386FA4), label = "Leave")
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
                                                            Toast.makeText(context, "Check-in failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
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
