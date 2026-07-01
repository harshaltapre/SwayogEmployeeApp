package com.example.swayogemployeeapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "invoices")
data class InvoiceEntity(
    @PrimaryKey val id: String,
    val invoiceNumber: String?,
    val customerId: Int,
    val invoiceType: String,
    val amount: Double,
    val paymentStatus: String,
    val amountPaid: Double,
    val invoiceDate: String,
    val paymentDate: String?,
    val zone: String?,
    val state: String?,
    val partnerId: String?,
    val createdAt: String,
    val updatedAt: String,
    val description: String?,
    val paymentMethod: String?,
    val proofUrl: String?,
    val isSynced: Boolean = false
)
