package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "apartments")
data class ApartmentEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val address: String,
    val city: String,
    val createdAt: String,
    val updatedAt: String,
    val isSynced: Boolean = false
)
