package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "survey_equipment")
data class SurveyEquipmentEntity(
    @PrimaryKey val id: String,
    val equipmentName: String,
    val equipmentType: String,
    val serialNumber: String?,
    val assignedTo: String?,
    val status: String,
    val lastMaintenanceDate: String?,
    val nextMaintenanceDate: String?,
    val isSynced: Boolean = false
)
