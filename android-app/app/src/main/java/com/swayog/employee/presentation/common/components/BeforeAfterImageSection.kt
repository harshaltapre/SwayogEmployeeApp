package com.swayog.employee.presentation.common.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.swayog.employee.presentation.common.utils.ImageUtils

@Composable
fun BeforeAfterImageSection(
    beforeImageUrl: String?,
    afterImageUrl: String?,
    sitePhotos: List<String>? = null,
    taskType: String? = null,
    jobType: String? = null,
    isSiteVisit: Boolean = false,
    serverUrl: String? = null
) {
    val context = LocalContext.current
    var fullScreenImage by remember { mutableStateOf<Any?>(null) }

    val resolvedSitePhotos = remember(sitePhotos, beforeImageUrl, afterImageUrl) {
        val result = mutableListOf<String>()
        val seenKeys = mutableSetOf<String>()

        fun getKey(url: String): String {
            return if (url.length > 200) {
                "${url.length}_${url.take(40)}_${url.takeLast(40)}"
            } else {
                url
            }
        }

        sitePhotos?.forEach { photo ->
            if (photo.isNotBlank()) {
                val key = getKey(photo)
                if (seenKeys.add(key)) {
                    result.add(photo)
                }
            }
        }

        if (!beforeImageUrl.isNullOrBlank()) {
            val key = getKey(beforeImageUrl)
            if (seenKeys.add(key)) {
                result.add(beforeImageUrl)
            }
        }

        if (!afterImageUrl.isNullOrBlank()) {
            val key = getKey(afterImageUrl)
            if (seenKeys.add(key)) {
                result.add(afterImageUrl)
            }
        }

        result
    }

    if (isSiteVisit || taskType == "SITE_VISIT" || !sitePhotos.isNullOrEmpty() || resolvedSitePhotos.size > 2 || jobType?.lowercase()?.contains("survey") == true) {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "📸 Site Visit Photos (${resolvedSitePhotos.size})",
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Spacer(modifier = Modifier.height(8.dp))

        if (resolvedSitePhotos.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(8.dp)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = "No site visit photos uploaded",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            val photoPairs = remember(resolvedSitePhotos) { resolvedSitePhotos.chunked(2) }
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                photoPairs.forEach { pair ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        pair.forEach { photoUrl ->
                            val model = ImageUtils.resolveImageModel(context, photoUrl, serverUrl)
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(130.dp)
                                    .clickable { fullScreenImage = model },
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                AsyncImage(
                                    model = ImageUtils.rememberImageRequest(context, photoUrl, serverUrl),
                                    contentDescription = "Site Photo",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                        if (pair.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    } else {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "📷 Before & After Photos",
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )

        if (beforeImageUrl == null && afterImageUrl == null) {
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(8.dp)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = "No photo uploaded",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Before Image
                Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Before Work", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    if (beforeImageUrl != null) {
                        val model = ImageUtils.resolveImageModel(context, beforeImageUrl, serverUrl)
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp)
                                .clickable { fullScreenImage = model },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            AsyncImage(
                                model = ImageUtils.rememberImageRequest(context, beforeImageUrl, serverUrl),
                                contentDescription = "Before Photo",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    } else {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                Text("Missing", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }

                // After Image
                Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("After Work", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    if (afterImageUrl != null) {
                        val model = ImageUtils.resolveImageModel(context, afterImageUrl, serverUrl)
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp)
                                .clickable { fullScreenImage = model },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            AsyncImage(
                                model = ImageUtils.rememberImageRequest(context, afterImageUrl, serverUrl),
                                contentDescription = "After Photo",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    } else {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                Text("Missing", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }

    fullScreenImage?.let { imageModel ->
        FullScreenImageDialog(
            imageModel = imageModel,
            onDismiss = { fullScreenImage = null }
        )
    }
}
