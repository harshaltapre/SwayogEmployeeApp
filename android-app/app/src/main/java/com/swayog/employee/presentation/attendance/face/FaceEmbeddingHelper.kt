package com.swayog.employee.presentation.attendance.face

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.DataType
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

class FaceEmbeddingHelper(context: Context) {

    companion object {
        const val EMBEDDING_DIMENSION = 128
    }

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
            val modelBuffer = try {
                val fileDescriptor = assetManager.openFd("mobile_face_net.tflite")
                val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
                val fileChannel = inputStream.channel
                val startOffset = fileDescriptor.startOffset
                val declaredLength = fileDescriptor.declaredLength
                fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
            } catch (e: Exception) {
                // If openFd fails (e.g. compressed asset in APK), read directly into ByteBuffer
                val bytes = assetManager.open("mobile_face_net.tflite").use { it.readBytes() }
                ByteBuffer.allocateDirect(bytes.size).apply {
                    order(ByteOrder.nativeOrder())
                    put(bytes)
                    rewind()
                }
            }
            
            val options = Interpreter.Options().apply {
                setNumThreads(4)
            }
            interpreter = Interpreter(modelBuffer, options)
        } catch (e: Exception) {
            e.printStackTrace()
            interpreter = null
        }
    }

    fun isModelLoaded(): Boolean = interpreter != null

    val modelOutputDimension: Int?
        get() = interpreter?.getOutputTensor(0)?.shape()?.lastOrNull()

    val modelInputShape: List<Int>?
        get() = interpreter?.getInputTensor(0)?.shape()?.toList()

    fun isModelCompatible(): Boolean {
        val currentInterpreter = interpreter ?: return false
        return modelInputShape == listOf(1, inputSize, inputSize, 3) &&
            currentInterpreter.getInputTensor(0).dataType() == DataType.FLOAT32 &&
            (modelOutputDimension ?: 0) >= EMBEDDING_DIMENSION &&
            currentInterpreter.getOutputTensor(0).dataType() == DataType.FLOAT32
    }

    fun getFaceEmbedding(bitmap: Bitmap): List<Float>? {
        val currentInterpreter = interpreter ?: return null
        if (!isModelCompatible()) return null

        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        resizedBitmap.getPixels(intValues, 0, resizedBitmap.width, 0, 0, resizedBitmap.width, resizedBitmap.height)
        resizedBitmap.recycle()
        
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

        val outputDim = modelOutputDimension ?: return null
        if (outputDim < EMBEDDING_DIMENSION) return null
        val embeddings = Array(1) { FloatArray(outputDim) }

        interpreter?.run(imgData, embeddings)
        
        val rawList = embeddings[0].take(EMBEDDING_DIMENSION)
        if (rawList.any { !it.isFinite() }) return null

        // Normalize output
        val l2 = rawList.map { it * it }.sum()
        val norm = kotlin.math.sqrt(l2.toDouble()).toFloat()
        return if (norm > 0) {
            rawList.map { it / norm }
        } else {
            rawList
        }
    }
    
    fun close() {
        interpreter?.close()
        interpreter = null
    }
}
