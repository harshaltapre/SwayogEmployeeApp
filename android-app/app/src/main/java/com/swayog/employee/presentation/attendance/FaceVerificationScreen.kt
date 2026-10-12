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
    faceDescriptors: List<List<Float>> = emptyList(),
    faceIndexManager: com.swayog.employee.presentation.attendance.face.FaceIndexManager? = null,
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
    val analyzerExecutor = remember { java.util.concurrent.Executors.newSingleThreadExecutor() }
    var recognitionTargets by remember { mutableStateOf<List<List<Float>>>(emptyList()) }
    var isCheckingEnrollment by remember { mutableStateOf(true) }
    
    DisposableEffect(Unit) {
        onDispose {
            faceEmbeddingHelper.close()
            analyzerExecutor.shutdown()
        }
    }

    if (!faceEmbeddingHelper.isModelLoaded() || !faceEmbeddingHelper.isModelCompatible()) {
        LaunchedEffect(Unit) {
            android.util.Log.e(
                "FACE_DEBUG",
                "[FACE_UPDATE_9] modelLoaded=${faceEmbeddingHelper.isModelLoaded()} " +
                    "modelCompatible=${faceEmbeddingHelper.isModelCompatible()} " +
                    "modelInputShape=${faceEmbeddingHelper.modelInputShape} " +
                    "modelOutputDimension=${faceEmbeddingHelper.modelOutputDimension} " +
                    "version=${com.swayog.employee.BuildConfig.VERSION_CODE}/${com.swayog.employee.BuildConfig.VERSION_NAME}"
            )
            onVerificationFailed("Face recognition model is unavailable or incompatible with this app version. Your saved enrollment was preserved.")
        }
        return
    }

    LaunchedEffect(faceIndexManager, faceDescriptors) {
        isCheckingEnrollment = true
        val refreshedTargets = if (faceIndexManager != null) {
            faceIndexManager.loadFromDataStore(FaceEmbeddingHelper.EMBEDDING_DIMENSION)
        } else {
            faceDescriptors.filter {
                com.swayog.employee.data.local.preferences.DataStoreManager.isValidFaceDescriptor(
                    it,
                    FaceEmbeddingHelper.EMBEDDING_DIMENSION
                )
            }
        }
        recognitionTargets = refreshedTargets.filter {
            com.swayog.employee.data.local.preferences.DataStoreManager.isValidFaceDescriptor(
                it,
                FaceEmbeddingHelper.EMBEDDING_DIMENSION
            )
        }
        android.util.Log.d(
            "FACE_DEBUG",
            "[FACE_UPDATE_1] appVersion=${com.swayog.employee.BuildConfig.VERSION_CODE}/${com.swayog.employee.BuildConfig.VERSION_NAME} " +
                "[FACE_UPDATE_9] modelLoaded=${faceEmbeddingHelper.isModelLoaded()} " +
                "modelCompatible=${faceEmbeddingHelper.isModelCompatible()} " +
                "modelInputShape=${faceEmbeddingHelper.modelInputShape} " +
                "[FACE_UPDATE_10] modelOutputDimension=${faceEmbeddingHelper.modelOutputDimension} " +
                "activeDimension=${FaceEmbeddingHelper.EMBEDDING_DIMENSION} " +
                "indexCount=${faceIndexManager?.getIndexSnapshot()?.size ?: recognitionTargets.size} " +
                "indexVersion=${faceIndexManager?.activeIndexVersion ?: -1}"
        )
        isCheckingEnrollment = false
    }

    val hasEnrolledFaces = recognitionTargets.size == 3

    if (!isCheckingEnrollment && !hasEnrolledFaces) {
        LaunchedEffect(Unit) {
            onVerificationFailed("No valid saved face enrollment is available. Existing saved data was not deleted; check enrollment status in Settings.")
        }
        return
    }

    if (isCheckingEnrollment) {
        Box(modifier = Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
            Text("Preparing face recognition...", color = Color.White, style = MaterialTheme.typography.titleMedium)
        }
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                var lastDiagnosticLogTime = 0L
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    imageAnalyzer.setAnalyzer(
                        analyzerExecutor,
                        FaceAnalyzer(faceEmbeddingHelper) { face, embedding ->
                            if (isProcessing) return@FaceAnalyzer
                            
                            if (face == null || embedding == null) {
                                // Update UI on main thread
                                ContextCompat.getMainExecutor(ctx).execute {
                                    faceStatusText = "No face detected"
                                }
                            } else {
                                val currentTargets = recognitionTargets

                                if (currentTargets.isEmpty()) {
                                    ContextCompat.getMainExecutor(ctx).execute {
                                        faceStatusText = "No face enrolled. Please enroll in Settings."
                                    }
                                    return@FaceAnalyzer
                                }

                                val matchScore = FaceMatcher.findBestMatch(embedding, currentTargets)
                                val now = System.currentTimeMillis()
                                if (now - lastDiagnosticLogTime >= 3000L) {
                                    lastDiagnosticLogTime = now
                                    val result = if (matchScore >= FaceMatcher.THRESHOLD) "MATCH" else "NO_MATCH"
                                    android.util.Log.d(
                                        "FACE_DEBUG",
                                        "[FACE_UPDATE_3] storedCount=${currentTargets.size} " +
                                            "[FACE_UPDATE_4] storedDimensions=${currentTargets.map { it.size }} " +
                                            "[FACE_UPDATE_11] liveDimension=${embedding.size} " +
                                            "[FACE_UPDATE_12] bestScore=$matchScore " +
                                            "[FACE_UPDATE_13] threshold=${FaceMatcher.THRESHOLD} " +
                                            "[FACE_UPDATE_14] result=$result"
                                    )
                                }
                                if (matchScore >= FaceMatcher.THRESHOLD) {
                                    isProcessing = true
                                    // Update UI and trigger success on main thread
                                    ContextCompat.getMainExecutor(ctx).execute {
                                        faceStatusText = "Match Success! Checking in..."
                                        val capturedBitmap = previewView.bitmap
                                        if (capturedBitmap != null) {
                                            onVerificationSuccess(capturedBitmap, matchScore)
                                        } else {
                                            onVerificationFailed("Failed to capture image")
                                        }
                                    }
                                } else {
                                    // Update UI on main thread
                                    ContextCompat.getMainExecutor(ctx).execute {
                                        faceStatusText = "Verification failed: Match score too low"
                                    }
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
