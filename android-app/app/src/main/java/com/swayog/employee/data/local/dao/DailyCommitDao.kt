package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.DailyCommitEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DailyCommitDao {
    
    @Query("SELECT * FROM daily_commits WHERE employeeId = :employeeId ORDER BY commitDate DESC")
    fun getDailyCommitsByEmployeeId(employeeId: String): Flow<List<DailyCommitEntity>>
    
    @Query("SELECT * FROM daily_commits WHERE employeeId = :employeeId AND commitDate = :date")
    suspend fun getDailyCommitByDate(employeeId: String, date: String): DailyCommitEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDailyCommit(dailyCommit: DailyCommitEntity)
    
    @Update
    suspend fun updateDailyCommit(dailyCommit: DailyCommitEntity)
    
    @Delete
    suspend fun deleteDailyCommit(dailyCommit: DailyCommitEntity)
    
    @Query("DELETE FROM daily_commits")
    suspend fun deleteAllDailyCommits()
    
    @Query("SELECT * FROM daily_commits WHERE isSynced = 0")
    suspend fun getUnsyncedDailyCommits(): List<DailyCommitEntity>
}
