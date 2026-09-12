package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

/**
 * Server manifest containing update metadata for the Swayog Employee App.
 */
data class AppUpdateManifest(
    @SerializedName("versionCode")
    val versionCode: Long,

    @SerializedName("versionName")
    val versionName: String,

    @SerializedName("minimumVersionCode")
    val minimumVersionCode: Long? = null,

    @SerializedName("mandatory")
    val mandatory: Boolean = false,

    @SerializedName("releaseDate")
    val releaseDate: String? = null,

    @SerializedName("title")
    val title: String? = null,

    @SerializedName("releaseNotes")
    val releaseNotes: List<String> = emptyList(),

    @SerializedName("apkUrl")
    val apkUrl: String,

    @SerializedName("sha256")
    val sha256: String,

    @SerializedName("fileSize")
    val fileSize: Long? = null
)
