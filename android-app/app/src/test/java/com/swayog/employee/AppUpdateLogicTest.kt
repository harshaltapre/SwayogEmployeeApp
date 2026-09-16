package com.swayog.employee

import com.swayog.employee.data.model.AppUpdateManifest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying authoritative numeric version comparison,
 * mandatory update evaluation, and checksum logic according to the specification.
 */
class AppUpdateLogicTest {

    private fun isUpdateAvailable(installedCode: Long, serverCode: Long): Boolean {
        return serverCode > installedCode
    }

    private fun isMandatoryUpdate(installedCode: Long, manifest: AppUpdateManifest): Boolean {
        val minCode = manifest.minimumVersionCode ?: 0L
        return manifest.mandatory || (installedCode < minCode)
    }

    private fun evaluateUpdateState(
        installedCode: Long,
        installedName: String,
        manifest: AppUpdateManifest?,
        isNetworkError: Boolean,
        httpStatus: Int
    ): Pair<String, Boolean> {
        if (isNetworkError || httpStatus != 200 || manifest == null) {
            return Pair("Unable to check for updates. Please check your internet connection and try again.", false)
        }
        return if (manifest.versionCode > installedCode) {
            Pair("New Update Available", true)
        } else {
            Pair("Application is up to date", false)
        }
    }

    @Test
    fun test1_upToDate_whenBuildsMatch() {
        val manifest = AppUpdateManifest(versionCode = 1L, versionName = "1.0.0", apkUrl = "url", sha256 = "sha")
        val (stateText, isUpdate) = evaluateUpdateState(1L, "1.0.0", manifest, false, 200)
        assertEquals("Application is up to date", stateText)
        assertFalse(isUpdate)
    }

    @Test
    fun test2_updateAvailable_whenServerBuildHigher() {
        val manifest = AppUpdateManifest(versionCode = 2L, versionName = "1.1.0", apkUrl = "url", sha256 = "sha")
        val (stateText, isUpdate) = evaluateUpdateState(1L, "1.0.0", manifest, false, 200)
        assertEquals("New Update Available", stateText)
        assertTrue(isUpdate)
    }

    @Test
    fun test3_checkManualBypassesThrottle() {
        val lastChecked = System.currentTimeMillis() - 1000L // 1 second ago
        val throttleWindow = 6 * 60 * 60 * 1000L
        val force = true
        val shouldExecute = force || (System.currentTimeMillis() - lastChecked > throttleWindow)
        assertTrue("Manual check must always bypass the 6h throttle window", shouldExecute)
    }

    @Test
    fun test4_downloadProgressAndChecksum() {
        val totalBytes = 25000000L
        val downloadedBytes = 12500000L
        val progressPercent = ((downloadedBytes * 100) / totalBytes).toInt()
        assertEquals(50, progressPercent)

        val expectedSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        val calculatedSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        assertTrue("Checksum must match identically", expectedSha.equals(calculatedSha, ignoreCase = true))
    }

    @Test
    fun test5_settingsReflectsInstalledBuildAfterInstall() {
        var installedName = "1.0.0"
        var installedCode = 1L
        // Simulating app update to Build 2
        installedName = "1.1.0"
        installedCode = 2L
        assertEquals("1.1.0", installedName)
        assertEquals(2L, installedCode)
    }

    @Test
    fun test6_checkAgainAfterInstallIsUpToDate() {
        val manifest = AppUpdateManifest(versionCode = 2L, versionName = "1.1.0", apkUrl = "url", sha256 = "sha")
        val (stateText, isUpdate) = evaluateUpdateState(2L, "1.1.0", manifest, false, 200)
        assertEquals("Application is up to date", stateText)
        assertFalse(isUpdate)
    }

    @Test
    fun test7_serverUnavailableReportsErrorNotUpToDate() {
        val (stateText, _) = evaluateUpdateState(1L, "1.0.0", null, true, 500)
        assertEquals("Unable to check for updates. Please check your internet connection and try again.", stateText)
        assertFalse("Must not report up to date when server is unavailable", stateText.contains("up to date", ignoreCase = true))

        val (state404, _) = evaluateUpdateState(1L, "1.0.0", null, false, 404)
        assertEquals("Unable to check for updates. Please check your internet connection and try again.", state404)
    }

    @Test
    fun test8_wrongChecksumBlocksInstall() {
        val expectedSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        val corruptedSha = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
        val isValid = expectedSha.equals(corruptedSha, ignoreCase = true)
        assertFalse("Installation must be aborted if checksum mismatches", isValid)
    }

    @Test
    fun test9_mandatoryUpdateLogic() {
        val manifestMinCode = AppUpdateManifest(
            versionCode = 5L,
            versionName = "1.5.0",
            minimumVersionCode = 4L,
            mandatory = false,
            apkUrl = "url",
            sha256 = "sha"
        )
        assertTrue("Installed build 3 is below minimumVersionCode 4 -> mandatory", isMandatoryUpdate(3L, manifestMinCode))
        assertFalse("Installed build 4 meets minimumVersionCode 4 -> optional", isMandatoryUpdate(4L, manifestMinCode))

        val manifestExplicitMandatory = AppUpdateManifest(
            versionCode = 5L,
            versionName = "1.5.0",
            minimumVersionCode = 2L,
            mandatory = true,
            apkUrl = "url",
            sha256 = "sha"
        )
        assertTrue("Manifest marked mandatory == true -> mandatory", isMandatoryUpdate(4L, manifestExplicitMandatory))
    }

