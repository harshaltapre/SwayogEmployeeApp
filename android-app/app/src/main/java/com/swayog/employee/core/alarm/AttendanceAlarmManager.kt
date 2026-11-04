package com.swayog.employee.core.alarm

import android.app.AlarmManager
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
        const val EXTRA_ALARM_TYPE = "EXTRA_ALARM_TYPE"
        const val EXTRA_ALARM_LABEL = "EXTRA_ALARM_LABEL"

        const val REQ_PERSONAL = 3001
        const val REQ_REMINDER_1 = 3002
        const val REQ_REMINDER_2 = 3003

        const val KEY_ENABLED = "alarm_enabled"
        const val KEY_PERSONAL_TIME = "personal_alarm_time"
        const val KEY_REMINDER_1_TIME = "reminder_1_time"
        const val KEY_REMINDER_2_TIME = "reminder_2_time"
        const val KEY_REPEAT_DAYS = "repeat_days"
        const val KEY_VIBRATION = "vibration_enabled"
        const val KEY_SNOOZE = "snooze_enabled"
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
            putString(KEY_REMINDER_1_TIME, setting.reminder1Time ?: "10:00")
            putString(KEY_REMINDER_2_TIME, setting.reminder2Time ?: "10:15")
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
        val enabled = prefs.getBoolean(KEY_ENABLED, true)
        if (!enabled) {
            cancelAllAlarms()
            return true
        }

        val personalTime = prefs.getString(KEY_PERSONAL_TIME, "09:30") ?: "09:30"
        val reminder1 = prefs.getString(KEY_REMINDER_1_TIME, "10:00")
        val reminder2 = prefs.getString(KEY_REMINDER_2_TIME, "10:15")
        val repeatDaysStr = prefs.getString(KEY_REPEAT_DAYS, "1,2,3,4,5,6") ?: "1,2,3,4,5,6"
        val repeatDays = repeatDaysStr.split(",").mapNotNull { it.toIntOrNull() }
        val vibration = prefs.getBoolean(KEY_VIBRATION, true)
        val snooze = prefs.getBoolean(KEY_SNOOZE, true)

        val setting = EmployeeAlarmSetting(
            personalAlarmTime = personalTime,
            reminder1Time = reminder1,
            reminder2Time = reminder2,
            repeatDays = repeatDays,
            vibrationEnabled = vibration,
            snoozeEnabled = snooze,
            enabled = true
        )

        return scheduleAllAlarms(setting)
    }

    private fun scheduleAllAlarms(setting: EmployeeAlarmSetting): Boolean {
        cancelAllAlarms()

        // 1. Personal Alarm
        scheduleSingleAlarm(
            timeStr = setting.personalAlarmTime,
            repeatDays = setting.repeatDays,
            alarmType = "PERSONAL",
            label = "Morning Attendance Alarm",
            requestCode = REQ_PERSONAL
        )

        // 2. Reminder 1 (Preparation)
        if (!setting.reminder1Time.isNullOrBlank()) {
            scheduleSingleAlarm(
                timeStr = setting.reminder1Time,
                repeatDays = setting.repeatDays,
                alarmType = "REMINDER_1",
                label = "Reporting Prep Reminder",
                requestCode = REQ_REMINDER_1
            )
        }

        // 3. Reminder 2 (Final Call)
        if (!setting.reminder2Time.isNullOrBlank()) {
            scheduleSingleAlarm(
                timeStr = setting.reminder2Time,
                repeatDays = setting.repeatDays,
                alarmType = "REMINDER_2",
                label = "Final Reporting Call (10:30 AM Cutoff)",
                requestCode = REQ_REMINDER_2
            )
        }

        return true
    }

    private fun scheduleSingleAlarm(
        timeStr: String,
        repeatDays: List<Int>,
        alarmType: String,
        label: String,
        requestCode: Int
    ) {
        val parts = timeStr.split(":").mapNotNull { it.toIntOrNull() }
        if (parts.size != 2) return
        val hour = parts[0]
        val minute = parts[1]

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
            android.util.Log.d("AttendanceAlarm", "Scheduled $alarmType for timestamp $triggerTimeMs")
        } catch (e: SecurityException) {
            android.util.Log.e("AttendanceAlarm", "SecurityException scheduling exact alarm: ${e.message}")
        }
    }

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

    fun getLocalSettings(): EmployeeAlarmSetting {
        val enabled = prefs.getBoolean(KEY_ENABLED, true)
        val personalTime = prefs.getString(KEY_PERSONAL_TIME, "09:30") ?: "09:30"
        val reminder1 = prefs.getString(KEY_REMINDER_1_TIME, "10:00")
        val reminder2 = prefs.getString(KEY_REMINDER_2_TIME, "10:15")
        val repeatDaysStr = prefs.getString(KEY_REPEAT_DAYS, "1,2,3,4,5,6") ?: "1,2,3,4,5,6"
        val repeatDays = repeatDaysStr.split(",").mapNotNull { it.toIntOrNull() }
        val vibration = prefs.getBoolean(KEY_VIBRATION, true)
        val snooze = prefs.getBoolean(KEY_SNOOZE, true)

        return EmployeeAlarmSetting(
            personalAlarmTime = personalTime,
            reminder1Time = reminder1,
            reminder2Time = reminder2,
            repeatDays = repeatDays,
            vibrationEnabled = vibration,
            snoozeEnabled = snooze,
            enabled = enabled
        )
    }
}

