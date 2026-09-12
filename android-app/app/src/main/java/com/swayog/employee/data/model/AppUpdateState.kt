package com.swayog.employee.data.model

import java.io.File

/**
 * Represents the current lifecycle state of in-app updates.
 */
sealed interface AppUpdateState {
    /**
     * Default inactive state.
     */
    object Idle : AppUpdateState

    /**
     * Currently checking server for updates.
     */
    object Checking : AppUpdateState

    /**
     * App is currently running the latest version available on the server.
     */
    data class UpToDate(
        val installedVersionName: String,
        val installedVersionCode: Long,
        val lastCheckedTimeMillis: Long
    ) : AppUpdateState

    /**
     * A new version is available on the server.
     */
    data class UpdateAvailable(
        val manifest: AppUpdateManifest,
        val isMandatory: Boolean,
        val installedVersionName: String,
        val installedVersionCode: Long
    ) : AppUpdateState

    /**
     * APK download in progress.
     */
    data class Downloading(
        val progressPercent: Int,
        val bytesDownloaded: Long,
        val totalBytes: Long,
        val manifest: AppUpdateManifest
    ) : AppUpdateState

    /**
     * Computing and verifying SHA-256 checksum of downloaded APK.
     */
    data class Verifying(
        val manifest: AppUpdateManifest
    ) : AppUpdateState

    /**
     * Verification succeeded. Ready to launch the Android system package installer.
     */
    data class ReadyToInstall(
        val apkFile: File,
        val manifest: AppUpdateManifest
    ) : AppUpdateState

    /**
     * Installation or update check encountered an error.
     */
    data class Error(
        val message: String,
        val isNetworkError: Boolean = false,
        val manifest: AppUpdateManifest? = null
    ) : AppUpdateState
}
