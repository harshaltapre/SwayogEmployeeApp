package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EmployeeSessionDao {
    @Query("SELECT * FROM employee_session LIMIT 1")
    fun getSessionFlow(): Flow<EmployeeSessionEntity?>

    @Query("SELECT * FROM employee_session LIMIT 1")
    suspend fun getSession(): EmployeeSessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: EmployeeSessionEntity)

    @Query("DELETE FROM employee_session")
    suspend fun clearSession()
}
