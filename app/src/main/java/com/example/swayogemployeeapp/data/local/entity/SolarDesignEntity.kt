package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "solar_designs")
data class SolarDesignEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val engineerId: String,
    val panelCount: Int,
    val inverterModel: String,
    val systemCapacityKw: Double,
    val tiltAngle: Double,
    val cadLayoutPath: String?,
    val sldDiagramPath: String?,
    val designStatus: String,
    val submittedAt: String,
    val reviewedAt: String?,
    val reviewedBy: String?,
    val reviewNotes: String?,
    val isSynced: Boolean = false
)
