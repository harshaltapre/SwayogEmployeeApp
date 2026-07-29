package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class UserSettingsDto(
    @SerializedName("darkMode") val darkMode: Boolean? = null,
    @SerializedName("biometricEnabled") val biometricEnabled: Boolean? = null,
    @SerializedName("notificationsEnabled") val notificationsEnabled: Boolean? = null,
    @SerializedName("compactViewEnabled") val compactViewEnabled: Boolean? = null,
    @SerializedName("animationsEnabled") val animationsEnabled: Boolean? = null,
    @SerializedName("profileVisibilityEnabled") val profileVisibilityEnabled: Boolean? = null,
    @SerializedName("showStatusEnabled") val showStatusEnabled: Boolean? = null,
    @SerializedName("activitySharingEnabled") val activitySharingEnabled: Boolean? = null,
    @SerializedName("language") val language: String? = null
)
