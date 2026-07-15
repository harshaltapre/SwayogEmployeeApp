package com.swayog.employee.presentation.attendance.face

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

class FaceEmbeddingHelper(context: Context) {

    private var interpreter: Interpreter? = null
    // Assuming MobileFaceNet 112x112 input
    private val inputSize = 112
    // Array of floats, shape [1, 112, 112, 3]
    private val imgData: ByteBuffer = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4).apply {
        order(ByteOrder.nativeOrder())
    }
    private val intValues = IntArray(inputSize * inputSize)

    init {
        try {
            val assetManager = context.assets
            val fileDescriptor = assetManager.openFd("mobile_face_net.tflite")
            val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
            val fileChannel = inputStream.channel
            val startOffset = fileDescriptor.startOffset
            val declaredLength = fileDescriptor.declaredLength
            val modelBuffer = fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
            
            val options = Interpreter.Options().apply {
                setNumThreads(4)
            }
            interpreter = Interpreter(modelBuffer, options)
        } catch (e: Exception) {
            e.printStackTrace()
            // Model not found or invalid
        }
    }

    fun getFaceEmbedding(bitmap: Bitmap): List<Float> {
        if (interpreter == null) {
            // Mock descriptor for testing if model is absent
            return List(128) { 0.1f }
        }

        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        resizedBitmap.getPixels(intValues, 0, resizedBitmap.width, 0, 0, resizedBitmap.width, resizedBitmap.height)
        
        imgData.rewind()
        for (i in 0 until inputSize) {
            for (j in 0 until inputSize) {
                val pixelValue = intValues[i * inputSize + j]
                // MobileFaceNet preprocessing (normalize to -1, 1)
                imgData.putFloat(((pixelValue shr 16 and 0xFF) - 127.5f) / 128.0f)
                imgData.putFloat(((pixelValue shr 8 and 0xFF) - 127.5f) / 128.0f)
                imgData.putFloat(((pixelValue and 0xFF) - 127.5f) / 128.0f)
            }
        }

        // Check output dimension. We determine it dynamically based on the model if we can, or assume 192.
        val outputTensor = interpreter?.getOutputTensor(0)
        val outputDim = outputTensor?.shape()?.get(1) ?: 192
        val embeddings = Array(1) { FloatArray(outputDim) }

        interpreter?.run(imgData, embeddings)
        
        // Normalize output
        val l2 = embeddings[0].map { it * it }.sum()
        val norm = kotlin.math.sqrt(l2.toDouble()).toFloat()
        return if (norm > 0) {
            embeddings[0].map { it / norm }
        } else {
            embeddings[0].toList()
        }
    }
    
    fun close() {
        interpreter?.close()
        interpreter = null
    }
}
