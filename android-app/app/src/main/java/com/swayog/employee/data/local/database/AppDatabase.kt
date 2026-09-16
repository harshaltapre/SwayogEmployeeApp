package com.swayog.employee.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.swayog.employee.data.local.dao.*
import com.swayog.employee.data.local.entity.*

// IMPORTANT: Any change to an @Entity class requires incrementing the version number below
@Database(
    entities = [
        UserEntity::class,
        TaskEntity::class,
        AttendanceEntity::class,
        DailyCommitEntity::class,
        CustomerEntity::class,
        OutboxQueueEntity::class
    ],
    version = 15,
    exportSchema = true
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
        
        private val MIGRATION_14_15 = object : Migration(14, 15) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Add indexes for better query performance
                database.execSQL("CREATE INDEX IF NOT EXISTS index_attendance_employeeId_date ON attendance(employeeId, date)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_attendance_date ON attendance(date)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_task_employeeId ON task(employeeId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_outboxQueue_isSynced ON outboxQueue(isSynced)")
            }
        }
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "swayog_employee_database"
                )
                    .addMigrations(MIGRATION_14_15)
                    .fallbackToDestructiveMigrationOnDowngrade()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
