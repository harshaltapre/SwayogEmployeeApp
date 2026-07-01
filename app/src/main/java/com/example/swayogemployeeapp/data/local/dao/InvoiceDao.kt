package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.InvoiceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface InvoiceDao {
    @Query("SELECT * FROM invoices")
    fun getAllInvoices(): Flow<List<InvoiceEntity>>

    @Query("SELECT * FROM invoices WHERE id = :id")
    suspend fun getInvoiceById(id: String): InvoiceEntity?

    @Query("SELECT * FROM invoices WHERE customerId = :customerId")
    fun getInvoicesByCustomer(customerId: Int): Flow<List<InvoiceEntity>>

    @Query("SELECT * FROM invoices WHERE paymentStatus = :status")
    fun getInvoicesByStatus(status: String): Flow<List<InvoiceEntity>>

    @Query("SELECT * FROM invoices WHERE isSynced = 0")
    suspend fun getUnsyncedInvoices(): List<InvoiceEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoice(invoice: InvoiceEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoices(invoices: List<InvoiceEntity>)

    @Update
    suspend fun updateInvoice(invoice: InvoiceEntity)

    @Delete
    suspend fun deleteInvoice(invoice: InvoiceEntity)

    @Query("DELETE FROM invoices")
    suspend fun deleteAllInvoices()
}
