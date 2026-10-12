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
import com.swayog.employee.data.local.dao.AttendanceDao
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.AttendanceRepository
import com.swayog.employee.presentation.MainActivity
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.Calendar
import java.util.Locale

/**
 * AutoCheckoutWorker
 *
 * A WorkManager CoroutineWorker that runs once per day at 7:00 PM IST.
 * If the employee has checked in today but has NOT yet checked out, it will:
 *   1. Call the checkout endpoint / repository to record check-out at 7 PM IST.
 *   2. Update the local Room DB so the UI reflects the checkout immediately.
 *   3. Send a local push notification informing the employee they were auto-checked out.
 *
 * If the server's backend scheduler already auto-checked out the employee at 7:00 PM,
 * this worker detects it, synchronizes the local database, and notifies the employee.
 *
 * The worker re-schedules itself for the next day's 7:00 PM IST on every run.
 */
@HiltWorker
class AutoCheckoutWorker @AssistedInject constructor(
    @Assisted private val context: Context,
    @Assisted workerParams: WorkerParameters,
    private val apiService: ApiService,
    private val attendanceRepository: AttendanceRepository,
    private val attendanceDao: AttendanceDao,
    private val dataStoreManager: DataStoreManager
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val WORK_NAME = "auto_checkout_worker"
        const val CHANNEL_ID = "swayog_employee_channel"
        const val NOTIFICATION_ID = 1002
        private const val PREFS_NAME = "auto_checkout_prefs"
        private const val KEY_LAST_NOTIFIED_DATE = "last_notified_date"
    }

    override suspend fun doWork(): Result {
        return try {
            val todayStr = LocalDate.now().toString()

            // 1. Guard: skip if user is not logged in
            val token = dataStoreManager.getCachedAuthToken()
            val userId = dataStoreManager.userId.first()
            if (token.isNullOrBlank() || userId.isNullOrBlank()) {
                android.util.Log.d("AutoCheckoutWorker", "No logged-in user - skipping auto-checkout.")
                rescheduleForTomorrow()
                return Result.success()
            }

            // 2. Guard: skip on weekly off days (Sunday by default)
            val dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
            if (dayOfWeek == Calendar.SUNDAY) {
                android.util.Log.d("AutoCheckoutWorker", "Sunday / weekly off - skipping auto-checkout.")
                rescheduleForTomorrow()
                return Result.success()
            }

            // 3. Check today's attendance status (server first, then local DB fallback)
            var hasCheckedIn = false
            var hasCheckedOut = false
            var isAlreadyAutoCheckedOut = false
            var isManualOverride = false
            var statusStr: String? = null

            try {
                val todayResponse = apiService.getTodayAttendance()
                if (todayResponse.isSuccessful && todayResponse.body()?.record != null) {
                    val record = todayResponse.body()!!.record!!
                    hasCheckedIn = record.checkInTime != null
                    hasCheckedOut = record.checkOutTime != null
                    isManualOverride = record.manualOverride
                    statusStr = record.status
                    val notes = record.notes.orEmpty()
                    isAlreadyAutoCheckedOut = hasCheckedOut && notes.contains("Auto-checked out", ignoreCase = true)
                }
            } catch (e: Exception) {
                android.util.Log.w("AutoCheckoutWorker", "Network fetch failed, falling back to local DB: ${e.message}")
            }

            // If network failed or record wasn't retrieved, check local Room DB
            if (!hasCheckedIn && !hasCheckedOut) {
                val localRecord = attendanceDao.getTodayAttendance(userId, todayStr)
                if (localRecord != null) {
                    hasCheckedIn = localRecord.checkInTime != null
                    hasCheckedOut = localRecord.checkOutTime != null
                    isManualOverride = localRecord.manualOverride
                    statusStr = localRecord.status
                    val notes = localRecord.notes.orEmpty()
                    isAlreadyAutoCheckedOut = hasCheckedOut && notes.contains("Auto-checked out", ignoreCase = true)
                }
            }

            val activeStatuses = setOf("PRESENT", "LATE", "HALF_DAY")
            val isActiveStatus = statusStr?.uppercase(Locale.getDefault()) in activeStatuses

            // Case A: The backend auto-checkout job already ran at 7:00 PM IST on the server
            if (isAlreadyAutoCheckedOut) {
                android.util.Log.i("AutoCheckoutWorker", "Server already auto-checked out today. Syncing local DB and notifying user.")
                updateLocalRecordCheckedOut(userId, todayStr)
                notifyUserOnceToday(todayStr)
                rescheduleForTomorrow()
                return Result.success()
            }

            // Case B: Not checked in, or already checked out manually, or administrative override/leave
            if (!hasCheckedIn || hasCheckedOut || isManualOverride || !isActiveStatus) {
                android.util.Log.d(
                    "AutoCheckoutWorker",
                    "Auto-checkout not needed - checkedIn=$hasCheckedIn, checkedOut=$hasCheckedOut, " +
                        "manualOverride=$isManualOverride, status=$statusStr"
                )
                rescheduleForTomorrow()
                return Result.success()
            }

            // Case C: Checked in today, NOT checked out by 7:00 PM IST -> Perform Auto-Checkout
            android.util.Log.i(
                "AutoCheckoutWorker",
                "Employee forgot to check out by 7:00 PM IST. Triggering auto-checkout..."
            )

            val checkOutResult = attendanceRepository.checkOut()

            if (checkOutResult.isSuccess) {
                updateLocalRecordCheckedOut(userId, todayStr)
                notifyUserOnceToday(todayStr)
                android.util.Log.i("AutoCheckoutWorker", "Auto-checkout completed successfully.")
            } else {
                android.util.Log.w(
                    "AutoCheckoutWorker",
                    "AttendanceRepository checkOut returned failure: ${checkOutResult.exceptionOrNull()?.message}"
                )
                // Even if offline, AttendanceRepository handles offline queuing and local update
                updateLocalRecordCheckedOut(userId, todayStr)
                notifyUserOnceToday(todayStr)
            }

            rescheduleForTomorrow()
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("AutoCheckoutWorker", "Auto-checkout execution error: ${e.message}", e)
            rescheduleForTomorrow()
            Result.success()
        }
    }

    private suspend fun updateLocalRecordCheckedOut(userId: String, todayStr: String) {
        try {
            val local = attendanceDao.getTodayAttendance(userId, todayStr)
            if (local != null) {
                val nowStr = LocalDateTime.now().toString()
                val updatedNotes = if (local.notes.isNullOrBlank()) {
                    "Auto-checked out at 7:00 PM (system)"
                } else if (!local.notes.contains("Auto-checked out")) {
                    "${local.notes} | Auto-checked out at 7:00 PM (system)"
                } else {
                    local.notes
                }
                attendanceDao.updateAttendance(
                    local.copy(
                        checkOutTime = local.checkOutTime ?: nowStr,
                        isSynced = true,
                        notes = updatedNotes
                    )
                )
            }
        } catch (e: Exception) {
            android.util.Log.w("AutoCheckoutWorker", "Could not update local record: ${e.message}")
        }
    }

    private fun notifyUserOnceToday(todayStr: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastNotified = prefs.getString(KEY_LAST_NOTIFIED_DATE, null)
        if (lastNotified == todayStr) {
            return // Already notified for today
        }

        sendAutoCheckoutNotification()
        prefs.edit().putString(KEY_LAST_NOTIFIED_DATE, todayStr).apply()
    }

    private fun rescheduleForTomorrow() {
        WorkManagerScheduler.scheduleAutoCheckout(context)
    }

    private fun sendAutoCheckoutNotification() {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "attendance")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Auto Check-Out at 7:00 PM \uD83D\uDD51")
            .setContentText("You forgot to check out today, so we did it for you at 7:00 PM.")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(
                        "You forgot to check out today. Your attendance has been " +
                            "automatically closed at 7:00 PM IST. Please remember to " +
                            "check out manually before 7 PM next time."
                    )
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 300, 200, 300))
            .build()

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}
