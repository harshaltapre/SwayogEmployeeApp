package com.swayog.employee.core.alarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.swayog.employee.data.model.CompanyAlarmPolicy
import com.swayog.employee.data.model.EmployeeAlarm
import java.util.Calendar
import java.util.UUID

/**
 * Multi-alarm engine. Personal alarms are stored as a JSON list; each entry owns a
 * stable PendingIntent request code so scheduling one alarm never touches another.
 * Company reminders (prep/final) are scheduled from the cached company policy and
 * are not employee-editable.
 */
class AttendanceAlarmManager(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        const val PREFS_NAME = "swayog_attendance_alarms"
        const val CHANNEL_ID = "attendance_alarms_channel"
        const val RINGING_CHANNEL_ID = "attendance_alarm_ringing_channel"
        const val ACTION_ATTENDANCE_ALARM = "com.swayog.employee.ACTION_ATTENDANCE_ALARM"
        const val ACTION_SNOOZE_ALARM = "com.swayog.employee.ACTION_SNOOZE_ALARM"
        const val ACTION_DISMISS_ALARM = "com.swayog.employee.ACTION_DISMISS_ALARM"
        const val EXTRA_ALARM_JSON = "EXTRA_ALARM_JSON"
        const val EXTRA_ALARM_ID = "EXTRA_ALARM_ID"
        const val EXTRA_COMPANY_TYPE = "EXTRA_COMPANY_TYPE" // "PREP" | "FINAL"
        const val EXTRA_SNOOZE_REMAINING = "EXTRA_SNOOZE_REMAINING"
        const val EXTRA_NOTIFICATION_ID = "EXTRA_NOTIFICATION_ID"

        const val REQ_COMPANY_PREP = 4001
        const val REQ_COMPANY_FINAL = 4002
        const val SNOOZE_REQ_BASE = 50000
        const val MAX_ALARMS = 20

        private const val KEY_ALARMS_JSON = "alarm_entries_v2"
        private const val KEY_POLICY_JSON = "company_alarm_policy"
        private const val KEY_REQ_COUNTER = "alarm_req_counter"
        private const val KEY_MIGRATED = "alarms_migrated_v2"

        // Legacy keys (pre multi-alarm model) — read once for migration.
        private const val LEGACY_KEY_ENABLED = "alarm_enabled"
        private const val LEGACY_KEY_PERSONAL_TIME = "personal_alarm_time"
        private const val LEGACY_KEY_REPEAT_DAYS = "repeat_days"
        private const val LEGACY_KEY_VIBRATION = "vibration_enabled"
        private const val LEGACY_KEY_SNOOZE = "snooze_enabled"

        const val DEFAULT_REPORTING_TIME = "10:30"
        const val DEFAULT_TIMEZONE = "Asia/Kolkata"
        val DEFAULT_REPEAT_DAYS = listOf(1, 2, 3, 4, 5, 6)
        const val DEFAULT_SNOOZE_MINUTES = 5
        const val DEFAULT_SNOOZE_COUNT = 3
        const val MAX_SNOOZE_MINUTES = 30

        /** Returns a zero-padded 24-hour HH:MM string, or null when the value is not a valid time. */
        fun normalizeTime(raw: String?): String? {
            val parts = raw?.trim()?.split(":")?.mapNotNull { it.toIntOrNull() } ?: return null
            if (parts.size != 2) return null
            if (parts[0] !in 0..23 || parts[1] !in 0..59) return null
            return String.format("%02d:%02d", parts[0], parts[1])
        }

        fun formatAmPm(time: String): String {
            val parts = time.split(":").mapNotNull { it.toIntOrNull() }
            if (parts.size != 2) return time
            val hour12 = when {
                parts[0] == 0 -> 12
                parts[0] > 12 -> parts[0] - 12
                else -> parts[0]
            }
            val suffix = if (parts[0] < 12) "AM" else "PM"
            return String.format("%d:%02d %s", hour12, parts[1], suffix)
        }

        fun defaultPolicy(): CompanyAlarmPolicy = CompanyAlarmPolicy()
    }

    // ── Alarm storage ──────────────────────────────────────────────────────────

    fun getAlarms(): List<EmployeeAlarm> {
        migrateLegacyIfNeeded()
        val json = prefs.getString(KEY_ALARMS_JSON, null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<EmployeeAlarm>>() {}.type
            (gson.fromJson<List<EmployeeAlarm>>(json, type) ?: emptyList())
                .sortedBy { it.time }
        } catch (e: Exception) {
            Log.e("AttendanceAlarm", "Failed to parse alarms JSON", e)
            emptyList()
        }
    }

    private fun persistAlarms(alarms: List<EmployeeAlarm>) {
        prefs.edit().putString(KEY_ALARMS_JSON, gson.toJson(alarms)).apply()
    }

    /** Converts the legacy single-setting model into the new list on first run. */
    private fun migrateLegacyIfNeeded() {
        if (prefs.getBoolean(KEY_MIGRATED, false)) return
        prefs.edit().putBoolean(KEY_MIGRATED, true).apply()
        if (prefs.contains(KEY_ALARMS_JSON)) return

        val legacyEnabled = prefs.getBoolean(LEGACY_KEY_ENABLED, true)
        val legacyTime = normalizeTime(prefs.getString(LEGACY_KEY_PERSONAL_TIME, "09:30")) ?: "09:30"
        val legacyDays = prefs.getString(LEGACY_KEY_REPEAT_DAYS, null)
            ?.split(",")
            ?.mapNotNull { it.trim().toIntOrNull() }
            ?.filter { it in 0..6 }
            ?.ifEmpty { DEFAULT_REPEAT_DAYS }
            ?: DEFAULT_REPEAT_DAYS

        val migrated = mutableListOf(
            EmployeeAlarm(
                id = UUID.randomUUID().toString(),
                time = legacyTime,
                label = "Personal Morning Alarm",
                repeatDays = legacyDays,
                enabled = legacyEnabled,
                vibrationEnabled = prefs.getBoolean(LEGACY_KEY_VIBRATION, true),
                snoozeEnabled = prefs.getBoolean(LEGACY_KEY_SNOOZE, true),
                requestCode = nextRequestCode()
            )
        )
        if (!prefs.contains(LEGACY_KEY_PERSONAL_TIME)) {
            migrated.add(
                EmployeeAlarm(
                    id = UUID.randomUUID().toString(),
                    time = "10:00",
                    label = "Attendance Preparation",
                    repeatDays = DEFAULT_REPEAT_DAYS,
                    requestCode = nextRequestCode()
                )
            )
        }
        persistAlarms(migrated)
    }

    private fun nextRequestCode(): Int {
        val next = prefs.getInt(KEY_REQ_COUNTER, 1000) + 1
        prefs.edit().putInt(KEY_REQ_COUNTER, next).apply()
        return next
    }

    fun upsertAlarm(alarm: EmployeeAlarm): Boolean {
        val alarms = getAlarms().toMutableList()
        val normalized = alarm.copy(
            time = normalizeTime(alarm.time) ?: return false,
            repeatDays = alarm.repeatDays.filter { it in 0..6 }.distinct(),
            snoozeMinutes = alarm.snoozeMinutes.coerceIn(1, MAX_SNOOZE_MINUTES),
            snoozeCount = alarm.snoozeCount.coerceIn(0, 10),
            requestCode = if (alarm.requestCode > 0) alarm.requestCode else nextRequestCode()
        )
        val idx = alarms.indexOfFirst { it.id == normalized.id }
        if (idx >= 0) alarms[idx] = normalized else alarms.add(normalized)
        if (alarms.size > MAX_ALARMS) return false
        persistAlarms(alarms)
        return if (normalized.enabled) scheduleAlarm(normalized) else cancelAlarm(normalized)
    }

    fun deleteAlarm(id: String): Boolean {
        val alarms = getAlarms().toMutableList()
        val idx = alarms.indexOfFirst { it.id == id }
        if (idx < 0) return false
        val removed = alarms.removeAt(idx)
        persistAlarms(alarms)
        cancelAlarm(removed)
        return true
    }

    fun setAlarmEnabled(id: String, enabled: Boolean): Boolean {
        val alarms = getAlarms().toMutableList()
        val idx = alarms.indexOfFirst { it.id == id }
        if (idx < 0) return false
        val updated = alarms[idx].copy(enabled = enabled)
        alarms[idx] = updated
        persistAlarms(alarms)
        return if (enabled) scheduleAlarm(updated) else cancelAlarm(updated)
    }

    // ── Company Policy ────────────────────────────────────────────────────────

    fun getPolicy(): CompanyAlarmPolicy {
        val json = prefs.getString(KEY_POLICY_JSON, null) ?: return CompanyAlarmPolicy()
        return try {
            gson.fromJson(json, CompanyAlarmPolicy::class.java) ?: CompanyAlarmPolicy()
        } catch (e: Exception) {
            Log.e("AttendanceAlarm", "Failed to parse policy JSON", e)
            CompanyAlarmPolicy()
        }
    }

    fun savePolicy(policy: CompanyAlarmPolicy) {
        prefs.edit().putString(KEY_POLICY_JSON, gson.toJson(policy)).apply()
    }

    // ── Scheduling & AlarmManager Interop ──────────────────────────────────────

    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    fun areNotificationsEnabled(): Boolean {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return nm.areNotificationsEnabled()
    }

    fun scheduleAlarm(alarm: EmployeeAlarm): Boolean {
        val parts = alarm.time.split(":").mapNotNull { it.toIntOrNull() }
        if (parts.size != 2) return false
        val triggerTime = computeNextOccurrence(parts[0], parts[1], alarm.repeatDays)
        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
            putExtra(EXTRA_ALARM_JSON, gson.toJson(alarm))
        }
        val pi = PendingIntent.getBroadcast(
            context,
            alarm.requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pi)
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pi)
                }
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pi)
            }
            return true
        } catch (e: SecurityException) {
            Log.e("AttendanceAlarm", "SecurityException scheduling alarm", e)
            return false
        }
    }

    fun snooze(alarmJson: String?, companyType: String?, minutes: Int, remaining: Int): Boolean {
        val baseRequest = when {
            alarmJson != null -> try {
                gson.fromJson(alarmJson, EmployeeAlarm::class.java).requestCode
            } catch (e: Exception) { -1 }
            companyType == "PREP" -> REQ_COMPANY_PREP
            companyType == "FINAL" -> REQ_COMPANY_FINAL
            else -> -1
        }
        if (baseRequest < 0) return false
        val requestCode = SNOOZE_REQ_BASE + baseRequest
        val triggerTimeMs = System.currentTimeMillis() + minutes * 60_000L

        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
            putExtra(EXTRA_ALARM_JSON, alarmJson)
            putExtra(EXTRA_COMPANY_TYPE, companyType)
            putExtra(EXTRA_SNOOZE_REMAINING, remaining)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMs,
                    pendingIntent
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMs,
                    pendingIntent
                )
            }
            true
        } catch (e: SecurityException) {
            Log.e("AttendanceAlarm", "SecurityException snoozing: ${e.message}")
            false
        }
    }

    fun cancelAlarm(alarm: EmployeeAlarm): Boolean {
        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
        }
        val pi = PendingIntent.getBroadcast(
            context,
            alarm.requestCode,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pi != null) {
            alarmManager.cancel(pi)
            pi.cancel()
        }
        val snoozePi = PendingIntent.getBroadcast(
            context,
            SNOOZE_REQ_BASE + alarm.requestCode,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (snoozePi != null) {
            alarmManager.cancel(snoozePi)
            snoozePi.cancel()
        }
        return true
    }

    fun rescheduleNext(alarm: EmployeeAlarm) {
        if (alarm.enabled) {
            scheduleAlarm(alarm)
        }
    }

    fun rescheduleCompanyReminder(type: String) {
        val policy = getPolicy()
        val (time, enabled, reqCode, label) = when (type) {
            "PREP" -> listOf(policy.prepReminderTime, policy.prepReminderEnabled, REQ_COMPANY_PREP, "Attendance Preparation")
            "FINAL" -> listOf(policy.finalReminderTime, policy.finalReminderEnabled, REQ_COMPANY_FINAL, "Final Reporting Reminder")
            else -> return
        }
        if (enabled != true) {
            val cancelIntent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
                action = ACTION_ATTENDANCE_ALARM
            }
            val cancelPi = PendingIntent.getBroadcast(
                context,
                reqCode as Int,
                cancelIntent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (cancelPi != null) {
                alarmManager.cancel(cancelPi)
                cancelPi.cancel()
            }
            return
        }

        val parts = (time as String).split(":").mapNotNull { it.toIntOrNull() }
        if (parts.size != 2) return
        val triggerTime = computeNextOccurrence(parts[0], parts[1], policy.workingDays)

        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
            putExtra(EXTRA_COMPANY_TYPE, type)
        }
        val pi = PendingIntent.getBroadcast(
            context,
            reqCode as Int,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pi)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pi)
            }
        } catch (e: SecurityException) {
            Log.e("AttendanceAlarm", "SecurityException scheduling company reminder", e)
        }
    }

    fun rescheduleFromPreferences(): Boolean {
        val alarms = getAlarms()
        for (a in alarms) {
            if (a.enabled) scheduleAlarm(a) else cancelAlarm(a)
        }
        rescheduleCompanyReminder("PREP")
        rescheduleCompanyReminder("FINAL")
        return true
    }

    fun cancelAllAlarms() {
        for (a in getAlarms()) {
            cancelAlarm(a)
        }
        listOf(REQ_COMPANY_PREP, REQ_COMPANY_FINAL).forEach { reqCode ->
            val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
                action = ACTION_ATTENDANCE_ALARM
            }
            val pi = PendingIntent.getBroadcast(
                context,
                reqCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pi != null) {
                alarmManager.cancel(pi)
                pi.cancel()
            }
        }
    }

    private fun computeNextOccurrence(hour: Int, minute: Int, repeatDays: List<Int>): Long {
        val now = Calendar.getInstance()
        val candidate = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        if (candidate.timeInMillis <= now.timeInMillis) {
            candidate.add(Calendar.DAY_OF_YEAR, 1)
        }
        val validDays = repeatDays.map {
            when (it) {
                0 -> Calendar.SUNDAY
                1 -> Calendar.MONDAY
                2 -> Calendar.TUESDAY
                3 -> Calendar.WEDNESDAY
                4 -> Calendar.THURSDAY
                5 -> Calendar.FRIDAY
                6 -> Calendar.SATURDAY
                else -> -1
            }
        }.filter { it != -1 }

        if (validDays.isNotEmpty()) {
            for (i in 0..7) {
                if (validDays.contains(candidate.get(Calendar.DAY_OF_WEEK))) {
                    break
                }
                candidate.add(Calendar.DAY_OF_YEAR, 1)
            }
        }
        return candidate.timeInMillis
    }
}
