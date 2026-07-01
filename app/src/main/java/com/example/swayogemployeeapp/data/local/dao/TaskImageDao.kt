package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.TaskImageEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskImageDao {
    @Query("SELECT * FROM task_images")
    fun getAllTaskImages(): Flow<List<TaskImageEntity>>

    @Query("SELECT * FROM task_images WHERE id = :id")
    suspend fun getTaskImageById(id: String): TaskImageEntity?

    @Query("SELECT * FROM task_images WHERE taskId = :taskId")
    fun getTaskImagesByTask(taskId: Int): Flow<List<TaskImageEntity>>

    @Query("SELECT * FROM task_images WHERE employeeUserId = :employeeId")
    fun getTaskImagesByEmployee(employeeId: String): Flow<List<TaskImageEntity>>

    @Query("SELECT * FROM task_images WHERE type = :type")
    fun getTaskImagesByType(type: String): Flow<List<TaskImageEntity>>

    @Query("SELECT * FROM task_images WHERE isSynced = 0")
    suspend fun getUnsyncedTaskImages(): List<TaskImageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTaskImage(image: TaskImageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTaskImages(images: List<TaskImageEntity>)

    @Update
    suspend fun updateTaskImage(image: TaskImageEntity)

    @Delete
    suspend fun deleteTaskImage(image: TaskImageEntity)

    @Query("DELETE FROM task_images")
    suspend fun deleteAllTaskImages()
}
