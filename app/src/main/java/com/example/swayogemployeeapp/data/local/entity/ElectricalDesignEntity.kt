package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "electrical_designs")
data class ElectricalDesignEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val engineerId: String,
    val systemSizeKw: Double,
    val mainBreakerSize: Double,
    val cableSize: String,
    val designStatus: String,
    val schematicUrl: String?,
    val loadCalculations: String?,
    val complianceCheck: String?,
    val submittedAt: String,
    val reviewedAt: String?,
    val reviewedBy: String?,
    val reviewNotes: String?,
    val isSynced: Boolean = false
)
