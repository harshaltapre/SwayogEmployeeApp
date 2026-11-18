package com.swayog.employee.data.local.entity

import androidx.annotation.Keep
import androidx.room.Entity
import androidx.room.PrimaryKey

@Keep
@Entity(tableName = "outbox_queue")
data class OutboxQueueEntity(
    @PrimaryKey
    val id: String,
    val endpoint: String,
    val method: String,
    val payload: String,
    val createdAt: String,
    val retryCount: Int = 0,
    val isSynced: Boolean = false,
    val clientUploadId: String? = null, // Idempotency key for duplicate prevention
    val ownerUserId: String = "", // Employee ID that owns this queued operation
    val status: String = "PENDING", // PENDING, PROCESSING, SYNCED, FAILED_PERMANENT
    val lastError: String? = null,
    val lastAttemptAt: String? = null
)

