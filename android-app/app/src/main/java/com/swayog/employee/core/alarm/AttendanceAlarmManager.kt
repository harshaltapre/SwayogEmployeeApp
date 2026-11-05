package com.swayog.employee.core.alarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import com.swayog.employee.data.model.EmployeeAlarmSetting
import java.util.Calendar

class AttendanceAlarmManager(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        const val PREFS_NAME = "swayog_attendance_alarms"
        const val CHANNEL_ID = "attendance_alarms_channel"
        const val ACTION_ATTENDANCE_ALARM = "com.swayog.employee.ACTION_ATTENDANCE_ALARM"
        const val ACTION_SNOOZE_ALARM = "com.swayog.employee.ACTION_SNOOZE_ALARM"
        const val EXTRA_ALARM_TYPE = "EXTRA_ALARM_TYPE"
        const val EXTRA_ALARM_LABEL = "EXTRA_ALARM_LABEL"
        const val EXTRA_NOTIFICATION_ID = "EXTRA_NOTIFICATION_ID"

        const val REQ_PERSONAL = 3001
        const val REQ_REMINDER_1 = 3002
        const val REQ_REMINDER_2 = 3003
        const val REQ_SNOOZE = 3004

        const val KEY_ENABLED = "alarm_enabled"
        const val KEY_PERSONAL_TIME = "personal_alarm_time"
        const val KEY_REMINDER_1_TIME = "reminder_1_time"
        const val KEY_REMINDER_2_TIME = "reminder_2_time"
        const val KEY_REPEAT_DAYS = "repeat_days"
        const val KEY_VIBRATION = "vibration_enabled"
        const val KEY_SNOOZE = "snooze_enabled"
        const val KEY_REPORTING_TIME = "company_reporting_time"

        // A blank stored reminder means the employee switched that reminder off.
        const val REMINDER_OFF = ""
        const val DEFAULT_PERSONAL_TIME = "09:30"
        const val DEFAULT_REMINDER_1_TIME = "10:00"
        const val DEFAULT_REMINDER_2_TIME = "10:15"
        const val DEFAULT_REPORTING_TIME = "10:30"
        val DEFAULT_REPEAT_DAYS = listOf(1, 2, 3, 4, 5, 6)
        const val SNOOZE_MINUTES = 5

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
    }

    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    fun saveAndScheduleAlarms(setting: EmployeeAlarmSetting): Boolean {
        // Save to local shared preferences
        prefs.edit().apply {
            putBoolean(KEY_ENABLED, setting.enabled)
            putString(KEY_PERSONAL_TIME, setting.personalAlarmTime)
            putString(KEY_REMINDER_1_TIME, setting.reminder1Time ?: REMINDER_OFF)
            putString(KEY_REMINDER_2_TIME, setting.reminder2Time ?: REMINDER_OFF)
            putString(KEY_REPEAT_DAYS, setting.repeatDays.joinToString(","))
            putBoolean(KEY_VIBRATION, setting.vibrationEnabled)
            putBoolean(KEY_SNOOZE, setting.snoozeEnabled)
            apply()
        }

        if (!setting.enabled) {
            cancelAllAlarms()
            return true
        }

        return scheduleAllAlarms(setting)
    }

    fun rescheduleFromPreferences(): Boolean {
        val setting = getLocalSettings()
        if (!setting.enabled) {
            cancelAllAlarms()
            return true
        }
        return scheduleAllAlarms(setting)
    }

    fun scheduleAllAlarms(setting: EmployeeAlarmSetting): Boolean {
        cancelAllAlarms()

        if (setting.repeatDays.isEmpty()) return false

        val personalScheduled = scheduleSingleAlarm(
            timeStr = setting.personalAlarmTime,
            repeatDays = setting.repeatDays,
            alarmType = "PERSONAL",
            label = "Morning Attendance Alarm",
            requestCode = REQ_PERSONAL
        )

        val reminder1Scheduled = if (!setting.reminder1Time.isNullOrBlank()) {
            scheduleSingleAlarm(
                timeStr = setting.reminder1Time,
                repeatDays = setting.repeatDays,
                alarmType = "REMINDER_1",
                label = "Reporting Prep Reminder",
                requestCode = REQ_REMINDER_1
            )
        } else {
            true
        }

        val reminder2Scheduled = if (!setting.reminder2Time.isNullOrBlank()) {
            scheduleSingleAlarm(
                timeStr = setting.reminder2Time,
                repeatDays = setting.repeatDays,
                alarmType = "REMINDER_2",
                label = "Final Reporting Call (${getReportingTimeLabel()} Cutoff)",
                requestCode = REQ_REMINDER_2
            )
        } else {
            true
        }

        return personalScheduled && reminder1Scheduled && reminder2Scheduled
    }

    private fun scheduleSingleAlarm(
        timeStr: String,
        repeatDays: List<Int>,
        alarmType: String,
        label: String,
        requestCode: Int
    ): Boolean {
        val parts = timeStr.split(":").mapNotNull { it.toIntOrNull() }
        if (parts.size != 2) {
            android.util.Log.w("AttendanceAlarm", "Ignoring invalid alarm time '$timeStr'")
            return false
        }
        val hour = parts[0]
        val minute = parts[1]
        if (hour !in 0..23 || minute !in 0..59) {
            android.util.Log.w("AttendanceAlarm", "Ignoring out-of-range alarm time '$timeStr'")
            return false
        }

        val triggerTimeMs = computeNextOccurrence(hour, minute, repeatDays)

        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
            putExtra(EXTRA_ALARM_TYPE, alarmType)
            putExtra(EXTRA_ALARM_LABEL, label)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (canScheduleExactAlarms()) {
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
            } else {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMs,
                    pendingIntent
                )
            }
            android.util.Log.d("AttendanceAlarm", "Scheduled $alarmType for timestamp $triggerTimeMs")
            true
        } catch (e: SecurityException) {
            android.util.Log.e("AttendanceAlarm", "SecurityException scheduling exact alarm: ${e.message}")
            false
        }
    }

    /**
     * One-shot follow-up for the snooze action. Deliberately ignores repeat days so the
     * regular daily cycle scheduled by [rescheduleFromPreferences] is left untouched.
     */
    fun snoozeAlarm(alarmType: String, label: String, minutes: Int = SNOOZE_MINUTES): Boolean {
        val triggerTimeMs = System.currentTimeMillis() + minutes * 60_000L
        val requestCode = when (alarmType) {
            "REMINDER_1" -> REQ_REMINDER_1
            "REMINDER_2" -> REQ_REMINDER_2
            else -> REQ_PERSONAL
        }

        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
            putExtra(EXTRA_ALARM_TYPE, alarmType)
            putExtra(EXTRA_ALARM_LABEL, label)
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
            android.util.Log.d("AttendanceAlarm", "Snoozed $alarmType for $minutes minutes")
            true
        } catch (e: SecurityException) {
            android.util.Log.e("AttendanceAlarm", "SecurityException snoozing alarm: ${e.message}")
            false
        }
    }

    fun areNotificationsEnabled(): Boolean {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return notificationManager.areNotificationsEnabled()
    }

    /**
     * Caches the admin-controlled reporting time from the last successful settings sync so the
     * settings screen and reminder text show the official cutoff even while offline.
     */
    fun saveReportingTime(time: String?) {
        val normalized = normalizeTime(time) ?: return
        prefs.edit().putString(KEY_REPORTING_TIME, normalized).apply()
    }

    fun getReportingTime(): String =
        normalizeTime(prefs.getString(KEY_REPORTING_TIME, DEFAULT_REPORTING_TIME))
            ?: DEFAULT_REPORTING_TIME

    fun getReportingTimeLabel(): String = formatAmPm(getReportingTime())

    private fun computeNextOccurrence(hour: Int, minute: Int, repeatDays: List<Int>): Long {
        val now = Calendar.getInstance()
        var candidate = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        // If candidate time has already passed today, advance by at least 1 day
        if (candidate.timeInMillis <= now.timeInMillis) {
            candidate.add(Calendar.DAY_OF_YEAR, 1)
        }

        // Calendar.DAY_OF_WEEK: Sunday=1, Monday=2, Tuesday=3, ..., Saturday=7
        // Convert our repeatDays (0=Sun, 1=Mon, ..., 6=Sat) to Calendar.DAY_OF_WEEK
        val validCalendarDays = repeatDays.map { dayNum ->
            when (dayNum) {
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

        if (validCalendarDays.isNotEmpty()) {
            for (i in 0..7) {
                if (validCalendarDays.contains(candidate.get(Calendar.DAY_OF_WEEK))) {
                    break
                }
                candidate.add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        return candidate.timeInMillis
    }

    fun cancelAllAlarms() {
        val requests = listOf(REQ_PERSONAL, REQ_REMINDER_1, REQ_REMINDER_2)
        for (req in requests) {
            val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
                action = ACTION_ATTENDANCE_ALARM
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                req,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }
    }

    fun rescheduleSingleAlarm(requestCode: Int, setting: EmployeeAlarmSetting): Boolean {
        val (timeStr, alarmType, label) = when (requestCode) {
            REQ_PERSONAL -> Triple(setting.personalAlarmTime, "PERSONAL", "Morning Attendance Alarm")
            REQ_REMINDER_1 -> Triple(setting.reminder1Time ?: "10:00", "REMINDER_1", "Reporting Prep Reminder")
            REQ_REMINDER_2 -> Triple(setting.reminder2Time ?: "10:15", "REMINDER_2", "Final Reporting Call (10:30 AM Cutoff)")
            else -> return false
        }

        if (timeStr.isBlank()) return false

        val parts = timeStr.split(":").mapNotNull { it.toIntOrNull() }
        if (parts.size != 2) return false
        val hour = parts[0]
        val minute = parts[1]

        val triggerTimeMs = computeNextOccurrence(hour, minute, setting.repeatDays)

        val intent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
            action = ACTION_ATTENDANCE_ALARM
            putExtra(EXTRA_ALARM_TYPE, alarmType)
            putExtra(EXTRA_ALARM_LABEL, label)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (canScheduleExactAlarms()) {
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
            } else {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMs,
                    pendingIntent
                )
            }
            android.util.Log.d("AttendanceAlarm", "Rescheduled $alarmType for timestamp $triggerTimeMs")
            return true
        } catch (e: SecurityException) {
            android.util.Log.e("AttendanceAlarm", "SecurityException scheduling exact alarm: ${e.message}")
            return false
        }
    }

    fun getLocalSettings(): EmployeeAlarmSetting {
        // Defaults only apply on first launch: once the employee saves, their stored
        // choices (including a deliberately closed reminder or a 09:30 alarm) are kept.
        val enabled = prefs.getBoolean(KEY_ENABLED, true)
        val personalTime = prefs.getString(KEY_PERSONAL_TIME, DEFAULT_PERSONAL_TIME)
            ?: DEFAULT_PERSONAL_TIME
        val reminder1 = readReminder(KEY_REMINDER_1_TIME, DEFAULT_REMINDER_1_TIME)
        val reminder2 = readReminder(KEY_REMINDER_2_TIME, DEFAULT_REMINDER_2_TIME)
        val repeatDaysStr = prefs.getString(KEY_REPEAT_DAYS, null)
            ?.takeIf { it.isNotBlank() }
            ?: DEFAULT_REPEAT_DAYS.joinToString(",")
        val repeatDays = repeatDaysStr
            .split(",")
            .mapNotNull { it.trim().toIntOrNull() }
            .filter { it in 0..6 }
            .distinct()
            .ifEmpty { DEFAULT_REPEAT_DAYS }

        return EmployeeAlarmSetting(
            personalAlarmTime = personalTime,
            reminder1Time = reminder1,
            reminder2Time = reminder2,
            repeatDays = repeatDays,
            vibrationEnabled = prefs.getBoolean(KEY_VIBRATION, true),
            snoozeEnabled = prefs.getBoolean(KEY_SNOOZE, true),
            enabled = enabled
        )
    }

    private fun readReminder(key: String, defaultTime: String): String? {
        if (!prefs.contains(key)) return defaultTime
        return prefs.getString(key, REMINDER_OFF)?.takeIf { it.isNotBlank() }
    }
}

