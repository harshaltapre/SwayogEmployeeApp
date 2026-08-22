package com.swayog.employee.presentation.common.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
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

        val isBase64 = photoUrl.startsWith("data:") ||
                photoUrl.startsWith("/9j/") ||
                photoUrl.startsWith("iVBORw") ||
                photoUrl.startsWith("R0lGOD") ||
                photoUrl.startsWith("UklGR") ||
                photoUrl.contains(";base64,") ||
                (!photoUrl.startsWith("/uploads/") && !photoUrl.startsWith("/api/") && photoUrl.length > 200)

        return if (isBase64) {
            try {
                val base64Data = if (photoUrl.contains(",")) photoUrl.substringAfter(",") else photoUrl
                val cleanBase64 = base64Data.replace("\n", "").replace("\r", "").trim()
                val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                if (bitmap != null) {
                    android.util.Log.d("IMAGE_RENDER", "Successfully decoded Base64 image to Bitmap (${bitmap.width}x${bitmap.height})")
                    bitmap
                } else {
                    android.util.Log.e("IMAGE_RENDER", "Base64 decode returned null Bitmap")
                    null
                }
            } catch (e: Exception) {
                android.util.Log.e("IMAGE_RENDER", "Error decoding Base64 image string: ${e.message}", e)
                null
            }
        } else if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
            android.util.Log.d("IMAGE_RENDER", "Using HTTP(S) image URL: $photoUrl")
            photoUrl
        } else {
            val currentServerUrl = serverUrl
            val base = if (!currentServerUrl.isNullOrBlank()) {
                currentServerUrl.removeSuffix("/").removeSuffix("/api/v1")
            } else {
                com.swayog.employee.BuildConfig.API_BASE_URL.removeSuffix("/").removeSuffix("/api/v1")
            }
            val cleanPath = if (photoUrl.startsWith("/")) photoUrl else "/$photoUrl"
            val fullUrl = "$base$cleanPath"
            android.util.Log.d("IMAGE_RENDER", "Resolved relative image path to full URL: $fullUrl")
            fullUrl
        }
    }

    @Composable
    fun rememberImageRequest(
        context: Context,
        photoUrl: String?,
        serverUrl: String?
    ): ImageRequest? {
        val model = remember(photoUrl, serverUrl) {
            resolveImageModel(context, photoUrl, serverUrl)
        }

        return remember(model) {
            if (model == null) null
            else {
                ImageRequest.Builder(context)
                    .data(model)
                    .crossfade(true)
                    .diskCachePolicy(CachePolicy.ENABLED)
                    .memoryCachePolicy(CachePolicy.ENABLED)
                    .build()
            }
        }
    }
}
