package com.swayog.employee.presentation.attendance

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FaceVerificationScreen(
    profilePhotoUrl: String?,
    onVerificationSuccess: (Bitmap) -> Unit,
    onVerificationFailed: (String) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    var faceStatusText by remember { mutableStateOf("Initializing face template...") }
    var isProcessing by remember { mutableStateOf(false) }
    var isInitializing by remember { mutableStateOf(true) }
    var referenceSignature by remember { mutableStateOf<FaceMatchingHelper.FaceSignature?>(null) }
    var lastCheckTime by remember { mutableStateOf(0L) }

    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    // ML Kit Face Detector with Landmarks Enabled
    val faceDetector = remember {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .build()
        FaceDetection.getClient(options)
    }

    // Extract reference signature on load
    LaunchedEffect(profilePhotoUrl) {
        if (!profilePhotoUrl.isNullOrEmpty()) {
            val sig = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                try {
                    val base64Data = if (profilePhotoUrl.startsWith("data:image")) {
                        profilePhotoUrl.substringAfter("base64,")
                    } else {
                        profilePhotoUrl
                    }
                    val decodedBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                    val refBitmap = android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                    if (refBitmap != null) {
                        FaceMatchingHelper.extractSignature(refBitmap)
                    } else null
                } catch (e: Exception) {
                    e.printStackTrace()
                    null
                }
            }
            if (sig != null) {
                referenceSignature = sig
                isInitializing = false
                faceStatusText = "Position your face in the circle"
            } else {
                isInitializing = false
                faceStatusText = "Error: Invalid enrollment photo face"
                onVerificationFailed("No face detected in your profile photo. Please re-upload a clear selfie in Settings.")
            }
        } else {
            isInitializing = false
            faceStatusText = "No profile photo uploaded"
            onVerificationFailed("Please upload your profile photo in Settings before check-in.")
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
            faceDetector.close()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { analysis ->
                            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                if (isProcessing || isInitializing || referenceSignature == null) {
                                    imageProxy.close()
                                    return@setAnalyzer
                                }

                                val mediaImage = imageProxy.image
                                if (mediaImage != null) {
                                    val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                                    
                                    faceDetector.process(inputImage)
                                        .addOnSuccessListener { faces: List<Face> ->
                                            if (faces.isEmpty()) {
                                                faceStatusText = "No face detected"
                                            } else if (faces.size > 1) {
                                                faceStatusText = "Multiple faces detected. Ensure only you are in frame."
                                            } else {
                                                val face = faces.first()
                                                val leftEyeOpenProb = face.leftEyeOpenProbability
                                                val rightEyeOpenProb = face.rightEyeOpenProbability
                                                
                                                if (leftEyeOpenProb != null && rightEyeOpenProb != null) {
                                                    if (leftEyeOpenProb < 0.2f && rightEyeOpenProb < 0.2f) {
                                                        faceStatusText = "Please open your eyes"
                                                    } else {
                                                        val now = System.currentTimeMillis()
                                                        if (now - lastCheckTime > 1500L) {
                                                            lastCheckTime = now
                                                            val capturedBitmap = previewView.bitmap
                                                            if (capturedBitmap != null) {
                                                                faceStatusText = "Verifying identity..."
                                                                scope.launch(kotlinx.coroutines.Dispatchers.Default) {
                                                                    val liveSig = FaceMatchingHelper.extractSignature(capturedBitmap)
                                                                    if (liveSig != null) {
                                                                        val score = FaceMatchingHelper.calculateSimilarity(referenceSignature!!, liveSig)
                                                                        if (score >= 0.78) {
                                                                            faceStatusText = "Match Success!"
                                                                            isProcessing = true
                                                                            onVerificationSuccess(capturedBitmap)
                                                                        } else {
                                                                            faceStatusText = "Verification failed: Face mismatch."
                                                                        }
                                                                    } else {
                                                                        faceStatusText = "Face not aligned. Move to better lighting."
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    faceStatusText = "Detecting features..."
                                                }
                                            }
                                        }
                                        .addOnFailureListener { e ->
                                            faceStatusText = "Detection error: ${e.message}"
                                        }
                                        .addOnCompleteListener {
                                            imageProxy.close()
                                        }
                                } else {
                                    imageProxy.close()
                                }
                            }
                        }

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
                        Log.e("FaceVerificationScreen", "Use case binding failed", e)
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

        // Status text
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 64.dp)
                .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                .padding(horizontal = 24.dp, vertical = 12.dp)
        ) {
            Text(
                text = faceStatusText,
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )
        }
    }
}
