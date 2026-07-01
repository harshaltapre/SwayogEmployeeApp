package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.data.remote.NetworkClient
import kotlinx.coroutines.flow.Flow

class InventoryRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)
    private val apiService = NetworkClient.getApiService(context)

    suspend fun syncInventoryFromServer() {
        try {
            val response = apiService.getInventory()
            if (response.isSuccessful) {
                val inventoryList = response.body() ?: emptyList()
                val entities = inventoryList.map { dto ->
                    InventoryItemEntity(
                        id = dto.id.toString(),
                        itemName = dto.name,
                        category = dto.category,
                        quantityInStock = dto.inStock,
                        unit = "Units",
                        qrCodeHash = dto.sku
                    )
                }
                db.inventoryItemDao().insertAll(entities)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getAllItems(): Flow<List<InventoryItemEntity>> = db.inventoryItemDao().getAllItemsFlow()

    suspend fun issueStock(itemId: String, quantity: Double): Boolean {
        val item = db.inventoryItemDao().getItemById(itemId) ?: return false
        if (item.quantityInStock >= quantity) {
            val newQty = item.quantityInStock - quantity
            db.inventoryItemDao().updateStock(itemId, newQty)
            return true
        }
        return false
    }

    suspend fun adjustStockOffline(itemId: String, quantity: Double) {
        val item = db.inventoryItemDao().getItemById(itemId)
        if (item != null) {
            db.inventoryItemDao().updateStock(itemId, quantity)
        }
    }

    suspend fun insertItem(item: InventoryItemEntity) {
        db.inventoryItemDao().insert(item)
    }
}
