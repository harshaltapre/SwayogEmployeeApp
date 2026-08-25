package com.swayog.employee.data.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Utility class to schedule and manage periodic background work using WorkManager.
 * Ensures tasks are refreshed periodically to keep the dashboard synchronized with the backend.
 */
object WorkManagerScheduler {
    
    private const val PERIODIC_TASK_REFRESH_WORK = "periodic_task_refresh_work"
    
    /**
     * Schedules the periodic task refresh worker to run every 15 minutes.
     * This ensures the dashboard stays synchronized with the backend without manual refresh.
     * 
     * @param context Application context
     */
    fun schedulePeriodicTaskRefresh(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
        
        val periodicWorkRequest = PeriodicWorkRequestBuilder<PeriodicTaskRefreshWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setInitialDelay(5, TimeUnit.MINUTES) // Initial delay to avoid immediate refresh on app start
            .build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_TASK_REFRESH_WORK,
            ExistingPeriodicWorkPolicy.REPLACE, // Replace any existing work with this one
            periodicWorkRequest
        )
        
        android.util.Log.d("WorkManagerScheduler", "Scheduled periodic task refresh worker (every 15 minutes)")
    }
    
    /**
     * Cancels the periodic task refresh worker.
     * Use this when the user logs out or when periodic sync should be disabled.
     * 
     * @param context Application context
     */
    fun cancelPeriodicTaskRefresh(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_TASK_REFRESH_WORK)
        android.util.Log.d("WorkManagerScheduler", "Cancelled periodic task refresh worker")
    }
}
