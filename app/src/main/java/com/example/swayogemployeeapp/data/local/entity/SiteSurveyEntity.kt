package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "site_surveys")
data class SiteSurveyEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val taskId: Int,
    val customerId: String,
    val roofType: String,           // "Concrete", "Tin Sheet", "Asbestos", "Ground Mount"
    val lengthFt: Double,
    val widthFt: Double,
    val obstacleNotes: String,
    val shadowFactors: String,      // JSON string of surrounding trees/buildings
    val recommendedCapacityKw: Double,
    val coordinatesLatitude: Double,
    val coordinatesLongitude: Double,
    val localPhotoPaths: String,    // Comma-separated absolute paths to local compressed photos
    val isSynced: Boolean = false
)
