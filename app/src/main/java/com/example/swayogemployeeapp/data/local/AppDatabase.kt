package com.example.swayogemployeeapp.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.swayogemployeeapp.data.local.dao.AmcVisitDao
import com.example.swayogemployeeapp.data.local.dao.ApartmentDao
import com.example.swayogemployeeapp.data.local.dao.AttendanceRecordDao
import com.example.swayogemployeeapp.data.local.dao.BillOfMaterialsDao
import com.example.swayogemployeeapp.data.local.dao.CustomerDao
import com.example.swayogemployeeapp.data.local.dao.CustomerNotificationDao
import com.example.swayogemployeeapp.data.local.dao.DailyCommitDao
import com.example.swayogemployeeapp.data.local.dao.DispatchRecordDao
import com.example.swayogemployeeapp.data.local.dao.ElectricalDesignDao
import com.example.swayogemployeeapp.data.local.dao.ElectricalInspectionDao
import com.example.swayogemployeeapp.data.local.dao.EmployeeSessionDao
import com.example.swayogemployeeapp.data.local.dao.EmployeeTaskDao
import com.example.swayogemployeeapp.data.local.dao.InvoiceDao
import com.example.swayogemployeeapp.data.local.dao.InventoryItemDao
import com.example.swayogemployeeapp.data.local.dao.OutboxQueueDao
import com.example.swayogemployeeapp.data.local.dao.PaymentDao
import com.example.swayogemployeeapp.data.local.dao.PerformanceSnapshotDao
import com.example.swayogemployeeapp.data.local.dao.ServiceRequestDao
import com.example.swayogemployeeapp.data.local.dao.SiteSurveyDao
import com.example.swayogemployeeapp.data.local.dao.SolarDesignDao
import com.example.swayogemployeeapp.data.local.dao.SurveyEquipmentDao
import com.example.swayogemployeeapp.data.local.dao.TaskAssignmentDao
import com.example.swayogemployeeapp.data.local.dao.TaskImageDao
import com.example.swayogemployeeapp.data.local.entity.AmcVisitEntity
import com.example.swayogemployeeapp.data.local.entity.ApartmentEntity
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity
import com.example.swayogemployeeapp.data.local.entity.BillOfMaterialsEntity
import com.example.swayogemployeeapp.data.local.entity.CustomerEntity
import com.example.swayogemployeeapp.data.local.entity.CustomerNotificationEntity
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity
import com.example.swayogemployeeapp.data.local.entity.DispatchRecordEntity
import com.example.swayogemployeeapp.data.local.entity.ElectricalDesignEntity
import com.example.swayogemployeeapp.data.local.entity.ElectricalInspectionEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.data.local.entity.InvoiceEntity
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.local.entity.PaymentEntity
import com.example.swayogemployeeapp.data.local.entity.PerformanceSnapshotEntity
import com.example.swayogemployeeapp.data.local.entity.ServiceRequestEntity
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity
import com.example.swayogemployeeapp.data.local.entity.SolarDesignEntity
import com.example.swayogemployeeapp.data.local.entity.SurveyEquipmentEntity
import com.example.swayogemployeeapp.data.local.entity.TaskAssignmentEntity
import com.example.swayogemployeeapp.data.local.entity.TaskImageEntity

@Database(
    entities = [
        EmployeeSessionEntity::class,
        AttendanceRecordEntity::class,
        EmployeeTaskEntity::class,
        SiteSurveyEntity::class,
        InventoryItemEntity::class,
        DailyCommitEntity::class,
        OutboxQueueEntity::class,
        CustomerEntity::class,
        DispatchRecordEntity::class,
        SolarDesignEntity::class,
        ElectricalDesignEntity::class,
        AmcVisitEntity::class,
        ServiceRequestEntity::class,
        SurveyEquipmentEntity::class,
        BillOfMaterialsEntity::class,
        ElectricalInspectionEntity::class,
        ApartmentEntity::class,
        InvoiceEntity::class,
        PaymentEntity::class,
        TaskAssignmentEntity::class,
        TaskImageEntity::class,
        CustomerNotificationEntity::class,
        PerformanceSnapshotEntity::class
    ],
    version = 4,
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
    abstract fun customerDao(): CustomerDao
    abstract fun dispatchRecordDao(): DispatchRecordDao
    abstract fun solarDesignDao(): SolarDesignDao
    abstract fun electricalDesignDao(): ElectricalDesignDao
    abstract fun amcVisitDao(): AmcVisitDao
    abstract fun serviceRequestDao(): ServiceRequestDao
    abstract fun surveyEquipmentDao(): SurveyEquipmentDao
    abstract fun billOfMaterialsDao(): BillOfMaterialsDao
    abstract fun electricalInspectionDao(): ElectricalInspectionDao
    abstract fun apartmentDao(): ApartmentDao
    abstract fun invoiceDao(): InvoiceDao
    abstract fun paymentDao(): PaymentDao
    abstract fun taskAssignmentDao(): TaskAssignmentDao
    abstract fun taskImageDao(): TaskImageDao
    abstract fun customerNotificationDao(): CustomerNotificationDao
    abstract fun performanceSnapshotDao(): PerformanceSnapshotDao

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
