package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.ElectricalDesignEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ElectricalDesignDao {
    @Query("SELECT * FROM electrical_designs")
    fun getAllElectricalDesigns(): Flow<List<ElectricalDesignEntity>>

    @Query("SELECT * FROM electrical_designs WHERE id = :id")
    suspend fun getElectricalDesignById(id: String): ElectricalDesignEntity?

    @Query("SELECT * FROM electrical_designs WHERE customerId = :customerId")
    fun getElectricalDesignsByCustomer(customerId: Int): Flow<List<ElectricalDesignEntity>>

    @Query("SELECT * FROM electrical_designs WHERE engineerId = :engineerId")
    fun getElectricalDesignsByEngineer(engineerId: String): Flow<List<ElectricalDesignEntity>>

    @Query("SELECT * FROM electrical_designs WHERE designStatus = :status")
    fun getElectricalDesignsByStatus(status: String): Flow<List<ElectricalDesignEntity>>

    @Query("SELECT * FROM electrical_designs WHERE isSynced = 0")
    suspend fun getUnsyncedElectricalDesigns(): List<ElectricalDesignEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertElectricalDesign(design: ElectricalDesignEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertElectricalDesigns(designs: List<ElectricalDesignEntity>)

    @Update
    suspend fun updateElectricalDesign(design: ElectricalDesignEntity)

    @Delete
    suspend fun deleteElectricalDesign(design: ElectricalDesignEntity)

    @Query("DELETE FROM electrical_designs")
    suspend fun deleteAllElectricalDesigns()
}
