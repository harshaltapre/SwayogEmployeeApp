package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

/**
 * Represents a task image stored in Cloudflare R2 object storage.
 * Maps to the backend's TaskImage Prisma model.
 */
data class TaskImage(
    val id: Int,
    val taskId: Int,
    val employeeUserId: String? = null,
    val type: String, // "before" or "after"
    val url: String? = null,
    val objectKey: String? = null,
    val fileName: String? = null,
    val mimeType: String? = null,
    val fileSize: Int? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val watermarkText: String? = null,
    val uploadedAt: String? = null,
    val employee: TaskImageEmployee? = null
)

data class TaskImageEmployee(
    val id: String,
    val fullName: String? = null
)

data class TaskImagesResponse(
    val images: List<TaskImage>
)

/**
 * Payment model matching backend's Prisma Payment schema.
 * Used for read-only display in Android (coordinator/admin feature).
 */
data class Payment(
    val id: Int,
    val customerId: Int? = null,
    val taskId: Int? = null,
    val amount: Double,
    val status: String, // PENDING, COMPLETED, FAILED, REFUNDED
    val paymentMethod: String? = null,
    val transactionId: String? = null,
    val paidAt: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
