package com.swayog.employee.data.sync

import android.content.Context
import androidx.work.*
import java.util.Calendar
import java.util.TimeZone
import java.util.concurrent.TimeUnit

object WorkManagerScheduler {
    
    /**
     * Schedule periodic task refresh every 15 minutes
     * This ensures the dashboard stays synchronized with backend changes
     */
    fun schedulePeriodicTaskRefresh(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(false)
            .setRequiresCharging(false)
            .build()
        
        val periodicWorkRequest = PeriodicWorkRequestBuilder<PeriodicTaskRefreshWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                10, TimeUnit.MINUTES
            )
            .build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PeriodicTaskRefreshWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodicWorkRequest
        )
        
        android.util.Log.d("WorkManagerScheduler", "Scheduled periodic task refresh every 15 minutes")
    }
    
    /**
     * Cancel the periodic task refresh
     */
    fun cancelPeriodicTaskRefresh(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(PeriodicTaskRefreshWorker.WORK_NAME)
        android.util.Log.d("WorkManagerScheduler", "Cancelled periodic task refresh")
    }
    
    /**
     * Manually trigger an immediate task refresh (for pull-to-refresh scenarios)
     */
    fun triggerImmediateTaskRefresh(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val oneTimeWorkRequest = OneTimeWorkRequestBuilder<PeriodicTaskRefreshWorker>()
            .setConstraints(constraints)
            .build()
        
        WorkManager.getInstance(context).enqueue(oneTimeWorkRequest)
        android.util.Log.d("WorkManagerScheduler", "Triggered immediate task refresh")
    }

    /**
     * Schedule a periodic check-in reminder every 30 minutes.
     * The CheckInReminderWorker will internally determine if a reminder
     * is needed (i.e., working day + user logged in + no check-in yet).
     */
    fun scheduleCheckInReminder(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val periodicWorkRequest = PeriodicWorkRequestBuilder<CheckInReminderWorker>(
            30, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                15, TimeUnit.MINUTES
            )
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            CheckInReminderWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodicWorkRequest
        )

        android.util.Log.d("WorkManagerScheduler", "Scheduled check-in reminder check every 30 minutes")
    }

    /**
     * Cancel the check-in reminder (e.g., on logout)
     */
    fun cancelCheckInReminder(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(CheckInReminderWorker.WORK_NAME)
        android.util.Log.d("WorkManagerScheduler", "Cancelled check-in reminder")
    }

    /**
     * Schedule the auto-checkout one-shot worker to fire at 7:00 PM IST today
     * (or tomorrow if it's already past 7 PM IST).
     *
     * IST = UTC + 05:30 -> 19:00 IST = 13:30 UTC
     *
     * This function is idempotent: calling it again simply replaces any pending
     * work, ensuring the timer is always fresh.
     */
    fun scheduleAutoCheckout(context: Context) {
        val istZone = TimeZone.getTimeZone("Asia/Kolkata")
        val nowIst = Calendar.getInstance(istZone)

        // Build target: today at 19:00:00 IST
        val targetIst = Calendar.getInstance(istZone).apply {
            set(Calendar.HOUR_OF_DAY, 19)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        // If it's already past 7 PM IST, schedule for tomorrow
        if (nowIst >= targetIst) {
            targetIst.add(Calendar.DAY_OF_YEAR, 1)
        }

        val delayMs = targetIst.timeInMillis - nowIst.timeInMillis

        android.util.Log.d(
            "WorkManagerScheduler",
            "Auto-checkout scheduled in ${delayMs / 60_000} minutes (fires at ${targetIst.time})"
        )

        val oneTimeWorkRequest = OneTimeWorkRequestBuilder<AutoCheckoutWorker>()
            .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
            .setBackoffCriteria(BackoffPolicy.LINEAR, 15, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            AutoCheckoutWorker.WORK_NAME,
            ExistingWorkPolicy.REPLACE, // Replace if already pending - keeps the timer fresh
            oneTimeWorkRequest
        )
    }

    /**
     * Cancel any pending auto-checkout work (e.g., on logout or when user manually checks out).
     */
    fun cancelAutoCheckout(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AutoCheckoutWorker.WORK_NAME)
        android.util.Log.d("WorkManagerScheduler", "Cancelled auto-checkout worker")
    }
}
