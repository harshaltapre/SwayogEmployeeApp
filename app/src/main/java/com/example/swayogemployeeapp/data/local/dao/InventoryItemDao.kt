package com.example.swayogemployeeapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface InventoryItemDao {
    @Query("SELECT * FROM inventory_items ORDER BY itemName ASC")
    fun getAllItemsFlow(): Flow<List<InventoryItemEntity>>

    @Query("SELECT * FROM inventory_items ORDER BY itemName ASC")
    suspend fun getAllItemsList(): List<InventoryItemEntity>

    @Query("SELECT * FROM inventory_items WHERE id = :id LIMIT 1")
    suspend fun getItemById(id: String): InventoryItemEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<InventoryItemEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: InventoryItemEntity)

    @Update
    suspend fun update(item: InventoryItemEntity)

    @Query("UPDATE inventory_items SET quantityInStock = :quantity WHERE id = :id")
    suspend fun updateStock(id: String, quantity: Double)
}
