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
        return if (trimmed.startsWith("data:")) {
            trimmed
        } else if (trimmed.startsWith("/9j/") || trimmed.startsWith("iVBORw") || trimmed.startsWith("R0lGOD") || trimmed.startsWith("UklGR")) {
            "data:image/jpeg;base64,$trimmed"
        } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            val currentServerUrl = serverUrl
            val base = if (!currentServerUrl.isNullOrBlank()) {
                currentServerUrl.removeSuffix("/").removeSuffix("/api/v1")
            } else {
                com.swayog.employee.BuildConfig.API_BASE_URL.removeSuffix("/").removeSuffix("/api/v1")
            }
            val cleanPath = if (trimmed.startsWith("/")) trimmed else "/$trimmed"
            "$base$cleanPath"
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
