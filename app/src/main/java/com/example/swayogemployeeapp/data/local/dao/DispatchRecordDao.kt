package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.DispatchRecordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DispatchRecordDao {
    @Query("SELECT * FROM dispatch_records")
    fun getAllDispatchRecords(): Flow<List<DispatchRecordEntity>>

    @Query("SELECT * FROM dispatch_records WHERE id = :id")
    suspend fun getDispatchRecordById(id: String): DispatchRecordEntity?

    @Query("SELECT * FROM dispatch_records WHERE customerId = :customerId")
    fun getDispatchRecordsByCustomer(customerId: Int): Flow<List<DispatchRecordEntity>>

    @Query("SELECT * FROM dispatch_records WHERE isSynced = 0")
    suspend fun getUnsyncedDispatchRecords(): List<DispatchRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDispatchRecord(record: DispatchRecordEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDispatchRecords(records: List<DispatchRecordEntity>)

    @Update
    suspend fun updateDispatchRecord(record: DispatchRecordEntity)

    @Delete
    suspend fun deleteDispatchRecord(record: DispatchRecordEntity)

    @Query("DELETE FROM dispatch_records")
    suspend fun deleteAllDispatchRecords()
}
