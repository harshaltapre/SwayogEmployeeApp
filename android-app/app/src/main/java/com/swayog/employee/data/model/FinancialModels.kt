package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

data class  Invoice(
    val id: String,
    val invoiceNumber: String? = null,
    val customerId: Int,
    val description: String,
    val amount: Double,
    @SerializedName("date", alternate = ["createdAt"])
    val date: String,
    val status: String,
    val invoiceType: String? = null,
    val paymentMethod: String? = null,
    val proofUrl: String? = null
)

data class CreateInvoiceRequest(
    val invoiceNumber: String? = null,
    val customerId: Int,
    val description: String,
    val amount: Double,
    val date: String,
    val status: String,
    val invoiceType: String? = null,
    val paymentMethod: String? = null
)
