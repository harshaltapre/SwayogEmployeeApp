package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "payments")
data class PaymentEntity(
    @PrimaryKey val id: String,
    val taskId: Int,
    val customerId: Int,
    val amount: Double,
    val paymentMethod: String?,
    val paymentStatus: String,
    val transactionId: String?,
    val paidBy: String?,
    val paidAt: String?,
    val processedBy: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
    val isSynced: Boolean = false
)
