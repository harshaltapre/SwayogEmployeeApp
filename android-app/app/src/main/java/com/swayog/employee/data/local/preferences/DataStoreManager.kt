package com.swayog.employee.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "swayog_preferences")

@Singleton
class DataStoreManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object PreferencesKeys {
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val USER_NAME = stringPreferencesKey("user_name")
        val USER_ROLE = stringPreferencesKey("user_role")
        val JOB_ROLE = stringPreferencesKey("job_role")
        val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        val BIOMETRIC_ENABLED = booleanPreferencesKey("biometric_enabled")
        val DARK_MODE = booleanPreferencesKey("dark_mode")
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val COMPACT_VIEW_ENABLED = booleanPreferencesKey("compact_view_enabled")
        val ANIMATIONS_ENABLED = booleanPreferencesKey("animations_enabled")
        val PROFILE_VISIBILITY_ENABLED = booleanPreferencesKey("profile_visibility_enabled")
        val SHOW_STATUS_ENABLED = booleanPreferencesKey("show_status_enabled")
        val ACTIVITY_SHARING_ENABLED = booleanPreferencesKey("activity_sharing_enabled")
        val LANGUAGE = stringPreferencesKey("language")
        val SERVER_URL = stringPreferencesKey("server_url")
        val PROFILE_PHOTO_URL = stringPreferencesKey("profile_photo_url")
        
        // Face recognition
        val FACE_ENROLLED = booleanPreferencesKey("face_enrolled")
        val FACE_DESCRIPTOR_1 = stringPreferencesKey("face_descriptor_1")
        val FACE_DESCRIPTOR_2 = stringPreferencesKey("face_descriptor_2")
        val FACE_DESCRIPTOR_3 = stringPreferencesKey("face_descriptor_3")

