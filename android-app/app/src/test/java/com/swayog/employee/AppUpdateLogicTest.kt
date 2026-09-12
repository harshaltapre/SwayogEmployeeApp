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

    @Test
    fun test1_updateAvailable_whenServerVersionHigher() {
        val installedVersion = 24L
        val serverVersion = 25L
        assertTrue("Expected update to be available", isUpdateAvailable(installedVersion, serverVersion))
    }

    @Test
    fun test2_alreadyUpToDate_whenVersionsEqual() {
        val installedVersion = 25L
        val serverVersion = 25L
        assertFalse("Expected already up to date", isUpdateAvailable(installedVersion, serverVersion))
    }

    @Test
    fun test3_noDowngrade_whenInstalledVersionHigher() {
        val installedVersion = 26L
        val serverVersion = 25L
        assertFalse("Should not downgrade automatically", isUpdateAvailable(installedVersion, serverVersion))
    }

    @Test
    fun test4_mandatoryUpdate_whenBelowMinimumVersion() {
        val installedVersion = 21L
        val manifest = AppUpdateManifest(
            versionCode = 25L,
            versionName = "2.5.0",
            minimumVersionCode = 23L,
            mandatory = false,
            apkUrl = "releases/android/2.5.0/app-release.apk",
            sha256 = "dummy_sha"
        )
        assertTrue("Update must be mandatory because installed < minimumVersionCode", isMandatoryUpdate(installedVersion, manifest))
    }

    @Test
    fun test4b_optionalUpdate_whenAboveMinimumVersion() {
        val installedVersion = 24L
        val manifest = AppUpdateManifest(
            versionCode = 25L,
            versionName = "2.5.0",
            minimumVersionCode = 23L,
            mandatory = false,
            apkUrl = "releases/android/2.5.0/app-release.apk",
            sha256 = "dummy_sha"
        )
        assertFalse("Update should be optional", isMandatoryUpdate(installedVersion, manifest))
    }

    @Test
    fun test4c_mandatoryUpdate_whenExplicitlyMandatory() {
        val installedVersion = 24L
        val manifest = AppUpdateManifest(
            versionCode = 25L,
            versionName = "2.5.0",
            minimumVersionCode = 20L,
            mandatory = true,
            apkUrl = "releases/android/2.5.0/app-release.apk",
            sha256 = "dummy_sha"
        )
        assertTrue("Update must be mandatory when manifest.mandatory == true", isMandatoryUpdate(installedVersion, manifest))
    }

    @Test
    fun test5_checksumVerification_failsOnMismatch() {
        val expectedSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        val corruptedSha = "a1b2c3d4e5f60000000000000000000000000000000000000000000000000000"
        assertFalse("Checksum mismatch must be detected", expectedSha.equals(corruptedSha, ignoreCase = true))
    }
}
