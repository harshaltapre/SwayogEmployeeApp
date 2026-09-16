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

        /**
         * Version 14 introduced the review/source fields on cached attendance
         * records. Versions 13 and 14 were not released with an incremental
         * migration, so existing version-12 installs must upgrade directly.
         */
        private val MIGRATION_12_14 = object : Migration(12, 14) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL(
                    "CREATE TABLE attendance_new (" +
                        "id TEXT NOT NULL, " +
                        "employeeId TEXT NOT NULL, " +
                        "date TEXT NOT NULL, " +
                        "checkInTime TEXT, " +
                        "checkOutTime TEXT, " +
                        "totalMinutes INTEGER, " +
                        "status TEXT NOT NULL, " +
                        "notes TEXT, " +
                        "checkInSelfieUrl TEXT, " +
                        "checkInLocation TEXT, " +
                        "isSynced INTEGER NOT NULL, " +
                        "source TEXT, " +
                        "manualOverride INTEGER NOT NULL, " +
                        "reviewedBy TEXT, " +
                        "reviewerName TEXT, " +
                        "isAttendanceCompleted INTEGER NOT NULL, " +
                        "PRIMARY KEY(id))"
                )
                database.execSQL(
                    "INSERT INTO attendance_new (" +
                        "id, employeeId, date, checkInTime, checkOutTime, totalMinutes, status, notes, " +
                        "checkInSelfieUrl, checkInLocation, isSynced, source, manualOverride, reviewedBy, " +
                        "reviewerName, isAttendanceCompleted) " +
                        "SELECT id, employeeId, date, checkInTime, checkOutTime, totalMinutes, status, notes, " +
                        "checkInSelfieUrl, checkInLocation, isSynced, NULL, 0, NULL, NULL, 0 FROM attendance"
                )
                database.execSQL("DROP TABLE attendance")
                database.execSQL("ALTER TABLE attendance_new RENAME TO attendance")
            }
        }
        
        private val MIGRATION_14_15 = object : Migration(14, 15) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Version 15 has the same Room-managed schema as version 14.
                // Do not create ad-hoc indexes here: Room validates the complete
                // schema, including indexes declared by @Entity, and none are
                // declared for attendance or outbox_queue.
            }
        }
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "swayog_employee_database"
                )
                    .addMigrations(MIGRATION_12_14)
                    .addMigrations(MIGRATION_14_15)
                    .fallbackToDestructiveMigrationOnDowngrade()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
