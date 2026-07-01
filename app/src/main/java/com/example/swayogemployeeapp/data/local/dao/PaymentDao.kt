package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.PaymentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PaymentDao {
    @Query("SELECT * FROM payments")
    fun getAllPayments(): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments WHERE id = :id")
    suspend fun getPaymentById(id: String): PaymentEntity?

    @Query("SELECT * FROM payments WHERE taskId = :taskId")
    fun getPaymentsByTask(taskId: Int): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments WHERE customerId = :customerId")
    fun getPaymentsByCustomer(customerId: Int): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments WHERE paymentStatus = :status")
    fun getPaymentsByStatus(status: String): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments WHERE isSynced = 0")
    suspend fun getUnsyncedPayments(): List<PaymentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: PaymentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayments(payments: List<PaymentEntity>)

    @Update
    suspend fun updatePayment(payment: PaymentEntity)

    @Delete
    suspend fun deletePayment(payment: PaymentEntity)

    @Query("DELETE FROM payments")
    suspend fun deleteAllPayments()
}
