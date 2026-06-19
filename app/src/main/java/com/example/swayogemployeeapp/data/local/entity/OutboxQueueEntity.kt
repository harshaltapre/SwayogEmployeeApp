package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "outbox_queue")
data class OutboxQueueEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val actionType: String,            // e.g. "CHECK_IN", "CHECK_OUT", "SURVEY", "DESIGN", "TASK_COMPLETE", "COMMIT"
    val endpoint: String,              // target API endpoint
    val payloadJson: String,           // JSON body
    val localAttachmentPaths: String?, // Comma-separated file paths for files (drawings, photos)
    val createdAt: Long = System.currentTimeMillis(),
    val isProcessing: Boolean = false
)
