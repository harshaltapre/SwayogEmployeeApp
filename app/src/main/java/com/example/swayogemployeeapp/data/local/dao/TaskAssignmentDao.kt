package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.TaskAssignmentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskAssignmentDao {
    @Query("SELECT * FROM task_assignments")
    fun getAllTaskAssignments(): Flow<List<TaskAssignmentEntity>>

    @Query("SELECT * FROM task_assignments WHERE id = :id")
    suspend fun getTaskAssignmentById(id: String): TaskAssignmentEntity?

    @Query("SELECT * FROM task_assignments WHERE taskId = :taskId")
    fun getTaskAssignmentsByTask(taskId: Int): Flow<List<TaskAssignmentEntity>>

    @Query("SELECT * FROM task_assignments WHERE employeeUserId = :employeeId")
    fun getTaskAssignmentsByEmployee(employeeId: String): Flow<List<TaskAssignmentEntity>>

    @Query("SELECT * FROM task_assignments WHERE status = :status")
    fun getTaskAssignmentsByStatus(status: String): Flow<List<TaskAssignmentEntity>>

    @Query("SELECT * FROM task_assignments WHERE isSynced = 0")
    suspend fun getUnsyncedTaskAssignments(): List<TaskAssignmentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTaskAssignment(assignment: TaskAssignmentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTaskAssignments(assignments: List<TaskAssignmentEntity>)

    @Update
    suspend fun updateTaskAssignment(assignment: TaskAssignmentEntity)

    @Delete
    suspend fun deleteTaskAssignment(assignment: TaskAssignmentEntity)

    @Query("DELETE FROM task_assignments")
    suspend fun deleteAllTaskAssignments()
}
