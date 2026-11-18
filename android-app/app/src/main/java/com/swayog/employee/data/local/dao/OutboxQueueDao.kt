package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.OutboxQueueEntity

@Dao
interface OutboxQueueDao {
    
    @Query("SELECT * FROM outbox_queue WHERE isSynced = 0 AND status != 'FAILED_PERMANENT' ORDER BY createdAt ASC")
    suspend fun getPendingItems(): List<OutboxQueueEntity>

    @Query("SELECT * FROM outbox_queue WHERE isSynced = 0 AND status != 'FAILED_PERMANENT' AND ownerUserId = :ownerUserId ORDER BY createdAt ASC")
    suspend fun getPendingItemsForUser(ownerUserId: String): List<OutboxQueueEntity>
    
    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND status != 'FAILED_PERMANENT'")
    suspend fun getPendingCount(): Int

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND status != 'FAILED_PERMANENT' AND ownerUserId = :ownerUserId")
    suspend fun getPendingCountForUser(ownerUserId: String): Int
    
    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND status != 'FAILED_PERMANENT'")
    fun getPendingCountFlow(): kotlinx.coroutines.flow.Flow<Int>

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND status != 'FAILED_PERMANENT' AND ownerUserId = :ownerUserId")
    fun getPendingCountFlowForUser(ownerUserId: String): kotlinx.coroutines.flow.Flow<Int>

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE status = 'FAILED_PERMANENT' AND ownerUserId = :ownerUserId")
    fun getFailedCountFlowForUser(ownerUserId: String): kotlinx.coroutines.flow.Flow<Int>

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE status = 'FAILED_PERMANENT'")
    suspend fun getFailedCount(): Int
    
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
