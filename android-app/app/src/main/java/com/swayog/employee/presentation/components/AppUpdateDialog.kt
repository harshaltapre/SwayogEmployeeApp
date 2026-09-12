package com.swayog.employee.presentation.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.swayog.employee.data.model.AppUpdateManifest
import com.swayog.employee.data.model.AppUpdateState
import java.text.DecimalFormat

@Composable
fun AppUpdateDialog(
    updateState: AppUpdateState,
    onDownloadClick: (AppUpdateManifest) -> Unit,
    onInstallClick: (java.io.File) -> Unit,
    onDismissClick: () -> Unit
) {
    when (updateState) {
        is AppUpdateState.UpdateAvailable -> {
            UpdateContentDialog(
                manifest = updateState.manifest,
                isMandatory = updateState.isMandatory,
                installedVersionName = updateState.installedVersionName,
                downloadProgress = null,
                isVerifying = false,
                errorMessage = null,
                onPrimaryAction = { onDownloadClick(updateState.manifest) },
                onDismiss = onDismissClick
            )
        }
        is AppUpdateState.Downloading -> {
            UpdateContentDialog(
                manifest = updateState.manifest,
                isMandatory = true, // Prevent dismissing during download
                installedVersionName = "",
                downloadProgress = updateState,
                isVerifying = false,
                errorMessage = null,
                onPrimaryAction = {},
                onDismiss = {}
            )
        }
        is AppUpdateState.Verifying -> {
            UpdateContentDialog(
                manifest = updateState.manifest,
                isMandatory = true,
                installedVersionName = "",
                downloadProgress = null,
                isVerifying = true,
                errorMessage = null,
                onPrimaryAction = {},
                onDismiss = {}
            )
        }
        is AppUpdateState.ReadyToInstall -> {
            UpdateContentDialog(
                manifest = updateState.manifest,
                isMandatory = updateState.manifest.mandatory,
                installedVersionName = "",
                downloadProgress = null,
                isVerifying = false,
                errorMessage = null,
                primaryButtonText = "Install Now",
                onPrimaryAction = { onInstallClick(updateState.apkFile) },
                onDismiss = onDismissClick
            )
        }
        is AppUpdateState.Error -> {
            if (updateState.manifest != null) {
                UpdateContentDialog(
                    manifest = updateState.manifest,
                    isMandatory = updateState.manifest.mandatory,
                    installedVersionName = "",
                    downloadProgress = null,
                    isVerifying = false,
                    errorMessage = updateState.message,
                    primaryButtonText = "Retry Download",
                    onPrimaryAction = { onDownloadClick(updateState.manifest) },
                    onDismiss = onDismissClick
                )
            }
        }
        else -> {
            // Idle or UpToDate -> No global dialog needed
        }
    }
}

@Composable
private fun UpdateContentDialog(
    manifest: AppUpdateManifest,
    isMandatory: Boolean,
    installedVersionName: String,
    downloadProgress: AppUpdateState.Downloading?,
    isVerifying: Boolean,
    errorMessage: String?,
    primaryButtonText: String = "Download & Update",
    onPrimaryAction: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = {
            if (!isMandatory && downloadProgress == null && !isVerifying) {
                onDismiss()
            }
        },
        properties = DialogProperties(
            dismissOnBackPress = !isMandatory && downloadProgress == null && !isVerifying,
            dismissOnClickOutside = !isMandatory && downloadProgress == null && !isVerifying
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(
                            if (isMandatory) MaterialTheme.colorScheme.errorContainer
                            else MaterialTheme.colorScheme.primaryContainer
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isMandatory) Icons.Default.Warning else Icons.Default.SystemUpdate,
                        contentDescription = "App Update",
                        tint = if (isMandatory) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(32.dp)
                    )
                }

                // Title
                Text(
                    text = if (isMandatory) "Update Required" else (manifest.title ?: "New Version Available"),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface
                )

                // Version Badge
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        text = "Swayog v${manifest.versionName} (Build ${manifest.versionCode})",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (installedVersionName.isNotBlank()) {
                    Text(
                        text = "Your current version: v$installedVersionName",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                // Release Notes Section
                if (manifest.releaseNotes.isNotEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "What's New:",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        manifest.releaseNotes.forEach { note ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "•",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = note,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // Download Size if provided
                if (manifest.fileSize != null && manifest.fileSize > 0) {
                    val mb = manifest.fileSize.toDouble() / (1024 * 1024)
                    val df = DecimalFormat("#.#")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Download Size:",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${df.format(mb)} MB",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                // Download Progress or Verifying
                if (downloadProgress != null) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val animatedProgress by animateFloatAsState(
                            targetValue = downloadProgress.progressPercent / 100f,
                            label = "downloadProgress"
                        )
                        LinearProgressIndicator(
                            progress = animatedProgress,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                        )
                        Text(
                            text = "Downloading... ${downloadProgress.progressPercent}%",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                } else if (isVerifying) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Text(
                            text = "Verifying package integrity...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Error Message
                if (!errorMessage.isNullOrBlank()) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.errorContainer,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ErrorOutline,
                                contentDescription = "Error",
                                tint = MaterialTheme.colorScheme.error
                            )
                            Text(
                                text = errorMessage,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }

                // Action Buttons
                if (downloadProgress == null && !isVerifying) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onPrimaryAction,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isMandatory) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = primaryButtonText,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        if (!isMandatory) {
                            OutlinedButton(
                                onClick = onDismiss,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(text = "Later")
                            }
                        }
                    }
                }
            }
        }
    }
}
