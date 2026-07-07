package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class InventoryItem(
    val id: Int,
    val sku: String,
    val name: String,
    val category: String,
    val inStock: Int,
    val minThreshold: Int,
    val supplier: String?,
    val pricePerUnit: Float,
    val entryDate: String
)

data class DispatchRecord(
    val id: String,
    val customerId: Int,
    val itemId: Int,
    val quantity: Int,
    val dispatchedAt: String,
    val notes: String?
)

data class DispatchRequest(
    val customerId: Int,
    val itemId: Int,
    val quantity: Int,
    val notes: String?
)
