package com.swayog.employee.domain.face

import kotlin.math.sqrt

object FaceMatcher {

    /**
     * Calculates the Cosine Similarity between two embeddings (FloatArrays).
     * Value ranges from -1.0 to 1.0. A value closer to 1.0 means higher similarity.
     */
    fun cosineSimilarity(emb1: FloatArray, emb2: FloatArray): Float {
        if (emb1.size != emb2.size) {
            throw IllegalArgumentException("Embeddings must have the same dimension")
        }

        var dotProduct = 0f
        var norm1 = 0f
        var norm2 = 0f

        for (i in emb1.indices) {
            dotProduct += emb1[i] * emb2[i]
            norm1 += emb1[i] * emb1[i]
            norm2 += emb2[i] * emb2[i]
        }

        return if (norm1 == 0f || norm2 == 0f) {
            0f
        } else {
            dotProduct / (sqrt(norm1) * sqrt(norm2))
        }
    }

    /**
     * Calculates the Euclidean Distance between two embeddings.
     * Value is >= 0. A smaller value means higher similarity.
     */
    fun euclideanDistance(emb1: FloatArray, emb2: FloatArray): Float {
        if (emb1.size != emb2.size) {
            throw IllegalArgumentException("Embeddings must have the same dimension")
        }

        var sumSquare = 0f
        for (i in emb1.indices) {
            val diff = emb1[i] - emb2[i]
            sumSquare += diff * diff
        }

        return sqrt(sumSquare)
    }

    /**
     * Helper to find the best match (highest cosine similarity) for a live embedding
     * against a list of stored embeddings.
     */
    fun findBestMatchSimilarity(liveEmbedding: FloatArray, storedEmbeddings: List<FloatArray>): Float {
        var maxSimilarity = -1f
        for (stored in storedEmbeddings) {
            val similarity = cosineSimilarity(liveEmbedding, stored)
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity
            }
        }
        return maxSimilarity
    }
}
