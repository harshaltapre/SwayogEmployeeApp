package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DailyCommitDao {
    @Query("SELECT * FROM daily_commits ORDER BY localId DESC")
    fun getAllCommitsFlow(): Flow<List<DailyCommitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(commit: DailyCommitEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(commits: List<DailyCommitEntity>)

    @Update
    suspend fun update(commit: DailyCommitEntity)
}
