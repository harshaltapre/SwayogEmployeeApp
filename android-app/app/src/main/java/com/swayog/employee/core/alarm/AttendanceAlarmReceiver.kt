package com.swayog.employee.core.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.swayog.employee.presentation.MainActivity

class AttendanceAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        android.util.Log.d("AttendanceAlarm", "Broadcast received with action: $action")

        val alarmManager = AttendanceAlarmManager(context)

        when (action) {
            AttendanceAlarmManager.ACTION_ATTENDANCE_ALARM -> {
                val settings = alarmManager.getLocalSettings()
                if (!settings.enabled) {
                    alarmManager.cancelAllAlarms()
                    return
                }
                val alarmType = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_TYPE) ?: "PERSONAL"
                val label = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_LABEL) ?: "Attendance Reminder"
                showAlarmNotification(context, alarmManager, settings, alarmType, label)

                // Reschedule only the alarm that fired, not all alarms
                val requestCode = when (alarmType) {
                    "PERSONAL" -> AttendanceAlarmManager.REQ_PERSONAL
                    "REMINDER_1" -> AttendanceAlarmManager.REQ_REMINDER_1
                    "REMINDER_2" -> AttendanceAlarmManager.REQ_REMINDER_2
                    else -> AttendanceAlarmManager.REQ_PERSONAL
                }
                alarmManager.rescheduleSingleAlarm(requestCode, settings)
            }
            AttendanceAlarmManager.ACTION_SNOOZE_ALARM -> {
                val alarmType = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_TYPE) ?: "PERSONAL"
                val label = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_LABEL) ?: "Attendance Reminder"
                val notificationId = intent.getIntExtra(
                    AttendanceAlarmManager.EXTRA_NOTIFICATION_ID,
                    notificationIdFor(alarmType)
                )
                (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                    .cancel(notificationId)
                if (!alarmManager.snoozeAlarm(alarmType, label)) {
                    android.util.Log.w("AttendanceAlarm", "Snooze could not be scheduled (exact alarm permission denied?)")
                }
            }
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                android.util.Log.i("AttendanceAlarm", "Device reboot / time change event: Rescheduling attendance alarms")
                alarmManager.rescheduleFromPreferences()
            }
        }
    }

    private fun showAlarmNotification(
        context: Context,
        alarmManager: AttendanceAlarmManager,
        settings: com.swayog.employee.data.model.EmployeeAlarmSetting,
        alarmType: String,
        label: String
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = AttendanceAlarmManager.CHANNEL_ID
        val reportingTime = alarmManager.getReportingTimeLabel()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Attendance & Shift Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Daily shift reporting reminders and smart attendance alarms"
                enableVibration(settings.vibrationEnabled)
                if (settings.vibrationEnabled) {
                    vibrationPattern = VIBRATION_PATTERN
                }
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("NAVIGATE_TO", "attendance")
        }

        val contentIntent = PendingIntent.getActivity(
            context,
            1001,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val contentText = when (alarmType) {
            "PERSONAL" -> "Time to get ready! Official reporting time is $reportingTime."
            "REMINDER_1" -> "Prepare to reach the office before the $reportingTime reporting cutoff."
            "REMINDER_2" -> "Final reminder! Check in before $reportingTime to stay on time."
            else -> "Company reporting time is $reportingTime IST. Please check in now."
        }

        val notificationId = notificationIdFor(alarmType)

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $label")
            .setContentText(contentText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setContentIntent(contentIntent)
            .addAction(android.R.drawable.ic_menu_agenda, "Mark Attendance", contentIntent)

        if (settings.vibrationEnabled) {
            builder.setVibrate(VIBRATION_PATTERN)
        }

        if (settings.snoozeEnabled) {
            val snoozeIntent = Intent(context, AttendanceAlarmReceiver::class.java).apply {
                action = AttendanceAlarmManager.ACTION_SNOOZE_ALARM
                setPackage(context.packageName)
                putExtra(AttendanceAlarmManager.EXTRA_ALARM_TYPE, alarmType)
                putExtra(AttendanceAlarmManager.EXTRA_ALARM_LABEL, label)
                putExtra(AttendanceAlarmManager.EXTRA_NOTIFICATION_ID, notificationId)
            }
            val snoozePendingIntent = PendingIntent.getBroadcast(
                context,
                AttendanceAlarmManager.REQ_SNOOZE,
                snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(
                android.R.drawable.ic_lock_idle_alarm,
                "Snooze ${AttendanceAlarmManager.SNOOZE_MINUTES} min",
                snoozePendingIntent
            )
        }

        notificationManager.notify(notificationId, builder.build())

        if (!alarmManager.areNotificationsEnabled()) {
            android.util.Log.w(
                "AttendanceAlarm",
                "Alarm fired while notifications are blocked; the reminder was not visible."
            )
        }
    }

    private fun notificationIdFor(alarmType: String): Int = when (alarmType) {
        "PERSONAL" -> 2001
        "REMINDER_1" -> 2002
        "REMINDER_2" -> 2003
        else -> 2000
    }

    companion object {
        private val VIBRATION_PATTERN = longArrayOf(0, 500, 250, 500)
    }
}
