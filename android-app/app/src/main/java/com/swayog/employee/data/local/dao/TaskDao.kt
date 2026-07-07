package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    
    @Query("SELECT * FROM tasks WHERE employeeUserId = :employeeUserId ORDER BY scheduledTime DESC")
    fun getTasksByEmployeeId(employeeUserId: String): Flow<List<TaskEntity>>
    
    @Query("SELECT * FROM tasks WHERE employeeUserId = :employeeUserId AND status != 'completed' ORDER BY scheduledTime ASC")
    fun getActiveTasksByEmployeeId(employeeUserId: String): Flow<List<TaskEntity>>
    
    @Query("SELECT * FROM tasks WHERE id = :taskId")
    suspend fun getTaskById(taskId: Int): TaskEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)
    
    @Update
    suspend fun updateTask(task: TaskEntity)
    
    @Delete
    suspend fun deleteTask(task: TaskEntity)
    
    @Query("DELETE FROM tasks")
    suspend fun deleteAllTasks()
    
    @Query("SELECT * FROM tasks WHERE isSynced = 0")
    suspend fun getUnsyncedTasks(): List<TaskEntity>
}
