package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.sync.SyncManager

class DesignRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)

    suspend fun submitDesign(
        customerId: String,
        panelCount: Int,
        inverterModel: String,
        systemCapacityKw: Double,
        tiltAngle: Double,
        cadLayoutPath: String?,
        sldDiagramPath: String?
    ) {
        val payload = "$customerId|||$panelCount|||$inverterModel|||$systemCapacityKw|||$tiltAngle"
        val attachmentPaths = listOfNotNull(cadLayoutPath, sldDiagramPath).joinToString(",")
        
        val outbox = OutboxQueueEntity(
            actionType = "DESIGN",
            endpoint = "api/v1/employee/designs",
            payloadJson = payload,
            localAttachmentPaths = attachmentPaths
        )
        db.outboxQueueDao().enqueue(outbox)

        SyncManager.enqueueSync(context)
    }
}
