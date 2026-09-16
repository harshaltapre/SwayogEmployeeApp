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

        val ALL_MIGRATIONS: Array<Migration> = (1..14).flatMap { from ->
            (1..14).filter { to -> to != from }.map { to ->
                object : Migration(from, to) {
                    override fun migrate(db: SupportSQLiteDatabase) {
                        // Recreate tables to ensure schema matches latest entity definitions without crash
                        db.execSQL("DROP TABLE IF EXISTS `users`")
                        db.execSQL("DROP TABLE IF EXISTS `tasks`")
                        db.execSQL("DROP TABLE IF EXISTS `attendance`")
                        db.execSQL("DROP TABLE IF EXISTS `daily_commits`")
                        db.execSQL("DROP TABLE IF EXISTS `customers`")
                        db.execSQL("DROP TABLE IF EXISTS `outbox_queue`")

                        db.execSQL("CREATE TABLE IF NOT EXISTS `users` (`id` TEXT NOT NULL, `loginId` TEXT NOT NULL, `employeeCode` TEXT, `email` TEXT NOT NULL, `phoneNumber` TEXT, `fullName` TEXT NOT NULL, `role` TEXT NOT NULL, `designationTitle` TEXT, `departmentId` TEXT, `reportingManagerId` TEXT, `isActive` INTEGER NOT NULL, `createdAt` TEXT NOT NULL, `jobRole` TEXT, `zone` TEXT, `monthlySalaryInr` INTEGER, `profilePhotoUrl` TEXT, `rating` REAL, PRIMARY KEY(`id`))")
                        db.execSQL("CREATE TABLE IF NOT EXISTS `tasks` (`id` TEXT NOT NULL, `jobType` TEXT, `description` TEXT, `customerName` TEXT, `customerPhone` TEXT, `address` TEXT, `latitude` REAL, `longitude` REAL, `status` TEXT, `scheduledTime` TEXT, `employeeUserId` TEXT, `assignedById` TEXT, `completionMessage` TEXT, `completionDocumentUrl` TEXT, `beforeImageUrl` TEXT, `afterImageUrl` TEXT, `beforeLatitude` REAL, `beforeLongitude` REAL, `afterLatitude` REAL, `afterLongitude` REAL, `completedAt` TEXT, `createdAt` TEXT, `updatedAt` TEXT, `isSynced` INTEGER NOT NULL, `invoiceJson` TEXT, `taskType` TEXT, `imagesJson` TEXT, `sitePhotosJson` TEXT, `beforeImagesJson` TEXT, `afterImagesJson` TEXT, `assignedEmployeeName` TEXT, `assignedEmployeePhone` TEXT, PRIMARY KEY(`id`))")
                        db.execSQL("CREATE INDEX IF NOT EXISTS `index_tasks_employeeUserId` ON `tasks` (`employeeUserId`)")
                        db.execSQL("CREATE INDEX IF NOT EXISTS `index_tasks_status` ON `tasks` (`status`)")
                        db.execSQL("CREATE INDEX IF NOT EXISTS `index_tasks_taskType` ON `tasks` (`taskType`)")
                        db.execSQL("CREATE TABLE IF NOT EXISTS `attendance` (`id` TEXT NOT NULL, `employeeId` TEXT NOT NULL, `date` TEXT NOT NULL, `checkInTime` TEXT, `checkOutTime` TEXT, `totalMinutes` INTEGER, `status` TEXT NOT NULL, `notes` TEXT, `checkInSelfieUrl` TEXT, `checkInLocation` TEXT, `isSynced` INTEGER NOT NULL, `source` TEXT, `manualOverride` INTEGER NOT NULL, `reviewedBy` TEXT, `reviewerName` TEXT, `isAttendanceCompleted` INTEGER NOT NULL, PRIMARY KEY(`id`))")
                        db.execSQL("CREATE TABLE IF NOT EXISTS `daily_commits` (`id` TEXT NOT NULL, `employeeId` TEXT NOT NULL, `commitDate` TEXT NOT NULL, `taskWorkedOn` TEXT NOT NULL, `workSummary` TEXT NOT NULL, `hoursSpent` REAL NOT NULL, `issuesBlockers` TEXT, `tomorrowPlan` TEXT, `attachmentUrl` TEXT, `submittedAt` TEXT NOT NULL, `createdAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))")
                        db.execSQL("CREATE TABLE IF NOT EXISTS `customers` (`id` INTEGER NOT NULL, `customerCode` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT NOT NULL, `phoneNumber` TEXT NOT NULL, `city` TEXT, `address` TEXT, `systemSizeKw` REAL, `installationDate` TEXT, `warrantyExpiry` TEXT, `panelBrand` TEXT, `inverterBrand` TEXT, `inverterModel` TEXT, `amcStatus` TEXT NOT NULL, `amcExpiryDate` TEXT, `status` TEXT NOT NULL, `projectStage` INTEGER, `latitude` REAL, `longitude` REAL, `inverterLoginId` TEXT, `inverterPassword` TEXT, `inverterApiKey` TEXT, `inverterDeviceSn` TEXT, `commissionAmount` REAL, `portalPassword` TEXT, PRIMARY KEY(`id`))")
                        db.execSQL("CREATE TABLE IF NOT EXISTS `outbox_queue` (`id` TEXT NOT NULL, `endpoint` TEXT NOT NULL, `method` TEXT NOT NULL, `payload` TEXT NOT NULL, `createdAt` TEXT NOT NULL, `retryCount` INTEGER NOT NULL, `isSynced` INTEGER NOT NULL, `clientUploadId` TEXT, PRIMARY KEY(`id`))")
                    }
                }
            }
        }.toTypedArray()
        
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
                    .addMigrations(*ALL_MIGRATIONS, MIGRATION_14_15)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
