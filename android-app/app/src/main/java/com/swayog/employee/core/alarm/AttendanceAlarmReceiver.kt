package com.swayog.employee.core.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.gson.Gson
import com.swayog.employee.data.model.EmployeeAlarm
import com.swayog.employee.presentation.MainActivity

class AttendanceAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        android.util.Log.d("AttendanceAlarm", "Broadcast received: $action")

        val alarmManager = AttendanceAlarmManager(context)

        when (action) {
            AttendanceAlarmManager.ACTION_ATTENDANCE_ALARM -> {
                val alarmJson = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_JSON)
                val isSnooze = intent.hasExtra(AttendanceAlarmManager.EXTRA_SNOOZE_REMAINING)
                val snoozeRemainingExtra = intent.getIntExtra(
                    AttendanceAlarmManager.EXTRA_SNOOZE_REMAINING,
                    AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT
                )

                // Personal alarms only. Company reminders are delivered by
                // CompanyReminderWorker as ordinary notifications.
                if (alarmJson != null) {
                    handlePersonalAlarm(context, alarmManager, alarmJson, isSnooze, snoozeRemainingExtra)
                }
            }
            AttendanceAlarmManager.ACTION_SNOOZE_ALARM,
            AttendanceAlarmManager.ACTION_DISMISS_ALARM -> {
                // Legacy actions kept for compatibility; ringing is owned by the service.
            }
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                android.util.Log.i("AttendanceAlarm", "Device event: rescheduling attendance alarms")
                alarmManager.rescheduleFromPreferences()
            }
        }
    }

    private fun handlePersonalAlarm(
        context: Context,
        alarmManager: AttendanceAlarmManager,
        alarmJson: String,
        isSnooze: Boolean,
        snoozeRemainingExtra: Int
    ) {
        val alarm = try {
            Gson().fromJson(alarmJson, EmployeeAlarm::class.java)
        } catch (e: Exception) {
            android.util.Log.e("AttendanceAlarm", "Bad alarm payload", e)
            return
        }

        // Re-arm the repeating alarm for its next occurrence (skip for snoozes —
        // the repeat was already scheduled when the original fired).
        if (!isSnooze) {
            val stored = alarmManager.getAlarms().firstOrNull { it.id == alarm.id }
            if (stored != null && stored.enabled) {
                alarmManager.rescheduleNext(stored)
            } else {
                // Alarm was edited/deleted while pending; drop this firing.
                android.util.Log.w("AttendanceAlarm", "Alarm ${alarm.id} no longer active; ignoring fire")
                return
            }
        }

        ringAlarm(
            context = context,
            alarmManager = alarmManager,
            alarmJson = alarmJson,
            companyType = null,
            label = alarm.label.ifBlank { "Attendance Alarm" },
            time = AttendanceAlarmManager.formatAmPm(alarm.time),
            vibration = alarm.vibrationEnabled,
            snoozeMinutes = alarm.snoozeMinutes,
            snoozeRemaining = if (isSnooze) snoozeRemainingExtra else alarm.snoozeCount,
            notificationId = alarm.requestCode
        )
    }

    private fun ringAlarm(
        context: Context,
        alarmManager: AttendanceAlarmManager,
        alarmJson: String?,
        companyType: String?,
        label: String,
        time: String,
        vibration: Boolean,
        snoozeMinutes: Int,
        snoozeRemaining: Int,
        notificationId: Int
    ) {
        // Fallback heads-up notification in case the full-screen intent is blocked.
        postFallbackNotification(context, label, time, notificationId)

        val serviceIntent = Intent(context, AlarmRingingService::class.java).apply {
            putExtra(AttendanceAlarmManager.EXTRA_ALARM_JSON, alarmJson)
            putExtra(AttendanceAlarmManager.EXTRA_COMPANY_TYPE, companyType)
            putExtra(AlarmRingingService.EXTRA_LABEL, label)
            putExtra(AlarmRingingService.EXTRA_TIME, time)
            putExtra(AlarmRingingService.EXTRA_VIBRATION, vibration)
            putExtra(AlarmRingingService.EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra(AttendanceAlarmManager.EXTRA_SNOOZE_REMAINING, snoozeRemaining)
            putExtra(AttendanceAlarmManager.EXTRA_NOTIFICATION_ID, notificationId)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            android.util.Log.e("AttendanceAlarm", "Failed to start ringing service", e)
        }

        if (!alarmManager.areNotificationsEnabled()) {
            android.util.Log.w("AttendanceAlarm", "Notifications are blocked; alarm still rings via foreground service")
        }
    }

    /** Minimal ongoing notification used when the full-screen intent cannot display. */
    private fun postFallbackNotification(context: Context, label: String, time: String, id: Int) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(
                    AttendanceAlarmManager.CHANNEL_ID,
                    "Attendance Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Attendance alarm reminders"
                }
            )
        }
        val launch = PendingIntent.getActivity(
            context, id,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("NAVIGATE_TO", "alarm_settings")
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, AttendanceAlarmManager.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $label")
            .setContentText(if (time.isNotBlank()) "Alarm for $time" else "Time to get ready")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(launch)
            .build()
        nm.notify(id, notification)
    }
}
