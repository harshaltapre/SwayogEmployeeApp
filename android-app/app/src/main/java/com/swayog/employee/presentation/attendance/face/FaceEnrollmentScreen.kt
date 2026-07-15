package com.swayog.employee.presentation.attendance.face

import android.Manifest
import android.widget.Toast
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.swayog.employee.presentation.common.components.SwayogTopBar

@OptIn(ExperimentalPermissionsApi::class, ExperimentalMaterial3Api::class)
@Composable
fun FaceEnrollmentScreen(
    onNavigateBack: () -> Unit,
    viewModel: FaceEnrollmentViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        if (!cameraPermissionState.status.isGranted) {
            cameraPermissionState.launchPermissionRequest()
        }
    }
    
    LaunchedEffect(uiState.enrollmentComplete) {
        if (uiState.enrollmentComplete) {
            Toast.makeText(context, "Face enrolled successfully!", Toast.LENGTH_SHORT).show()
            onNavigateBack()
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Face ID Enrollment",
                showBackButton = true,
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Step ${uiState.currentStep} of 3",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = uiState.instruction,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            if (cameraPermissionState.status.isGranted) {
                Box(
                    modifier = Modifier
                        .size(280.dp)
                        .background(Color.LightGray, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    AndroidView(
                        factory = { ctx ->
                            val previewView = PreviewView(ctx)
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                            
                            cameraProviderFuture.addListener({
                                val cameraProvider = cameraProviderFuture.get()
                                val preview = Preview.Builder().build().also {
                                    it.setSurfaceProvider(previewView.surfaceProvider)
                                }
                                
                                val imageAnalysis = ImageAnalysis.Builder()
                                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                    .build()
                                    
                                imageAnalysis.setAnalyzer(
                                    ContextCompat.getMainExecutor(ctx),
                                    FaceAnalyzer(viewModel.faceEmbeddingHelper) { face, embedding ->
                                        viewModel.processFace(face, embedding)
                                    }
                                )
                                
                                val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
                                
                                try {
                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(
                                        lifecycleOwner,
                                        cameraSelector,
                                        preview,
                                        imageAnalysis
                                    )
                                } catch(e: Exception) {
                                    e.printStackTrace()
                                }
                            }, ContextCompat.getMainExecutor(ctx))
                            
                            previewView
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                Text("Camera permission is required to enroll face.")
                Button(onClick = { cameraPermissionState.launchPermissionRequest() }) {
                    Text("Grant Permission")
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            LinearProgressIndicator(
                progress = uiState.currentStep / 3f,
                modifier = Modifier.fillMaxWidth()
            )
            
            if (uiState.isLoading) {
                Spacer(modifier = Modifier.height(16.dp))
                CircularProgressIndicator()
                Text("Syncing with server...")
            }
        }
    }
}
