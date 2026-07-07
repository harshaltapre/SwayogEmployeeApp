package com.example.swayogemployeeapp.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.example.swayogemployeeapp.data.local.entity.CustomerEntity;
import java.lang.Class;
import java.lang.Double;
import java.lang.Exception;
import java.lang.Integer;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class CustomerDao_Impl implements CustomerDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<CustomerEntity> __insertionAdapterOfCustomerEntity;

  private final EntityDeletionOrUpdateAdapter<CustomerEntity> __deletionAdapterOfCustomerEntity;

  private final EntityDeletionOrUpdateAdapter<CustomerEntity> __updateAdapterOfCustomerEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllCustomers;

  public CustomerDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfCustomerEntity = new EntityInsertionAdapter<CustomerEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `customers` (`id`,`customerCode`,`fullName`,`email`,`phoneNumber`,`city`,`address`,`systemSizeKw`,`installationDate`,`warrantyExpiry`,`panelBrand`,`inverterBrand`,`inverterModel`,`amcStatus`,`amcExpiryDate`,`status`,`partnerId`,`userId`,`projectStage`,`assignedEmployeeId`,`commissionAmount`,`commissionStatus`,`inverterLoginId`,`inverterPassword`,`inverterApiKey`,`inverterDeviceSn`,`portalPassword`,`latitude`,`longitude`,`cleaningWindow1`,`cleaningWindow2`,`cleaningWindow3`,`cleaningsPerMonth`,`clientType`,`consumerNumber`,`contractEndDate`,`contractStartDate`,`monthlyCleaningRate`,`paymentTerms`,`remarks`,`cleaningWindow4`,`cleaningWindow5`,`cleaningWindow6`,`cleaningWindow7`,`cleaningWindow8`,`commissionProofUrl`,`commissionPaidAt`,`apartmentId`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CustomerEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getCustomerCode());
        statement.bindString(3, entity.getFullName());
        statement.bindString(4, entity.getEmail());
        statement.bindString(5, entity.getPhoneNumber());
        statement.bindString(6, entity.getCity());
        statement.bindString(7, entity.getAddress());
        statement.bindDouble(8, entity.getSystemSizeKw());
        statement.bindString(9, entity.getInstallationDate());
        if (entity.getWarrantyExpiry() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getWarrantyExpiry());
        }
        if (entity.getPanelBrand() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getPanelBrand());
        }
        if (entity.getInverterBrand() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getInverterBrand());
        }
        if (entity.getInverterModel() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getInverterModel());
        }
        statement.bindString(14, entity.getAmcStatus());
        if (entity.getAmcExpiryDate() == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.getAmcExpiryDate());
        }
        statement.bindString(16, entity.getStatus());
        if (entity.getPartnerId() == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.getPartnerId());
        }
        if (entity.getUserId() == null) {
          statement.bindNull(18);
        } else {
          statement.bindString(18, entity.getUserId());
        }
        statement.bindLong(19, entity.getProjectStage());
        if (entity.getAssignedEmployeeId() == null) {
          statement.bindNull(20);
        } else {
          statement.bindString(20, entity.getAssignedEmployeeId());
        }
        if (entity.getCommissionAmount() == null) {
          statement.bindNull(21);
        } else {
          statement.bindDouble(21, entity.getCommissionAmount());
        }
        statement.bindString(22, entity.getCommissionStatus());
        if (entity.getInverterLoginId() == null) {
          statement.bindNull(23);
        } else {
          statement.bindString(23, entity.getInverterLoginId());
        }
        if (entity.getInverterPassword() == null) {
          statement.bindNull(24);
        } else {
          statement.bindString(24, entity.getInverterPassword());
        }
        if (entity.getInverterApiKey() == null) {
          statement.bindNull(25);
        } else {
          statement.bindString(25, entity.getInverterApiKey());
        }
        if (entity.getInverterDeviceSn() == null) {
          statement.bindNull(26);
        } else {
          statement.bindString(26, entity.getInverterDeviceSn());
        }
        if (entity.getPortalPassword() == null) {
          statement.bindNull(27);
        } else {
          statement.bindString(27, entity.getPortalPassword());
        }
        if (entity.getLatitude() == null) {
          statement.bindNull(28);
        } else {
          statement.bindDouble(28, entity.getLatitude());
        }
        if (entity.getLongitude() == null) {
          statement.bindNull(29);
        } else {
          statement.bindDouble(29, entity.getLongitude());
        }
        if (entity.getCleaningWindow1() == null) {
          statement.bindNull(30);
        } else {
          statement.bindString(30, entity.getCleaningWindow1());
        }
        if (entity.getCleaningWindow2() == null) {
          statement.bindNull(31);
        } else {
          statement.bindString(31, entity.getCleaningWindow2());
        }
        if (entity.getCleaningWindow3() == null) {
          statement.bindNull(32);
        } else {
          statement.bindString(32, entity.getCleaningWindow3());
        }
        if (entity.getCleaningsPerMonth() == null) {
          statement.bindNull(33);
        } else {
          statement.bindLong(33, entity.getCleaningsPerMonth());
        }
        if (entity.getClientType() == null) {
          statement.bindNull(34);
        } else {
          statement.bindString(34, entity.getClientType());
        }
        if (entity.getConsumerNumber() == null) {
          statement.bindNull(35);
        } else {
          statement.bindString(35, entity.getConsumerNumber());
        }
        if (entity.getContractEndDate() == null) {
          statement.bindNull(36);
        } else {
          statement.bindString(36, entity.getContractEndDate());
        }
        if (entity.getContractStartDate() == null) {
          statement.bindNull(37);
        } else {
          statement.bindString(37, entity.getContractStartDate());
        }
        if (entity.getMonthlyCleaningRate() == null) {
          statement.bindNull(38);
        } else {
          statement.bindDouble(38, entity.getMonthlyCleaningRate());
        }
        if (entity.getPaymentTerms() == null) {
          statement.bindNull(39);
        } else {
          statement.bindString(39, entity.getPaymentTerms());
        }
        if (entity.getRemarks() == null) {
          statement.bindNull(40);
        } else {
          statement.bindString(40, entity.getRemarks());
        }
        if (entity.getCleaningWindow4() == null) {
          statement.bindNull(41);
        } else {
          statement.bindString(41, entity.getCleaningWindow4());
        }
        if (entity.getCleaningWindow5() == null) {
          statement.bindNull(42);
        } else {
          statement.bindString(42, entity.getCleaningWindow5());
        }
        if (entity.getCleaningWindow6() == null) {
          statement.bindNull(43);
        } else {
          statement.bindString(43, entity.getCleaningWindow6());
        }
        if (entity.getCleaningWindow7() == null) {
          statement.bindNull(44);
        } else {
          statement.bindString(44, entity.getCleaningWindow7());
        }
        if (entity.getCleaningWindow8() == null) {
          statement.bindNull(45);
        } else {
          statement.bindString(45, entity.getCleaningWindow8());
        }
        if (entity.getCommissionProofUrl() == null) {
          statement.bindNull(46);
        } else {
          statement.bindString(46, entity.getCommissionProofUrl());
        }
        if (entity.getCommissionPaidAt() == null) {
          statement.bindNull(47);
        } else {
          statement.bindString(47, entity.getCommissionPaidAt());
        }
        if (entity.getApartmentId() == null) {
          statement.bindNull(48);
        } else {
          statement.bindLong(48, entity.getApartmentId());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(49, _tmp);
      }
    };
    this.__deletionAdapterOfCustomerEntity = new EntityDeletionOrUpdateAdapter<CustomerEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `customers` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CustomerEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfCustomerEntity = new EntityDeletionOrUpdateAdapter<CustomerEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `customers` SET `id` = ?,`customerCode` = ?,`fullName` = ?,`email` = ?,`phoneNumber` = ?,`city` = ?,`address` = ?,`systemSizeKw` = ?,`installationDate` = ?,`warrantyExpiry` = ?,`panelBrand` = ?,`inverterBrand` = ?,`inverterModel` = ?,`amcStatus` = ?,`amcExpiryDate` = ?,`status` = ?,`partnerId` = ?,`userId` = ?,`projectStage` = ?,`assignedEmployeeId` = ?,`commissionAmount` = ?,`commissionStatus` = ?,`inverterLoginId` = ?,`inverterPassword` = ?,`inverterApiKey` = ?,`inverterDeviceSn` = ?,`portalPassword` = ?,`latitude` = ?,`longitude` = ?,`cleaningWindow1` = ?,`cleaningWindow2` = ?,`cleaningWindow3` = ?,`cleaningsPerMonth` = ?,`clientType` = ?,`consumerNumber` = ?,`contractEndDate` = ?,`contractStartDate` = ?,`monthlyCleaningRate` = ?,`paymentTerms` = ?,`remarks` = ?,`cleaningWindow4` = ?,`cleaningWindow5` = ?,`cleaningWindow6` = ?,`cleaningWindow7` = ?,`cleaningWindow8` = ?,`commissionProofUrl` = ?,`commissionPaidAt` = ?,`apartmentId` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CustomerEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getCustomerCode());
        statement.bindString(3, entity.getFullName());
        statement.bindString(4, entity.getEmail());
        statement.bindString(5, entity.getPhoneNumber());
        statement.bindString(6, entity.getCity());
        statement.bindString(7, entity.getAddress());
        statement.bindDouble(8, entity.getSystemSizeKw());
        statement.bindString(9, entity.getInstallationDate());
        if (entity.getWarrantyExpiry() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getWarrantyExpiry());
        }
        if (entity.getPanelBrand() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getPanelBrand());
        }
        if (entity.getInverterBrand() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getInverterBrand());
        }
        if (entity.getInverterModel() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getInverterModel());
        }
        statement.bindString(14, entity.getAmcStatus());
        if (entity.getAmcExpiryDate() == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.getAmcExpiryDate());
        }
        statement.bindString(16, entity.getStatus());
        if (entity.getPartnerId() == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.getPartnerId());
        }
        if (entity.getUserId() == null) {
          statement.bindNull(18);
        } else {
          statement.bindString(18, entity.getUserId());
        }
        statement.bindLong(19, entity.getProjectStage());
        if (entity.getAssignedEmployeeId() == null) {
          statement.bindNull(20);
        } else {
          statement.bindString(20, entity.getAssignedEmployeeId());
        }
        if (entity.getCommissionAmount() == null) {
          statement.bindNull(21);
        } else {
          statement.bindDouble(21, entity.getCommissionAmount());
        }
        statement.bindString(22, entity.getCommissionStatus());
        if (entity.getInverterLoginId() == null) {
          statement.bindNull(23);
        } else {
          statement.bindString(23, entity.getInverterLoginId());
        }
        if (entity.getInverterPassword() == null) {
          statement.bindNull(24);
        } else {
          statement.bindString(24, entity.getInverterPassword());
        }
        if (entity.getInverterApiKey() == null) {
          statement.bindNull(25);
        } else {
          statement.bindString(25, entity.getInverterApiKey());
        }
        if (entity.getInverterDeviceSn() == null) {
          statement.bindNull(26);
        } else {
          statement.bindString(26, entity.getInverterDeviceSn());
        }
        if (entity.getPortalPassword() == null) {
          statement.bindNull(27);
        } else {
          statement.bindString(27, entity.getPortalPassword());
        }
        if (entity.getLatitude() == null) {
          statement.bindNull(28);
        } else {
          statement.bindDouble(28, entity.getLatitude());
        }
        if (entity.getLongitude() == null) {
          statement.bindNull(29);
        } else {
          statement.bindDouble(29, entity.getLongitude());
        }
        if (entity.getCleaningWindow1() == null) {
          statement.bindNull(30);
        } else {
          statement.bindString(30, entity.getCleaningWindow1());
        }
        if (entity.getCleaningWindow2() == null) {
          statement.bindNull(31);
        } else {
          statement.bindString(31, entity.getCleaningWindow2());
        }
        if (entity.getCleaningWindow3() == null) {
          statement.bindNull(32);
        } else {
          statement.bindString(32, entity.getCleaningWindow3());
        }
        if (entity.getCleaningsPerMonth() == null) {
          statement.bindNull(33);
        } else {
          statement.bindLong(33, entity.getCleaningsPerMonth());
        }
        if (entity.getClientType() == null) {
          statement.bindNull(34);
        } else {
          statement.bindString(34, entity.getClientType());
        }
        if (entity.getConsumerNumber() == null) {
          statement.bindNull(35);
        } else {
          statement.bindString(35, entity.getConsumerNumber());
        }
        if (entity.getContractEndDate() == null) {
          statement.bindNull(36);
        } else {
          statement.bindString(36, entity.getContractEndDate());
        }
        if (entity.getContractStartDate() == null) {
          statement.bindNull(37);
        } else {
          statement.bindString(37, entity.getContractStartDate());
        }
        if (entity.getMonthlyCleaningRate() == null) {
          statement.bindNull(38);
        } else {
          statement.bindDouble(38, entity.getMonthlyCleaningRate());
        }
        if (entity.getPaymentTerms() == null) {
          statement.bindNull(39);
        } else {
          statement.bindString(39, entity.getPaymentTerms());
        }
        if (entity.getRemarks() == null) {
          statement.bindNull(40);
        } else {
          statement.bindString(40, entity.getRemarks());
        }
        if (entity.getCleaningWindow4() == null) {
          statement.bindNull(41);
        } else {
          statement.bindString(41, entity.getCleaningWindow4());
        }
        if (entity.getCleaningWindow5() == null) {
          statement.bindNull(42);
        } else {
          statement.bindString(42, entity.getCleaningWindow5());
        }
        if (entity.getCleaningWindow6() == null) {
          statement.bindNull(43);
        } else {
          statement.bindString(43, entity.getCleaningWindow6());
        }
        if (entity.getCleaningWindow7() == null) {
          statement.bindNull(44);
        } else {
          statement.bindString(44, entity.getCleaningWindow7());
        }
        if (entity.getCleaningWindow8() == null) {
          statement.bindNull(45);
        } else {
          statement.bindString(45, entity.getCleaningWindow8());
        }
        if (entity.getCommissionProofUrl() == null) {
          statement.bindNull(46);
        } else {
          statement.bindString(46, entity.getCommissionProofUrl());
        }
        if (entity.getCommissionPaidAt() == null) {
          statement.bindNull(47);
        } else {
          statement.bindString(47, entity.getCommissionPaidAt());
        }
        if (entity.getApartmentId() == null) {
          statement.bindNull(48);
        } else {
          statement.bindLong(48, entity.getApartmentId());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(49, _tmp);
        statement.bindLong(50, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllCustomers = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM customers";
        return _query;
      }
    };
  }

  @Override
  public Object insertCustomer(final CustomerEntity customer,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfCustomerEntity.insert(customer);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertCustomers(final List<CustomerEntity> customers,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfCustomerEntity.insert(customers);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteCustomer(final CustomerEntity customer,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfCustomerEntity.handle(customer);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateCustomer(final CustomerEntity customer,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfCustomerEntity.handle(customer);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllCustomers(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllCustomers.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteAllCustomers.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<CustomerEntity>> getAllCustomers() {
    final String _sql = "SELECT * FROM customers";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"customers"}, new Callable<List<CustomerEntity>>() {
      @Override
      @NonNull
      public List<CustomerEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerCode = CursorUtil.getColumnIndexOrThrow(_cursor, "customerCode");
          final int _cursorIndexOfFullName = CursorUtil.getColumnIndexOrThrow(_cursor, "fullName");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
          final int _cursorIndexOfCity = CursorUtil.getColumnIndexOrThrow(_cursor, "city");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfInstallationDate = CursorUtil.getColumnIndexOrThrow(_cursor, "installationDate");
          final int _cursorIndexOfWarrantyExpiry = CursorUtil.getColumnIndexOrThrow(_cursor, "warrantyExpiry");
          final int _cursorIndexOfPanelBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "panelBrand");
          final int _cursorIndexOfInverterBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterBrand");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfAmcStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "amcStatus");
          final int _cursorIndexOfAmcExpiryDate = CursorUtil.getColumnIndexOrThrow(_cursor, "amcExpiryDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfProjectStage = CursorUtil.getColumnIndexOrThrow(_cursor, "projectStage");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCommissionAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionAmount");
          final int _cursorIndexOfCommissionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionStatus");
          final int _cursorIndexOfInverterLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterLoginId");
          final int _cursorIndexOfInverterPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterPassword");
          final int _cursorIndexOfInverterApiKey = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterApiKey");
          final int _cursorIndexOfInverterDeviceSn = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterDeviceSn");
          final int _cursorIndexOfPortalPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "portalPassword");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCleaningWindow1 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow1");
          final int _cursorIndexOfCleaningWindow2 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow2");
          final int _cursorIndexOfCleaningWindow3 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow3");
          final int _cursorIndexOfCleaningsPerMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningsPerMonth");
          final int _cursorIndexOfClientType = CursorUtil.getColumnIndexOrThrow(_cursor, "clientType");
          final int _cursorIndexOfConsumerNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "consumerNumber");
          final int _cursorIndexOfContractEndDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractEndDate");
          final int _cursorIndexOfContractStartDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractStartDate");
          final int _cursorIndexOfMonthlyCleaningRate = CursorUtil.getColumnIndexOrThrow(_cursor, "monthlyCleaningRate");
          final int _cursorIndexOfPaymentTerms = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentTerms");
          final int _cursorIndexOfRemarks = CursorUtil.getColumnIndexOrThrow(_cursor, "remarks");
          final int _cursorIndexOfCleaningWindow4 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow4");
          final int _cursorIndexOfCleaningWindow5 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow5");
          final int _cursorIndexOfCleaningWindow6 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow6");
          final int _cursorIndexOfCleaningWindow7 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow7");
          final int _cursorIndexOfCleaningWindow8 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow8");
          final int _cursorIndexOfCommissionProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionProofUrl");
          final int _cursorIndexOfCommissionPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionPaidAt");
          final int _cursorIndexOfApartmentId = CursorUtil.getColumnIndexOrThrow(_cursor, "apartmentId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerEntity> _result = new ArrayList<CustomerEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpCustomerCode;
            _tmpCustomerCode = _cursor.getString(_cursorIndexOfCustomerCode);
            final String _tmpFullName;
            _tmpFullName = _cursor.getString(_cursorIndexOfFullName);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpPhoneNumber;
            _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
            final String _tmpCity;
            _tmpCity = _cursor.getString(_cursorIndexOfCity);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final String _tmpInstallationDate;
            _tmpInstallationDate = _cursor.getString(_cursorIndexOfInstallationDate);
            final String _tmpWarrantyExpiry;
            if (_cursor.isNull(_cursorIndexOfWarrantyExpiry)) {
              _tmpWarrantyExpiry = null;
            } else {
              _tmpWarrantyExpiry = _cursor.getString(_cursorIndexOfWarrantyExpiry);
            }
            final String _tmpPanelBrand;
            if (_cursor.isNull(_cursorIndexOfPanelBrand)) {
              _tmpPanelBrand = null;
            } else {
              _tmpPanelBrand = _cursor.getString(_cursorIndexOfPanelBrand);
            }
            final String _tmpInverterBrand;
            if (_cursor.isNull(_cursorIndexOfInverterBrand)) {
              _tmpInverterBrand = null;
            } else {
              _tmpInverterBrand = _cursor.getString(_cursorIndexOfInverterBrand);
            }
            final String _tmpInverterModel;
            if (_cursor.isNull(_cursorIndexOfInverterModel)) {
              _tmpInverterModel = null;
            } else {
              _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            }
            final String _tmpAmcStatus;
            _tmpAmcStatus = _cursor.getString(_cursorIndexOfAmcStatus);
            final String _tmpAmcExpiryDate;
            if (_cursor.isNull(_cursorIndexOfAmcExpiryDate)) {
              _tmpAmcExpiryDate = null;
            } else {
              _tmpAmcExpiryDate = _cursor.getString(_cursorIndexOfAmcExpiryDate);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final int _tmpProjectStage;
            _tmpProjectStage = _cursor.getInt(_cursorIndexOfProjectStage);
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final Double _tmpCommissionAmount;
            if (_cursor.isNull(_cursorIndexOfCommissionAmount)) {
              _tmpCommissionAmount = null;
            } else {
              _tmpCommissionAmount = _cursor.getDouble(_cursorIndexOfCommissionAmount);
            }
            final String _tmpCommissionStatus;
            _tmpCommissionStatus = _cursor.getString(_cursorIndexOfCommissionStatus);
            final String _tmpInverterLoginId;
            if (_cursor.isNull(_cursorIndexOfInverterLoginId)) {
              _tmpInverterLoginId = null;
            } else {
              _tmpInverterLoginId = _cursor.getString(_cursorIndexOfInverterLoginId);
            }
            final String _tmpInverterPassword;
            if (_cursor.isNull(_cursorIndexOfInverterPassword)) {
              _tmpInverterPassword = null;
            } else {
              _tmpInverterPassword = _cursor.getString(_cursorIndexOfInverterPassword);
            }
            final String _tmpInverterApiKey;
            if (_cursor.isNull(_cursorIndexOfInverterApiKey)) {
              _tmpInverterApiKey = null;
            } else {
              _tmpInverterApiKey = _cursor.getString(_cursorIndexOfInverterApiKey);
            }
            final String _tmpInverterDeviceSn;
            if (_cursor.isNull(_cursorIndexOfInverterDeviceSn)) {
              _tmpInverterDeviceSn = null;
            } else {
              _tmpInverterDeviceSn = _cursor.getString(_cursorIndexOfInverterDeviceSn);
            }
            final String _tmpPortalPassword;
            if (_cursor.isNull(_cursorIndexOfPortalPassword)) {
              _tmpPortalPassword = null;
            } else {
              _tmpPortalPassword = _cursor.getString(_cursorIndexOfPortalPassword);
            }
            final Double _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            }
            final Double _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            }
            final String _tmpCleaningWindow1;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow1)) {
              _tmpCleaningWindow1 = null;
            } else {
              _tmpCleaningWindow1 = _cursor.getString(_cursorIndexOfCleaningWindow1);
            }
            final String _tmpCleaningWindow2;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow2)) {
              _tmpCleaningWindow2 = null;
            } else {
              _tmpCleaningWindow2 = _cursor.getString(_cursorIndexOfCleaningWindow2);
            }
            final String _tmpCleaningWindow3;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow3)) {
              _tmpCleaningWindow3 = null;
            } else {
              _tmpCleaningWindow3 = _cursor.getString(_cursorIndexOfCleaningWindow3);
            }
            final Integer _tmpCleaningsPerMonth;
            if (_cursor.isNull(_cursorIndexOfCleaningsPerMonth)) {
              _tmpCleaningsPerMonth = null;
            } else {
              _tmpCleaningsPerMonth = _cursor.getInt(_cursorIndexOfCleaningsPerMonth);
            }
            final String _tmpClientType;
            if (_cursor.isNull(_cursorIndexOfClientType)) {
              _tmpClientType = null;
            } else {
              _tmpClientType = _cursor.getString(_cursorIndexOfClientType);
            }
            final String _tmpConsumerNumber;
            if (_cursor.isNull(_cursorIndexOfConsumerNumber)) {
              _tmpConsumerNumber = null;
            } else {
              _tmpConsumerNumber = _cursor.getString(_cursorIndexOfConsumerNumber);
            }
            final String _tmpContractEndDate;
            if (_cursor.isNull(_cursorIndexOfContractEndDate)) {
              _tmpContractEndDate = null;
            } else {
              _tmpContractEndDate = _cursor.getString(_cursorIndexOfContractEndDate);
            }
            final String _tmpContractStartDate;
            if (_cursor.isNull(_cursorIndexOfContractStartDate)) {
              _tmpContractStartDate = null;
            } else {
              _tmpContractStartDate = _cursor.getString(_cursorIndexOfContractStartDate);
            }
            final Double _tmpMonthlyCleaningRate;
            if (_cursor.isNull(_cursorIndexOfMonthlyCleaningRate)) {
              _tmpMonthlyCleaningRate = null;
            } else {
              _tmpMonthlyCleaningRate = _cursor.getDouble(_cursorIndexOfMonthlyCleaningRate);
            }
            final String _tmpPaymentTerms;
            if (_cursor.isNull(_cursorIndexOfPaymentTerms)) {
              _tmpPaymentTerms = null;
            } else {
              _tmpPaymentTerms = _cursor.getString(_cursorIndexOfPaymentTerms);
            }
            final String _tmpRemarks;
            if (_cursor.isNull(_cursorIndexOfRemarks)) {
              _tmpRemarks = null;
            } else {
              _tmpRemarks = _cursor.getString(_cursorIndexOfRemarks);
            }
            final String _tmpCleaningWindow4;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow4)) {
              _tmpCleaningWindow4 = null;
            } else {
              _tmpCleaningWindow4 = _cursor.getString(_cursorIndexOfCleaningWindow4);
            }
            final String _tmpCleaningWindow5;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow5)) {
              _tmpCleaningWindow5 = null;
            } else {
              _tmpCleaningWindow5 = _cursor.getString(_cursorIndexOfCleaningWindow5);
            }
            final String _tmpCleaningWindow6;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow6)) {
              _tmpCleaningWindow6 = null;
            } else {
              _tmpCleaningWindow6 = _cursor.getString(_cursorIndexOfCleaningWindow6);
            }
            final String _tmpCleaningWindow7;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow7)) {
              _tmpCleaningWindow7 = null;
            } else {
              _tmpCleaningWindow7 = _cursor.getString(_cursorIndexOfCleaningWindow7);
            }
            final String _tmpCleaningWindow8;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow8)) {
              _tmpCleaningWindow8 = null;
            } else {
              _tmpCleaningWindow8 = _cursor.getString(_cursorIndexOfCleaningWindow8);
            }
            final String _tmpCommissionProofUrl;
            if (_cursor.isNull(_cursorIndexOfCommissionProofUrl)) {
              _tmpCommissionProofUrl = null;
            } else {
              _tmpCommissionProofUrl = _cursor.getString(_cursorIndexOfCommissionProofUrl);
            }
            final String _tmpCommissionPaidAt;
            if (_cursor.isNull(_cursorIndexOfCommissionPaidAt)) {
              _tmpCommissionPaidAt = null;
            } else {
              _tmpCommissionPaidAt = _cursor.getString(_cursorIndexOfCommissionPaidAt);
            }
            final Integer _tmpApartmentId;
            if (_cursor.isNull(_cursorIndexOfApartmentId)) {
              _tmpApartmentId = null;
            } else {
              _tmpApartmentId = _cursor.getInt(_cursorIndexOfApartmentId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new CustomerEntity(_tmpId,_tmpCustomerCode,_tmpFullName,_tmpEmail,_tmpPhoneNumber,_tmpCity,_tmpAddress,_tmpSystemSizeKw,_tmpInstallationDate,_tmpWarrantyExpiry,_tmpPanelBrand,_tmpInverterBrand,_tmpInverterModel,_tmpAmcStatus,_tmpAmcExpiryDate,_tmpStatus,_tmpPartnerId,_tmpUserId,_tmpProjectStage,_tmpAssignedEmployeeId,_tmpCommissionAmount,_tmpCommissionStatus,_tmpInverterLoginId,_tmpInverterPassword,_tmpInverterApiKey,_tmpInverterDeviceSn,_tmpPortalPassword,_tmpLatitude,_tmpLongitude,_tmpCleaningWindow1,_tmpCleaningWindow2,_tmpCleaningWindow3,_tmpCleaningsPerMonth,_tmpClientType,_tmpConsumerNumber,_tmpContractEndDate,_tmpContractStartDate,_tmpMonthlyCleaningRate,_tmpPaymentTerms,_tmpRemarks,_tmpCleaningWindow4,_tmpCleaningWindow5,_tmpCleaningWindow6,_tmpCleaningWindow7,_tmpCleaningWindow8,_tmpCommissionProofUrl,_tmpCommissionPaidAt,_tmpApartmentId,_tmpIsSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object getAllCustomersList(final Continuation<? super List<CustomerEntity>> $completion) {
    final String _sql = "SELECT * FROM customers";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<CustomerEntity>>() {
      @Override
      @NonNull
      public List<CustomerEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerCode = CursorUtil.getColumnIndexOrThrow(_cursor, "customerCode");
          final int _cursorIndexOfFullName = CursorUtil.getColumnIndexOrThrow(_cursor, "fullName");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
          final int _cursorIndexOfCity = CursorUtil.getColumnIndexOrThrow(_cursor, "city");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfInstallationDate = CursorUtil.getColumnIndexOrThrow(_cursor, "installationDate");
          final int _cursorIndexOfWarrantyExpiry = CursorUtil.getColumnIndexOrThrow(_cursor, "warrantyExpiry");
          final int _cursorIndexOfPanelBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "panelBrand");
          final int _cursorIndexOfInverterBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterBrand");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfAmcStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "amcStatus");
          final int _cursorIndexOfAmcExpiryDate = CursorUtil.getColumnIndexOrThrow(_cursor, "amcExpiryDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfProjectStage = CursorUtil.getColumnIndexOrThrow(_cursor, "projectStage");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCommissionAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionAmount");
          final int _cursorIndexOfCommissionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionStatus");
          final int _cursorIndexOfInverterLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterLoginId");
          final int _cursorIndexOfInverterPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterPassword");
          final int _cursorIndexOfInverterApiKey = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterApiKey");
          final int _cursorIndexOfInverterDeviceSn = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterDeviceSn");
          final int _cursorIndexOfPortalPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "portalPassword");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCleaningWindow1 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow1");
          final int _cursorIndexOfCleaningWindow2 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow2");
          final int _cursorIndexOfCleaningWindow3 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow3");
          final int _cursorIndexOfCleaningsPerMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningsPerMonth");
          final int _cursorIndexOfClientType = CursorUtil.getColumnIndexOrThrow(_cursor, "clientType");
          final int _cursorIndexOfConsumerNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "consumerNumber");
          final int _cursorIndexOfContractEndDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractEndDate");
          final int _cursorIndexOfContractStartDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractStartDate");
          final int _cursorIndexOfMonthlyCleaningRate = CursorUtil.getColumnIndexOrThrow(_cursor, "monthlyCleaningRate");
          final int _cursorIndexOfPaymentTerms = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentTerms");
          final int _cursorIndexOfRemarks = CursorUtil.getColumnIndexOrThrow(_cursor, "remarks");
          final int _cursorIndexOfCleaningWindow4 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow4");
          final int _cursorIndexOfCleaningWindow5 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow5");
          final int _cursorIndexOfCleaningWindow6 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow6");
          final int _cursorIndexOfCleaningWindow7 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow7");
          final int _cursorIndexOfCleaningWindow8 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow8");
          final int _cursorIndexOfCommissionProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionProofUrl");
          final int _cursorIndexOfCommissionPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionPaidAt");
          final int _cursorIndexOfApartmentId = CursorUtil.getColumnIndexOrThrow(_cursor, "apartmentId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerEntity> _result = new ArrayList<CustomerEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpCustomerCode;
            _tmpCustomerCode = _cursor.getString(_cursorIndexOfCustomerCode);
            final String _tmpFullName;
            _tmpFullName = _cursor.getString(_cursorIndexOfFullName);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpPhoneNumber;
            _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
            final String _tmpCity;
            _tmpCity = _cursor.getString(_cursorIndexOfCity);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final String _tmpInstallationDate;
            _tmpInstallationDate = _cursor.getString(_cursorIndexOfInstallationDate);
            final String _tmpWarrantyExpiry;
            if (_cursor.isNull(_cursorIndexOfWarrantyExpiry)) {
              _tmpWarrantyExpiry = null;
            } else {
              _tmpWarrantyExpiry = _cursor.getString(_cursorIndexOfWarrantyExpiry);
            }
            final String _tmpPanelBrand;
            if (_cursor.isNull(_cursorIndexOfPanelBrand)) {
              _tmpPanelBrand = null;
            } else {
              _tmpPanelBrand = _cursor.getString(_cursorIndexOfPanelBrand);
            }
            final String _tmpInverterBrand;
            if (_cursor.isNull(_cursorIndexOfInverterBrand)) {
              _tmpInverterBrand = null;
            } else {
              _tmpInverterBrand = _cursor.getString(_cursorIndexOfInverterBrand);
            }
            final String _tmpInverterModel;
            if (_cursor.isNull(_cursorIndexOfInverterModel)) {
              _tmpInverterModel = null;
            } else {
              _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            }
            final String _tmpAmcStatus;
            _tmpAmcStatus = _cursor.getString(_cursorIndexOfAmcStatus);
            final String _tmpAmcExpiryDate;
            if (_cursor.isNull(_cursorIndexOfAmcExpiryDate)) {
              _tmpAmcExpiryDate = null;
            } else {
              _tmpAmcExpiryDate = _cursor.getString(_cursorIndexOfAmcExpiryDate);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final int _tmpProjectStage;
            _tmpProjectStage = _cursor.getInt(_cursorIndexOfProjectStage);
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final Double _tmpCommissionAmount;
            if (_cursor.isNull(_cursorIndexOfCommissionAmount)) {
              _tmpCommissionAmount = null;
            } else {
              _tmpCommissionAmount = _cursor.getDouble(_cursorIndexOfCommissionAmount);
            }
            final String _tmpCommissionStatus;
            _tmpCommissionStatus = _cursor.getString(_cursorIndexOfCommissionStatus);
            final String _tmpInverterLoginId;
            if (_cursor.isNull(_cursorIndexOfInverterLoginId)) {
              _tmpInverterLoginId = null;
            } else {
              _tmpInverterLoginId = _cursor.getString(_cursorIndexOfInverterLoginId);
            }
            final String _tmpInverterPassword;
            if (_cursor.isNull(_cursorIndexOfInverterPassword)) {
              _tmpInverterPassword = null;
            } else {
              _tmpInverterPassword = _cursor.getString(_cursorIndexOfInverterPassword);
            }
            final String _tmpInverterApiKey;
            if (_cursor.isNull(_cursorIndexOfInverterApiKey)) {
              _tmpInverterApiKey = null;
            } else {
              _tmpInverterApiKey = _cursor.getString(_cursorIndexOfInverterApiKey);
            }
            final String _tmpInverterDeviceSn;
            if (_cursor.isNull(_cursorIndexOfInverterDeviceSn)) {
              _tmpInverterDeviceSn = null;
            } else {
              _tmpInverterDeviceSn = _cursor.getString(_cursorIndexOfInverterDeviceSn);
            }
            final String _tmpPortalPassword;
            if (_cursor.isNull(_cursorIndexOfPortalPassword)) {
              _tmpPortalPassword = null;
            } else {
              _tmpPortalPassword = _cursor.getString(_cursorIndexOfPortalPassword);
            }
            final Double _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            }
            final Double _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            }
            final String _tmpCleaningWindow1;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow1)) {
              _tmpCleaningWindow1 = null;
            } else {
              _tmpCleaningWindow1 = _cursor.getString(_cursorIndexOfCleaningWindow1);
            }
            final String _tmpCleaningWindow2;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow2)) {
              _tmpCleaningWindow2 = null;
            } else {
              _tmpCleaningWindow2 = _cursor.getString(_cursorIndexOfCleaningWindow2);
            }
            final String _tmpCleaningWindow3;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow3)) {
              _tmpCleaningWindow3 = null;
            } else {
              _tmpCleaningWindow3 = _cursor.getString(_cursorIndexOfCleaningWindow3);
            }
            final Integer _tmpCleaningsPerMonth;
            if (_cursor.isNull(_cursorIndexOfCleaningsPerMonth)) {
              _tmpCleaningsPerMonth = null;
            } else {
              _tmpCleaningsPerMonth = _cursor.getInt(_cursorIndexOfCleaningsPerMonth);
            }
            final String _tmpClientType;
            if (_cursor.isNull(_cursorIndexOfClientType)) {
              _tmpClientType = null;
            } else {
              _tmpClientType = _cursor.getString(_cursorIndexOfClientType);
            }
            final String _tmpConsumerNumber;
            if (_cursor.isNull(_cursorIndexOfConsumerNumber)) {
              _tmpConsumerNumber = null;
            } else {
              _tmpConsumerNumber = _cursor.getString(_cursorIndexOfConsumerNumber);
            }
            final String _tmpContractEndDate;
            if (_cursor.isNull(_cursorIndexOfContractEndDate)) {
              _tmpContractEndDate = null;
            } else {
              _tmpContractEndDate = _cursor.getString(_cursorIndexOfContractEndDate);
            }
            final String _tmpContractStartDate;
            if (_cursor.isNull(_cursorIndexOfContractStartDate)) {
              _tmpContractStartDate = null;
            } else {
              _tmpContractStartDate = _cursor.getString(_cursorIndexOfContractStartDate);
            }
            final Double _tmpMonthlyCleaningRate;
            if (_cursor.isNull(_cursorIndexOfMonthlyCleaningRate)) {
              _tmpMonthlyCleaningRate = null;
            } else {
              _tmpMonthlyCleaningRate = _cursor.getDouble(_cursorIndexOfMonthlyCleaningRate);
            }
            final String _tmpPaymentTerms;
            if (_cursor.isNull(_cursorIndexOfPaymentTerms)) {
              _tmpPaymentTerms = null;
            } else {
              _tmpPaymentTerms = _cursor.getString(_cursorIndexOfPaymentTerms);
            }
            final String _tmpRemarks;
            if (_cursor.isNull(_cursorIndexOfRemarks)) {
              _tmpRemarks = null;
            } else {
              _tmpRemarks = _cursor.getString(_cursorIndexOfRemarks);
            }
            final String _tmpCleaningWindow4;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow4)) {
              _tmpCleaningWindow4 = null;
            } else {
              _tmpCleaningWindow4 = _cursor.getString(_cursorIndexOfCleaningWindow4);
            }
            final String _tmpCleaningWindow5;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow5)) {
              _tmpCleaningWindow5 = null;
            } else {
              _tmpCleaningWindow5 = _cursor.getString(_cursorIndexOfCleaningWindow5);
            }
            final String _tmpCleaningWindow6;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow6)) {
              _tmpCleaningWindow6 = null;
            } else {
              _tmpCleaningWindow6 = _cursor.getString(_cursorIndexOfCleaningWindow6);
            }
            final String _tmpCleaningWindow7;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow7)) {
              _tmpCleaningWindow7 = null;
            } else {
              _tmpCleaningWindow7 = _cursor.getString(_cursorIndexOfCleaningWindow7);
            }
            final String _tmpCleaningWindow8;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow8)) {
              _tmpCleaningWindow8 = null;
            } else {
              _tmpCleaningWindow8 = _cursor.getString(_cursorIndexOfCleaningWindow8);
            }
            final String _tmpCommissionProofUrl;
            if (_cursor.isNull(_cursorIndexOfCommissionProofUrl)) {
              _tmpCommissionProofUrl = null;
            } else {
              _tmpCommissionProofUrl = _cursor.getString(_cursorIndexOfCommissionProofUrl);
            }
            final String _tmpCommissionPaidAt;
            if (_cursor.isNull(_cursorIndexOfCommissionPaidAt)) {
              _tmpCommissionPaidAt = null;
            } else {
              _tmpCommissionPaidAt = _cursor.getString(_cursorIndexOfCommissionPaidAt);
            }
            final Integer _tmpApartmentId;
            if (_cursor.isNull(_cursorIndexOfApartmentId)) {
              _tmpApartmentId = null;
            } else {
              _tmpApartmentId = _cursor.getInt(_cursorIndexOfApartmentId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new CustomerEntity(_tmpId,_tmpCustomerCode,_tmpFullName,_tmpEmail,_tmpPhoneNumber,_tmpCity,_tmpAddress,_tmpSystemSizeKw,_tmpInstallationDate,_tmpWarrantyExpiry,_tmpPanelBrand,_tmpInverterBrand,_tmpInverterModel,_tmpAmcStatus,_tmpAmcExpiryDate,_tmpStatus,_tmpPartnerId,_tmpUserId,_tmpProjectStage,_tmpAssignedEmployeeId,_tmpCommissionAmount,_tmpCommissionStatus,_tmpInverterLoginId,_tmpInverterPassword,_tmpInverterApiKey,_tmpInverterDeviceSn,_tmpPortalPassword,_tmpLatitude,_tmpLongitude,_tmpCleaningWindow1,_tmpCleaningWindow2,_tmpCleaningWindow3,_tmpCleaningsPerMonth,_tmpClientType,_tmpConsumerNumber,_tmpContractEndDate,_tmpContractStartDate,_tmpMonthlyCleaningRate,_tmpPaymentTerms,_tmpRemarks,_tmpCleaningWindow4,_tmpCleaningWindow5,_tmpCleaningWindow6,_tmpCleaningWindow7,_tmpCleaningWindow8,_tmpCommissionProofUrl,_tmpCommissionPaidAt,_tmpApartmentId,_tmpIsSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getCustomerById(final int id,
      final Continuation<? super CustomerEntity> $completion) {
    final String _sql = "SELECT * FROM customers WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<CustomerEntity>() {
      @Override
      @Nullable
      public CustomerEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerCode = CursorUtil.getColumnIndexOrThrow(_cursor, "customerCode");
          final int _cursorIndexOfFullName = CursorUtil.getColumnIndexOrThrow(_cursor, "fullName");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
          final int _cursorIndexOfCity = CursorUtil.getColumnIndexOrThrow(_cursor, "city");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfInstallationDate = CursorUtil.getColumnIndexOrThrow(_cursor, "installationDate");
          final int _cursorIndexOfWarrantyExpiry = CursorUtil.getColumnIndexOrThrow(_cursor, "warrantyExpiry");
          final int _cursorIndexOfPanelBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "panelBrand");
          final int _cursorIndexOfInverterBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterBrand");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfAmcStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "amcStatus");
          final int _cursorIndexOfAmcExpiryDate = CursorUtil.getColumnIndexOrThrow(_cursor, "amcExpiryDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfProjectStage = CursorUtil.getColumnIndexOrThrow(_cursor, "projectStage");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCommissionAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionAmount");
          final int _cursorIndexOfCommissionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionStatus");
          final int _cursorIndexOfInverterLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterLoginId");
          final int _cursorIndexOfInverterPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterPassword");
          final int _cursorIndexOfInverterApiKey = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterApiKey");
          final int _cursorIndexOfInverterDeviceSn = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterDeviceSn");
          final int _cursorIndexOfPortalPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "portalPassword");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCleaningWindow1 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow1");
          final int _cursorIndexOfCleaningWindow2 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow2");
          final int _cursorIndexOfCleaningWindow3 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow3");
          final int _cursorIndexOfCleaningsPerMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningsPerMonth");
          final int _cursorIndexOfClientType = CursorUtil.getColumnIndexOrThrow(_cursor, "clientType");
          final int _cursorIndexOfConsumerNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "consumerNumber");
          final int _cursorIndexOfContractEndDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractEndDate");
          final int _cursorIndexOfContractStartDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractStartDate");
          final int _cursorIndexOfMonthlyCleaningRate = CursorUtil.getColumnIndexOrThrow(_cursor, "monthlyCleaningRate");
          final int _cursorIndexOfPaymentTerms = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentTerms");
          final int _cursorIndexOfRemarks = CursorUtil.getColumnIndexOrThrow(_cursor, "remarks");
          final int _cursorIndexOfCleaningWindow4 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow4");
          final int _cursorIndexOfCleaningWindow5 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow5");
          final int _cursorIndexOfCleaningWindow6 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow6");
          final int _cursorIndexOfCleaningWindow7 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow7");
          final int _cursorIndexOfCleaningWindow8 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow8");
          final int _cursorIndexOfCommissionProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionProofUrl");
          final int _cursorIndexOfCommissionPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionPaidAt");
          final int _cursorIndexOfApartmentId = CursorUtil.getColumnIndexOrThrow(_cursor, "apartmentId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final CustomerEntity _result;
          if (_cursor.moveToFirst()) {
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpCustomerCode;
            _tmpCustomerCode = _cursor.getString(_cursorIndexOfCustomerCode);
            final String _tmpFullName;
            _tmpFullName = _cursor.getString(_cursorIndexOfFullName);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpPhoneNumber;
            _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
            final String _tmpCity;
            _tmpCity = _cursor.getString(_cursorIndexOfCity);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final String _tmpInstallationDate;
            _tmpInstallationDate = _cursor.getString(_cursorIndexOfInstallationDate);
            final String _tmpWarrantyExpiry;
            if (_cursor.isNull(_cursorIndexOfWarrantyExpiry)) {
              _tmpWarrantyExpiry = null;
            } else {
              _tmpWarrantyExpiry = _cursor.getString(_cursorIndexOfWarrantyExpiry);
            }
            final String _tmpPanelBrand;
            if (_cursor.isNull(_cursorIndexOfPanelBrand)) {
              _tmpPanelBrand = null;
            } else {
              _tmpPanelBrand = _cursor.getString(_cursorIndexOfPanelBrand);
            }
            final String _tmpInverterBrand;
            if (_cursor.isNull(_cursorIndexOfInverterBrand)) {
              _tmpInverterBrand = null;
            } else {
              _tmpInverterBrand = _cursor.getString(_cursorIndexOfInverterBrand);
            }
            final String _tmpInverterModel;
            if (_cursor.isNull(_cursorIndexOfInverterModel)) {
              _tmpInverterModel = null;
            } else {
              _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            }
            final String _tmpAmcStatus;
            _tmpAmcStatus = _cursor.getString(_cursorIndexOfAmcStatus);
            final String _tmpAmcExpiryDate;
            if (_cursor.isNull(_cursorIndexOfAmcExpiryDate)) {
              _tmpAmcExpiryDate = null;
            } else {
              _tmpAmcExpiryDate = _cursor.getString(_cursorIndexOfAmcExpiryDate);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final int _tmpProjectStage;
            _tmpProjectStage = _cursor.getInt(_cursorIndexOfProjectStage);
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final Double _tmpCommissionAmount;
            if (_cursor.isNull(_cursorIndexOfCommissionAmount)) {
              _tmpCommissionAmount = null;
            } else {
              _tmpCommissionAmount = _cursor.getDouble(_cursorIndexOfCommissionAmount);
            }
            final String _tmpCommissionStatus;
            _tmpCommissionStatus = _cursor.getString(_cursorIndexOfCommissionStatus);
            final String _tmpInverterLoginId;
            if (_cursor.isNull(_cursorIndexOfInverterLoginId)) {
              _tmpInverterLoginId = null;
            } else {
              _tmpInverterLoginId = _cursor.getString(_cursorIndexOfInverterLoginId);
            }
            final String _tmpInverterPassword;
            if (_cursor.isNull(_cursorIndexOfInverterPassword)) {
              _tmpInverterPassword = null;
            } else {
              _tmpInverterPassword = _cursor.getString(_cursorIndexOfInverterPassword);
            }
            final String _tmpInverterApiKey;
            if (_cursor.isNull(_cursorIndexOfInverterApiKey)) {
              _tmpInverterApiKey = null;
            } else {
              _tmpInverterApiKey = _cursor.getString(_cursorIndexOfInverterApiKey);
            }
            final String _tmpInverterDeviceSn;
            if (_cursor.isNull(_cursorIndexOfInverterDeviceSn)) {
              _tmpInverterDeviceSn = null;
            } else {
              _tmpInverterDeviceSn = _cursor.getString(_cursorIndexOfInverterDeviceSn);
            }
            final String _tmpPortalPassword;
            if (_cursor.isNull(_cursorIndexOfPortalPassword)) {
              _tmpPortalPassword = null;
            } else {
              _tmpPortalPassword = _cursor.getString(_cursorIndexOfPortalPassword);
            }
            final Double _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            }
            final Double _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            }
            final String _tmpCleaningWindow1;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow1)) {
              _tmpCleaningWindow1 = null;
            } else {
              _tmpCleaningWindow1 = _cursor.getString(_cursorIndexOfCleaningWindow1);
            }
            final String _tmpCleaningWindow2;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow2)) {
              _tmpCleaningWindow2 = null;
            } else {
              _tmpCleaningWindow2 = _cursor.getString(_cursorIndexOfCleaningWindow2);
            }
            final String _tmpCleaningWindow3;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow3)) {
              _tmpCleaningWindow3 = null;
            } else {
              _tmpCleaningWindow3 = _cursor.getString(_cursorIndexOfCleaningWindow3);
            }
            final Integer _tmpCleaningsPerMonth;
            if (_cursor.isNull(_cursorIndexOfCleaningsPerMonth)) {
              _tmpCleaningsPerMonth = null;
            } else {
              _tmpCleaningsPerMonth = _cursor.getInt(_cursorIndexOfCleaningsPerMonth);
            }
            final String _tmpClientType;
            if (_cursor.isNull(_cursorIndexOfClientType)) {
              _tmpClientType = null;
            } else {
              _tmpClientType = _cursor.getString(_cursorIndexOfClientType);
            }
            final String _tmpConsumerNumber;
            if (_cursor.isNull(_cursorIndexOfConsumerNumber)) {
              _tmpConsumerNumber = null;
            } else {
              _tmpConsumerNumber = _cursor.getString(_cursorIndexOfConsumerNumber);
            }
            final String _tmpContractEndDate;
            if (_cursor.isNull(_cursorIndexOfContractEndDate)) {
              _tmpContractEndDate = null;
            } else {
              _tmpContractEndDate = _cursor.getString(_cursorIndexOfContractEndDate);
            }
            final String _tmpContractStartDate;
            if (_cursor.isNull(_cursorIndexOfContractStartDate)) {
              _tmpContractStartDate = null;
            } else {
              _tmpContractStartDate = _cursor.getString(_cursorIndexOfContractStartDate);
            }
            final Double _tmpMonthlyCleaningRate;
            if (_cursor.isNull(_cursorIndexOfMonthlyCleaningRate)) {
              _tmpMonthlyCleaningRate = null;
            } else {
              _tmpMonthlyCleaningRate = _cursor.getDouble(_cursorIndexOfMonthlyCleaningRate);
            }
            final String _tmpPaymentTerms;
            if (_cursor.isNull(_cursorIndexOfPaymentTerms)) {
              _tmpPaymentTerms = null;
            } else {
              _tmpPaymentTerms = _cursor.getString(_cursorIndexOfPaymentTerms);
            }
            final String _tmpRemarks;
            if (_cursor.isNull(_cursorIndexOfRemarks)) {
              _tmpRemarks = null;
            } else {
              _tmpRemarks = _cursor.getString(_cursorIndexOfRemarks);
            }
            final String _tmpCleaningWindow4;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow4)) {
              _tmpCleaningWindow4 = null;
            } else {
              _tmpCleaningWindow4 = _cursor.getString(_cursorIndexOfCleaningWindow4);
            }
            final String _tmpCleaningWindow5;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow5)) {
              _tmpCleaningWindow5 = null;
            } else {
              _tmpCleaningWindow5 = _cursor.getString(_cursorIndexOfCleaningWindow5);
            }
            final String _tmpCleaningWindow6;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow6)) {
              _tmpCleaningWindow6 = null;
            } else {
              _tmpCleaningWindow6 = _cursor.getString(_cursorIndexOfCleaningWindow6);
            }
            final String _tmpCleaningWindow7;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow7)) {
              _tmpCleaningWindow7 = null;
            } else {
              _tmpCleaningWindow7 = _cursor.getString(_cursorIndexOfCleaningWindow7);
            }
            final String _tmpCleaningWindow8;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow8)) {
              _tmpCleaningWindow8 = null;
            } else {
              _tmpCleaningWindow8 = _cursor.getString(_cursorIndexOfCleaningWindow8);
            }
            final String _tmpCommissionProofUrl;
            if (_cursor.isNull(_cursorIndexOfCommissionProofUrl)) {
              _tmpCommissionProofUrl = null;
            } else {
              _tmpCommissionProofUrl = _cursor.getString(_cursorIndexOfCommissionProofUrl);
            }
            final String _tmpCommissionPaidAt;
            if (_cursor.isNull(_cursorIndexOfCommissionPaidAt)) {
              _tmpCommissionPaidAt = null;
            } else {
              _tmpCommissionPaidAt = _cursor.getString(_cursorIndexOfCommissionPaidAt);
            }
            final Integer _tmpApartmentId;
            if (_cursor.isNull(_cursorIndexOfApartmentId)) {
              _tmpApartmentId = null;
            } else {
              _tmpApartmentId = _cursor.getInt(_cursorIndexOfApartmentId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new CustomerEntity(_tmpId,_tmpCustomerCode,_tmpFullName,_tmpEmail,_tmpPhoneNumber,_tmpCity,_tmpAddress,_tmpSystemSizeKw,_tmpInstallationDate,_tmpWarrantyExpiry,_tmpPanelBrand,_tmpInverterBrand,_tmpInverterModel,_tmpAmcStatus,_tmpAmcExpiryDate,_tmpStatus,_tmpPartnerId,_tmpUserId,_tmpProjectStage,_tmpAssignedEmployeeId,_tmpCommissionAmount,_tmpCommissionStatus,_tmpInverterLoginId,_tmpInverterPassword,_tmpInverterApiKey,_tmpInverterDeviceSn,_tmpPortalPassword,_tmpLatitude,_tmpLongitude,_tmpCleaningWindow1,_tmpCleaningWindow2,_tmpCleaningWindow3,_tmpCleaningsPerMonth,_tmpClientType,_tmpConsumerNumber,_tmpContractEndDate,_tmpContractStartDate,_tmpMonthlyCleaningRate,_tmpPaymentTerms,_tmpRemarks,_tmpCleaningWindow4,_tmpCleaningWindow5,_tmpCleaningWindow6,_tmpCleaningWindow7,_tmpCleaningWindow8,_tmpCommissionProofUrl,_tmpCommissionPaidAt,_tmpApartmentId,_tmpIsSynced);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<CustomerEntity>> getCustomersByCity(final String city) {
    final String _sql = "SELECT * FROM customers WHERE city = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, city);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"customers"}, new Callable<List<CustomerEntity>>() {
      @Override
      @NonNull
      public List<CustomerEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerCode = CursorUtil.getColumnIndexOrThrow(_cursor, "customerCode");
          final int _cursorIndexOfFullName = CursorUtil.getColumnIndexOrThrow(_cursor, "fullName");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
          final int _cursorIndexOfCity = CursorUtil.getColumnIndexOrThrow(_cursor, "city");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfInstallationDate = CursorUtil.getColumnIndexOrThrow(_cursor, "installationDate");
          final int _cursorIndexOfWarrantyExpiry = CursorUtil.getColumnIndexOrThrow(_cursor, "warrantyExpiry");
          final int _cursorIndexOfPanelBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "panelBrand");
          final int _cursorIndexOfInverterBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterBrand");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfAmcStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "amcStatus");
          final int _cursorIndexOfAmcExpiryDate = CursorUtil.getColumnIndexOrThrow(_cursor, "amcExpiryDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfProjectStage = CursorUtil.getColumnIndexOrThrow(_cursor, "projectStage");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCommissionAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionAmount");
          final int _cursorIndexOfCommissionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionStatus");
          final int _cursorIndexOfInverterLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterLoginId");
          final int _cursorIndexOfInverterPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterPassword");
          final int _cursorIndexOfInverterApiKey = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterApiKey");
          final int _cursorIndexOfInverterDeviceSn = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterDeviceSn");
          final int _cursorIndexOfPortalPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "portalPassword");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCleaningWindow1 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow1");
          final int _cursorIndexOfCleaningWindow2 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow2");
          final int _cursorIndexOfCleaningWindow3 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow3");
          final int _cursorIndexOfCleaningsPerMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningsPerMonth");
          final int _cursorIndexOfClientType = CursorUtil.getColumnIndexOrThrow(_cursor, "clientType");
          final int _cursorIndexOfConsumerNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "consumerNumber");
          final int _cursorIndexOfContractEndDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractEndDate");
          final int _cursorIndexOfContractStartDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractStartDate");
          final int _cursorIndexOfMonthlyCleaningRate = CursorUtil.getColumnIndexOrThrow(_cursor, "monthlyCleaningRate");
          final int _cursorIndexOfPaymentTerms = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentTerms");
          final int _cursorIndexOfRemarks = CursorUtil.getColumnIndexOrThrow(_cursor, "remarks");
          final int _cursorIndexOfCleaningWindow4 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow4");
          final int _cursorIndexOfCleaningWindow5 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow5");
          final int _cursorIndexOfCleaningWindow6 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow6");
          final int _cursorIndexOfCleaningWindow7 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow7");
          final int _cursorIndexOfCleaningWindow8 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow8");
          final int _cursorIndexOfCommissionProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionProofUrl");
          final int _cursorIndexOfCommissionPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionPaidAt");
          final int _cursorIndexOfApartmentId = CursorUtil.getColumnIndexOrThrow(_cursor, "apartmentId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerEntity> _result = new ArrayList<CustomerEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpCustomerCode;
            _tmpCustomerCode = _cursor.getString(_cursorIndexOfCustomerCode);
            final String _tmpFullName;
            _tmpFullName = _cursor.getString(_cursorIndexOfFullName);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpPhoneNumber;
            _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
            final String _tmpCity;
            _tmpCity = _cursor.getString(_cursorIndexOfCity);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final String _tmpInstallationDate;
            _tmpInstallationDate = _cursor.getString(_cursorIndexOfInstallationDate);
            final String _tmpWarrantyExpiry;
            if (_cursor.isNull(_cursorIndexOfWarrantyExpiry)) {
              _tmpWarrantyExpiry = null;
            } else {
              _tmpWarrantyExpiry = _cursor.getString(_cursorIndexOfWarrantyExpiry);
            }
            final String _tmpPanelBrand;
            if (_cursor.isNull(_cursorIndexOfPanelBrand)) {
              _tmpPanelBrand = null;
            } else {
              _tmpPanelBrand = _cursor.getString(_cursorIndexOfPanelBrand);
            }
            final String _tmpInverterBrand;
            if (_cursor.isNull(_cursorIndexOfInverterBrand)) {
              _tmpInverterBrand = null;
            } else {
              _tmpInverterBrand = _cursor.getString(_cursorIndexOfInverterBrand);
            }
            final String _tmpInverterModel;
            if (_cursor.isNull(_cursorIndexOfInverterModel)) {
              _tmpInverterModel = null;
            } else {
              _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            }
            final String _tmpAmcStatus;
            _tmpAmcStatus = _cursor.getString(_cursorIndexOfAmcStatus);
            final String _tmpAmcExpiryDate;
            if (_cursor.isNull(_cursorIndexOfAmcExpiryDate)) {
              _tmpAmcExpiryDate = null;
            } else {
              _tmpAmcExpiryDate = _cursor.getString(_cursorIndexOfAmcExpiryDate);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final int _tmpProjectStage;
            _tmpProjectStage = _cursor.getInt(_cursorIndexOfProjectStage);
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final Double _tmpCommissionAmount;
            if (_cursor.isNull(_cursorIndexOfCommissionAmount)) {
              _tmpCommissionAmount = null;
            } else {
              _tmpCommissionAmount = _cursor.getDouble(_cursorIndexOfCommissionAmount);
            }
            final String _tmpCommissionStatus;
            _tmpCommissionStatus = _cursor.getString(_cursorIndexOfCommissionStatus);
            final String _tmpInverterLoginId;
            if (_cursor.isNull(_cursorIndexOfInverterLoginId)) {
              _tmpInverterLoginId = null;
            } else {
              _tmpInverterLoginId = _cursor.getString(_cursorIndexOfInverterLoginId);
            }
            final String _tmpInverterPassword;
            if (_cursor.isNull(_cursorIndexOfInverterPassword)) {
              _tmpInverterPassword = null;
            } else {
              _tmpInverterPassword = _cursor.getString(_cursorIndexOfInverterPassword);
            }
            final String _tmpInverterApiKey;
            if (_cursor.isNull(_cursorIndexOfInverterApiKey)) {
              _tmpInverterApiKey = null;
            } else {
              _tmpInverterApiKey = _cursor.getString(_cursorIndexOfInverterApiKey);
            }
            final String _tmpInverterDeviceSn;
            if (_cursor.isNull(_cursorIndexOfInverterDeviceSn)) {
              _tmpInverterDeviceSn = null;
            } else {
              _tmpInverterDeviceSn = _cursor.getString(_cursorIndexOfInverterDeviceSn);
            }
            final String _tmpPortalPassword;
            if (_cursor.isNull(_cursorIndexOfPortalPassword)) {
              _tmpPortalPassword = null;
            } else {
              _tmpPortalPassword = _cursor.getString(_cursorIndexOfPortalPassword);
            }
            final Double _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            }
            final Double _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            }
            final String _tmpCleaningWindow1;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow1)) {
              _tmpCleaningWindow1 = null;
            } else {
              _tmpCleaningWindow1 = _cursor.getString(_cursorIndexOfCleaningWindow1);
            }
            final String _tmpCleaningWindow2;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow2)) {
              _tmpCleaningWindow2 = null;
            } else {
              _tmpCleaningWindow2 = _cursor.getString(_cursorIndexOfCleaningWindow2);
            }
            final String _tmpCleaningWindow3;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow3)) {
              _tmpCleaningWindow3 = null;
            } else {
              _tmpCleaningWindow3 = _cursor.getString(_cursorIndexOfCleaningWindow3);
            }
            final Integer _tmpCleaningsPerMonth;
            if (_cursor.isNull(_cursorIndexOfCleaningsPerMonth)) {
              _tmpCleaningsPerMonth = null;
            } else {
              _tmpCleaningsPerMonth = _cursor.getInt(_cursorIndexOfCleaningsPerMonth);
            }
            final String _tmpClientType;
            if (_cursor.isNull(_cursorIndexOfClientType)) {
              _tmpClientType = null;
            } else {
              _tmpClientType = _cursor.getString(_cursorIndexOfClientType);
            }
            final String _tmpConsumerNumber;
            if (_cursor.isNull(_cursorIndexOfConsumerNumber)) {
              _tmpConsumerNumber = null;
            } else {
              _tmpConsumerNumber = _cursor.getString(_cursorIndexOfConsumerNumber);
            }
            final String _tmpContractEndDate;
            if (_cursor.isNull(_cursorIndexOfContractEndDate)) {
              _tmpContractEndDate = null;
            } else {
              _tmpContractEndDate = _cursor.getString(_cursorIndexOfContractEndDate);
            }
            final String _tmpContractStartDate;
            if (_cursor.isNull(_cursorIndexOfContractStartDate)) {
              _tmpContractStartDate = null;
            } else {
              _tmpContractStartDate = _cursor.getString(_cursorIndexOfContractStartDate);
            }
            final Double _tmpMonthlyCleaningRate;
            if (_cursor.isNull(_cursorIndexOfMonthlyCleaningRate)) {
              _tmpMonthlyCleaningRate = null;
            } else {
              _tmpMonthlyCleaningRate = _cursor.getDouble(_cursorIndexOfMonthlyCleaningRate);
            }
            final String _tmpPaymentTerms;
            if (_cursor.isNull(_cursorIndexOfPaymentTerms)) {
              _tmpPaymentTerms = null;
            } else {
              _tmpPaymentTerms = _cursor.getString(_cursorIndexOfPaymentTerms);
            }
            final String _tmpRemarks;
            if (_cursor.isNull(_cursorIndexOfRemarks)) {
              _tmpRemarks = null;
            } else {
              _tmpRemarks = _cursor.getString(_cursorIndexOfRemarks);
            }
            final String _tmpCleaningWindow4;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow4)) {
              _tmpCleaningWindow4 = null;
            } else {
              _tmpCleaningWindow4 = _cursor.getString(_cursorIndexOfCleaningWindow4);
            }
            final String _tmpCleaningWindow5;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow5)) {
              _tmpCleaningWindow5 = null;
            } else {
              _tmpCleaningWindow5 = _cursor.getString(_cursorIndexOfCleaningWindow5);
            }
            final String _tmpCleaningWindow6;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow6)) {
              _tmpCleaningWindow6 = null;
            } else {
              _tmpCleaningWindow6 = _cursor.getString(_cursorIndexOfCleaningWindow6);
            }
            final String _tmpCleaningWindow7;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow7)) {
              _tmpCleaningWindow7 = null;
            } else {
              _tmpCleaningWindow7 = _cursor.getString(_cursorIndexOfCleaningWindow7);
            }
            final String _tmpCleaningWindow8;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow8)) {
              _tmpCleaningWindow8 = null;
            } else {
              _tmpCleaningWindow8 = _cursor.getString(_cursorIndexOfCleaningWindow8);
            }
            final String _tmpCommissionProofUrl;
            if (_cursor.isNull(_cursorIndexOfCommissionProofUrl)) {
              _tmpCommissionProofUrl = null;
            } else {
              _tmpCommissionProofUrl = _cursor.getString(_cursorIndexOfCommissionProofUrl);
            }
            final String _tmpCommissionPaidAt;
            if (_cursor.isNull(_cursorIndexOfCommissionPaidAt)) {
              _tmpCommissionPaidAt = null;
            } else {
              _tmpCommissionPaidAt = _cursor.getString(_cursorIndexOfCommissionPaidAt);
            }
            final Integer _tmpApartmentId;
            if (_cursor.isNull(_cursorIndexOfApartmentId)) {
              _tmpApartmentId = null;
            } else {
              _tmpApartmentId = _cursor.getInt(_cursorIndexOfApartmentId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new CustomerEntity(_tmpId,_tmpCustomerCode,_tmpFullName,_tmpEmail,_tmpPhoneNumber,_tmpCity,_tmpAddress,_tmpSystemSizeKw,_tmpInstallationDate,_tmpWarrantyExpiry,_tmpPanelBrand,_tmpInverterBrand,_tmpInverterModel,_tmpAmcStatus,_tmpAmcExpiryDate,_tmpStatus,_tmpPartnerId,_tmpUserId,_tmpProjectStage,_tmpAssignedEmployeeId,_tmpCommissionAmount,_tmpCommissionStatus,_tmpInverterLoginId,_tmpInverterPassword,_tmpInverterApiKey,_tmpInverterDeviceSn,_tmpPortalPassword,_tmpLatitude,_tmpLongitude,_tmpCleaningWindow1,_tmpCleaningWindow2,_tmpCleaningWindow3,_tmpCleaningsPerMonth,_tmpClientType,_tmpConsumerNumber,_tmpContractEndDate,_tmpContractStartDate,_tmpMonthlyCleaningRate,_tmpPaymentTerms,_tmpRemarks,_tmpCleaningWindow4,_tmpCleaningWindow5,_tmpCleaningWindow6,_tmpCleaningWindow7,_tmpCleaningWindow8,_tmpCommissionProofUrl,_tmpCommissionPaidAt,_tmpApartmentId,_tmpIsSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object getUnsyncedCustomers(final Continuation<? super List<CustomerEntity>> $completion) {
    final String _sql = "SELECT * FROM customers WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<CustomerEntity>>() {
      @Override
      @NonNull
      public List<CustomerEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerCode = CursorUtil.getColumnIndexOrThrow(_cursor, "customerCode");
          final int _cursorIndexOfFullName = CursorUtil.getColumnIndexOrThrow(_cursor, "fullName");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
          final int _cursorIndexOfCity = CursorUtil.getColumnIndexOrThrow(_cursor, "city");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfInstallationDate = CursorUtil.getColumnIndexOrThrow(_cursor, "installationDate");
          final int _cursorIndexOfWarrantyExpiry = CursorUtil.getColumnIndexOrThrow(_cursor, "warrantyExpiry");
          final int _cursorIndexOfPanelBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "panelBrand");
          final int _cursorIndexOfInverterBrand = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterBrand");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfAmcStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "amcStatus");
          final int _cursorIndexOfAmcExpiryDate = CursorUtil.getColumnIndexOrThrow(_cursor, "amcExpiryDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfProjectStage = CursorUtil.getColumnIndexOrThrow(_cursor, "projectStage");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCommissionAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionAmount");
          final int _cursorIndexOfCommissionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionStatus");
          final int _cursorIndexOfInverterLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterLoginId");
          final int _cursorIndexOfInverterPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterPassword");
          final int _cursorIndexOfInverterApiKey = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterApiKey");
          final int _cursorIndexOfInverterDeviceSn = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterDeviceSn");
          final int _cursorIndexOfPortalPassword = CursorUtil.getColumnIndexOrThrow(_cursor, "portalPassword");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCleaningWindow1 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow1");
          final int _cursorIndexOfCleaningWindow2 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow2");
          final int _cursorIndexOfCleaningWindow3 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow3");
          final int _cursorIndexOfCleaningsPerMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningsPerMonth");
          final int _cursorIndexOfClientType = CursorUtil.getColumnIndexOrThrow(_cursor, "clientType");
          final int _cursorIndexOfConsumerNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "consumerNumber");
          final int _cursorIndexOfContractEndDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractEndDate");
          final int _cursorIndexOfContractStartDate = CursorUtil.getColumnIndexOrThrow(_cursor, "contractStartDate");
          final int _cursorIndexOfMonthlyCleaningRate = CursorUtil.getColumnIndexOrThrow(_cursor, "monthlyCleaningRate");
          final int _cursorIndexOfPaymentTerms = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentTerms");
          final int _cursorIndexOfRemarks = CursorUtil.getColumnIndexOrThrow(_cursor, "remarks");
          final int _cursorIndexOfCleaningWindow4 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow4");
          final int _cursorIndexOfCleaningWindow5 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow5");
          final int _cursorIndexOfCleaningWindow6 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow6");
          final int _cursorIndexOfCleaningWindow7 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow7");
          final int _cursorIndexOfCleaningWindow8 = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningWindow8");
          final int _cursorIndexOfCommissionProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionProofUrl");
          final int _cursorIndexOfCommissionPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "commissionPaidAt");
          final int _cursorIndexOfApartmentId = CursorUtil.getColumnIndexOrThrow(_cursor, "apartmentId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerEntity> _result = new ArrayList<CustomerEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpCustomerCode;
            _tmpCustomerCode = _cursor.getString(_cursorIndexOfCustomerCode);
            final String _tmpFullName;
            _tmpFullName = _cursor.getString(_cursorIndexOfFullName);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpPhoneNumber;
            _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
            final String _tmpCity;
            _tmpCity = _cursor.getString(_cursorIndexOfCity);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final String _tmpInstallationDate;
            _tmpInstallationDate = _cursor.getString(_cursorIndexOfInstallationDate);
            final String _tmpWarrantyExpiry;
            if (_cursor.isNull(_cursorIndexOfWarrantyExpiry)) {
              _tmpWarrantyExpiry = null;
            } else {
              _tmpWarrantyExpiry = _cursor.getString(_cursorIndexOfWarrantyExpiry);
            }
            final String _tmpPanelBrand;
            if (_cursor.isNull(_cursorIndexOfPanelBrand)) {
              _tmpPanelBrand = null;
            } else {
              _tmpPanelBrand = _cursor.getString(_cursorIndexOfPanelBrand);
            }
            final String _tmpInverterBrand;
            if (_cursor.isNull(_cursorIndexOfInverterBrand)) {
              _tmpInverterBrand = null;
            } else {
              _tmpInverterBrand = _cursor.getString(_cursorIndexOfInverterBrand);
            }
            final String _tmpInverterModel;
            if (_cursor.isNull(_cursorIndexOfInverterModel)) {
              _tmpInverterModel = null;
            } else {
              _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            }
            final String _tmpAmcStatus;
            _tmpAmcStatus = _cursor.getString(_cursorIndexOfAmcStatus);
            final String _tmpAmcExpiryDate;
            if (_cursor.isNull(_cursorIndexOfAmcExpiryDate)) {
              _tmpAmcExpiryDate = null;
            } else {
              _tmpAmcExpiryDate = _cursor.getString(_cursorIndexOfAmcExpiryDate);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final int _tmpProjectStage;
            _tmpProjectStage = _cursor.getInt(_cursorIndexOfProjectStage);
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final Double _tmpCommissionAmount;
            if (_cursor.isNull(_cursorIndexOfCommissionAmount)) {
              _tmpCommissionAmount = null;
            } else {
              _tmpCommissionAmount = _cursor.getDouble(_cursorIndexOfCommissionAmount);
            }
            final String _tmpCommissionStatus;
            _tmpCommissionStatus = _cursor.getString(_cursorIndexOfCommissionStatus);
            final String _tmpInverterLoginId;
            if (_cursor.isNull(_cursorIndexOfInverterLoginId)) {
              _tmpInverterLoginId = null;
            } else {
              _tmpInverterLoginId = _cursor.getString(_cursorIndexOfInverterLoginId);
            }
            final String _tmpInverterPassword;
            if (_cursor.isNull(_cursorIndexOfInverterPassword)) {
              _tmpInverterPassword = null;
            } else {
              _tmpInverterPassword = _cursor.getString(_cursorIndexOfInverterPassword);
            }
            final String _tmpInverterApiKey;
            if (_cursor.isNull(_cursorIndexOfInverterApiKey)) {
              _tmpInverterApiKey = null;
            } else {
              _tmpInverterApiKey = _cursor.getString(_cursorIndexOfInverterApiKey);
            }
            final String _tmpInverterDeviceSn;
            if (_cursor.isNull(_cursorIndexOfInverterDeviceSn)) {
              _tmpInverterDeviceSn = null;
            } else {
              _tmpInverterDeviceSn = _cursor.getString(_cursorIndexOfInverterDeviceSn);
            }
            final String _tmpPortalPassword;
            if (_cursor.isNull(_cursorIndexOfPortalPassword)) {
              _tmpPortalPassword = null;
            } else {
              _tmpPortalPassword = _cursor.getString(_cursorIndexOfPortalPassword);
            }
            final Double _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            }
            final Double _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            }
            final String _tmpCleaningWindow1;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow1)) {
              _tmpCleaningWindow1 = null;
            } else {
              _tmpCleaningWindow1 = _cursor.getString(_cursorIndexOfCleaningWindow1);
            }
            final String _tmpCleaningWindow2;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow2)) {
              _tmpCleaningWindow2 = null;
            } else {
              _tmpCleaningWindow2 = _cursor.getString(_cursorIndexOfCleaningWindow2);
            }
            final String _tmpCleaningWindow3;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow3)) {
              _tmpCleaningWindow3 = null;
            } else {
              _tmpCleaningWindow3 = _cursor.getString(_cursorIndexOfCleaningWindow3);
            }
            final Integer _tmpCleaningsPerMonth;
            if (_cursor.isNull(_cursorIndexOfCleaningsPerMonth)) {
              _tmpCleaningsPerMonth = null;
            } else {
              _tmpCleaningsPerMonth = _cursor.getInt(_cursorIndexOfCleaningsPerMonth);
            }
            final String _tmpClientType;
            if (_cursor.isNull(_cursorIndexOfClientType)) {
              _tmpClientType = null;
            } else {
              _tmpClientType = _cursor.getString(_cursorIndexOfClientType);
            }
            final String _tmpConsumerNumber;
            if (_cursor.isNull(_cursorIndexOfConsumerNumber)) {
              _tmpConsumerNumber = null;
            } else {
              _tmpConsumerNumber = _cursor.getString(_cursorIndexOfConsumerNumber);
            }
            final String _tmpContractEndDate;
            if (_cursor.isNull(_cursorIndexOfContractEndDate)) {
              _tmpContractEndDate = null;
            } else {
              _tmpContractEndDate = _cursor.getString(_cursorIndexOfContractEndDate);
            }
            final String _tmpContractStartDate;
            if (_cursor.isNull(_cursorIndexOfContractStartDate)) {
              _tmpContractStartDate = null;
            } else {
              _tmpContractStartDate = _cursor.getString(_cursorIndexOfContractStartDate);
            }
            final Double _tmpMonthlyCleaningRate;
            if (_cursor.isNull(_cursorIndexOfMonthlyCleaningRate)) {
              _tmpMonthlyCleaningRate = null;
            } else {
              _tmpMonthlyCleaningRate = _cursor.getDouble(_cursorIndexOfMonthlyCleaningRate);
            }
            final String _tmpPaymentTerms;
            if (_cursor.isNull(_cursorIndexOfPaymentTerms)) {
              _tmpPaymentTerms = null;
            } else {
              _tmpPaymentTerms = _cursor.getString(_cursorIndexOfPaymentTerms);
            }
            final String _tmpRemarks;
            if (_cursor.isNull(_cursorIndexOfRemarks)) {
              _tmpRemarks = null;
            } else {
              _tmpRemarks = _cursor.getString(_cursorIndexOfRemarks);
            }
            final String _tmpCleaningWindow4;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow4)) {
              _tmpCleaningWindow4 = null;
            } else {
              _tmpCleaningWindow4 = _cursor.getString(_cursorIndexOfCleaningWindow4);
            }
            final String _tmpCleaningWindow5;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow5)) {
              _tmpCleaningWindow5 = null;
            } else {
              _tmpCleaningWindow5 = _cursor.getString(_cursorIndexOfCleaningWindow5);
            }
            final String _tmpCleaningWindow6;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow6)) {
              _tmpCleaningWindow6 = null;
            } else {
              _tmpCleaningWindow6 = _cursor.getString(_cursorIndexOfCleaningWindow6);
            }
            final String _tmpCleaningWindow7;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow7)) {
              _tmpCleaningWindow7 = null;
            } else {
              _tmpCleaningWindow7 = _cursor.getString(_cursorIndexOfCleaningWindow7);
            }
            final String _tmpCleaningWindow8;
            if (_cursor.isNull(_cursorIndexOfCleaningWindow8)) {
              _tmpCleaningWindow8 = null;
            } else {
              _tmpCleaningWindow8 = _cursor.getString(_cursorIndexOfCleaningWindow8);
            }
            final String _tmpCommissionProofUrl;
            if (_cursor.isNull(_cursorIndexOfCommissionProofUrl)) {
              _tmpCommissionProofUrl = null;
            } else {
              _tmpCommissionProofUrl = _cursor.getString(_cursorIndexOfCommissionProofUrl);
            }
            final String _tmpCommissionPaidAt;
            if (_cursor.isNull(_cursorIndexOfCommissionPaidAt)) {
              _tmpCommissionPaidAt = null;
            } else {
              _tmpCommissionPaidAt = _cursor.getString(_cursorIndexOfCommissionPaidAt);
            }
            final Integer _tmpApartmentId;
            if (_cursor.isNull(_cursorIndexOfApartmentId)) {
              _tmpApartmentId = null;
            } else {
              _tmpApartmentId = _cursor.getInt(_cursorIndexOfApartmentId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new CustomerEntity(_tmpId,_tmpCustomerCode,_tmpFullName,_tmpEmail,_tmpPhoneNumber,_tmpCity,_tmpAddress,_tmpSystemSizeKw,_tmpInstallationDate,_tmpWarrantyExpiry,_tmpPanelBrand,_tmpInverterBrand,_tmpInverterModel,_tmpAmcStatus,_tmpAmcExpiryDate,_tmpStatus,_tmpPartnerId,_tmpUserId,_tmpProjectStage,_tmpAssignedEmployeeId,_tmpCommissionAmount,_tmpCommissionStatus,_tmpInverterLoginId,_tmpInverterPassword,_tmpInverterApiKey,_tmpInverterDeviceSn,_tmpPortalPassword,_tmpLatitude,_tmpLongitude,_tmpCleaningWindow1,_tmpCleaningWindow2,_tmpCleaningWindow3,_tmpCleaningsPerMonth,_tmpClientType,_tmpConsumerNumber,_tmpContractEndDate,_tmpContractStartDate,_tmpMonthlyCleaningRate,_tmpPaymentTerms,_tmpRemarks,_tmpCleaningWindow4,_tmpCleaningWindow5,_tmpCleaningWindow6,_tmpCleaningWindow7,_tmpCleaningWindow8,_tmpCommissionProofUrl,_tmpCommissionPaidAt,_tmpApartmentId,_tmpIsSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
