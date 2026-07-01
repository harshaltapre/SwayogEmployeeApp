package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.ElectricalInspectionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ElectricalInspectionDao {
    @Query("SELECT * FROM electrical_inspections")
    fun getAllElectricalInspections(): Flow<List<ElectricalInspectionEntity>>

    @Query("SELECT * FROM electrical_inspections WHERE id = :id")
    suspend fun getElectricalInspectionById(id: String): ElectricalInspectionEntity?

    @Query("SELECT * FROM electrical_inspections WHERE customerId = :customerId")
    fun getElectricalInspectionsByCustomer(customerId: Int): Flow<List<ElectricalInspectionEntity>>

    @Query("SELECT * FROM electrical_inspections WHERE inspectorId = :inspectorId")
    fun getElectricalInspectionsByInspector(inspectorId: String): Flow<List<ElectricalInspectionEntity>>

    @Query("SELECT * FROM electrical_inspections WHERE inspectionStatus = :status")
    fun getElectricalInspectionsByStatus(status: String): Flow<List<ElectricalInspectionEntity>>

    @Query("SELECT * FROM electrical_inspections WHERE isSynced = 0")
    suspend fun getUnsyncedElectricalInspections(): List<ElectricalInspectionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertElectricalInspection(inspection: ElectricalInspectionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertElectricalInspections(inspections: List<ElectricalInspectionEntity>)

    @Update
    suspend fun updateElectricalInspection(inspection: ElectricalInspectionEntity)

    @Delete
    suspend fun deleteElectricalInspection(inspection: ElectricalInspectionEntity)

    @Query("DELETE FROM electrical_inspections")
    suspend fun deleteAllElectricalInspections()
}
