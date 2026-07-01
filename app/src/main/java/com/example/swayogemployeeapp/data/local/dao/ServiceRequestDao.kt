package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.ServiceRequestEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ServiceRequestDao {
    @Query("SELECT * FROM service_requests")
    fun getAllServiceRequests(): Flow<List<ServiceRequestEntity>>

    @Query("SELECT * FROM service_requests WHERE id = :id")
    suspend fun getServiceRequestById(id: Int): ServiceRequestEntity?

    @Query("SELECT * FROM service_requests WHERE customerId = :customerId")
    fun getServiceRequestsByCustomer(customerId: Int): Flow<List<ServiceRequestEntity>>

    @Query("SELECT * FROM service_requests WHERE status = :status")
    fun getServiceRequestsByStatus(status: String): Flow<List<ServiceRequestEntity>>

    @Query("SELECT * FROM service_requests WHERE isSynced = 0")
    suspend fun getUnsyncedServiceRequests(): List<ServiceRequestEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertServiceRequest(request: ServiceRequestEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertServiceRequests(requests: List<ServiceRequestEntity>)

    @Update
    suspend fun updateServiceRequest(request: ServiceRequestEntity)

    @Delete
    suspend fun deleteServiceRequest(request: ServiceRequestEntity)

    @Query("DELETE FROM service_requests")
    suspend fun deleteAllServiceRequests()
}
