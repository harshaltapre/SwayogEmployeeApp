package com.swayog.employee.presentation.attendance

import android.graphics.Bitmap
import android.widget.Toast
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
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
import com.swayog.employee.presentation.attendance.face.FaceAnalyzer
import com.swayog.employee.presentation.attendance.face.FaceEmbeddingHelper
import com.swayog.employee.presentation.attendance.face.FaceMatcher
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun FaceVerificationScreen(
    faceDescriptors: List<List<Float>>,
    onVerificationSuccess: (Bitmap, Float) -> Unit,
    onVerificationFailed: (String) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    var faceStatusText by remember { mutableStateOf("Position your face in the circle") }
    var isProcessing by remember { mutableStateOf(false) }

    val faceEmbeddingHelper = remember { FaceEmbeddingHelper(context) }
    
    DisposableEffect(Unit) {
        onDispose {
            faceEmbeddingHelper.close()
        }
    }

    if (faceDescriptors.isEmpty()) {
        LaunchedEffect(Unit) {
            onVerificationFailed("No face enrolled. Please enroll in Settings.")
        }
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    imageAnalyzer.setAnalyzer(
                        ContextCompat.getMainExecutor(ctx),
                        FaceAnalyzer(faceEmbeddingHelper) { face, embedding ->
                            if (isProcessing) return@FaceAnalyzer
                            
                            if (face == null || embedding == null) {
                                faceStatusText = "No face detected"
                            } else {
                                val matchScore = FaceMatcher.findBestMatch(embedding, faceDescriptors)
                                if (matchScore >= FaceMatcher.THRESHOLD) {
                                    faceStatusText = "Match Success! Checking in..."
                                    isProcessing = true
                                    
                                    val capturedBitmap = previewView.bitmap
                                    if (capturedBitmap != null) {
                                        onVerificationSuccess(capturedBitmap, matchScore)
                                    } else {
                                        onVerificationFailed("Failed to capture image")
                                    }
                                } else {
                                    faceStatusText = "Verification failed: Match score too low"
                                }
                            }
                        }
                    )

                    val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            imageAnalyzer
                        )
                    } catch (e: Exception) {
                        e.printStackTrace()
                        onVerificationFailed("Camera initialization failed")
                    }
                }, ContextCompat.getMainExecutor(ctx))
                
                previewView
            }
        )
        
        // Overlay mask
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasWidth = size.width
            val radius = canvasWidth * 0.35f
            
            drawRect(color = Color.Black.copy(alpha = 0.7f))
            drawCircle(
                color = Color.Transparent,
                radius = radius,
                center = center,
                blendMode = androidx.compose.ui.graphics.BlendMode.Clear
            )
        }

        Text(
            text = faceStatusText,
            color = Color.White,
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 64.dp)
        )

        // Top bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .statusBarsPadding(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(
                onClick = onCancel,
                modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Cancel", tint = Color.White)
            }
        }
    }
}
