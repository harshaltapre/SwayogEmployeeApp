package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.model.CreateInvoiceRequest
import com.swayog.employee.data.model.Invoice
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FinancialRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getInvoices(invoiceType: String? = null): Result<List<Invoice>> {
        return try {
            val response = apiService.getInvoices(invoiceType)
            if (response.isSuccessful && response.body()?.success == true) {
                // The API response payload is usually `response.body()!!.data`
                Result.success(response.body()!!.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to fetch invoices"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createInvoice(request: CreateInvoiceRequest): Result<Invoice> {
        return try {
            val response = apiService.createInvoice(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to log payment"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
