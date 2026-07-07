package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.OutboxQueueEntity

@Dao
interface OutboxQueueDao {
    
    @Query("SELECT * FROM outbox_queue WHERE isSynced = 0 ORDER BY createdAt ASC")
    suspend fun getPendingItems(): List<OutboxQueueEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: OutboxQueueEntity)
    
    @Update
    suspend fun updateItem(item: OutboxQueueEntity)
    
    @Delete
    suspend fun deleteItem(item: OutboxQueueEntity)
    
    @Query("DELETE FROM outbox_queue WHERE isSynced = 1")
    suspend fun deleteSyncedItems()
    
    @Query("DELETE FROM outbox_queue")
    suspend fun deleteAllItems()
}
