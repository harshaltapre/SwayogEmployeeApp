package com.swayog.employee.presentation.attendance.face

import kotlin.math.sqrt

object FaceMatcher {
    // Threshold matching the web app (0.55 default)
    const val THRESHOLD = 0.55f

    fun cosineSimilarity(v1: List<Float>, v2: List<Float>): Float {
        if (v1.size != v2.size) return 0f
        var dotProduct = 0f
        var norm1 = 0f
        var norm2 = 0f
        for (i in v1.indices) {
            dotProduct += v1[i] * v2[i]
            norm1 += v1[i] * v1[i]
            norm2 += v2[i] * v2[i]
        }
        val denom = sqrt(norm1.toDouble()) * sqrt(norm2.toDouble())
        if (denom == 0.0) return 0f
        return (dotProduct / denom).toFloat()
    }

    fun findBestMatch(liveEmbedding: List<Float>, storedEmbeddings: List<List<Float>>): Float {
        var bestScore = 0f
        for (stored in storedEmbeddings) {
            val score = cosineSimilarity(liveEmbedding, stored)
            if (score > bestScore) {
                bestScore = score
            }
        }
        return bestScore
    }
}
