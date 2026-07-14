package com.swayog.employee.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey
    val id: Int,
    val customerCode: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val city: String?,
    val address: String?,
    val systemSizeKw: Float?,
    val installationDate: String?,
    val warrantyExpiry: String?,
    val panelBrand: String?,
    val inverterBrand: String?,
    val inverterModel: String?,
    val amcStatus: String,
    val amcExpiryDate: String?,
    val status: String,
    val projectStage: Int?,
    val latitude: Double?,
    val longitude: Double?,
    val inverterLoginId: String?,
    val inverterPassword: String?,
    val inverterApiKey: String?,
    val inverterDeviceSn: String?
)
