package com.swayog.employee.data.sync

import android.content.Context
import androidx.work.*
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
            15, TimeUnit.MINUTES // Refresh every 15 minutes
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                10, TimeUnit.MINUTES
            )
            .build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PeriodicTaskRefreshWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE, // Update if already exists
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
}