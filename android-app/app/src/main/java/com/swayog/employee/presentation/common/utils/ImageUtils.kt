package com.swayog.employee.presentation.common.utils

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import coil.request.CachePolicy
import coil.request.ImageRequest

object ImageUtils {

    @Suppress("UNUSED_PARAMETER")
    fun resolveImageModel(
        context: Context? = null,
        photoUrl: String?,
        serverUrl: String? = null
    ): Any? {
        if (photoUrl.isNullOrBlank()) return null

        val trimmed = photoUrl.trim()
        val base = com.swayog.employee.core.config.AppConfig.BASE_URL_WITHOUT_API

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

    /**
     * Crops bitmap to center square, resizes to max 480x480, and saves to compressed JPEG file.
     */
    fun createAvatarFileFromBitmap(context: Context, bitmap: android.graphics.Bitmap): java.io.File {
        val dimension = Math.min(bitmap.width, bitmap.height)
        val xOffset = (bitmap.width - dimension) / 2
        val yOffset = (bitmap.height - dimension) / 2
        val squareBitmap = android.graphics.Bitmap.createBitmap(bitmap, xOffset, yOffset, dimension, dimension)
        val scaled = if (dimension > 480) {
            android.graphics.Bitmap.createScaledBitmap(squareBitmap, 480, 480, true)
        } else {
            squareBitmap
        }
        val tempFile = java.io.File(context.cacheDir, "profile_upload_${System.currentTimeMillis()}.jpg")
        java.io.FileOutputStream(tempFile).use { out ->
            scaled.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, out)
        }
        return tempFile
    }

    /**
     * Reads image URI, applies EXIF rotation if needed, center-crops, and saves as compact JPEG avatar file.
     */
    fun createAvatarFileFromUri(context: Context, uri: android.net.Uri): java.io.File? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val bitmap = android.graphics.BitmapFactory.decodeStream(inputStream) ?: return null
            
            var rotatedBitmap = bitmap
            try {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    val exif = android.media.ExifInterface(stream)
                    val orientation = exif.getAttributeInt(
                        android.media.ExifInterface.TAG_ORIENTATION,
                        android.media.ExifInterface.ORIENTATION_NORMAL
                    )
                    val matrix = android.graphics.Matrix()
                    when (orientation) {
                        android.media.ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                        android.media.ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                        android.media.ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                    }
                    if (orientation != android.media.ExifInterface.ORIENTATION_NORMAL && orientation != android.media.ExifInterface.ORIENTATION_UNDEFINED) {
                        rotatedBitmap = android.graphics.Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                    }
                }
            } catch (_: Exception) {}

            createAvatarFileFromBitmap(context, rotatedBitmap)
        } catch (e: Exception) {
            android.util.Log.e("IMAGE_UTILS", "Failed to create avatar from URI: ${e.message}", e)
            null
        }
    }
}

