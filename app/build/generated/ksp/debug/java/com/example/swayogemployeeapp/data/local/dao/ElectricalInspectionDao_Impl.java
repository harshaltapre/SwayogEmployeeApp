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
import com.example.swayogemployeeapp.data.local.entity.ElectricalInspectionEntity;
import java.lang.Class;
import java.lang.Exception;
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
public final class ElectricalInspectionDao_Impl implements ElectricalInspectionDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ElectricalInspectionEntity> __insertionAdapterOfElectricalInspectionEntity;

  private final EntityDeletionOrUpdateAdapter<ElectricalInspectionEntity> __deletionAdapterOfElectricalInspectionEntity;

  private final EntityDeletionOrUpdateAdapter<ElectricalInspectionEntity> __updateAdapterOfElectricalInspectionEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllElectricalInspections;

  public ElectricalInspectionDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfElectricalInspectionEntity = new EntityInsertionAdapter<ElectricalInspectionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `electrical_inspections` (`id`,`customerId`,`inspectorId`,`inspectionDate`,`inspectionType`,`inspectionStatus`,`safetyChecklist`,`complianceStatus`,`findings`,`approvedAt`,`approvedBy`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ElectricalInspectionEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getInspectorId());
        statement.bindString(4, entity.getInspectionDate());
        statement.bindString(5, entity.getInspectionType());
        statement.bindString(6, entity.getInspectionStatus());
        if (entity.getSafetyChecklist() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getSafetyChecklist());
        }
        if (entity.getComplianceStatus() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getComplianceStatus());
        }
        if (entity.getFindings() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getFindings());
        }
        if (entity.getApprovedAt() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getApprovedAt());
        }
        if (entity.getApprovedBy() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getApprovedBy());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(12, _tmp);
      }
    };
    this.__deletionAdapterOfElectricalInspectionEntity = new EntityDeletionOrUpdateAdapter<ElectricalInspectionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `electrical_inspections` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ElectricalInspectionEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfElectricalInspectionEntity = new EntityDeletionOrUpdateAdapter<ElectricalInspectionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `electrical_inspections` SET `id` = ?,`customerId` = ?,`inspectorId` = ?,`inspectionDate` = ?,`inspectionType` = ?,`inspectionStatus` = ?,`safetyChecklist` = ?,`complianceStatus` = ?,`findings` = ?,`approvedAt` = ?,`approvedBy` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ElectricalInspectionEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getInspectorId());
        statement.bindString(4, entity.getInspectionDate());
        statement.bindString(5, entity.getInspectionType());
        statement.bindString(6, entity.getInspectionStatus());
        if (entity.getSafetyChecklist() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getSafetyChecklist());
        }
        if (entity.getComplianceStatus() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getComplianceStatus());
        }
        if (entity.getFindings() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getFindings());
        }
        if (entity.getApprovedAt() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getApprovedAt());
        }
        if (entity.getApprovedBy() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getApprovedBy());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(12, _tmp);
        statement.bindString(13, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllElectricalInspections = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM electrical_inspections";
        return _query;
      }
    };
  }

  @Override
  public Object insertElectricalInspection(final ElectricalInspectionEntity inspection,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfElectricalInspectionEntity.insert(inspection);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertElectricalInspections(final List<ElectricalInspectionEntity> inspections,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfElectricalInspectionEntity.insert(inspections);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteElectricalInspection(final ElectricalInspectionEntity inspection,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfElectricalInspectionEntity.handle(inspection);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateElectricalInspection(final ElectricalInspectionEntity inspection,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfElectricalInspectionEntity.handle(inspection);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllElectricalInspections(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllElectricalInspections.acquire();
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
          __preparedStmtOfDeleteAllElectricalInspections.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<ElectricalInspectionEntity>> getAllElectricalInspections() {
    final String _sql = "SELECT * FROM electrical_inspections";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_inspections"}, new Callable<List<ElectricalInspectionEntity>>() {
      @Override
      @NonNull
      public List<ElectricalInspectionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInspectorId = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectorId");
          final int _cursorIndexOfInspectionDate = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionDate");
          final int _cursorIndexOfInspectionType = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionType");
          final int _cursorIndexOfInspectionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionStatus");
          final int _cursorIndexOfSafetyChecklist = CursorUtil.getColumnIndexOrThrow(_cursor, "safetyChecklist");
          final int _cursorIndexOfComplianceStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceStatus");
          final int _cursorIndexOfFindings = CursorUtil.getColumnIndexOrThrow(_cursor, "findings");
          final int _cursorIndexOfApprovedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedAt");
          final int _cursorIndexOfApprovedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedBy");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalInspectionEntity> _result = new ArrayList<ElectricalInspectionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalInspectionEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInspectorId;
            _tmpInspectorId = _cursor.getString(_cursorIndexOfInspectorId);
            final String _tmpInspectionDate;
            _tmpInspectionDate = _cursor.getString(_cursorIndexOfInspectionDate);
            final String _tmpInspectionType;
            _tmpInspectionType = _cursor.getString(_cursorIndexOfInspectionType);
            final String _tmpInspectionStatus;
            _tmpInspectionStatus = _cursor.getString(_cursorIndexOfInspectionStatus);
            final String _tmpSafetyChecklist;
            if (_cursor.isNull(_cursorIndexOfSafetyChecklist)) {
              _tmpSafetyChecklist = null;
            } else {
              _tmpSafetyChecklist = _cursor.getString(_cursorIndexOfSafetyChecklist);
            }
            final String _tmpComplianceStatus;
            if (_cursor.isNull(_cursorIndexOfComplianceStatus)) {
              _tmpComplianceStatus = null;
            } else {
              _tmpComplianceStatus = _cursor.getString(_cursorIndexOfComplianceStatus);
            }
            final String _tmpFindings;
            if (_cursor.isNull(_cursorIndexOfFindings)) {
              _tmpFindings = null;
            } else {
              _tmpFindings = _cursor.getString(_cursorIndexOfFindings);
            }
            final String _tmpApprovedAt;
            if (_cursor.isNull(_cursorIndexOfApprovedAt)) {
              _tmpApprovedAt = null;
            } else {
              _tmpApprovedAt = _cursor.getString(_cursorIndexOfApprovedAt);
            }
            final String _tmpApprovedBy;
            if (_cursor.isNull(_cursorIndexOfApprovedBy)) {
              _tmpApprovedBy = null;
            } else {
              _tmpApprovedBy = _cursor.getString(_cursorIndexOfApprovedBy);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalInspectionEntity(_tmpId,_tmpCustomerId,_tmpInspectorId,_tmpInspectionDate,_tmpInspectionType,_tmpInspectionStatus,_tmpSafetyChecklist,_tmpComplianceStatus,_tmpFindings,_tmpApprovedAt,_tmpApprovedBy,_tmpIsSynced);
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
  public Object getElectricalInspectionById(final String id,
      final Continuation<? super ElectricalInspectionEntity> $completion) {
    final String _sql = "SELECT * FROM electrical_inspections WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<ElectricalInspectionEntity>() {
      @Override
      @Nullable
      public ElectricalInspectionEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInspectorId = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectorId");
          final int _cursorIndexOfInspectionDate = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionDate");
          final int _cursorIndexOfInspectionType = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionType");
          final int _cursorIndexOfInspectionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionStatus");
          final int _cursorIndexOfSafetyChecklist = CursorUtil.getColumnIndexOrThrow(_cursor, "safetyChecklist");
          final int _cursorIndexOfComplianceStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceStatus");
          final int _cursorIndexOfFindings = CursorUtil.getColumnIndexOrThrow(_cursor, "findings");
          final int _cursorIndexOfApprovedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedAt");
          final int _cursorIndexOfApprovedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedBy");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final ElectricalInspectionEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInspectorId;
            _tmpInspectorId = _cursor.getString(_cursorIndexOfInspectorId);
            final String _tmpInspectionDate;
            _tmpInspectionDate = _cursor.getString(_cursorIndexOfInspectionDate);
            final String _tmpInspectionType;
            _tmpInspectionType = _cursor.getString(_cursorIndexOfInspectionType);
            final String _tmpInspectionStatus;
            _tmpInspectionStatus = _cursor.getString(_cursorIndexOfInspectionStatus);
            final String _tmpSafetyChecklist;
            if (_cursor.isNull(_cursorIndexOfSafetyChecklist)) {
              _tmpSafetyChecklist = null;
            } else {
              _tmpSafetyChecklist = _cursor.getString(_cursorIndexOfSafetyChecklist);
            }
            final String _tmpComplianceStatus;
            if (_cursor.isNull(_cursorIndexOfComplianceStatus)) {
              _tmpComplianceStatus = null;
            } else {
              _tmpComplianceStatus = _cursor.getString(_cursorIndexOfComplianceStatus);
            }
            final String _tmpFindings;
            if (_cursor.isNull(_cursorIndexOfFindings)) {
              _tmpFindings = null;
            } else {
              _tmpFindings = _cursor.getString(_cursorIndexOfFindings);
            }
            final String _tmpApprovedAt;
            if (_cursor.isNull(_cursorIndexOfApprovedAt)) {
              _tmpApprovedAt = null;
            } else {
              _tmpApprovedAt = _cursor.getString(_cursorIndexOfApprovedAt);
            }
            final String _tmpApprovedBy;
            if (_cursor.isNull(_cursorIndexOfApprovedBy)) {
              _tmpApprovedBy = null;
            } else {
              _tmpApprovedBy = _cursor.getString(_cursorIndexOfApprovedBy);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new ElectricalInspectionEntity(_tmpId,_tmpCustomerId,_tmpInspectorId,_tmpInspectionDate,_tmpInspectionType,_tmpInspectionStatus,_tmpSafetyChecklist,_tmpComplianceStatus,_tmpFindings,_tmpApprovedAt,_tmpApprovedBy,_tmpIsSynced);
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
  public Flow<List<ElectricalInspectionEntity>> getElectricalInspectionsByCustomer(
      final int customerId) {
    final String _sql = "SELECT * FROM electrical_inspections WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_inspections"}, new Callable<List<ElectricalInspectionEntity>>() {
      @Override
      @NonNull
      public List<ElectricalInspectionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInspectorId = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectorId");
          final int _cursorIndexOfInspectionDate = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionDate");
          final int _cursorIndexOfInspectionType = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionType");
          final int _cursorIndexOfInspectionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionStatus");
          final int _cursorIndexOfSafetyChecklist = CursorUtil.getColumnIndexOrThrow(_cursor, "safetyChecklist");
          final int _cursorIndexOfComplianceStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceStatus");
          final int _cursorIndexOfFindings = CursorUtil.getColumnIndexOrThrow(_cursor, "findings");
          final int _cursorIndexOfApprovedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedAt");
          final int _cursorIndexOfApprovedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedBy");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalInspectionEntity> _result = new ArrayList<ElectricalInspectionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalInspectionEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInspectorId;
            _tmpInspectorId = _cursor.getString(_cursorIndexOfInspectorId);
            final String _tmpInspectionDate;
            _tmpInspectionDate = _cursor.getString(_cursorIndexOfInspectionDate);
            final String _tmpInspectionType;
            _tmpInspectionType = _cursor.getString(_cursorIndexOfInspectionType);
            final String _tmpInspectionStatus;
            _tmpInspectionStatus = _cursor.getString(_cursorIndexOfInspectionStatus);
            final String _tmpSafetyChecklist;
            if (_cursor.isNull(_cursorIndexOfSafetyChecklist)) {
              _tmpSafetyChecklist = null;
            } else {
              _tmpSafetyChecklist = _cursor.getString(_cursorIndexOfSafetyChecklist);
            }
            final String _tmpComplianceStatus;
            if (_cursor.isNull(_cursorIndexOfComplianceStatus)) {
              _tmpComplianceStatus = null;
            } else {
              _tmpComplianceStatus = _cursor.getString(_cursorIndexOfComplianceStatus);
            }
            final String _tmpFindings;
            if (_cursor.isNull(_cursorIndexOfFindings)) {
              _tmpFindings = null;
            } else {
              _tmpFindings = _cursor.getString(_cursorIndexOfFindings);
            }
            final String _tmpApprovedAt;
            if (_cursor.isNull(_cursorIndexOfApprovedAt)) {
              _tmpApprovedAt = null;
            } else {
              _tmpApprovedAt = _cursor.getString(_cursorIndexOfApprovedAt);
            }
            final String _tmpApprovedBy;
            if (_cursor.isNull(_cursorIndexOfApprovedBy)) {
              _tmpApprovedBy = null;
            } else {
              _tmpApprovedBy = _cursor.getString(_cursorIndexOfApprovedBy);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalInspectionEntity(_tmpId,_tmpCustomerId,_tmpInspectorId,_tmpInspectionDate,_tmpInspectionType,_tmpInspectionStatus,_tmpSafetyChecklist,_tmpComplianceStatus,_tmpFindings,_tmpApprovedAt,_tmpApprovedBy,_tmpIsSynced);
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
  public Flow<List<ElectricalInspectionEntity>> getElectricalInspectionsByInspector(
      final String inspectorId) {
    final String _sql = "SELECT * FROM electrical_inspections WHERE inspectorId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, inspectorId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_inspections"}, new Callable<List<ElectricalInspectionEntity>>() {
      @Override
      @NonNull
      public List<ElectricalInspectionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInspectorId = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectorId");
          final int _cursorIndexOfInspectionDate = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionDate");
          final int _cursorIndexOfInspectionType = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionType");
          final int _cursorIndexOfInspectionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionStatus");
          final int _cursorIndexOfSafetyChecklist = CursorUtil.getColumnIndexOrThrow(_cursor, "safetyChecklist");
          final int _cursorIndexOfComplianceStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceStatus");
          final int _cursorIndexOfFindings = CursorUtil.getColumnIndexOrThrow(_cursor, "findings");
          final int _cursorIndexOfApprovedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedAt");
          final int _cursorIndexOfApprovedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedBy");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalInspectionEntity> _result = new ArrayList<ElectricalInspectionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalInspectionEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInspectorId;
            _tmpInspectorId = _cursor.getString(_cursorIndexOfInspectorId);
            final String _tmpInspectionDate;
            _tmpInspectionDate = _cursor.getString(_cursorIndexOfInspectionDate);
            final String _tmpInspectionType;
            _tmpInspectionType = _cursor.getString(_cursorIndexOfInspectionType);
            final String _tmpInspectionStatus;
            _tmpInspectionStatus = _cursor.getString(_cursorIndexOfInspectionStatus);
            final String _tmpSafetyChecklist;
            if (_cursor.isNull(_cursorIndexOfSafetyChecklist)) {
              _tmpSafetyChecklist = null;
            } else {
              _tmpSafetyChecklist = _cursor.getString(_cursorIndexOfSafetyChecklist);
            }
            final String _tmpComplianceStatus;
            if (_cursor.isNull(_cursorIndexOfComplianceStatus)) {
              _tmpComplianceStatus = null;
            } else {
              _tmpComplianceStatus = _cursor.getString(_cursorIndexOfComplianceStatus);
            }
            final String _tmpFindings;
            if (_cursor.isNull(_cursorIndexOfFindings)) {
              _tmpFindings = null;
            } else {
              _tmpFindings = _cursor.getString(_cursorIndexOfFindings);
            }
            final String _tmpApprovedAt;
            if (_cursor.isNull(_cursorIndexOfApprovedAt)) {
              _tmpApprovedAt = null;
            } else {
              _tmpApprovedAt = _cursor.getString(_cursorIndexOfApprovedAt);
            }
            final String _tmpApprovedBy;
            if (_cursor.isNull(_cursorIndexOfApprovedBy)) {
              _tmpApprovedBy = null;
            } else {
              _tmpApprovedBy = _cursor.getString(_cursorIndexOfApprovedBy);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalInspectionEntity(_tmpId,_tmpCustomerId,_tmpInspectorId,_tmpInspectionDate,_tmpInspectionType,_tmpInspectionStatus,_tmpSafetyChecklist,_tmpComplianceStatus,_tmpFindings,_tmpApprovedAt,_tmpApprovedBy,_tmpIsSynced);
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
  public Flow<List<ElectricalInspectionEntity>> getElectricalInspectionsByStatus(
      final String status) {
    final String _sql = "SELECT * FROM electrical_inspections WHERE inspectionStatus = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_inspections"}, new Callable<List<ElectricalInspectionEntity>>() {
      @Override
      @NonNull
      public List<ElectricalInspectionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInspectorId = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectorId");
          final int _cursorIndexOfInspectionDate = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionDate");
          final int _cursorIndexOfInspectionType = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionType");
          final int _cursorIndexOfInspectionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionStatus");
          final int _cursorIndexOfSafetyChecklist = CursorUtil.getColumnIndexOrThrow(_cursor, "safetyChecklist");
          final int _cursorIndexOfComplianceStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceStatus");
          final int _cursorIndexOfFindings = CursorUtil.getColumnIndexOrThrow(_cursor, "findings");
          final int _cursorIndexOfApprovedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedAt");
          final int _cursorIndexOfApprovedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedBy");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalInspectionEntity> _result = new ArrayList<ElectricalInspectionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalInspectionEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInspectorId;
            _tmpInspectorId = _cursor.getString(_cursorIndexOfInspectorId);
            final String _tmpInspectionDate;
            _tmpInspectionDate = _cursor.getString(_cursorIndexOfInspectionDate);
            final String _tmpInspectionType;
            _tmpInspectionType = _cursor.getString(_cursorIndexOfInspectionType);
            final String _tmpInspectionStatus;
            _tmpInspectionStatus = _cursor.getString(_cursorIndexOfInspectionStatus);
            final String _tmpSafetyChecklist;
            if (_cursor.isNull(_cursorIndexOfSafetyChecklist)) {
              _tmpSafetyChecklist = null;
            } else {
              _tmpSafetyChecklist = _cursor.getString(_cursorIndexOfSafetyChecklist);
            }
            final String _tmpComplianceStatus;
            if (_cursor.isNull(_cursorIndexOfComplianceStatus)) {
              _tmpComplianceStatus = null;
            } else {
              _tmpComplianceStatus = _cursor.getString(_cursorIndexOfComplianceStatus);
            }
            final String _tmpFindings;
            if (_cursor.isNull(_cursorIndexOfFindings)) {
              _tmpFindings = null;
            } else {
              _tmpFindings = _cursor.getString(_cursorIndexOfFindings);
            }
            final String _tmpApprovedAt;
            if (_cursor.isNull(_cursorIndexOfApprovedAt)) {
              _tmpApprovedAt = null;
            } else {
              _tmpApprovedAt = _cursor.getString(_cursorIndexOfApprovedAt);
            }
            final String _tmpApprovedBy;
            if (_cursor.isNull(_cursorIndexOfApprovedBy)) {
              _tmpApprovedBy = null;
            } else {
              _tmpApprovedBy = _cursor.getString(_cursorIndexOfApprovedBy);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalInspectionEntity(_tmpId,_tmpCustomerId,_tmpInspectorId,_tmpInspectionDate,_tmpInspectionType,_tmpInspectionStatus,_tmpSafetyChecklist,_tmpComplianceStatus,_tmpFindings,_tmpApprovedAt,_tmpApprovedBy,_tmpIsSynced);
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
  public Object getUnsyncedElectricalInspections(
      final Continuation<? super List<ElectricalInspectionEntity>> $completion) {
    final String _sql = "SELECT * FROM electrical_inspections WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<ElectricalInspectionEntity>>() {
      @Override
      @NonNull
      public List<ElectricalInspectionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInspectorId = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectorId");
          final int _cursorIndexOfInspectionDate = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionDate");
          final int _cursorIndexOfInspectionType = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionType");
          final int _cursorIndexOfInspectionStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "inspectionStatus");
          final int _cursorIndexOfSafetyChecklist = CursorUtil.getColumnIndexOrThrow(_cursor, "safetyChecklist");
          final int _cursorIndexOfComplianceStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceStatus");
          final int _cursorIndexOfFindings = CursorUtil.getColumnIndexOrThrow(_cursor, "findings");
          final int _cursorIndexOfApprovedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedAt");
          final int _cursorIndexOfApprovedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "approvedBy");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalInspectionEntity> _result = new ArrayList<ElectricalInspectionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalInspectionEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInspectorId;
            _tmpInspectorId = _cursor.getString(_cursorIndexOfInspectorId);
            final String _tmpInspectionDate;
            _tmpInspectionDate = _cursor.getString(_cursorIndexOfInspectionDate);
            final String _tmpInspectionType;
            _tmpInspectionType = _cursor.getString(_cursorIndexOfInspectionType);
            final String _tmpInspectionStatus;
            _tmpInspectionStatus = _cursor.getString(_cursorIndexOfInspectionStatus);
            final String _tmpSafetyChecklist;
            if (_cursor.isNull(_cursorIndexOfSafetyChecklist)) {
              _tmpSafetyChecklist = null;
            } else {
              _tmpSafetyChecklist = _cursor.getString(_cursorIndexOfSafetyChecklist);
            }
            final String _tmpComplianceStatus;
            if (_cursor.isNull(_cursorIndexOfComplianceStatus)) {
              _tmpComplianceStatus = null;
            } else {
              _tmpComplianceStatus = _cursor.getString(_cursorIndexOfComplianceStatus);
            }
            final String _tmpFindings;
            if (_cursor.isNull(_cursorIndexOfFindings)) {
              _tmpFindings = null;
            } else {
              _tmpFindings = _cursor.getString(_cursorIndexOfFindings);
            }
            final String _tmpApprovedAt;
            if (_cursor.isNull(_cursorIndexOfApprovedAt)) {
              _tmpApprovedAt = null;
            } else {
              _tmpApprovedAt = _cursor.getString(_cursorIndexOfApprovedAt);
            }
            final String _tmpApprovedBy;
            if (_cursor.isNull(_cursorIndexOfApprovedBy)) {
              _tmpApprovedBy = null;
            } else {
              _tmpApprovedBy = _cursor.getString(_cursorIndexOfApprovedBy);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalInspectionEntity(_tmpId,_tmpCustomerId,_tmpInspectorId,_tmpInspectionDate,_tmpInspectionType,_tmpInspectionStatus,_tmpSafetyChecklist,_tmpComplianceStatus,_tmpFindings,_tmpApprovedAt,_tmpApprovedBy,_tmpIsSynced);
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
