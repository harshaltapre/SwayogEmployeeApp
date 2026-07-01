package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity

@Dao
interface OutboxQueueDao {
    @Query("SELECT * FROM outbox_queue ORDER BY localId ASC")
    suspend fun getQueue(): List<OutboxQueueEntity>

    @Query("SELECT * FROM outbox_queue ORDER BY localId ASC")
    fun getQueueFlow(): kotlinx.coroutines.flow.Flow<List<OutboxQueueEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(item: OutboxQueueEntity): Long

    @Query("DELETE FROM outbox_queue WHERE localId = :localId")
    suspend fun dequeue(localId: Long)

    @Query("UPDATE outbox_queue SET isProcessing = :isProcessing WHERE localId = :localId")
    suspend fun updateProcessingStatus(localId: Long, isProcessing: Boolean)
}
