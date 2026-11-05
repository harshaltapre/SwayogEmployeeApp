package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

// ── Multi-alarm models ────────────────────────────────────────────────────────
// repeatDays uses 0=Sunday .. 6=Saturday (matches AttendanceAlarmManager convention).

data class EmployeeAlarm(
    val id: String = "",
    val time: String = "09:30",          // HH:mm, 24-hour
    val label: String = "Alarm",
    val repeatDays: List<Int> = listOf(1, 2, 3, 4, 5, 6),
    val enabled: Boolean = true,
    // DEVICE = content:// URI picked from device ringtones
    // BUILTIN = res/raw resource name
    // COMPANY = remote company ringtone (id or URL stored in soundUri)
    val soundType: String = SoundType.BUILTIN,
    val soundUri: String? = null,
    val soundName: String? = null,
    val vibrationEnabled: Boolean = true,
    val snoozeEnabled: Boolean = true,
    val snoozeMinutes: Int = 5,
    val snoozeCount: Int = 3,
    // Stable PendingIntent request code assigned by AttendanceAlarmManager.
    // Not serialized to the backend; kept in local storage only via Gson anyway.
    val requestCode: Int = 0
) {
    object SoundType {
        const val DEVICE = "DEVICE"
        const val BUILTIN = "BUILTIN"
        const val COMPANY = "COMPANY"
    }
}

data class CompanyRingtone(
    val id: String = "",
    val name: String = "",
    val url: String? = null,       // fresh presigned URL from API
    val objectKey: String? = null,
    val mimeType: String? = null
)

data class CompanyAlarmPolicy(
    val reportingTime: String = "10:30",
    val timezone: String = "Asia/Kolkata",
    val workingDays: List<Int> = listOf(1, 2, 3, 4, 5, 6),
    val personalDefaultTime: String = "09:30",
    val prepReminderTime: String = "10:00",
    val prepReminderEnabled: Boolean = true,
    val finalReminderTime: String = "10:15",
    val finalReminderEnabled: Boolean = true,
    val policyNote: String? = null,
    val companySoundName: String? = null,
    val companySoundUrl: String? = null
)

// ── API payloads ──────────────────────────────────────────────────────────────

data class SaveAlarmSettingsRequest(
    val personalAlarmTime: String = "09:30",
    val reminder1Time: String? = "10:00",
    val reminder2Time: String? = "10:15",
    val repeatDays: List<Int> = listOf(1, 2, 3, 4, 5, 6),
    val soundUri: String? = null,
    val vibrationEnabled: Boolean = true,
    val snoozeEnabled: Boolean = true,
    val enabled: Boolean = true,
    val alarms: List<EmployeeAlarm> = emptyList()
)

data class CompanyAlarmPolicyResponse(
    val policy: CompanyAlarmPolicy,
    val ringtones: List<CompanyRingtone> = emptyList()
)
