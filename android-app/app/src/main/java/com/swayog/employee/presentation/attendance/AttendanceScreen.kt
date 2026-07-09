package com.swayog.employee.presentation.attendance

import android.graphics.Bitmap
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.swayog.employee.presentation.common.components.*
import java.io.ByteArrayOutputStream

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun AttendanceScreen(
    onNavigateBack: () -> Unit,
    viewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val state by viewModel.attendanceState.collectAsState()
    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val performance by viewModel.performance.collectAsState()
    
    // Accompanist camera permission checking state
    val cameraPermissionState = rememberPermissionState(
        android.Manifest.permission.CAMERA
    )
    
    // Activity launcher for capturing check-in selfie dynamically
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        if (bitmap != null) {
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val byteArray = outputStream.toByteArray()
            val base64Selfie = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            val dataUrl = "data:image/jpeg;base64,$base64Selfie"
            
            // Dispatch dynamic check-in request with the captured photo
            viewModel.checkIn(
                selfie = dataUrl,
                latitude = 18.5204, // Default Pune lat
                longitude = 73.8567 // Default Pune lng
            ) { res ->
                res.onSuccess {
                    Toast.makeText(context, "Checked in successfully with selfie!", Toast.LENGTH_SHORT).show()
                }.onFailure {
                    Toast.makeText(context, "Check-in failed: ${it.message}", Toast.LENGTH_LONG).show()
                }
            }
        } else {
            Toast.makeText(context, "Selfie capture cancelled. Please take a selfie to check in.", Toast.LENGTH_LONG).show()
        }
    }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Attendance Control",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = viewModel::loadData) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (state is AttendanceState.Loading && todayAttendance == null) {
            LoadingScreen(message = "Updating attendance logs...")
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Today's Status Card
                SwayogCard {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Today's Status",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        val record = todayAttendance
                        if (record != null) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = "Status: ${record.status.uppercase()}",
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = if (record.status.lowercase() == "present") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Checked In: ${record.checkInTime ?: "N/A"}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Text(
                                        text = "Checked Out: ${record.checkOutTime ?: "N/A"}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                                Icon(
                                    imageVector = if (record.checkInTime != null) Icons.Default.CheckCircle else Icons.Default.Cancel,
                                    contentDescription = null,
                                    tint = if (record.checkInTime != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(48.dp)
                                )
                            }
                        } else {
                            Text(
                                text = "You have not checked in for today yet.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
                
                // Check-in/Check-out Action Buttons
                SwayogCard {
                    Column {
                        Text(
                            text = "Today's Actions",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        val record = todayAttendance
                        val hasCheckedIn = record?.checkInTime != null
                        val hasCheckedOut = record?.checkOutTime != null
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            SwayogButton(
                                text = "Check In",
                                enabled = !hasCheckedIn,
                                onClick = {
                                    if (cameraPermissionState.status.isGranted) {
                                        try {
                                            cameraLauncher.launch(null)
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "No camera application found on this device!", Toast.LENGTH_LONG).show()
                                        }
                                    } else {
                                        cameraPermissionState.launchPermissionRequest()
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )
                            SwayogButton(
                                text = "Check Out",
                                enabled = hasCheckedIn && !hasCheckedOut,
                                onClick = {
                                    viewModel.checkOut { res ->
                                        res.onSuccess {
                                            Toast.makeText(context, "Checked out successfully!", Toast.LENGTH_SHORT).show()
                                        }.onFailure {
                                            Toast.makeText(context, "Check-out failed: ${it.message}", Toast.LENGTH_LONG).show()
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                variant = ButtonVariant.Secondary
                            )
                        }
                    }
                }
                
                // Attendance stats from backend
                val perf = performance
                if (perf != null) {
                    SwayogCard {
                        Text(
                            text = "This Month Snapshot",
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
                                    text = perf.daysPresent.toString(),
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Present",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = perf.daysAbsent.toString(),
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Absent",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "${perf.attendancePercent}%",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.secondary,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Attendance",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
