package com.swayog.employee

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.util.Log
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.sync.SyncManager
import com.swayog.employee.data.sync.WorkManagerScheduler
import dagger.hilt.android.HiltAndroidApp
import java.io.File
import javax.inject.Inject

@HiltAndroidApp
class SwayogEmployeeApp : Application(), Configuration.Provider, ImageLoaderFactory {
    
    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    @Inject
    lateinit var syncManager: SyncManager

    @Inject
    lateinit var dataStoreManager: DataStoreManager

    @Volatile
    private var coilImageLoader: ImageLoader? = null

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

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    // Cap bitmap memory cache at 15% of available heap to prevent OOM on low-RAM phones
                    .maxSizePercent(0.15)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(File(cacheDir, "image_cache"))
                    .maxSizeBytes(30L * 1024 * 1024) // 30 MB bounded disk cache
                    .build()
            }
            .crossfade(true)
            .allowRgb565(true)
            .build()
            .also { coilImageLoader = it }
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        registerConnectivitySyncCallback()
        // Schedule periodic task refresh for dashboard synchronization
        WorkManagerScheduler.schedulePeriodicTaskRefresh(this)
        // Schedule periodic check-in reminder for employees who haven't checked in
        WorkManagerScheduler.scheduleCheckInReminder(this)
        // Schedule daily auto-checkout at 7:00 PM IST for employees who forgot to check out
        WorkManagerScheduler.scheduleAutoCheckout(this)
        // Schedule periodic company attendance reminders (ordinary notifications)
        WorkManagerScheduler.scheduleCompanyReminders(this)
    }

    /**
     * Triggers an immediate outbox drain via [SyncManager] the moment validated network
     * connectivity is restored, avoiding background polling delays.
     */
    private fun registerConnectivitySyncCallback() {
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            cm.registerNetworkCallback(request, object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    if (::syncManager.isInitialized && ::dataStoreManager.isInitialized) {
                        if (dataStoreManager.isCachedLoggedIn()) {
                            Log.d("TASK_SYNC", "Network connectivity restored — scheduling immediate outbox sync")
                            syncManager.scheduleSync()
                        }
                    }
                }
            })
        } catch (e: Exception) {
            Log.w("SwayogEmployeeApp", "Connectivity callback registration skipped: ${e.message}")
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW ||
            level >= ComponentCallbacks2.TRIM_MEMORY_BACKGROUND
        ) {
            coilImageLoader?.memoryCache?.clear()
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        coilImageLoader?.memoryCache?.clear()
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
