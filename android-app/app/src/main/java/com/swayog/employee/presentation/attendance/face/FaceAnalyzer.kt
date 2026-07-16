package com.swayog.employee.presentation.attendance.face

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.Rect
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

class FaceAnalyzer(
    private val faceEmbeddingHelper: FaceEmbeddingHelper,
    private val onFaceDetected: (Face?, List<Float>?) -> Unit
) : ImageAnalysis.Analyzer {

    private val options = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .build()

    private val detector = FaceDetection.getClient(options)
    
    private var isProcessing = false

    @SuppressLint("UnsafeOptInUsageError")
    override fun analyze(imageProxy: ImageProxy) {
        if (isProcessing) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            isProcessing = true
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            val rawBitmap = imageProxy.toBitmap()
            
            // ML Kit bounding box is based on the rotated image. We must rotate the raw bitmap to match.
            val matrix = android.graphics.Matrix()
            matrix.postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
            val bitmap = Bitmap.createBitmap(rawBitmap, 0, 0, rawBitmap.width, rawBitmap.height, matrix, true)

            detector.process(image)
                .addOnSuccessListener { faces ->
                    if (faces.size == 1) {
                        val face = faces[0]
                        val bounds = face.boundingBox
                        
                        val safeBounds = Rect(
                            maxOf(0, bounds.left),
                            maxOf(0, bounds.top),
                            minOf(bitmap.width, bounds.right),
                            minOf(bitmap.height, bounds.bottom)
                        )
                        
                        if (safeBounds.width() > 0 && safeBounds.height() > 0) {
                            val faceBitmap = Bitmap.createBitmap(
                                bitmap, 
                                safeBounds.left, 
                                safeBounds.top, 
                                safeBounds.width(), 
                                safeBounds.height()
                            )
                            val embedding = faceEmbeddingHelper.getFaceEmbedding(faceBitmap)
                            onFaceDetected(face, embedding)
                        } else {
                            onFaceDetected(face, null)
                        }
                    } else {
                        onFaceDetected(null, null)
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                    isProcessing = false
                }
        } else {
            imageProxy.close()
        }
    }
}
