package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.AttendanceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AttendanceDao {
    
    @Query("SELECT * FROM attendance WHERE employeeId = :employeeId ORDER BY date DESC")
    fun getAttendanceByEmployeeId(employeeId: String): Flow<List<AttendanceEntity>>
    
    @Query("SELECT * FROM attendance WHERE employeeId = :employeeId AND date = :date")
    suspend fun getAttendanceByDate(employeeId: String, date: String): AttendanceEntity?
    
    @Query("SELECT * FROM attendance WHERE date = :todayDate LIMIT 1")
    suspend fun getTodayAttendance(todayDate: String = java.time.LocalDate.now().toString()): AttendanceEntity?
    
    @Query("SELECT * FROM attendance WHERE employeeId = :employeeId AND date >= :startDate AND date <= :endDate")
    fun getAttendanceByDateRange(employeeId: String, startDate: String, endDate: String): Flow<List<AttendanceEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendance(attendance: AttendanceEntity)
    
    @Update
    suspend fun updateAttendance(attendance: AttendanceEntity)
    
    @Delete
    suspend fun deleteAttendance(attendance: AttendanceEntity)
    
    @Query("DELETE FROM attendance")
    suspend fun deleteAllAttendance()
    
    @Query("SELECT * FROM attendance WHERE isSynced = 0")
    suspend fun getUnsyncedAttendance(): List<AttendanceEntity>
}
