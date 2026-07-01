package com.example.swayogemployeeapp.data.local.dao

import androidx.room.*
import com.example.swayogemployeeapp.data.local.entity.ApartmentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ApartmentDao {
    @Query("SELECT * FROM apartments")
    fun getAllApartments(): Flow<List<ApartmentEntity>>

    @Query("SELECT * FROM apartments WHERE id = :id")
    suspend fun getApartmentById(id: Int): ApartmentEntity?

    @Query("SELECT * FROM apartments WHERE city = :city")
    fun getApartmentsByCity(city: String): Flow<List<ApartmentEntity>>

    @Query("SELECT * FROM apartments WHERE isSynced = 0")
    suspend fun getUnsyncedApartments(): List<ApartmentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApartment(apartment: ApartmentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApartments(apartments: List<ApartmentEntity>)

    @Update
    suspend fun updateApartment(apartment: ApartmentEntity)

    @Delete
    suspend fun deleteApartment(apartment: ApartmentEntity)

    @Query("DELETE FROM apartments")
    suspend fun deleteAllApartments()
}
