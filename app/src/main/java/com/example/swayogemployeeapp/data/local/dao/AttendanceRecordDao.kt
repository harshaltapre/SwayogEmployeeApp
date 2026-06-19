package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AttendanceRecordDao {
    @Query("SELECT * FROM attendance_records ORDER BY localId DESC")
    fun getAllRecordsFlow(): Flow<List<AttendanceRecordEntity>>

    @Query("SELECT * FROM attendance_records WHERE date = :date ORDER BY localId DESC LIMIT 1")
    fun getRecordForDateFlow(date: String): Flow<AttendanceRecordEntity?>

    @Query("SELECT * FROM attendance_records WHERE date = :date ORDER BY localId DESC LIMIT 1")
    suspend fun getRecordForDate(date: String): AttendanceRecordEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(record: AttendanceRecordEntity): Long

    @Update
    suspend fun update(record: AttendanceRecordEntity)

    @Query("SELECT * FROM attendance_records WHERE isSynced = 0")
    suspend fun getUnsyncedRecords(): List<AttendanceRecordEntity>
}
