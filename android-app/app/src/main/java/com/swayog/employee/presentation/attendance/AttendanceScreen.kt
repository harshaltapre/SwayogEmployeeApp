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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.swayog.employee.presentation.common.components.*
import java.io.ByteArrayOutputStream
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
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
    
    var showCamera by remember { mutableStateOf(false) }
    var currentLatitude by remember { mutableStateOf<Double?>(null) }
    var currentLongitude by remember { mutableStateOf<Double?>(null) }
    
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    
    // Permission launchers
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        
        if (fineGranted && cameraGranted) {
            // Get location first, then show camera
            try {
                fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
                    if (loc != null) {
                        currentLatitude = loc.latitude
                        currentLongitude = loc.longitude
                    } else {
                        // Fallback coordinates for emulator
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
        if (currentState is AttendanceState.Success) {
            Toast.makeText(context, currentState.message, Toast.LENGTH_LONG).show()
            viewModel.resetState()
        } else if (currentState is AttendanceState.Error) {
            Toast.makeText(context, currentState.message, Toast.LENGTH_LONG).show()
            viewModel.resetState()
        }
    }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Attendance Tracking",
                showBackButton = true,
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
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
                                        color = if (record != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                                    )
                                    if (record != null) {
                                        Text(
                                            text = "Checked in: ${record.checkInTime?.substringAfter("T")?.substringBefore(".") ?: ""}",
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                        if (record.checkOutTime != null) {
                                            Text(
                                                text = "Checked out: ${record.checkOutTime.substringAfter("T").substringBefore(".")}",
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                        }
                                    }
                                }
                                
                                val statusIcon = if (record != null) Icons.Default.CheckCircle else Icons.Default.Cancel
                                Icon(
                                    imageVector = statusIcon,
                                    contentDescription = null,
                                    tint = if (record != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
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
                            Text(
                                text = "Geofenced Location Verification",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            val mapCenter = LatLng(currentLatitude ?: 18.5204, currentLongitude ?: 73.8567)
                            val cameraPositionState = rememberCameraPositionState {
                                position = CameraPosition.fromLatLngZoom(mapCenter, 15f)
                            }
                            
                            // Update camera position when coordinates change
                            LaunchedEffect(currentLatitude, currentLongitude) {
                                if (currentLatitude != null && currentLongitude != null) {
                                    cameraPositionState.position = CameraPosition.fromLatLngZoom(
                                        LatLng(currentLatitude!!, currentLongitude!!), 15f
                                    )
                                }
                            }
                            
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(200.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.LightGray)
                            ) {
                                GoogleMap(
                                    modifier = Modifier.fillMaxSize(),
                                    cameraPositionState = cameraPositionState
                                ) {
                                    Marker(
                                        state = MarkerState(position = mapCenter),
                                        title = "Your Location",
                                        snippet = "Verification Spot"
                                    )
                                    
                                    // Geofence Circle radius 100m
                                    Circle(
                                        center = mapCenter,
                                        radius = 100.0,
                                        fillColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                                        strokeColor = MaterialTheme.colorScheme.primary,
                                        strokeWidth = 2f
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Verification Spot coordinate: ${"%.4f".format(mapCenter.latitude)}, ${"%.4f".format(mapCenter.longitude)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
                
                // Clock-in/Clock-out Operations Card
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
                                        permissionLauncher.launch(
                                            arrayOf(
                                                Manifest.permission.ACCESS_FINE_LOCATION,
                                                Manifest.permission.ACCESS_COARSE_LOCATION,
                                                Manifest.permission.CAMERA
                                            )
                                        )
                                    },
                                    enabled = todayAttendance == null,
                                    modifier = Modifier.weight(1f)
                                )
                                
                                SwayogButton(
                                    text = "Check Out",
                                    onClick = { viewModel.checkOut() },
                                    enabled = todayAttendance != null && todayAttendance?.checkOutTime == null,
                                    variant = ButtonVariant.Secondary,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
                
                // Attendance Logs / History Card
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
                            Text(
                                text = "No attendance logs this month",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                } else {
                    items(monthlyRecords.reversed().take(10)) { log ->
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
                                Column {
                                    Text(
                                        text = log.date,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "In: ${log.checkInTime?.substringAfter("T")?.substringBefore(".") ?: "N/A"} | Out: ${log.checkOutTime?.substringAfter("T")?.substringBefore(".") ?: "N/A"}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                
                                Badge(
                                    containerColor = if (log.status == "PRESENT") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
                                ) {
                                    Text(log.status)
                                }
                            }
                        }
                    }
                }
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
                                                    // Convert photo to base64
                                                    val bitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                                                    val stream = ByteArrayOutputStream()
                                                    bitmap.compress(Bitmap.CompressFormat.JPEG, 70, stream)
                                                    val byteArray = stream.toByteArray()
                                                    val base64Selfie = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
                                                    
                                                    viewModel.checkIn(base64Selfie, currentLatitude, currentLongitude)
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
