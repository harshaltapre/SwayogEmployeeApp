package com.example.swayogemployeeapp.data.sync

import android.content.Context
import androidx.work.*

object SyncManager {
    fun enqueueSync(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()
            
        WorkManager.getInstance(context).enqueueUniqueWork(
            "SwayogSyncWork",
            ExistingWorkPolicy.KEEP,
            syncRequest
        )
    }
}
