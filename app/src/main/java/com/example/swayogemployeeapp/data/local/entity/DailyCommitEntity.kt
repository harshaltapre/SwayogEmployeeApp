package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_commits")
data class DailyCommitEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String? = null,
    val date: String,
    val taskDescription: String,
    val hoursSpent: Double,
    val isSynced: Boolean = false
)
