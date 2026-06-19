package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EmployeeTaskDao {
    @Query("SELECT * FROM employee_tasks ORDER BY id DESC")
    fun getAllTasksFlow(): Flow<List<EmployeeTaskEntity>>

    @Query("SELECT * FROM employee_tasks WHERE id = :taskId LIMIT 1")
    fun getTaskByIdFlow(taskId: Int): Flow<EmployeeTaskEntity?>

    @Query("SELECT * FROM employee_tasks WHERE id = :taskId LIMIT 1")
    suspend fun getTaskById(taskId: Int): EmployeeTaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<EmployeeTaskEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: EmployeeTaskEntity)

    @Update
    suspend fun update(task: EmployeeTaskEntity)

    @Query("DELETE FROM employee_tasks")
    suspend fun clearTasks()
}
