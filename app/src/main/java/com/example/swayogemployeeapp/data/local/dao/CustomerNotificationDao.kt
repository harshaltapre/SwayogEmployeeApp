package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.CustomerNotificationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CustomerNotificationDao {
    @Query("SELECT * FROM customer_notifications")
    fun getAllCustomerNotifications(): Flow<List<CustomerNotificationEntity>>

    @Query("SELECT * FROM customer_notifications WHERE id = :id")
    suspend fun getCustomerNotificationById(id: String): CustomerNotificationEntity?

    @Query("SELECT * FROM customer_notifications WHERE customerId = :customerId")
    fun getCustomerNotificationsByCustomer(customerId: Int): Flow<List<CustomerNotificationEntity>>

    @Query("SELECT * FROM customer_notifications WHERE type = :type")
    fun getCustomerNotificationsByType(type: String): Flow<List<CustomerNotificationEntity>>

    @Query("SELECT * FROM customer_notifications WHERE isRead = :isRead")
    fun getCustomerNotificationsByReadStatus(isRead: Boolean): Flow<List<CustomerNotificationEntity>>

    @Query("SELECT * FROM customer_notifications WHERE isSynced = 0")
    suspend fun getUnsyncedCustomerNotifications(): List<CustomerNotificationEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomerNotification(notification: CustomerNotificationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomerNotifications(notifications: List<CustomerNotificationEntity>)

    @Update
    suspend fun updateCustomerNotification(notification: CustomerNotificationEntity)

    @Delete
    suspend fun deleteCustomerNotification(notification: CustomerNotificationEntity)

    @Query("DELETE FROM customer_notifications")
    suspend fun deleteAllCustomerNotifications()
}
