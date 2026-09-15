package com.swayog.employee.data.model

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

    @SerializedName("title")
    val title: String? = null,

    @SerializedName("releaseNotes")
    @JsonAdapter(ReleaseNotesDeserializer::class)
    val releaseNotesPayload: ReleaseNotesData = ReleaseNotesData(),

    @SerializedName("apkUrl")
    val apkUrl: String,

    @SerializedName("sha256")
    val sha256: String,

    @SerializedName("fileSize")
    val fileSize: Long? = null
) {
    /**
     * Backward-compatible access to notes as a flat list of strings.
     */
    val releaseNotes: List<String>
        get() = releaseNotesPayload.items

    val releaseSummary: String?
        get() = releaseNotesPayload.summary.takeIf { it.isNotBlank() } ?: title
}

data class ReleaseNotesData(
    val summary: String = "",
    val items: List<String> = emptyList()
)

class ReleaseNotesDeserializer : JsonDeserializer<ReleaseNotesData> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): ReleaseNotesData {
        if (json == null || json.isJsonNull) {
            return ReleaseNotesData()
        }

        if (json.isJsonArray) {
            val list = mutableListOf<String>()
            json.asJsonArray.forEach { elem ->
                if (elem.isJsonPrimitive) list.add(elem.asString)
            }
            return ReleaseNotesData(items = list)
        }

        if (json.isJsonObject) {
            val obj = json.asJsonObject
            val summary = obj.get("summary")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
            val items = mutableListOf<String>()
            val itemsElem = obj.get("items")
            if (itemsElem != null && itemsElem.isJsonArray) {
                itemsElem.asJsonArray.forEach { elem ->
                    if (elem.isJsonPrimitive) items.add(elem.asString)
                }
            }
            return ReleaseNotesData(summary = summary, items = items)
        }

        if (json.isJsonPrimitive) {
            return ReleaseNotesData(items = listOf(json.asString))
        }

        return ReleaseNotesData()
    }
}
