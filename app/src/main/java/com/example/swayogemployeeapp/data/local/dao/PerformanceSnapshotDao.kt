package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.PerformanceSnapshotEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PerformanceSnapshotDao {
    @Query("SELECT * FROM performance_snapshots")
    fun getAllPerformanceSnapshots(): Flow<List<PerformanceSnapshotEntity>>

    @Query("SELECT * FROM performance_snapshots WHERE id = :id")
    suspend fun getPerformanceSnapshotById(id: String): PerformanceSnapshotEntity?

    @Query("SELECT * FROM performance_snapshots WHERE employeeId = :employeeId")
    fun getPerformanceSnapshotsByEmployee(employeeId: String): Flow<List<PerformanceSnapshotEntity>>

    @Query("SELECT * FROM performance_snapshots WHERE employeeId = :employeeId AND month = :month AND year = :year")
    suspend fun getPerformanceSnapshotByMonthYear(employeeId: String, month: Int, year: Int): PerformanceSnapshotEntity?

    @Query("SELECT * FROM performance_snapshots WHERE isSynced = 0")
    suspend fun getUnsyncedPerformanceSnapshots(): List<PerformanceSnapshotEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPerformanceSnapshot(snapshot: PerformanceSnapshotEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPerformanceSnapshots(snapshots: List<PerformanceSnapshotEntity>)

    @Update
    suspend fun updatePerformanceSnapshot(snapshot: PerformanceSnapshotEntity)

    @Delete
    suspend fun deletePerformanceSnapshot(snapshot: PerformanceSnapshotEntity)

    @Query("DELETE FROM performance_snapshots")
    suspend fun deleteAllPerformanceSnapshots()
}
