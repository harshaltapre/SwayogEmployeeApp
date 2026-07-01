package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "bill_of_materials")
data class BillOfMaterialsEntity(
    @PrimaryKey val id: String,
    val designId: String,
    val itemId: Int,
    val quantity: Int,
    val unitCost: Double,
    val totalCost: Double,
    val notes: String?,
    val isSynced: Boolean = false
)
