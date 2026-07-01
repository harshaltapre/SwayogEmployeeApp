package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "electrical_inspections")
data class ElectricalInspectionEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val inspectorId: String,
    val inspectionDate: String,
    val inspectionType: String,
    val inspectionStatus: String,
    val safetyChecklist: String?,
    val complianceStatus: String?,
    val findings: String?,
    val approvedAt: String?,
    val approvedBy: String?,
    val isSynced: Boolean = false
)
