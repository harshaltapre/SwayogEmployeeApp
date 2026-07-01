package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.SurveyEquipmentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SurveyEquipmentDao {
    @Query("SELECT * FROM survey_equipment")
    fun getAllSurveyEquipment(): Flow<List<SurveyEquipmentEntity>>

    @Query("SELECT * FROM survey_equipment WHERE id = :id")
    suspend fun getSurveyEquipmentById(id: String): SurveyEquipmentEntity?

    @Query("SELECT * FROM survey_equipment WHERE assignedTo = :assignedTo")
    fun getSurveyEquipmentByAssignee(assignedTo: String): Flow<List<SurveyEquipmentEntity>>

    @Query("SELECT * FROM survey_equipment WHERE status = :status")
    fun getSurveyEquipmentByStatus(status: String): Flow<List<SurveyEquipmentEntity>>

    @Query("SELECT * FROM survey_equipment WHERE isSynced = 0")
    suspend fun getUnsyncedSurveyEquipment(): List<SurveyEquipmentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSurveyEquipment(equipment: SurveyEquipmentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSurveyEquipmentList(equipment: List<SurveyEquipmentEntity>)

    @Update
    suspend fun updateSurveyEquipment(equipment: SurveyEquipmentEntity)

    @Delete
    suspend fun deleteSurveyEquipment(equipment: SurveyEquipmentEntity)

    @Query("DELETE FROM survey_equipment")
    suspend fun deleteAllSurveyEquipment()
}
