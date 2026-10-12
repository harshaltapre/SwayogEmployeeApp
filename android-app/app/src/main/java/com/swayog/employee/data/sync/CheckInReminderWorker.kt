package com.swayog.employee.data.sync

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.swayog.employee.R
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.presentation.MainActivity
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.Calendar
import java.util.Locale

/**
 * WorkManager Worker that checks if the employee has checked in today,
 * and sends a local notification reminder if they haven't.
 *
 * Only fires on working days (not on weekly off days like Sunday).
 */
@HiltWorker
class CheckInReminderWorker @AssistedInject constructor(
    @Assisted private val context: Context,
    @Assisted workerParams: WorkerParameters,
    private val apiService: ApiService,
    private val dataStoreManager: DataStoreManager
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val WORK_NAME = "check_in_reminder_worker"
        const val CHANNEL_ID = "swayog_employee_channel"
        const val NOTIFICATION_ID = 1001
    }

    override suspend fun doWork(): Result {
        return try {
            // 1. Check if it's a working day (skip Sunday = day 1 in Calendar)
            val dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
            // Sunday = Calendar.SUNDAY = 1, Saturday = Calendar.SATURDAY = 7
            if (dayOfWeek == Calendar.SUNDAY) {
                // Weekly off — skip
                return Result.success()
            }

            // 2. Check if user is logged in
            val token = dataStoreManager.getCachedAuthToken()
            if (token.isNullOrBlank()) {
                return Result.success()
            }

            // 3. Check if already checked in today via API
            val response = apiService.getTodayAttendance()
            if (response.isSuccessful) {
                val body = response.body()
                val record = body?.record
                // If record has a checkIn time or status is PRESENT/LATE/HALF_DAY/LEAVE → skip
                if (record != null) {
                    val status = record.status.uppercase(Locale.getDefault())
                    if (record.checkInTime != null ||
                        status == "PRESENT" || status == "LATE" ||
                        status == "HALF_DAY" || status == "LEAVE"
                    ) {
                        return Result.success()
                    }
                }
            } else {
                // If we can't determine → skip to avoid false reminders
                return Result.success()
            }

            // 4. Employee has not checked in → send reminder notification
            sendCheckInReminderNotification()

            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("CheckInReminderWorker", "Error checking attendance: ${e.message}")
            Result.success() // Don't retry on error — avoid notification spam
        }
    }

    private fun sendCheckInReminderNotification() {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "attendance")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Check-In Reminder ⏰")
            .setContentText("Today is a working day and you haven't checked in yet. Please complete your check-in.")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("Today is a working day and you haven't completed your check-in yet. Please open the app and check in to mark your attendance.")
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 250, 250, 250))
            .build()

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)

        android.util.Log.d("CheckInReminderWorker", "Check-in reminder notification sent.")
    }
}
