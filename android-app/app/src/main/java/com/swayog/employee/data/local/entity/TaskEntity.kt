package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.swayog.employee.data.model.Task

@Entity(
    tableName = "tasks",
    indices = [
        Index(value = ["employeeUserId"]),
        Index(value = ["status"]),
        Index(value = ["taskType"])
    ]
)
data class TaskEntity(
    @PrimaryKey
    val id: String,
    val jobType: String? = null,
    val description: String? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val address: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val status: String? = null,
    val scheduledTime: String? = null,
    val employeeUserId: String? = null,
    val assignedById: String? = null,
    val completionMessage: String? = null,
    val completionDocumentUrl: String? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val beforeLatitude: Double? = null,
    val beforeLongitude: Double? = null,
    val afterLatitude: Double? = null,
    val afterLongitude: Double? = null,
    val completedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val isSynced: Boolean = true,
    val invoiceJson: String? = null,
    val taskType: String? = null, // "SITE_VISIT", "AMC_VISIT", "REGULAR"
    val imagesJson: String? = null, // JSON array of image URLs for site visits
    val sitePhotosJson: String? = null, // JSON array of site photo URLs
    val beforeImagesJson: String? = null, // JSON array of before image URLs for AMC visits
    val afterImagesJson: String? = null, // JSON array of after image URLs for AMC visits
    val assignedEmployeeName: String? = null, // Employee name for customer notifications
    val assignedEmployeePhone: String? = null // Employee phone for customer notifications
) {
    fun toTask(): Task {
        val gson = com.google.gson.Gson()
        val sitePhotosList = sitePhotosJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }
            ?: imagesJson?.let { try { gson.fromJson(it, Array<String>::class.java).toList() } catch(_: Exception) { null } }
        return Task(
            id = id,
            jobType = jobType,
            description = description,
            customerName = customerName,
            customerPhone = customerPhone,
            address = address,
            latitude = latitude,
            longitude = longitude,
            status = status,
            scheduledTime = scheduledTime,
            employeeUserId = employeeUserId,
            assignedById = assignedById,
            completionMessage = completionMessage,
            completionDocumentUrl = completionDocumentUrl,
            beforeImageUrl = beforeImageUrl,
            afterImageUrl = afterImageUrl,
            beforeLatitude = beforeLatitude,
            beforeLongitude = beforeLongitude,
            afterLatitude = afterLatitude,
            afterLongitude = afterLongitude,
            completedAt = completedAt,
            createdAt = createdAt,
            updatedAt = updatedAt,
            invoice = invoiceJson?.let { gson.fromJson(it, com.swayog.employee.data.model.Invoice::class.java) },
            taskType = taskType,
            images = sitePhotosList,
            sitePhotos = sitePhotosList,
            assignedEmployeeName = assignedEmployeeName,
            assignedEmployeePhone = assignedEmployeePhone
        )
    }
}

