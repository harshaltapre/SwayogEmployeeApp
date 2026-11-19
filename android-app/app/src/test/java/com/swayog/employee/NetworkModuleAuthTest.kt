package com.swayog.employee

import com.swayog.employee.di.NetworkModule
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkModuleAuthTest {

    @Test
    fun permanentRefreshRejection_onlyFor401And403() {
        assertTrue("HTTP 401 from /auth/refresh must clear session", NetworkModule.isPermanentRefreshRejection(401))
        assertTrue("HTTP 403 from /auth/refresh must clear session", NetworkModule.isPermanentRefreshRejection(403))

        assertFalse("HTTP 500 must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(500))
        assertFalse("HTTP 502 must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(502))
        assertFalse("HTTP 503 must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(503))
        assertFalse("HTTP 504 must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(504))
        assertFalse("HTTP 429 rate-limit must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(429))
        assertFalse("HTTP 408 timeout must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(408))
        assertFalse("HTTP 200 must NOT wipe tokens", NetworkModule.isPermanentRefreshRejection(200))
    }

    @Test
    fun dynamicNoCachePath_coversAttendanceAuthAndProfile() {
        assertTrue(NetworkModule.isDynamicNoCachePath("/api/v1/employee/attendance/today"))
        assertTrue(NetworkModule.isDynamicNoCachePath("/api/v1/attendance/check-in"))
        assertTrue(NetworkModule.isDynamicNoCachePath("/api/v1/auth/refresh"))
        assertTrue(NetworkModule.isDynamicNoCachePath("/api/v1/users/me"))

        assertFalse(NetworkModule.isDynamicNoCachePath("/uploads/ringtones/default.mp3"))
    }
}
