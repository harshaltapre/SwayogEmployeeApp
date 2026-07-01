package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dispatch_records")
data class DispatchRecordEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val itemId: String,
    val quantity: Int,
    val dispatchedAt: String,
    val notes: String?,
    val isSynced: Boolean = false
)
