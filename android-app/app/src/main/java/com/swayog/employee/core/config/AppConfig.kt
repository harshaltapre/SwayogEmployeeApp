package com.swayog.employee.core.config

import com.swayog.employee.BuildConfig

/**
 * Centralized Application Configuration.
 * Ensures server/API URLs remain constant, secure, and production-ready.
 */
object AppConfig {
    const val PRODUCTION_API_BASE_URL = "https://swayog-dashboard.vercel.app/api/v1/"
    const val PRODUCTION_WS_BASE_URL = "wss://swayog-dashboard.vercel.app"
    
    // Public distribution URL for APK downloads - should point to public R2/CDN domain
    // This should be configured in local.properties or environment variables
    const val PRODUCTION_PUBLIC_URL = "https://your-public-domain.com"

    /**
     * Normalized API Base URL (guaranteed to end with a trailing slash).
     * Defaults to production URL if BuildConfig is blank.
     */
    val API_BASE_URL: String
        get() = PRODUCTION_API_BASE_URL

    /**
     * Base URL without '/api/v1' suffix for resolving static assets and uploads.
     */
    val BASE_URL_WITHOUT_API: String
        get() {
            return API_BASE_URL.removeSuffix("/").removeSuffix("/api/v1")
        }

    /**
     * WebSocket Base URL for real-time services.
     */
    val WS_BASE_URL: String
        get() {
            return BuildConfig.WS_BASE_URL.takeIf { it.isNotBlank() } ?: PRODUCTION_WS_BASE_URL
        }
    
    /**
     * Public Update Endpoint - direct access to latest.json from public R2/CDN
     * This bypasses the backend API for direct access to release manifests
     */
    val PUBLIC_UPDATE_ENDPOINT: String
        get() {
            val publicUrl = BuildConfig.PUBLIC_DISTRIBUTION_URL.takeIf { it.isNotBlank() } ?: PRODUCTION_PUBLIC_URL
            return "${publicUrl.removeSuffix("/")}/releases/android/latest.json"
        }
}
