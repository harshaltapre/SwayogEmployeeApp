package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.BillOfMaterialsEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BillOfMaterialsDao {
    @Query("SELECT * FROM bill_of_materials")
    fun getAllBillOfMaterials(): Flow<List<BillOfMaterialsEntity>>

    @Query("SELECT * FROM bill_of_materials WHERE id = :id")
    suspend fun getBillOfMaterialsById(id: String): BillOfMaterialsEntity?

    @Query("SELECT * FROM bill_of_materials WHERE designId = :designId")
    fun getBillOfMaterialsByDesign(designId: String): Flow<List<BillOfMaterialsEntity>>

    @Query("SELECT * FROM bill_of_materials WHERE itemId = :itemId")
    fun getBillOfMaterialsByItem(itemId: Int): Flow<List<BillOfMaterialsEntity>>

    @Query("SELECT * FROM bill_of_materials WHERE isSynced = 0")
    suspend fun getUnsyncedBillOfMaterials(): List<BillOfMaterialsEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBillOfMaterials(bom: BillOfMaterialsEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBillOfMaterialsList(bomList: List<BillOfMaterialsEntity>)

    @Update
    suspend fun updateBillOfMaterials(bom: BillOfMaterialsEntity)

    @Delete
    suspend fun deleteBillOfMaterials(bom: BillOfMaterialsEntity)

    @Query("DELETE FROM bill_of_materials")
    suspend fun deleteAllBillOfMaterials()
}
