package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "inventory_items")
data class InventoryItemEntity(
    @PrimaryKey val id: String,
    val itemName: String,
    val category: String, // "Module", "Inverter", "Cable", "Structure", "BOS"
    val quantityInStock: Double,
    val unit: String,
    val qrCodeHash: String?
)
