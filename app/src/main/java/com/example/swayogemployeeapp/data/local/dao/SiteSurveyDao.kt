package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SiteSurveyDao {
    @Query("SELECT * FROM site_surveys ORDER BY localId DESC")
    fun getAllSurveysFlow(): Flow<List<SiteSurveyEntity>>

    @Query("SELECT * FROM site_surveys WHERE taskId = :taskId LIMIT 1")
    fun getSurveyForTaskFlow(taskId: Int): Flow<SiteSurveyEntity?>

    @Query("SELECT * FROM site_surveys WHERE localId = :localId LIMIT 1")
    suspend fun getSurveyById(localId: Long): SiteSurveyEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(survey: SiteSurveyEntity): Long

    @Update
    suspend fun update(survey: SiteSurveyEntity)
}
