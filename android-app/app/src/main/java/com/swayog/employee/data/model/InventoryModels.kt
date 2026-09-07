package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class InventoryItem(
    val id: Int,
    val sku: String,
    val name: String,
    val category: String,
    val company: String? = null,
    val capacityKw: String? = null,
    val unit: String? = "unit",
    val inStock: Int = 0,
    val minThreshold: Int = 0,
    val supplier: String? = null,
    val pricePerUnit: Float = 0f,
    val entryDate: String? = null
)

data class DispatchRecord(
    val id: String,
    val customerId: Int,
    val itemId: Int,
    val quantity: Int,
    val dispatchedAt: String? = null,
    val notes: String? = null,
    val customerName: String? = null,
    val itemName: String? = null,
    val unitPrice: Float? = null,
    val unit: String? = "unit",
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class DispatchRequest(
    val customerId: Int,
    val itemId: Int,
    val quantity: Int,
    val dispatchedAt: String? = null,
    val notes: String? = null
)

data class UpdateDispatchRequest(
    val quantity: Int? = null,
    val notes: String? = null
)

data class CreateInventoryRequest(
    val sku: String,
    val name: String,
    val category: String,
    val company: String? = null,
    val capacityKw: String? = null,
    val unit: String? = "unit",
    val inStock: Int = 0,
    val minThreshold: Int = 0,
    val supplier: String? = null,
    val pricePerUnit: Float = 0f,
    val entryDate: String? = null
)

data class UpdateInventoryRequest(
    val sku: String? = null,
    val name: String? = null,
    val category: String? = null,
    val company: String? = null,
    val capacityKw: String? = null,
    val unit: String? = null,
    val inStock: Int? = null,
    val minThreshold: Int? = null,
    val supplier: String? = null,
    val pricePerUnit: Float? = null,
    val entryDate: String? = null
)
