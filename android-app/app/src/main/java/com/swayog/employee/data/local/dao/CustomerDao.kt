package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.CustomerEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CustomerDao {
    
    @Query("SELECT * FROM customers ORDER BY fullName ASC")
    fun getAllCustomers(): Flow<List<CustomerEntity>>
    
    @Query("SELECT * FROM customers WHERE city = :city")
    fun getCustomersByCity(city: String): Flow<List<CustomerEntity>>
    
    @Query("SELECT * FROM customers WHERE id = :customerId")
    suspend fun getCustomerById(customerId: Int): CustomerEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomer(customer: CustomerEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomers(customers: List<CustomerEntity>)
    
    @Update
    suspend fun updateCustomer(customer: CustomerEntity)
    
    @Delete
    suspend fun deleteCustomer(customer: CustomerEntity)
    
    @Query("DELETE FROM customers")
    suspend fun deleteAllCustomers()
}
