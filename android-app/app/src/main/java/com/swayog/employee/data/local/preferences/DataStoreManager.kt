package com.swayog.employee.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
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
        val LANGUAGE = stringPreferencesKey("language")
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
    
    val isLoggedIn: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.IS_LOGGED_IN] ?: false
    }
    
    val biometricEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.BIOMETRIC_ENABLED] ?: false
    }
    
    val darkMode: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.DARK_MODE] ?: false
    }
    
    val language: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.LANGUAGE] ?: "en"
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
        jobRole: String?
    ) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.USER_ID] = userId
                preferences[PreferencesKeys.USER_EMAIL] = email
                preferences[PreferencesKeys.USER_NAME] = name
                preferences[PreferencesKeys.USER_ROLE] = role
                jobRole?.let { preferences[PreferencesKeys.JOB_ROLE] = it }
                preferences[PreferencesKeys.IS_LOGGED_IN] = true
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
    
    suspend fun setLanguage(language: String) {
        try {
            context.dataStore.edit { preferences ->
                preferences[PreferencesKeys.LANGUAGE] = language
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
