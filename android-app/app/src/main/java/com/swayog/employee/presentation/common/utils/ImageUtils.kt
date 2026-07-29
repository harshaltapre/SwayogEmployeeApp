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

        return if (photoUrl.startsWith("data:")) {
            try {
                val base64Data = photoUrl.substringAfter(",")
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                if (bitmap != null) {
                    android.util.Log.d("PROFILE_RENDER", "Successfully decoded Base64 image to Bitmap (${bitmap.width}x${bitmap.height})")
                } else {
                    android.util.Log.e("PROFILE_RENDER", "Base64 decode returned null Bitmap")
                }
                bitmap
            } catch (e: Exception) {
                android.util.Log.e("PROFILE_RENDER", "Error decoding Base64 image string: ${e.message}", e)
                null
            }
        } else if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
            android.util.Log.d("PROFILE_RENDER", "Using HTTP(S) image URL: $photoUrl")
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
            android.util.Log.d("PROFILE_RENDER", "Resolved relative image path to full URL: $fullUrl")
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
