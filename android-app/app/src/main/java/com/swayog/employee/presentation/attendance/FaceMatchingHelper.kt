package com.swayog.employee.presentation.attendance

import android.graphics.Bitmap
import android.graphics.PointF
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import kotlin.math.hypot

object FaceMatchingHelper {

    data class FacePoints(
        val leftEye: PointF,
        val rightEye: PointF,
        val nose: PointF,
        val mouth: PointF
    )

    data class FaceSignature(
        val geometry: FloatArray,
        val points: FacePoints
    )

    private val detector by lazy {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .build()
        FaceDetection.getClient(options)
    }

    suspend fun extractSignature(bitmap: Bitmap): FaceSignature? {
        return try {
            val image = InputImage.fromBitmap(bitmap, 0)
            val faces = Tasks.await(detector.process(image))
            if (faces.isEmpty()) return null
            
            val face = faces.first()
            val leftEyeLandmark = face.getLandmark(FaceLandmark.LEFT_EYE) ?: return null
            val rightEyeLandmark = face.getLandmark(FaceLandmark.RIGHT_EYE) ?: return null
            val noseLandmark = face.getLandmark(FaceLandmark.NOSE_BASE) ?: return null
            val mouthLandmark = face.getLandmark(FaceLandmark.MOUTH_BOTTOM) ?: return null

            val boundingBox = face.boundingBox
            val minX = boundingBox.left.toFloat()
            val minY = boundingBox.top.toFloat()
            val width = boundingBox.width().toFloat().coerceAtLeast(1f)
            val height = boundingBox.height().toFloat().coerceAtLeast(1f)

            // Normalize points relative to bounding box
            val leftEye = PointF((leftEyeLandmark.position.x - minX) / width, (leftEyeLandmark.position.y - minY) / height)
            val rightEye = PointF((rightEyeLandmark.position.x - minX) / width, (rightEyeLandmark.position.y - minY) / height)
            val nose = PointF((noseLandmark.position.x - minX) / width, (noseLandmark.position.y - minY) / height)
            val mouth = PointF((mouthLandmark.position.x - minX) / width, (mouthLandmark.position.y - minY) / height)

            val eyeMidX = (leftEye.x + rightEye.x) / 2f
            val eyeMidY = (leftEye.y + rightEye.y) / 2f
            val eyeDistance = hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y).coerceAtLeast(0.0001f)

            val geometry = floatArrayOf(
                eyeDistance,
                (rightEye.y - leftEye.y) / eyeDistance,
                (nose.x - eyeMidX) / eyeDistance,
                (nose.y - eyeMidY) / eyeDistance,
                (mouth.x - nose.x) / eyeDistance,
                (mouth.y - nose.y) / eyeDistance
            )

            FaceSignature(geometry, FacePoints(leftEye, rightEye, nose, mouth))
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun calculateSimilarity(ref: FaceSignature, live: FaceSignature): Double {
        // 1. Geometry cosine similarity
        val geomSimilarity = cosineSimilarity(ref.geometry, live.geometry)

        // 2. Average point distance similarity
        val distLeftEye = hypot(ref.points.leftEye.x - live.points.leftEye.x, ref.points.leftEye.y - live.points.leftEye.y)
        val distRightEye = hypot(ref.points.rightEye.x - live.points.rightEye.x, ref.points.rightEye.y - live.points.rightEye.y)
        val distNose = hypot(ref.points.nose.x - live.points.nose.x, ref.points.nose.y - live.points.nose.y)
        val distMouth = hypot(ref.points.mouth.x - live.points.mouth.x, ref.points.mouth.y - live.points.mouth.y)

        val avgDist = (distLeftEye + distRightEye + distNose + distMouth) / 4.0
        val pointSimilarity = (1.0 - avgDist * 4.0).coerceIn(0.0, 1.0)

        // Combine scores (0.7 geometry, 0.3 landmark point closeness)
        return geomSimilarity * 0.7 + pointSimilarity * 0.3
    }

    private fun cosineSimilarity(vectorA: FloatArray, vectorB: FloatArray): Double {
        var dotProduct = 0.0
        var normA = 0.0
        var normB = 0.0
        for (i in vectorA.indices) {
            dotProduct += vectorA[i] * vectorB[i]
            normA += vectorA[i] * vectorA[i]
            normB += vectorB[i] * vectorB[i]
        }
        if (normA == 0.0 || normB == 0.0) return 0.0
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }
}
