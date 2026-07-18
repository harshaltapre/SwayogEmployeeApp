package com.swayog.employee.presentation.common.components

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.location.Geocoder
import android.util.Log
import android.location.LocationManager
import android.content.Intent
import android.provider.Settings
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.Camera
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun CustomCameraScreen(
    customerName: String,
    taskId: String,
    taskAddress: String, // Fallback if reverse geocoding fails
    onPhotoCaptured: (Bitmap, String) -> Unit, // Returns Bitmap and formatted address
    onClosed: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var isCapturing by remember { mutableStateOf(false) }
    
    // Toggle camera state
    var isBackCamera by remember { mutableStateOf(true) }
    var isTorchOn by remember { mutableStateOf(false) }
    var camera by remember { mutableStateOf<androidx.camera.core.Camera?>(null) }
    val previewView = remember { PreviewView(context) }

    // Live overlay states
    var currentLat by remember { mutableStateOf<Double?>(null) }
    var currentLng by remember { mutableStateOf<Double?>(null) }
    var currentTime by remember { mutableStateOf("") }
    var currentAddress by remember { mutableStateOf("Locating...") }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    val geocoder = remember { Geocoder(context, Locale.getDefault()) }

    var showGpsDisabledDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
        if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) && !locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            showGpsDisabledDialog = true
        }
    }

    if (showGpsDisabledDialog) {
        AlertDialog(
            onDismissRequest = { showGpsDisabledDialog = false },
            title = { Text("Location Disabled") },
            text = { Text("Your device's location services are turned off. Please turn them on for accurate geotagging.") },
            confirmButton = {
                TextButton(onClick = {
                    showGpsDisabledDialog = false
                    context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                }) {
                    Text("Enable Location")
                }
            },
            dismissButton = {
                TextButton(onClick = { showGpsDisabledDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Update time every second
    LaunchedEffect(Unit) {
        while (true) {
            val format = SimpleDateFormat("EEEE, dd/MM/yyyy hh:mm a", Locale.getDefault())
            currentTime = format.format(Date())
            delay(1000)
        }
    }

    // Update location and reverse geocode with fallback
    LaunchedEffect(Unit) {
        try {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                // Try high accuracy first with a 6-second timeout
                var location = withTimeoutOrNull(6000) {
                    fusedLocationClient.getCurrentLocation(
                        Priority.PRIORITY_HIGH_ACCURACY,
                        CancellationTokenSource().token
                    ).await()
                }

                // Fallback to balanced power accuracy if high accuracy fails/times out
                if (location == null) {
                    location = withTimeoutOrNull(4000) {
                        fusedLocationClient.getCurrentLocation(
                            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                            CancellationTokenSource().token
                        ).await()
                    }
                }

                currentLat = location?.latitude
                currentLng = location?.longitude

                if (currentLat != null && currentLng != null) {
                    withContext(Dispatchers.IO) {
                        try {
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                                geocoder.getFromLocation(currentLat!!, currentLng!!, 1) { addresses ->
                                    val address = addresses.firstOrNull()
                                    currentAddress = address?.getAddressLine(0) ?: taskAddress
                                }
                            } else {
                                @Suppress("DEPRECATION")
                                val addresses = geocoder.getFromLocation(currentLat!!, currentLng!!, 1)
                                currentAddress = addresses?.firstOrNull()?.getAddressLine(0) ?: taskAddress
                            }
                        } catch (e: Exception) {
                            currentAddress = taskAddress
                        }
                    }
                } else {
                    currentAddress = taskAddress
                }
            }
        } catch (e: Exception) {
            Log.e("CustomCameraScreen", "Failed to get location", e)
            currentAddress = taskAddress
        }
    }

    // Camera Binding
    LaunchedEffect(isBackCamera) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()

            val cameraSelector = if (isBackCamera) {
                CameraSelector.DEFAULT_BACK_CAMERA
            } else {
                CameraSelector.DEFAULT_FRONT_CAMERA
            }

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture
                )
                // Restore flash if applicable
                if (camera?.cameraInfo?.hasFlashUnit() == true) {
                    camera?.cameraControl?.enableTorch(isTorchOn)
                } else {
                    isTorchOn = false // reset if no flash
                }
            } catch (e: Exception) {
                Log.e("CustomCameraScreen", "Use case binding failed", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        // Camera Preview
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { previewView }
        )

        // Top Controls: Close, Flash, and Switch Camera
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = onClosed,
                modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
            }
            
            Row {
                if (camera?.cameraInfo?.hasFlashUnit() == true) {
                    IconButton(
                        onClick = { 
                            isTorchOn = !isTorchOn
                            camera?.cameraControl?.enableTorch(isTorchOn)
                        },
                        modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                    ) {
                        Icon(
                            if (isTorchOn) Icons.Default.FlashOn else Icons.Default.FlashOff, 
                            contentDescription = "Toggle Flash", 
                            tint = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                }

                IconButton(
                    onClick = { isBackCamera = !isBackCamera },
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                ) {
                    Icon(Icons.Default.Cameraswitch, contentDescription = "Switch Camera", tint = Color.White)
                }
            }
        }

        // Live Geotag Overlay (Matches WatermarkHelper design)
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .fillMaxHeight(0.25f)
                .background(Color(0x99000000))
        ) {
            Row(modifier = Modifier.fillMaxSize().padding(8.dp)) {
                // Map Thumbnail Placeholder / Live Map
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .aspectRatio(1f)
                        .background(Color(0xFF444444)),
                    contentAlignment = Alignment.Center
                ) {
                    if (currentLat != null && currentLng != null) {
                        val pos = LatLng(currentLat!!, currentLng!!)
                        val cameraPositionState = rememberCameraPositionState {
                            position = CameraPosition.fromLatLngZoom(pos, 15f)
                        }
                        LaunchedEffect(pos) {
                            cameraPositionState.position = CameraPosition.fromLatLngZoom(pos, 15f)
                        }
                        GoogleMap(
                            modifier = Modifier.fillMaxSize(),
                            cameraPositionState = cameraPositionState,
                            uiSettings = MapUiSettings(
                                zoomControlsEnabled = false,
                                scrollGesturesEnabled = false,
                                zoomGesturesEnabled = false,
                                tiltGesturesEnabled = false,
                                rotationGesturesEnabled = false,
                                compassEnabled = false
                            )
                        ) {
                            Marker(state = MarkerState(position = pos))
                        }
                    } else {
                        // Fallback icon if no location yet
                        Canvas(modifier = Modifier.size(24.dp)) {
                            val radius = size.width * 0.3f
                            val cx = center.x
                            val cy = center.y - radius
                            
                            drawCircle(Color.Red, radius, center = androidx.compose.ui.geometry.Offset(cx, cy))
                            
                            val path = Path()
                            path.moveTo(cx - radius, cy)
                            path.lineTo(cx + radius, cy)
                            path.lineTo(cx, cy + (radius * 2f))
                            path.close()
                            drawPath(path, Color.Red)
                            
                            drawCircle(Color.White, radius * 0.4f, center = androidx.compose.ui.geometry.Offset(cx, cy))
                        }
                    }
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                // Text Information
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceEvenly
                ) {
                    Text(
                        text = "Customer: $customerName | Task ID: $taskId",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = currentAddress,
                        color = Color.White,
                        fontSize = 12.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    val locText = if (currentLat != null && currentLng != null) {
                        "Lat: %.6f, Lng: %.6f".format(currentLat, currentLng)
                    } else {
                        "Location: Unavailable"
                    }
                    Text(
                        text = locText,
                        color = Color.White,
                        fontSize = 12.sp
                    )
                    Text(
                        text = currentTime,
                        color = Color.White,
                        fontSize = 12.sp
                    )
                    Text(
                        text = "Captured by Swayog Field App",
                        color = Color(0xFFDDDDDD),
                        fontSize = 10.sp
                    )
                }
            }
        }

        // Capture Button
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = (LocalContext.current.resources.displayMetrics.heightPixels * 0.25f / LocalContext.current.resources.displayMetrics.density).dp + 16.dp)
                .size(72.dp)
                .border(4.dp, Color.White, CircleShape)
                .padding(8.dp)
                .clip(CircleShape)
                .background(if (isCapturing) Color.Gray else Color.White)
                .clickable(enabled = !isCapturing) {
                    isCapturing = true
                    val capture = imageCapture ?: return@clickable
                    capture.takePicture(
                        ContextCompat.getMainExecutor(context),
                        object : ImageCapture.OnImageCapturedCallback() {
                            override fun onCaptureSuccess(image: ImageProxy) {
                                val buffer = image.planes[0].buffer
                                val bytes = ByteArray(buffer.capacity())
                                buffer.get(bytes)
                                val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size, null)
                                
                                // Rotate bitmap if necessary
                                val rotation = image.imageInfo.rotationDegrees.toFloat()
                                val finalBitmap = if (rotation != 0f) {
                                    val matrix = Matrix().apply { postRotate(rotation) }
                                    // Handle mirroring for front camera
                                    if (!isBackCamera) {
                                        matrix.postScale(-1f, 1f, bitmap.width / 2f, bitmap.height / 2f)
                                    }
                                    Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                                } else {
                                    if (!isBackCamera) {
                                        val matrix = Matrix().apply { postScale(-1f, 1f, bitmap.width / 2f, bitmap.height / 2f) }
                                        Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                                    } else {
                                        bitmap
                                    }
                                }
                                
                                image.close()
                                isCapturing = false
                                onPhotoCaptured(finalBitmap, currentAddress)
                            }

                            override fun onError(exception: ImageCaptureException) {
                                Log.e("CustomCameraScreen", "Photo capture failed: ${exception.message}", exception)
                                isCapturing = false
                            }
                        }
                    )
                }
        )
    }
}
