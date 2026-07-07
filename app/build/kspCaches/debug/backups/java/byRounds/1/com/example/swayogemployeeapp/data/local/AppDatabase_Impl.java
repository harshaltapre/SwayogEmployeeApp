package com.example.swayogemployeeapp.data.local;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.example.swayogemployeeapp.data.local.dao.AmcVisitDao;
import com.example.swayogemployeeapp.data.local.dao.AmcVisitDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.ApartmentDao;
import com.example.swayogemployeeapp.data.local.dao.ApartmentDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.AttendanceRecordDao;
import com.example.swayogemployeeapp.data.local.dao.AttendanceRecordDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.BillOfMaterialsDao;
import com.example.swayogemployeeapp.data.local.dao.BillOfMaterialsDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.CustomerDao;
import com.example.swayogemployeeapp.data.local.dao.CustomerDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.CustomerNotificationDao;
import com.example.swayogemployeeapp.data.local.dao.CustomerNotificationDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.DailyCommitDao;
import com.example.swayogemployeeapp.data.local.dao.DailyCommitDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.DispatchRecordDao;
import com.example.swayogemployeeapp.data.local.dao.DispatchRecordDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.ElectricalDesignDao;
import com.example.swayogemployeeapp.data.local.dao.ElectricalDesignDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.ElectricalInspectionDao;
import com.example.swayogemployeeapp.data.local.dao.ElectricalInspectionDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.EmployeeSessionDao;
import com.example.swayogemployeeapp.data.local.dao.EmployeeSessionDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.EmployeeTaskDao;
import com.example.swayogemployeeapp.data.local.dao.EmployeeTaskDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.InventoryItemDao;
import com.example.swayogemployeeapp.data.local.dao.InventoryItemDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.InvoiceDao;
import com.example.swayogemployeeapp.data.local.dao.InvoiceDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.OutboxQueueDao;
import com.example.swayogemployeeapp.data.local.dao.OutboxQueueDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.PaymentDao;
import com.example.swayogemployeeapp.data.local.dao.PaymentDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.PerformanceSnapshotDao;
import com.example.swayogemployeeapp.data.local.dao.PerformanceSnapshotDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.ServiceRequestDao;
import com.example.swayogemployeeapp.data.local.dao.ServiceRequestDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.SiteSurveyDao;
import com.example.swayogemployeeapp.data.local.dao.SiteSurveyDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.SolarDesignDao;
import com.example.swayogemployeeapp.data.local.dao.SolarDesignDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.SurveyEquipmentDao;
import com.example.swayogemployeeapp.data.local.dao.SurveyEquipmentDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.TaskAssignmentDao;
import com.example.swayogemployeeapp.data.local.dao.TaskAssignmentDao_Impl;
import com.example.swayogemployeeapp.data.local.dao.TaskImageDao;
import com.example.swayogemployeeapp.data.local.dao.TaskImageDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class AppDatabase_Impl extends AppDatabase {
  private volatile EmployeeSessionDao _employeeSessionDao;

  private volatile AttendanceRecordDao _attendanceRecordDao;

  private volatile EmployeeTaskDao _employeeTaskDao;

  private volatile SiteSurveyDao _siteSurveyDao;

  private volatile InventoryItemDao _inventoryItemDao;

  private volatile DailyCommitDao _dailyCommitDao;

  private volatile OutboxQueueDao _outboxQueueDao;

  private volatile CustomerDao _customerDao;

  private volatile DispatchRecordDao _dispatchRecordDao;

  private volatile SolarDesignDao _solarDesignDao;

  private volatile ElectricalDesignDao _electricalDesignDao;

  private volatile AmcVisitDao _amcVisitDao;

  private volatile ServiceRequestDao _serviceRequestDao;

  private volatile SurveyEquipmentDao _surveyEquipmentDao;

  private volatile BillOfMaterialsDao _billOfMaterialsDao;

  private volatile ElectricalInspectionDao _electricalInspectionDao;

  private volatile ApartmentDao _apartmentDao;

  private volatile InvoiceDao _invoiceDao;

  private volatile PaymentDao _paymentDao;

  private volatile TaskAssignmentDao _taskAssignmentDao;

  private volatile TaskImageDao _taskImageDao;

  private volatile CustomerNotificationDao _customerNotificationDao;

  private volatile PerformanceSnapshotDao _performanceSnapshotDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(4) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `employee_session` (`id` TEXT NOT NULL, `loginId` TEXT NOT NULL, `email` TEXT NOT NULL, `name` TEXT NOT NULL, `role` TEXT NOT NULL, `jobRole` TEXT NOT NULL, `employeeCode` TEXT, `reportingManagerId` TEXT, `accessToken` TEXT NOT NULL, `refreshToken` TEXT NOT NULL, `lastSyncTimestamp` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `attendance_records` (`localId` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `remoteId` TEXT, `date` TEXT NOT NULL, `checkInTime` TEXT NOT NULL, `checkInLatitude` REAL NOT NULL, `checkInLongitude` REAL NOT NULL, `checkOutTime` TEXT, `checkOutLatitude` REAL, `checkOutLongitude` REAL, `totalBreakDurationSeconds` INTEGER NOT NULL, `isSynced` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `employee_tasks` (`id` INTEGER NOT NULL, `jobType` TEXT NOT NULL, `description` TEXT NOT NULL, `scheduledTime` TEXT NOT NULL, `status` TEXT NOT NULL, `customerName` TEXT NOT NULL, `customerPhone` TEXT NOT NULL, `address` TEXT NOT NULL, `latitude` REAL, `longitude` REAL, `completionMessage` TEXT, `completionDocumentUrl` TEXT, `completedAt` TEXT, `employeeUserId` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `site_surveys` (`localId` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `taskId` INTEGER NOT NULL, `customerId` TEXT NOT NULL, `roofType` TEXT NOT NULL, `lengthFt` REAL NOT NULL, `widthFt` REAL NOT NULL, `obstacleNotes` TEXT NOT NULL, `shadowFactors` TEXT NOT NULL, `recommendedCapacityKw` REAL NOT NULL, `coordinatesLatitude` REAL NOT NULL, `coordinatesLongitude` REAL NOT NULL, `localPhotoPaths` TEXT NOT NULL, `isSynced` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `inventory_items` (`id` TEXT NOT NULL, `itemName` TEXT NOT NULL, `category` TEXT NOT NULL, `quantityInStock` REAL NOT NULL, `unit` TEXT NOT NULL, `qrCodeHash` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `daily_commits` (`localId` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `remoteId` TEXT, `date` TEXT NOT NULL, `taskDescription` TEXT NOT NULL, `hoursSpent` REAL NOT NULL, `isSynced` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `outbox_queue` (`localId` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `actionType` TEXT NOT NULL, `endpoint` TEXT NOT NULL, `payloadJson` TEXT NOT NULL, `localAttachmentPaths` TEXT, `createdAt` INTEGER NOT NULL, `isProcessing` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `customers` (`id` INTEGER NOT NULL, `customerCode` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT NOT NULL, `phoneNumber` TEXT NOT NULL, `city` TEXT NOT NULL, `address` TEXT NOT NULL, `systemSizeKw` REAL NOT NULL, `installationDate` TEXT NOT NULL, `warrantyExpiry` TEXT, `panelBrand` TEXT, `inverterBrand` TEXT, `inverterModel` TEXT, `amcStatus` TEXT NOT NULL, `amcExpiryDate` TEXT, `status` TEXT NOT NULL, `partnerId` TEXT, `userId` TEXT, `projectStage` INTEGER NOT NULL, `assignedEmployeeId` TEXT, `commissionAmount` REAL, `commissionStatus` TEXT NOT NULL, `inverterLoginId` TEXT, `inverterPassword` TEXT, `inverterApiKey` TEXT, `inverterDeviceSn` TEXT, `portalPassword` TEXT, `latitude` REAL, `longitude` REAL, `cleaningWindow1` TEXT, `cleaningWindow2` TEXT, `cleaningWindow3` TEXT, `cleaningsPerMonth` INTEGER, `clientType` TEXT, `consumerNumber` TEXT, `contractEndDate` TEXT, `contractStartDate` TEXT, `monthlyCleaningRate` REAL, `paymentTerms` TEXT, `remarks` TEXT, `cleaningWindow4` TEXT, `cleaningWindow5` TEXT, `cleaningWindow6` TEXT, `cleaningWindow7` TEXT, `cleaningWindow8` TEXT, `commissionProofUrl` TEXT, `commissionPaidAt` TEXT, `apartmentId` INTEGER, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `dispatch_records` (`id` TEXT NOT NULL, `customerId` INTEGER NOT NULL, `itemId` TEXT NOT NULL, `quantity` INTEGER NOT NULL, `dispatchedAt` TEXT NOT NULL, `notes` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `solar_designs` (`id` TEXT NOT NULL, `customerId` INTEGER NOT NULL, `engineerId` TEXT NOT NULL, `panelCount` INTEGER NOT NULL, `inverterModel` TEXT NOT NULL, `systemCapacityKw` REAL NOT NULL, `tiltAngle` REAL NOT NULL, `cadLayoutPath` TEXT, `sldDiagramPath` TEXT, `designStatus` TEXT NOT NULL, `submittedAt` TEXT NOT NULL, `reviewedAt` TEXT, `reviewedBy` TEXT, `reviewNotes` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `electrical_designs` (`id` TEXT NOT NULL, `customerId` INTEGER NOT NULL, `engineerId` TEXT NOT NULL, `systemSizeKw` REAL NOT NULL, `mainBreakerSize` REAL NOT NULL, `cableSize` TEXT NOT NULL, `designStatus` TEXT NOT NULL, `schematicUrl` TEXT, `loadCalculations` TEXT, `complianceCheck` TEXT, `submittedAt` TEXT NOT NULL, `reviewedAt` TEXT, `reviewedBy` TEXT, `reviewNotes` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `amc_visits` (`id` TEXT NOT NULL, `customerId` INTEGER NOT NULL, `scheduledDate` TEXT NOT NULL, `status` TEXT NOT NULL, `completedAt` TEXT, `notes` TEXT, `assignedEmployeeId` TEXT, `completedByEmployeeId` TEXT, `completedByName` TEXT, `visitNotes` TEXT, `beforeImageUrl` TEXT, `afterImageUrl` TEXT, `cleaningNumber` INTEGER, `timeSlot` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `service_requests` (`id` INTEGER NOT NULL, `customerId` INTEGER NOT NULL, `title` TEXT NOT NULL, `description` TEXT NOT NULL, `address` TEXT, `latitude` REAL, `longitude` REAL, `status` TEXT NOT NULL, `scheduledDate` TEXT, `scheduledTime` TEXT, `createdAt` TEXT NOT NULL, `updatedAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `survey_equipment` (`id` TEXT NOT NULL, `equipmentName` TEXT NOT NULL, `equipmentType` TEXT NOT NULL, `serialNumber` TEXT, `assignedTo` TEXT, `status` TEXT NOT NULL, `lastMaintenanceDate` TEXT, `nextMaintenanceDate` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `bill_of_materials` (`id` TEXT NOT NULL, `designId` TEXT NOT NULL, `itemId` INTEGER NOT NULL, `quantity` INTEGER NOT NULL, `unitCost` REAL NOT NULL, `totalCost` REAL NOT NULL, `notes` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `electrical_inspections` (`id` TEXT NOT NULL, `customerId` INTEGER NOT NULL, `inspectorId` TEXT NOT NULL, `inspectionDate` TEXT NOT NULL, `inspectionType` TEXT NOT NULL, `inspectionStatus` TEXT NOT NULL, `safetyChecklist` TEXT, `complianceStatus` TEXT, `findings` TEXT, `approvedAt` TEXT, `approvedBy` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `apartments` (`id` INTEGER NOT NULL, `name` TEXT NOT NULL, `address` TEXT NOT NULL, `city` TEXT NOT NULL, `createdAt` TEXT NOT NULL, `updatedAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `invoices` (`id` TEXT NOT NULL, `invoiceNumber` TEXT, `customerId` INTEGER NOT NULL, `invoiceType` TEXT NOT NULL, `amount` REAL NOT NULL, `paymentStatus` TEXT NOT NULL, `amountPaid` REAL NOT NULL, `invoiceDate` TEXT NOT NULL, `paymentDate` TEXT, `zone` TEXT, `state` TEXT, `partnerId` TEXT, `createdAt` TEXT NOT NULL, `updatedAt` TEXT NOT NULL, `description` TEXT, `paymentMethod` TEXT, `proofUrl` TEXT, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `payments` (`id` TEXT NOT NULL, `taskId` INTEGER NOT NULL, `customerId` INTEGER NOT NULL, `amount` REAL NOT NULL, `paymentMethod` TEXT, `paymentStatus` TEXT NOT NULL, `transactionId` TEXT, `paidBy` TEXT, `paidAt` TEXT, `processedBy` TEXT, `notes` TEXT, `createdAt` TEXT NOT NULL, `updatedAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `task_assignments` (`id` TEXT NOT NULL, `taskId` INTEGER NOT NULL, `employeeUserId` TEXT NOT NULL, `assignedAt` TEXT NOT NULL, `status` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `task_images` (`id` TEXT NOT NULL, `taskId` INTEGER NOT NULL, `employeeUserId` TEXT NOT NULL, `type` TEXT NOT NULL, `url` TEXT NOT NULL, `latitude` REAL, `longitude` REAL, `watermarkText` TEXT, `uploadedAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `customer_notifications` (`id` TEXT NOT NULL, `customerId` INTEGER NOT NULL, `type` TEXT NOT NULL, `message` TEXT NOT NULL, `taskId` INTEGER, `imageUrl` TEXT, `isRead` INTEGER NOT NULL, `createdAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `performance_snapshots` (`id` TEXT NOT NULL, `employeeId` TEXT NOT NULL, `month` INTEGER NOT NULL, `year` INTEGER NOT NULL, `attendancePercent` REAL NOT NULL, `taskCompletionRate` REAL NOT NULL, `avgWorkScore` REAL NOT NULL, `totalHoursLogged` REAL NOT NULL, `performanceScore` REAL NOT NULL, `daysPresent` INTEGER NOT NULL, `daysAbsent` INTEGER NOT NULL, `tasksAssigned` INTEGER NOT NULL, `tasksCompleted` INTEGER NOT NULL, `workSubmissions` INTEGER NOT NULL, `calculatedAt` TEXT NOT NULL, `createdAt` TEXT NOT NULL, `updatedAt` TEXT NOT NULL, `isSynced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '58195ad6cde97c1a75a152ba71352311')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `employee_session`");
        db.execSQL("DROP TABLE IF EXISTS `attendance_records`");
        db.execSQL("DROP TABLE IF EXISTS `employee_tasks`");
        db.execSQL("DROP TABLE IF EXISTS `site_surveys`");
        db.execSQL("DROP TABLE IF EXISTS `inventory_items`");
        db.execSQL("DROP TABLE IF EXISTS `daily_commits`");
        db.execSQL("DROP TABLE IF EXISTS `outbox_queue`");
        db.execSQL("DROP TABLE IF EXISTS `customers`");
        db.execSQL("DROP TABLE IF EXISTS `dispatch_records`");
        db.execSQL("DROP TABLE IF EXISTS `solar_designs`");
        db.execSQL("DROP TABLE IF EXISTS `electrical_designs`");
        db.execSQL("DROP TABLE IF EXISTS `amc_visits`");
        db.execSQL("DROP TABLE IF EXISTS `service_requests`");
        db.execSQL("DROP TABLE IF EXISTS `survey_equipment`");
        db.execSQL("DROP TABLE IF EXISTS `bill_of_materials`");
        db.execSQL("DROP TABLE IF EXISTS `electrical_inspections`");
        db.execSQL("DROP TABLE IF EXISTS `apartments`");
        db.execSQL("DROP TABLE IF EXISTS `invoices`");
        db.execSQL("DROP TABLE IF EXISTS `payments`");
        db.execSQL("DROP TABLE IF EXISTS `task_assignments`");
        db.execSQL("DROP TABLE IF EXISTS `task_images`");
        db.execSQL("DROP TABLE IF EXISTS `customer_notifications`");
        db.execSQL("DROP TABLE IF EXISTS `performance_snapshots`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsEmployeeSession = new HashMap<String, TableInfo.Column>(11);
        _columnsEmployeeSession.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("loginId", new TableInfo.Column("loginId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("email", new TableInfo.Column("email", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("name", new TableInfo.Column("name", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("role", new TableInfo.Column("role", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("jobRole", new TableInfo.Column("jobRole", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("employeeCode", new TableInfo.Column("employeeCode", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("reportingManagerId", new TableInfo.Column("reportingManagerId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("accessToken", new TableInfo.Column("accessToken", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("refreshToken", new TableInfo.Column("refreshToken", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeSession.put("lastSyncTimestamp", new TableInfo.Column("lastSyncTimestamp", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysEmployeeSession = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesEmployeeSession = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoEmployeeSession = new TableInfo("employee_session", _columnsEmployeeSession, _foreignKeysEmployeeSession, _indicesEmployeeSession);
        final TableInfo _existingEmployeeSession = TableInfo.read(db, "employee_session");
        if (!_infoEmployeeSession.equals(_existingEmployeeSession)) {
          return new RoomOpenHelper.ValidationResult(false, "employee_session(com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity).\n"
                  + " Expected:\n" + _infoEmployeeSession + "\n"
                  + " Found:\n" + _existingEmployeeSession);
        }
        final HashMap<String, TableInfo.Column> _columnsAttendanceRecords = new HashMap<String, TableInfo.Column>(11);
        _columnsAttendanceRecords.put("localId", new TableInfo.Column("localId", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("remoteId", new TableInfo.Column("remoteId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("date", new TableInfo.Column("date", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("checkInTime", new TableInfo.Column("checkInTime", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("checkInLatitude", new TableInfo.Column("checkInLatitude", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("checkInLongitude", new TableInfo.Column("checkInLongitude", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("checkOutTime", new TableInfo.Column("checkOutTime", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("checkOutLatitude", new TableInfo.Column("checkOutLatitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("checkOutLongitude", new TableInfo.Column("checkOutLongitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("totalBreakDurationSeconds", new TableInfo.Column("totalBreakDurationSeconds", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAttendanceRecords.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysAttendanceRecords = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesAttendanceRecords = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoAttendanceRecords = new TableInfo("attendance_records", _columnsAttendanceRecords, _foreignKeysAttendanceRecords, _indicesAttendanceRecords);
        final TableInfo _existingAttendanceRecords = TableInfo.read(db, "attendance_records");
        if (!_infoAttendanceRecords.equals(_existingAttendanceRecords)) {
          return new RoomOpenHelper.ValidationResult(false, "attendance_records(com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity).\n"
                  + " Expected:\n" + _infoAttendanceRecords + "\n"
                  + " Found:\n" + _existingAttendanceRecords);
        }
        final HashMap<String, TableInfo.Column> _columnsEmployeeTasks = new HashMap<String, TableInfo.Column>(15);
        _columnsEmployeeTasks.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("jobType", new TableInfo.Column("jobType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("description", new TableInfo.Column("description", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("scheduledTime", new TableInfo.Column("scheduledTime", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("customerName", new TableInfo.Column("customerName", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("customerPhone", new TableInfo.Column("customerPhone", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("address", new TableInfo.Column("address", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("latitude", new TableInfo.Column("latitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("longitude", new TableInfo.Column("longitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("completionMessage", new TableInfo.Column("completionMessage", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("completionDocumentUrl", new TableInfo.Column("completionDocumentUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("completedAt", new TableInfo.Column("completedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("employeeUserId", new TableInfo.Column("employeeUserId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEmployeeTasks.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysEmployeeTasks = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesEmployeeTasks = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoEmployeeTasks = new TableInfo("employee_tasks", _columnsEmployeeTasks, _foreignKeysEmployeeTasks, _indicesEmployeeTasks);
        final TableInfo _existingEmployeeTasks = TableInfo.read(db, "employee_tasks");
        if (!_infoEmployeeTasks.equals(_existingEmployeeTasks)) {
          return new RoomOpenHelper.ValidationResult(false, "employee_tasks(com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity).\n"
                  + " Expected:\n" + _infoEmployeeTasks + "\n"
                  + " Found:\n" + _existingEmployeeTasks);
        }
        final HashMap<String, TableInfo.Column> _columnsSiteSurveys = new HashMap<String, TableInfo.Column>(13);
        _columnsSiteSurveys.put("localId", new TableInfo.Column("localId", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("taskId", new TableInfo.Column("taskId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("customerId", new TableInfo.Column("customerId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("roofType", new TableInfo.Column("roofType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("lengthFt", new TableInfo.Column("lengthFt", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("widthFt", new TableInfo.Column("widthFt", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("obstacleNotes", new TableInfo.Column("obstacleNotes", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("shadowFactors", new TableInfo.Column("shadowFactors", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("recommendedCapacityKw", new TableInfo.Column("recommendedCapacityKw", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("coordinatesLatitude", new TableInfo.Column("coordinatesLatitude", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("coordinatesLongitude", new TableInfo.Column("coordinatesLongitude", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("localPhotoPaths", new TableInfo.Column("localPhotoPaths", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSiteSurveys.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysSiteSurveys = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesSiteSurveys = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoSiteSurveys = new TableInfo("site_surveys", _columnsSiteSurveys, _foreignKeysSiteSurveys, _indicesSiteSurveys);
        final TableInfo _existingSiteSurveys = TableInfo.read(db, "site_surveys");
        if (!_infoSiteSurveys.equals(_existingSiteSurveys)) {
          return new RoomOpenHelper.ValidationResult(false, "site_surveys(com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity).\n"
                  + " Expected:\n" + _infoSiteSurveys + "\n"
                  + " Found:\n" + _existingSiteSurveys);
        }
        final HashMap<String, TableInfo.Column> _columnsInventoryItems = new HashMap<String, TableInfo.Column>(7);
        _columnsInventoryItems.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryItems.put("itemName", new TableInfo.Column("itemName", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryItems.put("category", new TableInfo.Column("category", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryItems.put("quantityInStock", new TableInfo.Column("quantityInStock", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryItems.put("unit", new TableInfo.Column("unit", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryItems.put("qrCodeHash", new TableInfo.Column("qrCodeHash", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryItems.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysInventoryItems = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesInventoryItems = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoInventoryItems = new TableInfo("inventory_items", _columnsInventoryItems, _foreignKeysInventoryItems, _indicesInventoryItems);
        final TableInfo _existingInventoryItems = TableInfo.read(db, "inventory_items");
        if (!_infoInventoryItems.equals(_existingInventoryItems)) {
          return new RoomOpenHelper.ValidationResult(false, "inventory_items(com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity).\n"
                  + " Expected:\n" + _infoInventoryItems + "\n"
                  + " Found:\n" + _existingInventoryItems);
        }
        final HashMap<String, TableInfo.Column> _columnsDailyCommits = new HashMap<String, TableInfo.Column>(6);
        _columnsDailyCommits.put("localId", new TableInfo.Column("localId", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDailyCommits.put("remoteId", new TableInfo.Column("remoteId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDailyCommits.put("date", new TableInfo.Column("date", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDailyCommits.put("taskDescription", new TableInfo.Column("taskDescription", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDailyCommits.put("hoursSpent", new TableInfo.Column("hoursSpent", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDailyCommits.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysDailyCommits = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesDailyCommits = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoDailyCommits = new TableInfo("daily_commits", _columnsDailyCommits, _foreignKeysDailyCommits, _indicesDailyCommits);
        final TableInfo _existingDailyCommits = TableInfo.read(db, "daily_commits");
        if (!_infoDailyCommits.equals(_existingDailyCommits)) {
          return new RoomOpenHelper.ValidationResult(false, "daily_commits(com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity).\n"
                  + " Expected:\n" + _infoDailyCommits + "\n"
                  + " Found:\n" + _existingDailyCommits);
        }
        final HashMap<String, TableInfo.Column> _columnsOutboxQueue = new HashMap<String, TableInfo.Column>(7);
        _columnsOutboxQueue.put("localId", new TableInfo.Column("localId", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsOutboxQueue.put("actionType", new TableInfo.Column("actionType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsOutboxQueue.put("endpoint", new TableInfo.Column("endpoint", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsOutboxQueue.put("payloadJson", new TableInfo.Column("payloadJson", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsOutboxQueue.put("localAttachmentPaths", new TableInfo.Column("localAttachmentPaths", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsOutboxQueue.put("createdAt", new TableInfo.Column("createdAt", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsOutboxQueue.put("isProcessing", new TableInfo.Column("isProcessing", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysOutboxQueue = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesOutboxQueue = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoOutboxQueue = new TableInfo("outbox_queue", _columnsOutboxQueue, _foreignKeysOutboxQueue, _indicesOutboxQueue);
        final TableInfo _existingOutboxQueue = TableInfo.read(db, "outbox_queue");
        if (!_infoOutboxQueue.equals(_existingOutboxQueue)) {
          return new RoomOpenHelper.ValidationResult(false, "outbox_queue(com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity).\n"
                  + " Expected:\n" + _infoOutboxQueue + "\n"
                  + " Found:\n" + _existingOutboxQueue);
        }
        final HashMap<String, TableInfo.Column> _columnsCustomers = new HashMap<String, TableInfo.Column>(49);
        _columnsCustomers.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("customerCode", new TableInfo.Column("customerCode", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("fullName", new TableInfo.Column("fullName", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("email", new TableInfo.Column("email", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("phoneNumber", new TableInfo.Column("phoneNumber", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("city", new TableInfo.Column("city", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("address", new TableInfo.Column("address", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("systemSizeKw", new TableInfo.Column("systemSizeKw", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("installationDate", new TableInfo.Column("installationDate", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("warrantyExpiry", new TableInfo.Column("warrantyExpiry", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("panelBrand", new TableInfo.Column("panelBrand", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("inverterBrand", new TableInfo.Column("inverterBrand", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("inverterModel", new TableInfo.Column("inverterModel", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("amcStatus", new TableInfo.Column("amcStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("amcExpiryDate", new TableInfo.Column("amcExpiryDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("partnerId", new TableInfo.Column("partnerId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("userId", new TableInfo.Column("userId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("projectStage", new TableInfo.Column("projectStage", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("assignedEmployeeId", new TableInfo.Column("assignedEmployeeId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("commissionAmount", new TableInfo.Column("commissionAmount", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("commissionStatus", new TableInfo.Column("commissionStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("inverterLoginId", new TableInfo.Column("inverterLoginId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("inverterPassword", new TableInfo.Column("inverterPassword", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("inverterApiKey", new TableInfo.Column("inverterApiKey", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("inverterDeviceSn", new TableInfo.Column("inverterDeviceSn", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("portalPassword", new TableInfo.Column("portalPassword", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("latitude", new TableInfo.Column("latitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("longitude", new TableInfo.Column("longitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow1", new TableInfo.Column("cleaningWindow1", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow2", new TableInfo.Column("cleaningWindow2", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow3", new TableInfo.Column("cleaningWindow3", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningsPerMonth", new TableInfo.Column("cleaningsPerMonth", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("clientType", new TableInfo.Column("clientType", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("consumerNumber", new TableInfo.Column("consumerNumber", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("contractEndDate", new TableInfo.Column("contractEndDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("contractStartDate", new TableInfo.Column("contractStartDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("monthlyCleaningRate", new TableInfo.Column("monthlyCleaningRate", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("paymentTerms", new TableInfo.Column("paymentTerms", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("remarks", new TableInfo.Column("remarks", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow4", new TableInfo.Column("cleaningWindow4", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow5", new TableInfo.Column("cleaningWindow5", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow6", new TableInfo.Column("cleaningWindow6", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow7", new TableInfo.Column("cleaningWindow7", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("cleaningWindow8", new TableInfo.Column("cleaningWindow8", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("commissionProofUrl", new TableInfo.Column("commissionProofUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("commissionPaidAt", new TableInfo.Column("commissionPaidAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("apartmentId", new TableInfo.Column("apartmentId", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomers.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysCustomers = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesCustomers = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoCustomers = new TableInfo("customers", _columnsCustomers, _foreignKeysCustomers, _indicesCustomers);
        final TableInfo _existingCustomers = TableInfo.read(db, "customers");
        if (!_infoCustomers.equals(_existingCustomers)) {
          return new RoomOpenHelper.ValidationResult(false, "customers(com.example.swayogemployeeapp.data.local.entity.CustomerEntity).\n"
                  + " Expected:\n" + _infoCustomers + "\n"
                  + " Found:\n" + _existingCustomers);
        }
        final HashMap<String, TableInfo.Column> _columnsDispatchRecords = new HashMap<String, TableInfo.Column>(7);
        _columnsDispatchRecords.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDispatchRecords.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDispatchRecords.put("itemId", new TableInfo.Column("itemId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDispatchRecords.put("quantity", new TableInfo.Column("quantity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDispatchRecords.put("dispatchedAt", new TableInfo.Column("dispatchedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDispatchRecords.put("notes", new TableInfo.Column("notes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDispatchRecords.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysDispatchRecords = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesDispatchRecords = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoDispatchRecords = new TableInfo("dispatch_records", _columnsDispatchRecords, _foreignKeysDispatchRecords, _indicesDispatchRecords);
        final TableInfo _existingDispatchRecords = TableInfo.read(db, "dispatch_records");
        if (!_infoDispatchRecords.equals(_existingDispatchRecords)) {
          return new RoomOpenHelper.ValidationResult(false, "dispatch_records(com.example.swayogemployeeapp.data.local.entity.DispatchRecordEntity).\n"
                  + " Expected:\n" + _infoDispatchRecords + "\n"
                  + " Found:\n" + _existingDispatchRecords);
        }
        final HashMap<String, TableInfo.Column> _columnsSolarDesigns = new HashMap<String, TableInfo.Column>(15);
        _columnsSolarDesigns.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("engineerId", new TableInfo.Column("engineerId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("panelCount", new TableInfo.Column("panelCount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("inverterModel", new TableInfo.Column("inverterModel", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("systemCapacityKw", new TableInfo.Column("systemCapacityKw", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("tiltAngle", new TableInfo.Column("tiltAngle", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("cadLayoutPath", new TableInfo.Column("cadLayoutPath", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("sldDiagramPath", new TableInfo.Column("sldDiagramPath", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("designStatus", new TableInfo.Column("designStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("submittedAt", new TableInfo.Column("submittedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("reviewedAt", new TableInfo.Column("reviewedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("reviewedBy", new TableInfo.Column("reviewedBy", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("reviewNotes", new TableInfo.Column("reviewNotes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSolarDesigns.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysSolarDesigns = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesSolarDesigns = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoSolarDesigns = new TableInfo("solar_designs", _columnsSolarDesigns, _foreignKeysSolarDesigns, _indicesSolarDesigns);
        final TableInfo _existingSolarDesigns = TableInfo.read(db, "solar_designs");
        if (!_infoSolarDesigns.equals(_existingSolarDesigns)) {
          return new RoomOpenHelper.ValidationResult(false, "solar_designs(com.example.swayogemployeeapp.data.local.entity.SolarDesignEntity).\n"
                  + " Expected:\n" + _infoSolarDesigns + "\n"
                  + " Found:\n" + _existingSolarDesigns);
        }
        final HashMap<String, TableInfo.Column> _columnsElectricalDesigns = new HashMap<String, TableInfo.Column>(15);
        _columnsElectricalDesigns.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("engineerId", new TableInfo.Column("engineerId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("systemSizeKw", new TableInfo.Column("systemSizeKw", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("mainBreakerSize", new TableInfo.Column("mainBreakerSize", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("cableSize", new TableInfo.Column("cableSize", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("designStatus", new TableInfo.Column("designStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("schematicUrl", new TableInfo.Column("schematicUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("loadCalculations", new TableInfo.Column("loadCalculations", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("complianceCheck", new TableInfo.Column("complianceCheck", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("submittedAt", new TableInfo.Column("submittedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("reviewedAt", new TableInfo.Column("reviewedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("reviewedBy", new TableInfo.Column("reviewedBy", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("reviewNotes", new TableInfo.Column("reviewNotes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalDesigns.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysElectricalDesigns = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesElectricalDesigns = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoElectricalDesigns = new TableInfo("electrical_designs", _columnsElectricalDesigns, _foreignKeysElectricalDesigns, _indicesElectricalDesigns);
        final TableInfo _existingElectricalDesigns = TableInfo.read(db, "electrical_designs");
        if (!_infoElectricalDesigns.equals(_existingElectricalDesigns)) {
          return new RoomOpenHelper.ValidationResult(false, "electrical_designs(com.example.swayogemployeeapp.data.local.entity.ElectricalDesignEntity).\n"
                  + " Expected:\n" + _infoElectricalDesigns + "\n"
                  + " Found:\n" + _existingElectricalDesigns);
        }
        final HashMap<String, TableInfo.Column> _columnsAmcVisits = new HashMap<String, TableInfo.Column>(15);
        _columnsAmcVisits.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("scheduledDate", new TableInfo.Column("scheduledDate", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("completedAt", new TableInfo.Column("completedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("notes", new TableInfo.Column("notes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("assignedEmployeeId", new TableInfo.Column("assignedEmployeeId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("completedByEmployeeId", new TableInfo.Column("completedByEmployeeId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("completedByName", new TableInfo.Column("completedByName", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("visitNotes", new TableInfo.Column("visitNotes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("beforeImageUrl", new TableInfo.Column("beforeImageUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("afterImageUrl", new TableInfo.Column("afterImageUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("cleaningNumber", new TableInfo.Column("cleaningNumber", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("timeSlot", new TableInfo.Column("timeSlot", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAmcVisits.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysAmcVisits = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesAmcVisits = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoAmcVisits = new TableInfo("amc_visits", _columnsAmcVisits, _foreignKeysAmcVisits, _indicesAmcVisits);
        final TableInfo _existingAmcVisits = TableInfo.read(db, "amc_visits");
        if (!_infoAmcVisits.equals(_existingAmcVisits)) {
          return new RoomOpenHelper.ValidationResult(false, "amc_visits(com.example.swayogemployeeapp.data.local.entity.AmcVisitEntity).\n"
                  + " Expected:\n" + _infoAmcVisits + "\n"
                  + " Found:\n" + _existingAmcVisits);
        }
        final HashMap<String, TableInfo.Column> _columnsServiceRequests = new HashMap<String, TableInfo.Column>(13);
        _columnsServiceRequests.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("title", new TableInfo.Column("title", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("description", new TableInfo.Column("description", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("address", new TableInfo.Column("address", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("latitude", new TableInfo.Column("latitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("longitude", new TableInfo.Column("longitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("scheduledDate", new TableInfo.Column("scheduledDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("scheduledTime", new TableInfo.Column("scheduledTime", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsServiceRequests.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysServiceRequests = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesServiceRequests = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoServiceRequests = new TableInfo("service_requests", _columnsServiceRequests, _foreignKeysServiceRequests, _indicesServiceRequests);
        final TableInfo _existingServiceRequests = TableInfo.read(db, "service_requests");
        if (!_infoServiceRequests.equals(_existingServiceRequests)) {
          return new RoomOpenHelper.ValidationResult(false, "service_requests(com.example.swayogemployeeapp.data.local.entity.ServiceRequestEntity).\n"
                  + " Expected:\n" + _infoServiceRequests + "\n"
                  + " Found:\n" + _existingServiceRequests);
        }
        final HashMap<String, TableInfo.Column> _columnsSurveyEquipment = new HashMap<String, TableInfo.Column>(9);
        _columnsSurveyEquipment.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("equipmentName", new TableInfo.Column("equipmentName", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("equipmentType", new TableInfo.Column("equipmentType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("serialNumber", new TableInfo.Column("serialNumber", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("assignedTo", new TableInfo.Column("assignedTo", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("lastMaintenanceDate", new TableInfo.Column("lastMaintenanceDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("nextMaintenanceDate", new TableInfo.Column("nextMaintenanceDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSurveyEquipment.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysSurveyEquipment = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesSurveyEquipment = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoSurveyEquipment = new TableInfo("survey_equipment", _columnsSurveyEquipment, _foreignKeysSurveyEquipment, _indicesSurveyEquipment);
        final TableInfo _existingSurveyEquipment = TableInfo.read(db, "survey_equipment");
        if (!_infoSurveyEquipment.equals(_existingSurveyEquipment)) {
          return new RoomOpenHelper.ValidationResult(false, "survey_equipment(com.example.swayogemployeeapp.data.local.entity.SurveyEquipmentEntity).\n"
                  + " Expected:\n" + _infoSurveyEquipment + "\n"
                  + " Found:\n" + _existingSurveyEquipment);
        }
        final HashMap<String, TableInfo.Column> _columnsBillOfMaterials = new HashMap<String, TableInfo.Column>(8);
        _columnsBillOfMaterials.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("designId", new TableInfo.Column("designId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("itemId", new TableInfo.Column("itemId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("quantity", new TableInfo.Column("quantity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("unitCost", new TableInfo.Column("unitCost", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("totalCost", new TableInfo.Column("totalCost", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("notes", new TableInfo.Column("notes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsBillOfMaterials.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysBillOfMaterials = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesBillOfMaterials = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoBillOfMaterials = new TableInfo("bill_of_materials", _columnsBillOfMaterials, _foreignKeysBillOfMaterials, _indicesBillOfMaterials);
        final TableInfo _existingBillOfMaterials = TableInfo.read(db, "bill_of_materials");
        if (!_infoBillOfMaterials.equals(_existingBillOfMaterials)) {
          return new RoomOpenHelper.ValidationResult(false, "bill_of_materials(com.example.swayogemployeeapp.data.local.entity.BillOfMaterialsEntity).\n"
                  + " Expected:\n" + _infoBillOfMaterials + "\n"
                  + " Found:\n" + _existingBillOfMaterials);
        }
        final HashMap<String, TableInfo.Column> _columnsElectricalInspections = new HashMap<String, TableInfo.Column>(12);
        _columnsElectricalInspections.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("inspectorId", new TableInfo.Column("inspectorId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("inspectionDate", new TableInfo.Column("inspectionDate", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("inspectionType", new TableInfo.Column("inspectionType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("inspectionStatus", new TableInfo.Column("inspectionStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("safetyChecklist", new TableInfo.Column("safetyChecklist", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("complianceStatus", new TableInfo.Column("complianceStatus", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("findings", new TableInfo.Column("findings", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("approvedAt", new TableInfo.Column("approvedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("approvedBy", new TableInfo.Column("approvedBy", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsElectricalInspections.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysElectricalInspections = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesElectricalInspections = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoElectricalInspections = new TableInfo("electrical_inspections", _columnsElectricalInspections, _foreignKeysElectricalInspections, _indicesElectricalInspections);
        final TableInfo _existingElectricalInspections = TableInfo.read(db, "electrical_inspections");
        if (!_infoElectricalInspections.equals(_existingElectricalInspections)) {
          return new RoomOpenHelper.ValidationResult(false, "electrical_inspections(com.example.swayogemployeeapp.data.local.entity.ElectricalInspectionEntity).\n"
                  + " Expected:\n" + _infoElectricalInspections + "\n"
                  + " Found:\n" + _existingElectricalInspections);
        }
        final HashMap<String, TableInfo.Column> _columnsApartments = new HashMap<String, TableInfo.Column>(7);
        _columnsApartments.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsApartments.put("name", new TableInfo.Column("name", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsApartments.put("address", new TableInfo.Column("address", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsApartments.put("city", new TableInfo.Column("city", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsApartments.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsApartments.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsApartments.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysApartments = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesApartments = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoApartments = new TableInfo("apartments", _columnsApartments, _foreignKeysApartments, _indicesApartments);
        final TableInfo _existingApartments = TableInfo.read(db, "apartments");
        if (!_infoApartments.equals(_existingApartments)) {
          return new RoomOpenHelper.ValidationResult(false, "apartments(com.example.swayogemployeeapp.data.local.entity.ApartmentEntity).\n"
                  + " Expected:\n" + _infoApartments + "\n"
                  + " Found:\n" + _existingApartments);
        }
        final HashMap<String, TableInfo.Column> _columnsInvoices = new HashMap<String, TableInfo.Column>(18);
        _columnsInvoices.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("invoiceNumber", new TableInfo.Column("invoiceNumber", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("invoiceType", new TableInfo.Column("invoiceType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("amount", new TableInfo.Column("amount", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("paymentStatus", new TableInfo.Column("paymentStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("amountPaid", new TableInfo.Column("amountPaid", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("invoiceDate", new TableInfo.Column("invoiceDate", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("paymentDate", new TableInfo.Column("paymentDate", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("zone", new TableInfo.Column("zone", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("state", new TableInfo.Column("state", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("partnerId", new TableInfo.Column("partnerId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("description", new TableInfo.Column("description", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("paymentMethod", new TableInfo.Column("paymentMethod", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("proofUrl", new TableInfo.Column("proofUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInvoices.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysInvoices = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesInvoices = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoInvoices = new TableInfo("invoices", _columnsInvoices, _foreignKeysInvoices, _indicesInvoices);
        final TableInfo _existingInvoices = TableInfo.read(db, "invoices");
        if (!_infoInvoices.equals(_existingInvoices)) {
          return new RoomOpenHelper.ValidationResult(false, "invoices(com.example.swayogemployeeapp.data.local.entity.InvoiceEntity).\n"
                  + " Expected:\n" + _infoInvoices + "\n"
                  + " Found:\n" + _existingInvoices);
        }
        final HashMap<String, TableInfo.Column> _columnsPayments = new HashMap<String, TableInfo.Column>(14);
        _columnsPayments.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("taskId", new TableInfo.Column("taskId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("amount", new TableInfo.Column("amount", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("paymentMethod", new TableInfo.Column("paymentMethod", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("paymentStatus", new TableInfo.Column("paymentStatus", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("transactionId", new TableInfo.Column("transactionId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("paidBy", new TableInfo.Column("paidBy", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("paidAt", new TableInfo.Column("paidAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("processedBy", new TableInfo.Column("processedBy", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("notes", new TableInfo.Column("notes", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPayments.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPayments = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPayments = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPayments = new TableInfo("payments", _columnsPayments, _foreignKeysPayments, _indicesPayments);
        final TableInfo _existingPayments = TableInfo.read(db, "payments");
        if (!_infoPayments.equals(_existingPayments)) {
          return new RoomOpenHelper.ValidationResult(false, "payments(com.example.swayogemployeeapp.data.local.entity.PaymentEntity).\n"
                  + " Expected:\n" + _infoPayments + "\n"
                  + " Found:\n" + _existingPayments);
        }
        final HashMap<String, TableInfo.Column> _columnsTaskAssignments = new HashMap<String, TableInfo.Column>(6);
        _columnsTaskAssignments.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskAssignments.put("taskId", new TableInfo.Column("taskId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskAssignments.put("employeeUserId", new TableInfo.Column("employeeUserId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskAssignments.put("assignedAt", new TableInfo.Column("assignedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskAssignments.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskAssignments.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysTaskAssignments = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesTaskAssignments = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoTaskAssignments = new TableInfo("task_assignments", _columnsTaskAssignments, _foreignKeysTaskAssignments, _indicesTaskAssignments);
        final TableInfo _existingTaskAssignments = TableInfo.read(db, "task_assignments");
        if (!_infoTaskAssignments.equals(_existingTaskAssignments)) {
          return new RoomOpenHelper.ValidationResult(false, "task_assignments(com.example.swayogemployeeapp.data.local.entity.TaskAssignmentEntity).\n"
                  + " Expected:\n" + _infoTaskAssignments + "\n"
                  + " Found:\n" + _existingTaskAssignments);
        }
        final HashMap<String, TableInfo.Column> _columnsTaskImages = new HashMap<String, TableInfo.Column>(10);
        _columnsTaskImages.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("taskId", new TableInfo.Column("taskId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("employeeUserId", new TableInfo.Column("employeeUserId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("type", new TableInfo.Column("type", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("url", new TableInfo.Column("url", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("latitude", new TableInfo.Column("latitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("longitude", new TableInfo.Column("longitude", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("watermarkText", new TableInfo.Column("watermarkText", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("uploadedAt", new TableInfo.Column("uploadedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsTaskImages.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysTaskImages = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesTaskImages = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoTaskImages = new TableInfo("task_images", _columnsTaskImages, _foreignKeysTaskImages, _indicesTaskImages);
        final TableInfo _existingTaskImages = TableInfo.read(db, "task_images");
        if (!_infoTaskImages.equals(_existingTaskImages)) {
          return new RoomOpenHelper.ValidationResult(false, "task_images(com.example.swayogemployeeapp.data.local.entity.TaskImageEntity).\n"
                  + " Expected:\n" + _infoTaskImages + "\n"
                  + " Found:\n" + _existingTaskImages);
        }
        final HashMap<String, TableInfo.Column> _columnsCustomerNotifications = new HashMap<String, TableInfo.Column>(9);
        _columnsCustomerNotifications.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("customerId", new TableInfo.Column("customerId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("type", new TableInfo.Column("type", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("message", new TableInfo.Column("message", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("taskId", new TableInfo.Column("taskId", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("imageUrl", new TableInfo.Column("imageUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("isRead", new TableInfo.Column("isRead", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCustomerNotifications.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysCustomerNotifications = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesCustomerNotifications = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoCustomerNotifications = new TableInfo("customer_notifications", _columnsCustomerNotifications, _foreignKeysCustomerNotifications, _indicesCustomerNotifications);
        final TableInfo _existingCustomerNotifications = TableInfo.read(db, "customer_notifications");
        if (!_infoCustomerNotifications.equals(_existingCustomerNotifications)) {
          return new RoomOpenHelper.ValidationResult(false, "customer_notifications(com.example.swayogemployeeapp.data.local.entity.CustomerNotificationEntity).\n"
                  + " Expected:\n" + _infoCustomerNotifications + "\n"
                  + " Found:\n" + _existingCustomerNotifications);
        }
        final HashMap<String, TableInfo.Column> _columnsPerformanceSnapshots = new HashMap<String, TableInfo.Column>(18);
        _columnsPerformanceSnapshots.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("employeeId", new TableInfo.Column("employeeId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("month", new TableInfo.Column("month", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("year", new TableInfo.Column("year", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("attendancePercent", new TableInfo.Column("attendancePercent", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("taskCompletionRate", new TableInfo.Column("taskCompletionRate", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("avgWorkScore", new TableInfo.Column("avgWorkScore", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("totalHoursLogged", new TableInfo.Column("totalHoursLogged", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("performanceScore", new TableInfo.Column("performanceScore", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("daysPresent", new TableInfo.Column("daysPresent", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("daysAbsent", new TableInfo.Column("daysAbsent", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("tasksAssigned", new TableInfo.Column("tasksAssigned", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("tasksCompleted", new TableInfo.Column("tasksCompleted", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("workSubmissions", new TableInfo.Column("workSubmissions", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("calculatedAt", new TableInfo.Column("calculatedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("createdAt", new TableInfo.Column("createdAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPerformanceSnapshots.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPerformanceSnapshots = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPerformanceSnapshots = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPerformanceSnapshots = new TableInfo("performance_snapshots", _columnsPerformanceSnapshots, _foreignKeysPerformanceSnapshots, _indicesPerformanceSnapshots);
        final TableInfo _existingPerformanceSnapshots = TableInfo.read(db, "performance_snapshots");
        if (!_infoPerformanceSnapshots.equals(_existingPerformanceSnapshots)) {
          return new RoomOpenHelper.ValidationResult(false, "performance_snapshots(com.example.swayogemployeeapp.data.local.entity.PerformanceSnapshotEntity).\n"
                  + " Expected:\n" + _infoPerformanceSnapshots + "\n"
                  + " Found:\n" + _existingPerformanceSnapshots);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "58195ad6cde97c1a75a152ba71352311", "602452c014f303abefc63c85318acf8e");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "employee_session","attendance_records","employee_tasks","site_surveys","inventory_items","daily_commits","outbox_queue","customers","dispatch_records","solar_designs","electrical_designs","amc_visits","service_requests","survey_equipment","bill_of_materials","electrical_inspections","apartments","invoices","payments","task_assignments","task_images","customer_notifications","performance_snapshots");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `employee_session`");
      _db.execSQL("DELETE FROM `attendance_records`");
      _db.execSQL("DELETE FROM `employee_tasks`");
      _db.execSQL("DELETE FROM `site_surveys`");
      _db.execSQL("DELETE FROM `inventory_items`");
      _db.execSQL("DELETE FROM `daily_commits`");
      _db.execSQL("DELETE FROM `outbox_queue`");
      _db.execSQL("DELETE FROM `customers`");
      _db.execSQL("DELETE FROM `dispatch_records`");
      _db.execSQL("DELETE FROM `solar_designs`");
      _db.execSQL("DELETE FROM `electrical_designs`");
      _db.execSQL("DELETE FROM `amc_visits`");
      _db.execSQL("DELETE FROM `service_requests`");
      _db.execSQL("DELETE FROM `survey_equipment`");
      _db.execSQL("DELETE FROM `bill_of_materials`");
      _db.execSQL("DELETE FROM `electrical_inspections`");
      _db.execSQL("DELETE FROM `apartments`");
      _db.execSQL("DELETE FROM `invoices`");
      _db.execSQL("DELETE FROM `payments`");
      _db.execSQL("DELETE FROM `task_assignments`");
      _db.execSQL("DELETE FROM `task_images`");
      _db.execSQL("DELETE FROM `customer_notifications`");
      _db.execSQL("DELETE FROM `performance_snapshots`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(EmployeeSessionDao.class, EmployeeSessionDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(AttendanceRecordDao.class, AttendanceRecordDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(EmployeeTaskDao.class, EmployeeTaskDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SiteSurveyDao.class, SiteSurveyDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(InventoryItemDao.class, InventoryItemDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(DailyCommitDao.class, DailyCommitDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(OutboxQueueDao.class, OutboxQueueDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(CustomerDao.class, CustomerDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(DispatchRecordDao.class, DispatchRecordDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SolarDesignDao.class, SolarDesignDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ElectricalDesignDao.class, ElectricalDesignDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(AmcVisitDao.class, AmcVisitDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ServiceRequestDao.class, ServiceRequestDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SurveyEquipmentDao.class, SurveyEquipmentDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(BillOfMaterialsDao.class, BillOfMaterialsDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ElectricalInspectionDao.class, ElectricalInspectionDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ApartmentDao.class, ApartmentDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(InvoiceDao.class, InvoiceDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(PaymentDao.class, PaymentDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(TaskAssignmentDao.class, TaskAssignmentDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(TaskImageDao.class, TaskImageDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(CustomerNotificationDao.class, CustomerNotificationDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(PerformanceSnapshotDao.class, PerformanceSnapshotDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public EmployeeSessionDao employeeSessionDao() {
    if (_employeeSessionDao != null) {
      return _employeeSessionDao;
    } else {
      synchronized(this) {
        if(_employeeSessionDao == null) {
          _employeeSessionDao = new EmployeeSessionDao_Impl(this);
        }
        return _employeeSessionDao;
      }
    }
  }

  @Override
  public AttendanceRecordDao attendanceRecordDao() {
    if (_attendanceRecordDao != null) {
      return _attendanceRecordDao;
    } else {
      synchronized(this) {
        if(_attendanceRecordDao == null) {
          _attendanceRecordDao = new AttendanceRecordDao_Impl(this);
        }
        return _attendanceRecordDao;
      }
    }
  }

  @Override
  public EmployeeTaskDao employeeTaskDao() {
    if (_employeeTaskDao != null) {
      return _employeeTaskDao;
    } else {
      synchronized(this) {
        if(_employeeTaskDao == null) {
          _employeeTaskDao = new EmployeeTaskDao_Impl(this);
        }
        return _employeeTaskDao;
      }
    }
  }

  @Override
  public SiteSurveyDao siteSurveyDao() {
    if (_siteSurveyDao != null) {
      return _siteSurveyDao;
    } else {
      synchronized(this) {
        if(_siteSurveyDao == null) {
          _siteSurveyDao = new SiteSurveyDao_Impl(this);
        }
        return _siteSurveyDao;
      }
    }
  }

  @Override
  public InventoryItemDao inventoryItemDao() {
    if (_inventoryItemDao != null) {
      return _inventoryItemDao;
    } else {
      synchronized(this) {
        if(_inventoryItemDao == null) {
          _inventoryItemDao = new InventoryItemDao_Impl(this);
        }
        return _inventoryItemDao;
      }
    }
  }

  @Override
  public DailyCommitDao dailyCommitDao() {
    if (_dailyCommitDao != null) {
      return _dailyCommitDao;
    } else {
      synchronized(this) {
        if(_dailyCommitDao == null) {
          _dailyCommitDao = new DailyCommitDao_Impl(this);
        }
        return _dailyCommitDao;
      }
    }
  }

  @Override
  public OutboxQueueDao outboxQueueDao() {
    if (_outboxQueueDao != null) {
      return _outboxQueueDao;
    } else {
      synchronized(this) {
        if(_outboxQueueDao == null) {
          _outboxQueueDao = new OutboxQueueDao_Impl(this);
        }
        return _outboxQueueDao;
      }
    }
  }

  @Override
  public CustomerDao customerDao() {
    if (_customerDao != null) {
      return _customerDao;
    } else {
      synchronized(this) {
        if(_customerDao == null) {
          _customerDao = new CustomerDao_Impl(this);
        }
        return _customerDao;
      }
    }
  }

  @Override
  public DispatchRecordDao dispatchRecordDao() {
    if (_dispatchRecordDao != null) {
      return _dispatchRecordDao;
    } else {
      synchronized(this) {
        if(_dispatchRecordDao == null) {
          _dispatchRecordDao = new DispatchRecordDao_Impl(this);
        }
        return _dispatchRecordDao;
      }
    }
  }

  @Override
  public SolarDesignDao solarDesignDao() {
    if (_solarDesignDao != null) {
      return _solarDesignDao;
    } else {
      synchronized(this) {
        if(_solarDesignDao == null) {
          _solarDesignDao = new SolarDesignDao_Impl(this);
        }
        return _solarDesignDao;
      }
    }
  }

  @Override
  public ElectricalDesignDao electricalDesignDao() {
    if (_electricalDesignDao != null) {
      return _electricalDesignDao;
    } else {
      synchronized(this) {
        if(_electricalDesignDao == null) {
          _electricalDesignDao = new ElectricalDesignDao_Impl(this);
        }
        return _electricalDesignDao;
      }
    }
  }

  @Override
  public AmcVisitDao amcVisitDao() {
    if (_amcVisitDao != null) {
      return _amcVisitDao;
    } else {
      synchronized(this) {
        if(_amcVisitDao == null) {
          _amcVisitDao = new AmcVisitDao_Impl(this);
        }
        return _amcVisitDao;
      }
    }
  }

  @Override
  public ServiceRequestDao serviceRequestDao() {
    if (_serviceRequestDao != null) {
      return _serviceRequestDao;
    } else {
      synchronized(this) {
        if(_serviceRequestDao == null) {
          _serviceRequestDao = new ServiceRequestDao_Impl(this);
        }
        return _serviceRequestDao;
      }
    }
  }

  @Override
  public SurveyEquipmentDao surveyEquipmentDao() {
    if (_surveyEquipmentDao != null) {
      return _surveyEquipmentDao;
    } else {
      synchronized(this) {
        if(_surveyEquipmentDao == null) {
          _surveyEquipmentDao = new SurveyEquipmentDao_Impl(this);
        }
        return _surveyEquipmentDao;
      }
    }
  }

  @Override
  public BillOfMaterialsDao billOfMaterialsDao() {
    if (_billOfMaterialsDao != null) {
      return _billOfMaterialsDao;
    } else {
      synchronized(this) {
        if(_billOfMaterialsDao == null) {
          _billOfMaterialsDao = new BillOfMaterialsDao_Impl(this);
        }
        return _billOfMaterialsDao;
      }
    }
  }

  @Override
  public ElectricalInspectionDao electricalInspectionDao() {
    if (_electricalInspectionDao != null) {
      return _electricalInspectionDao;
    } else {
      synchronized(this) {
        if(_electricalInspectionDao == null) {
          _electricalInspectionDao = new ElectricalInspectionDao_Impl(this);
        }
        return _electricalInspectionDao;
      }
    }
  }

  @Override
  public ApartmentDao apartmentDao() {
    if (_apartmentDao != null) {
      return _apartmentDao;
    } else {
      synchronized(this) {
        if(_apartmentDao == null) {
          _apartmentDao = new ApartmentDao_Impl(this);
        }
        return _apartmentDao;
      }
    }
  }

  @Override
  public InvoiceDao invoiceDao() {
    if (_invoiceDao != null) {
      return _invoiceDao;
    } else {
      synchronized(this) {
        if(_invoiceDao == null) {
          _invoiceDao = new InvoiceDao_Impl(this);
        }
        return _invoiceDao;
      }
    }
  }

  @Override
  public PaymentDao paymentDao() {
    if (_paymentDao != null) {
      return _paymentDao;
    } else {
      synchronized(this) {
        if(_paymentDao == null) {
          _paymentDao = new PaymentDao_Impl(this);
        }
        return _paymentDao;
      }
    }
  }

  @Override
  public TaskAssignmentDao taskAssignmentDao() {
    if (_taskAssignmentDao != null) {
      return _taskAssignmentDao;
    } else {
      synchronized(this) {
        if(_taskAssignmentDao == null) {
          _taskAssignmentDao = new TaskAssignmentDao_Impl(this);
        }
        return _taskAssignmentDao;
      }
    }
  }

  @Override
  public TaskImageDao taskImageDao() {
    if (_taskImageDao != null) {
      return _taskImageDao;
    } else {
      synchronized(this) {
        if(_taskImageDao == null) {
          _taskImageDao = new TaskImageDao_Impl(this);
        }
        return _taskImageDao;
      }
    }
  }

  @Override
  public CustomerNotificationDao customerNotificationDao() {
    if (_customerNotificationDao != null) {
      return _customerNotificationDao;
    } else {
      synchronized(this) {
        if(_customerNotificationDao == null) {
          _customerNotificationDao = new CustomerNotificationDao_Impl(this);
        }
        return _customerNotificationDao;
      }
    }
  }

  @Override
  public PerformanceSnapshotDao performanceSnapshotDao() {
    if (_performanceSnapshotDao != null) {
      return _performanceSnapshotDao;
    } else {
      synchronized(this) {
        if(_performanceSnapshotDao == null) {
          _performanceSnapshotDao = new PerformanceSnapshotDao_Impl(this);
        }
        return _performanceSnapshotDao;
      }
    }
  }
}
