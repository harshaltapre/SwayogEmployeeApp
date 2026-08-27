package com.swayog.employee.presentation.common.utils

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import coil.request.CachePolicy
import coil.request.ImageRequest

object ImageUtils {

    fun resolveImageModel(
        context: Context,
        photoUrl: String?,
        serverUrl: String?
    ): Any? {
        if (photoUrl.isNullOrBlank()) return null

        val trimmed = photoUrl.trim()
        val currentServerUrl = serverUrl
        val base = if (!currentServerUrl.isNullOrBlank()) {
            currentServerUrl.removeSuffix("/").removeSuffix("/api/v1")
        } else {
            com.swayog.employee.BuildConfig.API_BASE_URL.removeSuffix("/").removeSuffix("/api/v1")
        }

        if (trimmed.startsWith("data:") || trimmed.startsWith("/9j/") || trimmed.startsWith("iVBORw") || trimmed.startsWith("R0lGOD") || trimmed.startsWith("UklGR")) {
            val base64Clean = if (trimmed.startsWith("data:")) {
                trimmed.substringAfter("base64,")
            } else {
                trimmed
            }
            return try {
                android.util.Base64.decode(base64Clean, android.util.Base64.DEFAULT)
            } catch (e: Exception) {
                android.util.Log.e("IMAGE_UTILS", "Failed to decode base64 image: ${e.message}")
                null
            }
        } else if (trimmed.contains(".r2.cloudflarestorage.com/") && trimmed.contains("X-Amz-Signature")) {
            // Already a presigned URL
            return trimmed
        } else if (trimmed.contains(".r2.cloudflarestorage.com/")) {
            // Unsigned raw R2 URL -> Route through backend image view endpoint for presigned access
            val encoded = java.net.URLEncoder.encode(trimmed, "UTF-8")
            return "$base/api/v1/tasks/images/view?url=$encoded"
        } else if (trimmed.startsWith("tasks/") || trimmed.startsWith("users/") || trimmed.startsWith("profiles/") || trimmed.startsWith("uploads/")) {
            // R2 Object Key directly -> Route through backend image view endpoint
            val encoded = java.net.URLEncoder.encode(trimmed, "UTF-8")
            return "$base/api/v1/tasks/images/view?key=$encoded"
        } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed
        } else {
            val cleanPath = if (trimmed.startsWith("/")) trimmed else "/$trimmed"
            return "$base$cleanPath"
        }
    }

    /**
     * Builds a Coil [ImageRequest] for the given [photoUrl], resolved against [serverUrl].
     *
     * @param cacheKey  An opaque key (e.g. a timestamp) that is appended to Coil's cache keys.
     *                  When the caller bumps this value (e.g. after a successful upload), Coil
     *                  treats the request as a brand-new image and bypasses the stale cached entry.
     *                  Pass `0L` (default) when no cache-busting is needed.
     */
    @Composable
    fun rememberImageRequest(
        context: Context,
        photoUrl: String?,
        serverUrl: String?,
        cacheKey: Long = 0L
    ): ImageRequest? {
        // Recompute the resolved model whenever photoUrl, serverUrl, OR cacheKey changes.
        // Including cacheKey here ensures a recomposition after a successful upload.
        return remember(photoUrl, serverUrl, cacheKey) {
            val model = resolveImageModel(context, photoUrl, serverUrl)
            android.util.Log.d("PROFILE_RENDER", "[IMAGE_RENDER] photoUrl=${photoUrl?.take(40)} cacheKey=$cacheKey -> resolvedModelType=${model?.javaClass?.simpleName}")

            if (model == null) {
                null
            } else {
                val uniqueCacheKey = if (model is ByteArray) {
                    "bytes_${photoUrl.hashCode()}_ck_$cacheKey"
                } else {
                    "${model}_ck_$cacheKey"
                }
                ImageRequest.Builder(context)
                    .data(model)
                    .crossfade(true)
                    .memoryCacheKey(uniqueCacheKey)
                    .diskCacheKey(uniqueCacheKey)
                    .diskCachePolicy(CachePolicy.ENABLED)
                    .memoryCachePolicy(CachePolicy.ENABLED)
                    .build()
            }
        }
    }
}