        // Attendance Rules
        val RULE_SHIFT_START = stringPreferencesKey("rule_shift_start")
        val RULE_FACE_REQUIRED = booleanPreferencesKey("rule_face_required")
        val RULE_GEOFENCE_ENABLED = booleanPreferencesKey("rule_geofence_enabled")
        val RULE_OFFICE_LAT = stringPreferencesKey("rule_office_lat")
        val RULE_OFFICE_LNG = stringPreferencesKey("rule_office_lng")
        val RULE_OFFICE_RADIUS = stringPreferencesKey("rule_office_radius")
        val RULE_FACE_MATCH_THRESHOLD = stringPreferencesKey("rule_face_match_threshold")
    }

    val attendanceRule: Flow<com.swayog.employee.data.model.AttendanceRule> = context.dataStore.data.map { preferences ->
        com.swayog.employee.data.model.AttendanceRule(
            shiftStart = preferences[PreferencesKeys.RULE_SHIFT_START] ?: "09:15",
            faceRequired = preferences[PreferencesKeys.RULE_FACE_REQUIRED] ?: true,
            geofenceEnabled = preferences[PreferencesKeys.RULE_GEOFENCE_ENABLED] ?: false,
            officeLat = preferences[PreferencesKeys.RULE_OFFICE_LAT]?.toDoubleOrNull() ?: 18.5204,
            officeLng = preferences[PreferencesKeys.RULE_OFFICE_LNG]?.toDoubleOrNull() ?: 73.8567,
            officeRadius = preferences[PreferencesKeys.RULE_OFFICE_RADIUS]?.toDoubleOrNull() ?: 150.0,
            faceMatchThreshold = preferences[PreferencesKeys.RULE_FACE_MATCH_THRESHOLD]?.toFloatOrNull() ?: 0.55f
        )
    }
    
    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.AUTH_TOKEN]
    }
    
    val refreshToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.REFRESH_TOKEN]
    }
    
    val userId: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.USER_ID]
    }
    
    val userEmail: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.USER_EMAIL]
    }
    
    val userName: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.USER_NAME]
    }
    
    val userRole: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.USER_ROLE]
    }
    
    val jobRole: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.JOB_ROLE]
    }
    
    val profilePhotoUrl: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.PROFILE_PHOTO_URL]
    }
    
    val isLoggedIn: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.IS_LOGGED_IN] ?: false
    }
    
    val biometricEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.BIOMETRIC_ENABLED] ?: false
    }
    
    val darkMode: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.DARK_MODE] ?: false
    }

    val notificationsEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.NOTIFICATIONS_ENABLED] ?: true
    }

    val compactViewEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.COMPACT_VIEW_ENABLED] ?: false
    }

    val animationsEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.ANIMATIONS_ENABLED] ?: true
    }

    val profileVisibilityEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.PROFILE_VISIBILITY_ENABLED] ?: true
    }

    val showStatusEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.SHOW_STATUS_ENABLED] ?: true
    }

    val activitySharingEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.ACTIVITY_SHARING_ENABLED] ?: true
    }
    
    val language: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.LANGUAGE] ?: "en"
    }

    val serverUrl: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.SERVER_URL]
    }

    fun getServerUrlBlocking(): String? {
        return runBlocking { serverUrl.first() }
    }
    
    suspend fun saveAuthToken(token: String) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.AUTH_TOKEN] = token
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun saveRefreshToken(token: String) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.REFRESH_TOKEN] = token
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun saveUserInfo(
        userId: String,
        email: String,
        name: String,
        role: String,
        jobRole: String?,
        profilePhotoUrl: String? = null
    ) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.USER_ID] = userId
                preferences[PreferencesKeys.USER_EMAIL] = email
                preferences[PreferencesKeys.USER_NAME] = name
                preferences[PreferencesKeys.USER_ROLE] = role
                if (jobRole != null) {
                    preferences[PreferencesKeys.JOB_ROLE] = jobRole
                }
                if (!profilePhotoUrl.isNullOrEmpty()) {
                    preferences[PreferencesKeys.PROFILE_PHOTO_URL] = profilePhotoUrl
                } else {
                    preferences.remove(PreferencesKeys.PROFILE_PHOTO_URL)
                }
                preferences[PreferencesKeys.IS_LOGGED_IN] = true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun clearAuthData() {
        context.dataStore.edit { preferences ->
            preferences.remove(PreferencesKeys.AUTH_TOKEN)
            preferences.remove(PreferencesKeys.REFRESH_TOKEN)
            preferences.remove(PreferencesKeys.USER_ID)
            preferences.remove(PreferencesKeys.USER_EMAIL)
            preferences.remove(PreferencesKeys.USER_NAME)
            preferences.remove(PreferencesKeys.USER_ROLE)
            preferences.remove(PreferencesKeys.JOB_ROLE)
            preferences.remove(PreferencesKeys.IS_LOGGED_IN)
            preferences.remove(PreferencesKeys.PROFILE_PHOTO_URL)
            
            // Clear face enrollment data on logout
            preferences.remove(PreferencesKeys.FACE_ENROLLED)
            preferences.remove(PreferencesKeys.FACE_DESCRIPTOR_1)
            preferences.remove(PreferencesKeys.FACE_DESCRIPTOR_2)
            preferences.remove(PreferencesKeys.FACE_DESCRIPTOR_3)
        }
    }
    
    // Face Enrollment Storage
    val isFaceEnrolled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.FACE_ENROLLED] ?: false
    }

    val faceDescriptors: Flow<List<List<Float>>> = context.dataStore.data.map { preferences ->
        val d1 = preferences[PreferencesKeys.FACE_DESCRIPTOR_1]?.split(",")?.mapNotNull { it.toFloatOrNull() } ?: emptyList()
        val d2 = preferences[PreferencesKeys.FACE_DESCRIPTOR_2]?.split(",")?.mapNotNull { it.toFloatOrNull() } ?: emptyList()
        val d3 = preferences[PreferencesKeys.FACE_DESCRIPTOR_3]?.split(",")?.mapNotNull { it.toFloatOrNull() } ?: emptyList()
        listOf(d1, d2, d3).filter { it.isNotEmpty() }
    }

    suspend fun saveFaceEnrollment(descriptor1: List<Float>, descriptor2: List<Float>, descriptor3: List<Float>) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.FACE_ENROLLED] = true
            preferences[PreferencesKeys.FACE_DESCRIPTOR_1] = descriptor1.joinToString(",")
            preferences[PreferencesKeys.FACE_DESCRIPTOR_2] = descriptor2.joinToString(",")
            preferences[PreferencesKeys.FACE_DESCRIPTOR_3] = descriptor3.joinToString(",")
        }
    }

    suspend fun clearFaceEnrollment() {
        context.dataStore.edit { preferences ->
            preferences.remove(PreferencesKeys.FACE_ENROLLED)
            preferences.remove(PreferencesKeys.FACE_DESCRIPTOR_1)
            preferences.remove(PreferencesKeys.FACE_DESCRIPTOR_2)
            preferences.remove(PreferencesKeys.FACE_DESCRIPTOR_3)
        }
    }

    suspend fun saveProfilePhoto(url: String) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.PROFILE_PHOTO_URL] = url
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun setLoggedIn(isLoggedIn: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.IS_LOGGED_IN] = isLoggedIn
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun setBiometricEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.BIOMETRIC_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun setDarkMode(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.DARK_MODE] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.NOTIFICATIONS_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun setCompactViewEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.COMPACT_VIEW_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun setAnimationsEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.ANIMATIONS_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun setProfileVisibilityEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.PROFILE_VISIBILITY_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun setShowStatusEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.SHOW_STATUS_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun setActivitySharingEnabled(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.ACTIVITY_SHARING_ENABLED] = enabled
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun setLanguage(language: String) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.LANGUAGE] = language
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun saveServerUrl(url: String) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.SERVER_URL] = url
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun saveAttendanceRule(rule: com.swayog.employee.data.model.AttendanceRule) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.RULE_SHIFT_START] = rule.shiftStart
                preferences[PreferencesKeys.RULE_FACE_REQUIRED] = rule.faceRequired
                preferences[PreferencesKeys.RULE_GEOFENCE_ENABLED] = rule.geofenceEnabled
                preferences[PreferencesKeys.RULE_OFFICE_LAT] = rule.officeLat.toString()
                preferences[PreferencesKeys.RULE_OFFICE_LNG] = rule.officeLng.toString()
                preferences[PreferencesKeys.RULE_OFFICE_RADIUS] = rule.officeRadius.toString()
                preferences[PreferencesKeys.RULE_FACE_MATCH_THRESHOLD] = rule.faceMatchThreshold.toString()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateSettingsFromServer(settings: com.swayog.employee.data.model.UserSettingsDto) {
        try {
            context.dataStore.edit { preferences ->
                settings.darkMode?.let { preferences[PreferencesKeys.DARK_MODE] = it }
                settings.biometricEnabled?.let { preferences[PreferencesKeys.BIOMETRIC_ENABLED] = it }
                settings.notificationsEnabled?.let { preferences[PreferencesKeys.NOTIFICATIONS_ENABLED] = it }
                settings.compactViewEnabled?.let { preferences[PreferencesKeys.COMPACT_VIEW_ENABLED] = it }
                settings.animationsEnabled?.let { preferences[PreferencesKeys.ANIMATIONS_ENABLED] = it }
                settings.profileVisibilityEnabled?.let { preferences[PreferencesKeys.PROFILE_VISIBILITY_ENABLED] = it }
                settings.showStatusEnabled?.let { preferences[PreferencesKeys.SHOW_STATUS_ENABLED] = it }
                settings.activitySharingEnabled?.let { preferences[PreferencesKeys.ACTIVITY_SHARING_ENABLED] = it }
                settings.language?.let { preferences[PreferencesKeys.LANGUAGE] = it }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun clearAll() {
        try {
            context.dataStore.edit { preferences ->
                preferences.clear()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

