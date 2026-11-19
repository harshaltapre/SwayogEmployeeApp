package com.swayog.employee.data.local.dao

import androidx.room.*
import com.swayog.employee.data.local.entity.OutboxQueueEntity

@Dao
interface OutboxQueueDao {
    
    @Query("SELECT * FROM outbox_queue WHERE isSynced = 0 ORDER BY createdAt ASC")
    suspend fun getPendingItems(): List<OutboxQueueEntity>

    /**
     * Strictly returns pending items owned by [ownerUserId].
     * Legacy items with empty ownerUserId ("") are intentionally excluded and quarantined
     * so they are never replayed under another employee's session.
     */
    @Query("SELECT * FROM outbox_queue WHERE isSynced = 0 AND ownerUserId = :ownerUserId AND ownerUserId != '' ORDER BY createdAt ASC")
    suspend fun getPendingItemsForUser(ownerUserId: String): List<OutboxQueueEntity>

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND ownerUserId = :ownerUserId AND ownerUserId != ''")
    suspend fun getPendingCountForUser(ownerUserId: String): Int

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND ownerUserId = :ownerUserId AND ownerUserId != ''")
    fun getPendingCountFlowForUser(ownerUserId: String): kotlinx.coroutines.flow.Flow<Int>

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND ownerUserId = :ownerUserId AND ownerUserId != '' AND retryCount > 0")
    suspend fun getFailedCountForUser(ownerUserId: String): Int

    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0 AND ownerUserId = ''")
    suspend fun getQuarantinedLegacyCount(): Int
    
    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0")
    suspend fun getPendingCount(): Int
    
    @Query("SELECT COUNT(*) FROM outbox_queue WHERE isSynced = 0")
    fun getPendingCountFlow(): kotlinx.coroutines.flow.Flow<Int>
    
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
