package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.SolarDesignEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SolarDesignDao {
    @Query("SELECT * FROM solar_designs")
    fun getAllSolarDesigns(): Flow<List<SolarDesignEntity>>

    @Query("SELECT * FROM solar_designs WHERE id = :id")
    suspend fun getSolarDesignById(id: String): SolarDesignEntity?

    @Query("SELECT * FROM solar_designs WHERE customerId = :customerId")
    fun getSolarDesignsByCustomer(customerId: Int): Flow<List<SolarDesignEntity>>

    @Query("SELECT * FROM solar_designs WHERE engineerId = :engineerId")
    fun getSolarDesignsByEngineer(engineerId: String): Flow<List<SolarDesignEntity>>

    @Query("SELECT * FROM solar_designs WHERE designStatus = :status")
    fun getSolarDesignsByStatus(status: String): Flow<List<SolarDesignEntity>>

    @Query("SELECT * FROM solar_designs WHERE isSynced = 0")
    suspend fun getUnsyncedSolarDesigns(): List<SolarDesignEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSolarDesign(design: SolarDesignEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSolarDesigns(designs: List<SolarDesignEntity>)

    @Update
    suspend fun updateSolarDesign(design: SolarDesignEntity)

    @Delete
    suspend fun deleteSolarDesign(design: SolarDesignEntity)

    @Query("DELETE FROM solar_designs")
    suspend fun deleteAllSolarDesigns()
}
