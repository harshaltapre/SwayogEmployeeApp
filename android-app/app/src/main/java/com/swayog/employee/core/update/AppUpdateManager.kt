package com.swayog.employee.core.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.content.FileProvider
import androidx.core.content.pm.PackageInfoCompat
import com.swayog.employee.core.config.AppConfig
import com.swayog.employee.data.model.AppUpdateManifest
import com.swayog.employee.data.model.AppUpdateState
import com.swayog.employee.data.model.UpdateErrorKind
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import com.google.gson.Gson
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import com.swayog.employee.di.UpdateOkHttpClient
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "AppUpdateManager"
private const val CHECK_INTERVAL_MILLIS = 6 * 60 * 60 * 1000L // 6 hours

@Singleton
class AppUpdateManager @Inject constructor(
    @ApplicationContext private val context: Context,
    @UpdateOkHttpClient private val okHttpClient: OkHttpClient
) {
    sealed interface CheckResult {
        data class UpdateAvailable(val manifest: AppUpdateManifest, val downloading: Boolean) : CheckResult
        data class UpToDate(val installedVersionName: String, val lastCheckedTimeMillis: Long) : CheckResult
        data class Error(val message: String) : CheckResult
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _updateState = MutableStateFlow<AppUpdateState>(AppUpdateState.Idle)
    val updateState: StateFlow<AppUpdateState> = _updateState.asStateFlow()

    private var lastAutoCheckTimestamp: Long = 0L
    private val checkMutex = Mutex()

    val installedVersionCode: Long
        get() = try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            PackageInfoCompat.getLongVersionCode(pInfo)
        } catch (e: Exception) {
            1L
        }

    val installedVersionName: String
        get() = try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }

    /**
     * Checks for updates if the throttle interval (6 hours) has elapsed,
     * or immediately if [force] is true (e.g. manual user check in Settings).
     * If [autoDownload] is true and an update is available, download and install will be initiated automatically.
     */
    suspend fun checkForUpdates(force: Boolean = false, autoDownload: Boolean = false): CheckResult {
        return checkMutex.withLock {
            val now = System.currentTimeMillis()
            if (!force && (now - lastAutoCheckTimestamp < CHECK_INTERVAL_MILLIS)) {
                Log.d(TAG, "Skipping auto update check: within 6h window (elapsed: ${(now - lastAutoCheckTimestamp) / 1000}s)")
                return@withLock CheckResult.UpToDate(installedVersionName, lastAutoCheckTimestamp)
            }

            // Don't interrupt an ongoing download or verification
            val currentState = _updateState.value
            if (currentState is AppUpdateState.Downloading) {
                return@withLock CheckResult.UpdateAvailable(currentState.manifest, downloading = true)
            } else if (currentState is AppUpdateState.Verifying) {
                return@withLock CheckResult.UpdateAvailable(currentState.manifest, downloading = true)
            }

            _updateState.value = AppUpdateState.Checking

            withContext(Dispatchers.IO) {
                try {
                    val manifestUrl = AppConfig.PUBLIC_UPDATE_ENDPOINT
                    Log.i(TAG, "Update check started. Querying authoritative manifest: $manifestUrl")

                    val request = Request.Builder()
                        .url(manifestUrl)
                        .header("User-Agent", "SwayogEmployeeApp/${installedVersionName}")
                        .header("Cache-Control", "no-cache, no-store")
                        .build()

                    var httpStatus = 0
                    var contentType = ""
                    var rawBody = ""

                    okHttpClient.newCall(request).execute().use { response ->
                        httpStatus = response.code
                        contentType = response.header("Content-Type") ?: ""
                        rawBody = response.body?.string() ?: ""
                    }

                    Log.i(TAG, "Manifest response: HTTP $httpStatus, Content-Type: $contentType, length: ${rawBody.length} chars")

                    if (httpStatus != 200) {
                        Log.w(TAG, "Update check failed with HTTP $httpStatus from $manifestUrl")
                        val displayError = when (httpStatus) {
                            404 -> "Update manifest is currently unavailable (HTTP 404)."
                            401, 403 -> "Authentication error while checking updates (HTTP $httpStatus)."
                            500, 502, 503, 504 -> "Update service is temporarily unavailable (HTTP $httpStatus)."
                            0 -> "Unable to reach the update service."
                            else -> "Update service returned an error (HTTP $httpStatus)."
                        }
                        _updateState.value = AppUpdateState.Error(
                            message = displayError,
                            isNetworkError = (httpStatus == 0),
                            kind = if (httpStatus == 404) UpdateErrorKind.MANIFEST_NOT_FOUND else UpdateErrorKind.SERVER_ERROR
                        )
                        return@withContext CheckResult.Error(displayError)
                    }

                    // Pre-parse validation: detect HTML/SPA fallback or malformed response
                    val trimmedBody = rawBody.trim()
                    val isHtml = contentType.contains("text/html", ignoreCase = true) || trimmedBody.startsWith("<")
                    val isJsonObject = trimmedBody.startsWith("{") && trimmedBody.endsWith("}")

                    if (isHtml || !isJsonObject) {
                        Log.e(TAG, "HTTP 200 returned invalid format (expected JSON Object '{...}', got Content-Type: '$contentType', preview: '${trimmedBody.take(120)}')")
                        val errorMsg = "Update information is corrupted (invalid manifest format)."
                        _updateState.value = AppUpdateState.Error(
                            message = errorMsg,
                            isNetworkError = false,
                            kind = UpdateErrorKind.INVALID_MANIFEST
                        )
                        return@withContext CheckResult.Error(errorMsg)
                    }

                    // Parse JSON into AppUpdateManifest
                    val parsed: AppUpdateManifest = try {
                        Gson().fromJson(trimmedBody, AppUpdateManifest::class.java)
                    } catch (parseError: Exception) {
                        Log.e(TAG, "Gson parse error: ${parseError.message}", parseError)
                        val errorMsg = "Update information is corrupted (invalid manifest format)."
                        _updateState.value = AppUpdateState.Error(
                            message = errorMsg,
                            isNetworkError = false,
                            kind = UpdateErrorKind.INVALID_MANIFEST
                        )
                        return@withContext CheckResult.Error(errorMsg)
                    }

                    // Validate essential manifest fields
                    if (parsed.versionCode <= 0 || parsed.versionName.isBlank()) {
                        Log.e(TAG, "Manifest missing valid versionCode (${parsed.versionCode}) or versionName ('${parsed.versionName}')")
                        val errorMsg = "Update information is invalid (invalid build number)."
                        _updateState.value = AppUpdateState.Error(
                            message = errorMsg,
                            isNetworkError = false,
                            kind = UpdateErrorKind.INVALID_VERSION_DATA
                        )
                        return@withContext CheckResult.Error(errorMsg)
                    }

                    if (parsed.apkUrl.isBlank()) {
                        Log.e(TAG, "Manifest missing apkUrl")
                        val errorMsg = "New version was found, but the update package is currently unavailable."
                        _updateState.value = AppUpdateState.Error(
                            message = errorMsg,
                            isNetworkError = false,
                            kind = UpdateErrorKind.APK_NOT_FOUND
                        )
                        return@withContext CheckResult.Error(errorMsg)
                    }

                    if (!parsed.sha256.matches(Regex("^[A-Fa-f0-9]{64}$"))) {
                        Log.e(TAG, "Manifest contains invalid SHA-256 checksum format: '${parsed.sha256}'")
                        val errorMsg = "Update information is corrupted (invalid manifest format)."
                        _updateState.value = AppUpdateState.Error(
                            message = errorMsg,
                            isNetworkError = false,
                            kind = UpdateErrorKind.INVALID_MANIFEST
                        )
                        return@withContext CheckResult.Error(errorMsg)
                    }

                    Log.i(
                        TAG,
                        "Parsed manifest successfully: versionName=${parsed.versionName}, versionCode=${parsed.versionCode}, releaseTag=${parsed.releaseTag ?: "N/A"}, notes=${parsed.releaseNotes.size} items"
                    )

                    lastAutoCheckTimestamp = System.currentTimeMillis()

                    val serverCode = parsed.versionCode
                    val currentCode = installedVersionCode
                    val minCode = parsed.minimumVersionCode ?: 0L

                    Log.i(
                        TAG,
                        "Comparison: serverCode=$serverCode, installedCode=$currentCode (name=$installedVersionName), minCode=$minCode, mandatory=${parsed.mandatory}"
                    )

                    if (serverCode > currentCode) {
                        Log.i(TAG, "Result: UPDATE_AVAILABLE (server $serverCode > installed $currentCode)")
                        val isMandatory = parsed.mandatory || (currentCode < minCode)
                        if (autoDownload) {
                            Log.i(TAG, "autoDownload=true: launching direct download & install.")
                            scope.launch { downloadAndInstall(parsed) }
                            CheckResult.UpdateAvailable(parsed, downloading = true)
                        } else {
                            _updateState.value = AppUpdateState.UpdateAvailable(
                                manifest = parsed,
                                isMandatory = isMandatory,
                                installedVersionName = installedVersionName,
                                installedVersionCode = currentCode
                            )
                            CheckResult.UpdateAvailable(parsed, downloading = false)
                        }
                    } else if (serverCode < currentCode) {
                        Log.i(TAG, "Result: UP_TO_DATE (installed $currentCode > server $serverCode - no downgrade)")
                        _updateState.value = AppUpdateState.UpToDate(
                            installedVersionName = installedVersionName,
                            installedVersionCode = currentCode,
                            lastCheckedTimeMillis = lastAutoCheckTimestamp,
                            isNewerThanServer = true
                        )
                        CheckResult.UpToDate(installedVersionName, lastAutoCheckTimestamp)
                    } else {
                        Log.i(TAG, "Result: UP_TO_DATE (installed $currentCode == server $serverCode)")
                        _updateState.value = AppUpdateState.UpToDate(
                            installedVersionName = installedVersionName,
                            installedVersionCode = currentCode,
                            lastCheckedTimeMillis = lastAutoCheckTimestamp,
                            isNewerThanServer = false
                        )
                        CheckResult.UpToDate(installedVersionName, lastAutoCheckTimestamp)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Exception during update check: ${e.message}", e)
                    val (displayError, isNet) = when (e) {
                        is java.net.UnknownHostException -> "No internet connection. Please check your network." to true
                        is java.net.ConnectException -> "Unable to reach the update service." to true
                        is java.net.SocketTimeoutException -> "Unable to reach the update service (request timed out)." to true
                        is com.google.gson.JsonSyntaxException, is org.json.JSONException -> "Unable to read update information." to false
                        is javax.net.ssl.SSLException -> "Secure connection to update service failed (SSL/TLS error)." to true
                        else -> (e.localizedMessage?.takeIf { it.isNotBlank() } ?: "Update check failed.") to false
                    }
                    _updateState.value = AppUpdateState.Error(
                        message = displayError,
                        isNetworkError = isNet,
                        kind = if (isNet) UpdateErrorKind.NETWORK_ERROR else UpdateErrorKind.UNKNOWN
                    )
                    CheckResult.Error(displayError)
                }
            }
        }
    }

    /**
     * Downloads the APK specified by the manifest, verifying its SHA-256 hash.
     */
    suspend fun downloadAndInstall(manifest: AppUpdateManifest) {
        val currentState = _updateState.value
        if (currentState is AppUpdateState.Downloading || currentState is AppUpdateState.Verifying) {
            Log.d(TAG, "Download/verification already in progress. Ignoring duplicate call.")
            return
        }

        val updatesDir = File(context.cacheDir, "updates").apply { mkdirs() }
        val targetApkFile = File(updatesDir, "swayog-v${manifest.versionName}-${manifest.versionCode}.apk")

        // Clean up stale APK or temporary files from previous downloads/releases
        updatesDir.listFiles()?.forEach { file ->
            if (file != targetApkFile && (file.name.endsWith(".apk") || file.name.endsWith(".tmp"))) {
                try { file.delete() } catch (_: Exception) {}
            }
        }

        // If file already exists and passes checksum, jump directly to install
        if (targetApkFile.exists() && targetApkFile.length() > 0) {
            _updateState.value = AppUpdateState.Verifying(manifest)
            val existingChecksum = calculateSha256(targetApkFile)
            if (existingChecksum.equals(manifest.sha256, ignoreCase = true)) {
                Log.i(TAG, "Existing cached APK matches checksum. Ready to install.")
                _updateState.value = AppUpdateState.ReadyToInstall(targetApkFile, manifest)
                withContext(Dispatchers.Main) {
                    installApk(targetApkFile)
                }
                return
            } else {
                targetApkFile.delete()
            }
        }

        withContext(Dispatchers.IO) {
            try {
                _updateState.value = AppUpdateState.Downloading(
                    progressPercent = 0,
                    bytesDownloaded = 0,
                    totalBytes = manifest.fileSize ?: -1L,
                    manifest = manifest
                )

                val request = Request.Builder()
                    .url(manifest.apkUrl)
                    .header("User-Agent", "SwayogEmployeeApp/${installedVersionName}")
                    .build()

                val response = okHttpClient.newCall(request).execute()
                if (!response.isSuccessful || response.body == null) {
                    throw IllegalStateException("Failed to download APK: HTTP ${response.code}")
                }

                val body = response.body!!
                val contentLength = body.contentLength().takeIf { it > 0 } ?: (manifest.fileSize ?: -1L)
                val tempFile = File(updatesDir, "download-${System.currentTimeMillis()}.tmp")

                body.byteStream().use { input ->
                    FileOutputStream(tempFile).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        var totalRead = 0L
                        var lastProgressPercent = 0

                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            totalRead += bytesRead

                            if (contentLength > 0) {
                                val percent = ((totalRead * 100) / contentLength).toInt().coerceIn(0, 100)
                                if (percent != lastProgressPercent) {
                                    lastProgressPercent = percent
                                    _updateState.value = AppUpdateState.Downloading(
                                        progressPercent = percent,
                                        bytesDownloaded = totalRead,
                                        totalBytes = contentLength,
                                        manifest = manifest
                                    )
                                }
                            }
                        }
                        output.flush()
                    }
                }

                // Verify Checksum
                _updateState.value = AppUpdateState.Verifying(manifest)
                val calculatedChecksum = calculateSha256(tempFile)
                Log.d(TAG, "Download complete. Expected SHA-256: ${manifest.sha256}, Calculated: $calculatedChecksum")

                if (!calculatedChecksum.equals(manifest.sha256.trim(), ignoreCase = true)) {
                    tempFile.delete()
                    val msg = "Verification failed: APK checksum mismatch. Expected: ${manifest.sha256}, got: $calculatedChecksum"
                    Log.e(TAG, msg)
                    _updateState.value = AppUpdateState.Error(
                        message = "Update verification failed. The downloaded file may be corrupted.",
                        manifest = manifest
                    )
                    return@withContext
                }

                // Move temp file to final target APK
                if (targetApkFile.exists()) targetApkFile.delete()
                tempFile.renameTo(targetApkFile)

                _updateState.value = AppUpdateState.ReadyToInstall(targetApkFile, manifest)

                withContext(Dispatchers.Main) {
                    installApk(targetApkFile)
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error downloading APK: ${e.message}", e)
                _updateState.value = AppUpdateState.Error(
                    message = "Download failed: ${e.localizedMessage ?: "Unknown error"}",
                    isNetworkError = true,
                    manifest = manifest
                )
            }
        }
    }

    /**
     * Checks permission and launches the Android Package Installer.
     */
    fun installApk(apkFile: File) {
        if (!apkFile.exists()) {
            _updateState.value = AppUpdateState.Error("APK file does not exist")
            return
        }

        // On Android 8.0 (API 26) and above, check for unknown app install permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.packageManager.canRequestPackageInstalls()) {
                Log.w(TAG, "Install permission not granted. Requesting user permission in Settings.")
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                return
            }
        }

        try {
            val contentUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )

            Log.i(TAG, "Launching Android package installer with URI: $contentUri")

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            context.startActivity(installIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch installer: ${e.message}", e)
            _updateState.value = AppUpdateState.Error(
                message = "Failed to launch installer: ${e.localizedMessage}"
            )
        }
    }

    /**
     * Resumes installer if an update is already downloaded and verified,
     * particularly when the user returns after granting the unknown app install permission.
     */
    fun resumeInstallIfReady() {
        val current = _updateState.value
        if (current is AppUpdateState.ReadyToInstall) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()) {
                Log.i(TAG, "Permissions satisfied: automatically resuming APK installation.")
                installApk(current.apkFile)
            }
        }
    }

    /**
     * Dismisses an optional update or resets error state.
     */
    fun dismissUpdate() {
        val current = _updateState.value
        if (current is AppUpdateState.UpdateAvailable && !current.isMandatory) {
            _updateState.value = AppUpdateState.Idle
        } else if (current is AppUpdateState.Error) {
            _updateState.value = AppUpdateState.Idle
        }
    }

    private fun calculateSha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { fis ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (fis.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
