package com.swayog.employee.domain.face

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Rect
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.ops.NormalizeOp
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class FaceEmbeddingHelper(private val context: Context) {

    private var interpreter: Interpreter? = null
    private val modelFileName = "mobile_face_net.tflite"

    // MobileFaceNet typically expects 112x112 image
    private val imageSize = 112
    // Expected output is usually 192 or 128 float array
    val embeddingSize = 128 // Using 128 to match web app format if possible, adjust if model dictates 192

    private val imageProcessor = ImageProcessor.Builder()
        .add(ResizeOp(imageSize, imageSize, ResizeOp.ResizeMethod.BILINEAR))
        .add(NormalizeOp(127.5f, 127.5f)) // Normalization to [-1, 1]
        .build()

    init {
        loadModel()
    }

    private fun loadModel() {
        try {
            val assetFileDescriptor = context.assets.openFd(modelFileName)
            val fileInputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
            val fileChannel = fileInputStream.channel
            val startOffset = assetFileDescriptor.startOffset
            val declaredLength = assetFileDescriptor.declaredLength
            val mappedByteBuffer: MappedByteBuffer = fileChannel.map(
                FileChannel.MapMode.READ_ONLY,
                startOffset,
                declaredLength
            )
            interpreter = Interpreter(mappedByteBuffer, Interpreter.Options().apply {
                numThreads = 4
            })
        } catch (e: Exception) {
            e.printStackTrace()
            // Model not found - ensure it's placed in assets
        }
    }

    fun getEmbedding(bitmap: Bitmap, faceBoundingBox: Rect): FloatArray? {
        if (interpreter == null) return null

        // Crop face from original bitmap
        val croppedFace = cropFace(bitmap, faceBoundingBox) ?: return null

        // Prepare TensorImage
        var tensorImage = TensorImage(org.tensorflow.lite.DataType.FLOAT32)
        tensorImage.load(croppedFace)
        tensorImage = imageProcessor.process(tensorImage)

        // Run inference
        val outputBuffer = Array(1) { FloatArray(embeddingSize) }
        try {
            interpreter?.run(tensorImage.buffer, outputBuffer)
            return outputBuffer[0]
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    private fun cropFace(bitmap: Bitmap, boundingBox: Rect): Bitmap? {
        return try {
            val left = boundingBox.left.coerceAtLeast(0)
            val top = boundingBox.top.coerceAtLeast(0)
            val width = boundingBox.width().coerceAtMost(bitmap.width - left)
            val height = boundingBox.height().coerceAtMost(bitmap.height - top)
            
            if (width > 0 && height > 0) {
                Bitmap.createBitmap(bitmap, left, top, width, height)
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun close() {
        interpreter?.close()
        interpreter = null
    }
}
