package com.swayog.employee.data.model

import androidx.annotation.Keep
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.annotations.JsonAdapter
import com.google.gson.annotations.SerializedName
import java.lang.reflect.Type

/**
 * Server manifest containing update metadata for the Swayog Employee App.
 * Conforms to production schema: appId, platform, versionName, versionCode,
 * releaseDate, mandatory, minimumVersionCode, apkUrl, sha256, and releaseNotes.
 */
@Keep
data class AppUpdateManifest(
    @SerializedName("appId")
    val appId: String? = "com.swayog.employee",

    @SerializedName("platform")
    val platform: String? = "android",

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

    @SerializedName("releaseTag")
    val releaseTag: String? = null,

    @SerializedName("releaseTitle", alternate = ["title"])
    val releaseTitle: String? = null,

    @SerializedName("releaseNotes")
    @JsonAdapter(ReleaseNotesDeserializer::class)
    val releaseNotes: List<String> = emptyList(),

    @SerializedName("apkUrl")
    val apkUrl: String,

    @SerializedName("sha256")
    val sha256: String,

    @SerializedName("certificateSha256", alternate = ["certificate_sha256"])
    val certificateSha256: String? = null,

    @SerializedName("fileSize")
    val fileSize: Long? = null
) {
    val title: String?
        get() = releaseTitle

    val releaseSummary: String?
        get() = releaseTitle
}

@Keep
class ReleaseNotesDeserializer : JsonDeserializer<List<String>> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): List<String> {
        if (json == null || json.isJsonNull) {
            return emptyList()
        }

        if (json.isJsonArray) {
            val list = mutableListOf<String>()
            json.asJsonArray.forEach { elem ->
                if (elem.isJsonPrimitive) list.add(elem.asString)
            }
            return list
        }

        if (json.isJsonObject) {
            val obj = json.asJsonObject
            val list = mutableListOf<String>()
            val items = obj.get("items")
            if (items != null && items.isJsonArray) {
                items.asJsonArray.forEach { elem ->
                    if (elem.isJsonPrimitive) list.add(elem.asString)
                }
            }
            val summary = obj.get("summary")?.takeIf { it.isJsonPrimitive }?.asString
            if (!summary.isNullOrBlank() && !list.contains(summary)) {
                list.add(0, summary)
            }
            return list
        }

        if (json.isJsonPrimitive) {
            return listOf(json.asString)
        }

        return emptyList()
    }
}
