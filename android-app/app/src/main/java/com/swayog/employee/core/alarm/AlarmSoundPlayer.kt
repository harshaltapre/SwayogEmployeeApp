package com.swayog.employee.core.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.util.Log
import com.swayog.employee.data.model.EmployeeAlarm
import com.swayog.employee.data.model.CompanyRingtone
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL

/**
 * Resolves an [EmployeeAlarm] sound selection to a playable [MediaPlayer].
 *
 * - DEVICE: a content:// URI chosen through RingtoneManager picker.
 * - BUILTIN: a res/raw resource name bundled with the app.
 * - COMPANY: a remote ringtone; downloaded once into cacheDir and reused.
 */
object AlarmSoundPlayer {

    private const val TAG = "AlarmSoundPlayer"
    private const val COMPANY_CACHE_DIR = "company_ringtones"

    data class SoundSpec(
        val soundType: String,
        val soundUri: String?,
        val soundName: String?
    ) {
        companion object {
            fun from(alarm: EmployeeAlarm) = SoundSpec(alarm.soundType, alarm.soundUri, alarm.soundName)
            fun builtin(resName: String, displayName: String? = null) =
                SoundSpec(EmployeeAlarm.SoundType.BUILTIN, resName, displayName)
        }
    }

    /** Display names for the bundled sounds, keyed by res/raw name. */
    val BUILTIN_SOUNDS = listOf(
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_classic", "Classic Alarm"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_beep", "Digital Beep"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_bell", "Gentle Bell"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_morning", "Morning Tone"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_cat", "Cat Meme"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_1", "Alarm Tone 1"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_2", "Alarm Tone 2"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_3", "Alarm Tone 3"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_4", "Alarm Tone 4"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_5", "Alarm Tone 5"),
        SoundSpec(EmployeeAlarm.SoundType.BUILTIN, "alarm_6", "Alarm Tone 6")
    )

    fun resolveUri(context: Context, spec: SoundSpec): Uri? {
        return when (spec.soundType) {
            EmployeeAlarm.SoundType.DEVICE -> {
                spec.soundUri?.let { runCatching { Uri.parse(it) }.getOrNull() }
            }
            EmployeeAlarm.SoundType.BUILTIN -> {
                val resName = spec.soundUri ?: return null
                val resId = context.resources.getIdentifier(resName, "raw", context.packageName)
                if (resId != 0) {
                    Uri.parse("android.resource://${context.packageName}/$resId")
                } else {
                    Log.w(TAG, "Unknown builtin sound: $resName")
                    null
                }
            }
            EmployeeAlarm.SoundType.COMPANY -> {
                // Company sounds are always played from the local cache file.
                cachedCompanyFile(context, spec)?.let { Uri.fromFile(it) }
            }
            else -> null
        }
    }

    private fun cachedCompanyFile(context: Context, spec: SoundSpec): File? {
        val key = spec.soundUri ?: return null
        val dir = File(context.cacheDir, COMPANY_CACHE_DIR)
        val safeName = key.replace(Regex("[^A-Za-z0-9._-]"), "_")
        val file = File(dir, safeName)
        return if (file.exists() && file.length() > 0) file else null
    }

    /**
     * Prepares a looping player for the alarm. For COMPANY sounds this downloads
     * the remote file first (on the IO dispatcher). Returns null when the sound
     * cannot be resolved — callers should fall back to the default alarm tone.
     */
    suspend fun prepareAlarmPlayer(context: Context, spec: SoundSpec): MediaPlayer? =
        withContext(Dispatchers.IO) {
            try {
                var uri = resolveUri(context, spec)
                if (spec.soundType == EmployeeAlarm.SoundType.COMPANY && uri == null) {
                    uri = downloadCompanySound(context, spec)
                }
                if (uri == null) {
                    // Fallback: system default alarm tone
                    uri = android.media.RingtoneManager.getDefaultUri(
                        android.media.RingtoneManager.TYPE_ALARM
                    ) ?: android.media.RingtoneManager.getDefaultUri(
                        android.media.RingtoneManager.TYPE_RINGTONE
                    )
                }
                uri?.let { buildPlayer(context, it, looping = true, alarmUsage = true) }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to prepare alarm sound", e)
                null
            }
        }

    /** Short one-shot preview used on the edit screen. Caller must release(). */
    suspend fun preparePreviewPlayer(context: Context, spec: SoundSpec): MediaPlayer? =
        withContext(Dispatchers.IO) {
            try {
                var uri = resolveUri(context, spec)
                if (spec.soundType == EmployeeAlarm.SoundType.COMPANY && uri == null) {
                    uri = downloadCompanySound(context, spec)
                }
                uri?.let { buildPlayer(context, it, looping = false, alarmUsage = false) }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to prepare preview", e)
                null
            }
        }

    private fun buildPlayer(
        context: Context,
        uri: Uri,
        looping: Boolean,
        alarmUsage: Boolean
    ): MediaPlayer {
        return MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(
                        if (alarmUsage) AudioAttributes.USAGE_ALARM
                        else AudioAttributes.USAGE_NOTIFICATION_RINGTONE
                    )
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            setDataSource(context, uri)
            isLooping = looping
            setOnErrorListener { _, what, extra ->
                Log.w(TAG, "MediaPlayer error what=$what extra=$extra")
                true
            }
            prepare()
        }
    }

    /** Downloads a company ringtone into the cache; returns a file:// Uri. */
    private fun downloadCompanySound(context: Context, spec: SoundSpec): Uri? {
        val urlString = spec.soundUri ?: return null
        if (!urlString.startsWith("http")) return null
        return try {
            val dir = File(context.cacheDir, COMPANY_CACHE_DIR).apply { mkdirs() }
            val safeName = urlString.substringAfterLast('/').substringBefore('?')
                .ifBlank { "ringtone_${System.currentTimeMillis()}" }
                .replace(Regex("[^A-Za-z0-9._-]"), "_")
            val file = File(dir, safeName)
            if (!file.exists() || file.length() == 0L) {
                URL(urlString).openStream().use { input ->
                    file.outputStream().use { output -> input.copyTo(output) }
                }
            }
            if (file.exists() && file.length() > 0) Uri.fromFile(file) else null
        } catch (e: Exception) {
            Log.e(TAG, "Company sound download failed: $urlString", e)
            null
        }
    }

    /** Called by the edit screen so company ringtones picked there resolve. */
    fun companySpec(ringtone: CompanyRingtone): SoundSpec =
        SoundSpec(EmployeeAlarm.SoundType.COMPANY, ringtone.url ?: ringtone.objectKey, ringtone.name)
}
