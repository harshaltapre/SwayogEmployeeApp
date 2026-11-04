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

        when (action) {
            AttendanceAlarmManager.ACTION_ATTENDANCE_ALARM -> {
                val alarmType = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_TYPE) ?: "PERSONAL"
                val label = intent.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_LABEL) ?: "Attendance Reminder"
                showAlarmNotification(context, alarmType, label)
                
                // Reschedule for next repeating cycle
                val alarmManager = AttendanceAlarmManager(context)
                alarmManager.rescheduleFromPreferences()
            }
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                android.util.Log.i("AttendanceAlarm", "Device reboot / time change event: Rescheduling attendance alarms")
                val alarmManager = AttendanceAlarmManager(context)
                alarmManager.rescheduleFromPreferences()
            }
        }
    }

    private fun showAlarmNotification(context: Context, alarmType: String, label: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = AttendanceAlarmManager.CHANNEL_ID

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Attendance & Shift Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Daily shift reporting reminders and smart attendance alarms"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 250, 500)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("NAVIGATE_TO", "attendance")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            1001,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val contentText = when (alarmType) {
            "PERSONAL" -> "Time to get ready! Official reporting time is 10:30 AM."
            "REMINDER_1" -> "30 minutes until 10:30 AM reporting cutoff. Prepare to mark attendance."
            "REMINDER_2" -> "Final reminder! Check in before 10:30 AM to stay on time."
            else -> "Company reporting time is 10:30 AM IST. Please check in now."
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $label")
            .setContentText(contentText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setVibrate(longArrayOf(0, 500, 250, 500))
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_agenda, "Mark Attendance", pendingIntent)
            .build()

        val notificationId = when (alarmType) {
            "PERSONAL" -> 2001
            "REMINDER_1" -> 2002
            "REMINDER_2" -> 2003
            else -> 2000
        }

        notificationManager.notify(notificationId, notification)
    }
}

