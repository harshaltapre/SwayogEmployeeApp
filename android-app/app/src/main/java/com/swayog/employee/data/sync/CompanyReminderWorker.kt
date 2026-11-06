package com.swayog.employee.data.sync

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.swayog.employee.core.alarm.AttendanceAlarmManager
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.CompanyAlarmPolicy
import com.swayog.employee.presentation.MainActivity
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

/**
 * Delivers company attendance reminders (preparation / final reporting) as
 * ordinary notifications. Runs periodically via WorkManager — it does NOT use
 * AlarmManager, exact-alarm permission, the ringing service, or snooze.
 *
 * Policy comes from the backend alarm-policy endpoint when reachable, with the
 * locally cached copy ([AttendanceAlarmManager.getPolicy]) as fallback.
 */
@HiltWorker
class CompanyReminderWorker @AssistedInject constructor(
    @Assisted private val context: Context,
    @Assisted workerParams: WorkerParameters,
    private val apiService: ApiService,
    private val dataStoreManager: DataStoreManager
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val WORK_NAME = "company_reminder_worker"
        private const val PREFS = "company_reminder_state"
        private const val KEY_PREP_SENT = "prep_last_sent"
        private const val KEY_FINAL_SENT = "final_last_sent"
        private const val NOTIF_ID_PREP = 2101
        private const val NOTIF_ID_FINAL = 2102
        private val DATE_FMT: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE
        // A reminder is only sent inside this window after its scheduled time,
        // so a device that was off all day does not get a stale notification.
        private const val WINDOW_MINUTES = 30L
    }

    override suspend fun doWork(): Result {
        return try {
            val token = dataStoreManager.getCachedAuthToken()
            if (token.isNullOrBlank()) return Result.success()

            val policy = fetchPolicy()
            val zone = runCatching { ZoneId.of(policy.timezone) }
                .getOrDefault(ZoneId.of(AttendanceAlarmManager.DEFAULT_TIMEZONE))
            val now = ZonedDateTime.now(zone)
            val today = now.toLocalDate()

            // Company reminders only apply on configured working days.
            val dayIndex = now.dayOfWeek.toCompanyIndex() // 0=Sun..6=Sat
            if (!policy.workingDays.contains(dayIndex)) return Result.success()

            if (policy.prepReminderEnabled) {
                maybeNotify(
                    policy = policy, now = now, today = today,
                    reminderTime = policy.prepReminderTime,
                    sentKey = KEY_PREP_SENT,
                    notificationId = NOTIF_ID_PREP,
                    title = "Attendance Preparation",
                    detail = "Get ready — official reporting is ${AttendanceAlarmManager.formatAmPm(policy.reportingTime)}"
                )
            }
            if (policy.finalReminderTime.isNotBlank() && policy.finalReminderEnabled) {
                maybeNotify(
                    policy = policy, now = now, today = today,
                    reminderTime = policy.finalReminderTime,
                    sentKey = KEY_FINAL_SENT,
                    notificationId = NOTIF_ID_FINAL,
                    title = "Final Reporting Reminder",
                    detail = "Reporting time is ${AttendanceAlarmManager.formatAmPm(policy.reportingTime)} — please check in"
                )
            }
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("CompanyReminderWorker", "Error: ${e.message}")
            Result.success() // never retry-spam; next periodic run will try again
        }
    }

    private suspend fun fetchPolicy(): CompanyAlarmPolicy {
        return try {
            val resp = apiService.getAlarmPolicy()
            resp.body()?.policy ?: cachedPolicy()
        } catch (e: Exception) {
            cachedPolicy()
        }
    }

    private fun cachedPolicy(): CompanyAlarmPolicy =
        AttendanceAlarmManager(context).getPolicy()

    private fun maybeNotify(
        policy: CompanyAlarmPolicy,
        now: ZonedDateTime,
        today: LocalDate,
        reminderTime: String,
        sentKey: String,
        notificationId: Int,
        title: String,
        detail: String
    ) {
        val parts = reminderTime.split(":").mapNotNull { it.toIntOrNull() }
        if (parts.size != 2) return
        val reminder = LocalTime.of(parts[0].coerceIn(0, 23), parts[1].coerceIn(0, 59))
        val nowTime = now.toLocalTime()

        val start = reminder
        val end = reminder.plusMinutes(WINDOW_MINUTES)
        val inWindow = !nowTime.isBefore(start) && nowTime.isBefore(end)
        if (!inWindow) return

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val todayStr = today.format(DATE_FMT)
        if (prefs.getString(sentKey, null) == todayStr) return

        postNotification(title, detail, notificationId)
        prefs.edit().putString(sentKey, todayStr).apply()
    }

    private fun postNotification(title: String, detail: String, notificationId: Int) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(
                    AttendanceAlarmManager.COMPANY_CHANNEL_ID,
                    "Company reminders",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Attendance preparation and reporting reminders"
                }
            )
        }
        val launch = PendingIntent.getActivity(
            context, notificationId,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("NAVIGATE_TO", "attendance")
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, AttendanceAlarmManager.COMPANY_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(detail)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(launch)
            .build()
        nm.notify(notificationId, notification)
    }
}

/** java.time DayOfWeek (Mon=1..Sun=7) → company index (0=Sun..6=Sat). */
private fun DayOfWeek.toCompanyIndex(): Int = this.value % 7
