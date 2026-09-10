package com.swayog.employee.core.config

import com.swayog.employee.BuildConfig

/**
 * Centralized Application Configuration.
 * Ensures server/API URLs remain constant, secure, and production-ready.
 */
object AppConfig {
    const val PRODUCTION_API_BASE_URL = "https://swayog-dashboard.vercel.app/api/v1/"
    const val PRODUCTION_WS_BASE_URL = "wss://swayog-dashboard.vercel.app"

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
}
