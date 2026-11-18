package com.swayog.employee

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.swayog.employee.data.local.dao.OutboxQueueDao
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.sync.SyncManager
import com.swayog.employee.data.sync.WorkManagerScheduler
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class SwayogEmployeeApp : Application(), Configuration.Provider {
    
    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    @Inject
    lateinit var dataStoreManager: DataStoreManager

    @Inject
    lateinit var syncManager: SyncManager

    @Inject
    lateinit var outboxQueueDao: OutboxQueueDao

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override val workManagerConfiguration: Configuration
        get() = try {
            if (::workerFactory.isInitialized) {
                Configuration.Builder()
                    .setWorkerFactory(workerFactory)
                    .build()
            } else {
                Configuration.Builder().build()
            }
        } catch (e: Exception) {
            Configuration.Builder().build()
        }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        // Schedule periodic task refresh for dashboard synchronization
        WorkManagerScheduler.schedulePeriodicTaskRefresh(this)
        // Schedule periodic check-in reminder for employees who haven't checked in
        WorkManagerScheduler.scheduleCheckInReminder(this)
        // Schedule daily auto-checkout at 7:00 PM IST for employees who forgot to check out
        WorkManagerScheduler.scheduleAutoCheckout(this)
        // Schedule periodic company attendance reminders (ordinary notifications)
        WorkManagerScheduler.scheduleCompanyReminders(this)
        // Post-update integrity check and pending outbox sync recovery
        runPostUpdateAndStartupSyncCheck()
    }

    private fun runPostUpdateAndStartupSyncCheck() {
        appScope.launch {
            try {
                val currentVersion = BuildConfig.VERSION_CODE.toLong()
                val lastKnownVersion = dataStoreManager.getLastKnownAppVersionCode()
                if (lastKnownVersion != currentVersion) {
                    android.util.Log.i("SwayogApp", "App updated from versionCode $lastKnownVersion to $currentVersion; preserving local data and verifying sync")
                    dataStoreManager.setLastKnownAppVersionCode(currentVersion)
                }

                val userId = dataStoreManager.userId.first()
                if (!userId.isNullOrBlank()) {
                    val pendingCount = outboxQueueDao.getPendingCountForUser(userId)
                    if (pendingCount > 0) {
                        android.util.Log.i("SwayogApp", "Found $pendingCount pending outbox item(s) at startup; scheduling sync")
                        syncManager.scheduleSyncWorker()
                    }
                }
            } catch (e: Exception) {
                android.util.Log.w("SwayogApp", "Startup sync check error: ${e.message}")
            }
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = "swayog_employee_channel"
            val channelName = "SWAYOG Employee Notifications"
            val channelDescription = "Notifications for tasks, attendance, and alerts"
            
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(channelId, channelName, importance).apply {
                description = channelDescription
                enableVibration(true)
                enableLights(true)
            }
            
            val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}
