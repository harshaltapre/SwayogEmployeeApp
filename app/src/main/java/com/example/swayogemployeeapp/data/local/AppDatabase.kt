package com.example.swayogemployeeapp.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.swayogemployeeapp.data.local.dao.AttendanceRecordDao
import com.example.swayogemployeeapp.data.local.dao.DailyCommitDao
import com.example.swayogemployeeapp.data.local.dao.EmployeeSessionDao
import com.example.swayogemployeeapp.data.local.dao.EmployeeTaskDao
import com.example.swayogemployeeapp.data.local.dao.InventoryItemDao
import com.example.swayogemployeeapp.data.local.dao.OutboxQueueDao
import com.example.swayogemployeeapp.data.local.dao.SiteSurveyDao
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity

@Database(
    entities = [
        EmployeeSessionEntity::class,
        AttendanceRecordEntity::class,
        EmployeeTaskEntity::class,
        SiteSurveyEntity::class,
        InventoryItemEntity::class,
        DailyCommitEntity::class,
        OutboxQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun employeeSessionDao(): EmployeeSessionDao
    abstract fun attendanceRecordDao(): AttendanceRecordDao
    abstract fun employeeTaskDao(): EmployeeTaskDao
    abstract fun siteSurveyDao(): SiteSurveyDao
    abstract fun inventoryItemDao(): InventoryItemDao
    abstract fun dailyCommitDao(): DailyCommitDao
    abstract fun outboxQueueDao(): OutboxQueueDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "swayog_db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
