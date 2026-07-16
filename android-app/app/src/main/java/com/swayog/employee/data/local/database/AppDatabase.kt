package com.swayog.employee.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.swayog.employee.data.local.dao.*
import com.swayog.employee.data.local.entity.*

@Database(
    entities = [
        UserEntity::class,
        TaskEntity::class,
        AttendanceEntity::class,
        DailyCommitEntity::class,
        CustomerEntity::class,
        OutboxQueueEntity::class
    ],
    version = 7,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun userDao(): UserDao
    abstract fun taskDao(): TaskDao
    abstract fun attendanceDao(): AttendanceDao
    abstract fun dailyCommitDao(): DailyCommitDao
    abstract fun customerDao(): CustomerDao
    abstract fun outboxQueueDao(): OutboxQueueDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "swayog_employee_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
