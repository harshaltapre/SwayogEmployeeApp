package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "outbox_queue")
data class OutboxQueueEntity(
    @PrimaryKey
    val id: String,
    val endpoint: String,
    val method: String,
    val payload: String,
    val createdAt: String,
    val retryCount: Int = 0,
    val isSynced: Boolean = false
)