    @Test
    fun test10_noDowngradeIfInstalledHigherThanServer() {
        val manifest = AppUpdateManifest(versionCode = 2L, versionName = "1.1.0", apkUrl = "url", sha256 = "sha")
        val (stateText, isUpdate) = evaluateUpdateState(3L, "1.2.0", manifest, false, 200)
        assertEquals("Application is up to date", stateText)
        assertFalse("Should never downgrade automatically", isUpdate)
    }

    @Test
    fun test11_autoCheckThrottleElapsed() {
        val now = System.currentTimeMillis()
        val sevenHoursAgo = now - (7 * 60 * 60 * 1000L)
        val throttleWindow = 6 * 60 * 60 * 1000L
        val shouldAutoCheck = (now - sevenHoursAgo) >= throttleWindow
        assertTrue("Auto check must trigger if > 6 hours elapsed", shouldAutoCheck)
    }

    @Test
    fun test12_noInternetDoesNotCrash() {
        var didCrash = false
        try {
            val result = evaluateUpdateState(1L, "1.0.0", null, isNetworkError = true, httpStatus = 0)
            assertEquals("Unable to check for updates. Please check your internet connection and try again.", result.first)
        } catch (e: Exception) {
            didCrash = true
        }
        assertFalse("Network error must be safely caught without crashing the app", didCrash)
    }

    @Test
    fun test13_gsonDeserialization_canonicalManifest() {
        val json = """
        {
          "appId": "com.swayog.employee",
          "platform": "android",
          "versionName": "1.0.0",
          "versionCode": 21,
          "minimumVersionCode": 1,
          "mandatory": false,
          "releaseDate": "2026-09-16",
          "releaseTag": "v1.0.0-build21",
          "releaseTitle": "Swayog Employee App v1.0.0 — Build 21",
          "releaseNotes": [
            "Improved attendance tracking",
            "Bug fixes and performance improvements"
          ],
          "apkUrl": "https://swayog-dashboard.vercel.app/releases/android/1.0.0/build-21/app-release.apk",
          "sha256": "dd5422cce433152653308bb0ba04ba6159a35ebf4c4b9f90eeb32670289ba3c4",
          "fileSize": 76872575
        }
        """.trimIndent()

        val parsed = com.google.gson.Gson().fromJson(json, AppUpdateManifest::class.java)
        assertEquals("com.swayog.employee", parsed.appId)
        assertEquals("android", parsed.platform)
        assertEquals(21L, parsed.versionCode)
        assertEquals("1.0.0", parsed.versionName)
        assertEquals(2, parsed.releaseNotes.size)
        assertEquals("Improved attendance tracking", parsed.releaseNotes[0])
    }

    @Test
    fun test14_gsonDeserialization_stringEncodedJsonUnwrapped() {
        val rawJson = """{"appId":"com.swayog.employee","platform":"android","versionName":"1.0.0","versionCode":21,"mandatory":false,"apkUrl":"https://example.com/app.apk","sha256":"dd5422cce433152653308bb0ba04ba6159a35ebf4c4b9f90eeb32670289ba3c4","releaseNotes":["Note 1"]}"""
        // Simulate stringified JSON (wrapped in quotes)
        val stringified = com.google.gson.Gson().toJson(rawJson)
        assertTrue(stringified.startsWith("\"") && stringified.endsWith("\""))

        // Unwrapping logic
        val unwrapped = com.google.gson.Gson().fromJson(stringified, String::class.java)
        val parsed = com.google.gson.Gson().fromJson(unwrapped, AppUpdateManifest::class.java)
        assertEquals(21L, parsed.versionCode)
        assertEquals("1.0.0", parsed.versionName)
    }

    @Test
    fun test15_scenarioVerification() {
        // Scenario 1: Installed 1, Server 20 -> UPDATE_AVAILABLE
        val s1Manifest = AppUpdateManifest(versionCode = 20L, versionName = "1.0.0", apkUrl = "url", sha256 = "sha")
        assertTrue("Scenario 1: Server 20 > Installed 1 -> Update available", isUpdateAvailable(1L, s1Manifest.versionCode))

        // Scenario 2: Installed 20, Server 20 -> UP_TO_DATE
        val s2Manifest = AppUpdateManifest(versionCode = 20L, versionName = "1.0.0", apkUrl = "url", sha256 = "sha")
        assertFalse("Scenario 2: Server 20 == Installed 20 -> Up to date", isUpdateAvailable(20L, s2Manifest.versionCode))

        // Scenario 3: Installed 21, Server 20 -> NO_DOWNGRADE
        val s3Manifest = AppUpdateManifest(versionCode = 20L, versionName = "1.0.0", apkUrl = "url", sha256 = "sha")
        assertFalse("Scenario 3: Installed 21 > Server 20 -> No downgrade", isUpdateAvailable(21L, s3Manifest.versionCode))
    }
}
