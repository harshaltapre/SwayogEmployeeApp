package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.AmcVisitEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AmcVisitDao {
    @Query("SELECT * FROM amc_visits")
    fun getAllAmcVisits(): Flow<List<AmcVisitEntity>>

    @Query("SELECT * FROM amc_visits WHERE id = :id")
    suspend fun getAmcVisitById(id: String): AmcVisitEntity?

    @Query("SELECT * FROM amc_visits WHERE customerId = :customerId")
    fun getAmcVisitsByCustomer(customerId: Int): Flow<List<AmcVisitEntity>>

    @Query("SELECT * FROM amc_visits WHERE status = :status")
    fun getAmcVisitsByStatus(status: String): Flow<List<AmcVisitEntity>>

    @Query("SELECT * FROM amc_visits WHERE assignedEmployeeId = :employeeId")
    fun getAmcVisitsByEmployee(employeeId: String): Flow<List<AmcVisitEntity>>

    @Query("SELECT * FROM amc_visits WHERE isSynced = 0")
    suspend fun getUnsyncedAmcVisits(): List<AmcVisitEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAmcVisit(visit: AmcVisitEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAmcVisits(visits: List<AmcVisitEntity>)

    @Update
    suspend fun updateAmcVisit(visit: AmcVisitEntity)

    @Delete
    suspend fun deleteAmcVisit(visit: AmcVisitEntity)

    @Query("DELETE FROM amc_visits")
    suspend fun deleteAllAmcVisits()
}
