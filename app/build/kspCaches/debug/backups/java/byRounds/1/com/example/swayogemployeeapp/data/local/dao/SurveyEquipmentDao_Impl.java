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
import com.example.swayogemployeeapp.data.local.entity.SurveyEquipmentEntity;
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
public final class SurveyEquipmentDao_Impl implements SurveyEquipmentDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<SurveyEquipmentEntity> __insertionAdapterOfSurveyEquipmentEntity;

  private final EntityDeletionOrUpdateAdapter<SurveyEquipmentEntity> __deletionAdapterOfSurveyEquipmentEntity;

  private final EntityDeletionOrUpdateAdapter<SurveyEquipmentEntity> __updateAdapterOfSurveyEquipmentEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllSurveyEquipment;

  public SurveyEquipmentDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfSurveyEquipmentEntity = new EntityInsertionAdapter<SurveyEquipmentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `survey_equipment` (`id`,`equipmentName`,`equipmentType`,`serialNumber`,`assignedTo`,`status`,`lastMaintenanceDate`,`nextMaintenanceDate`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SurveyEquipmentEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getEquipmentName());
        statement.bindString(3, entity.getEquipmentType());
        if (entity.getSerialNumber() == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.getSerialNumber());
        }
        if (entity.getAssignedTo() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getAssignedTo());
        }
        statement.bindString(6, entity.getStatus());
        if (entity.getLastMaintenanceDate() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getLastMaintenanceDate());
        }
        if (entity.getNextMaintenanceDate() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getNextMaintenanceDate());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(9, _tmp);
      }
    };
    this.__deletionAdapterOfSurveyEquipmentEntity = new EntityDeletionOrUpdateAdapter<SurveyEquipmentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `survey_equipment` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SurveyEquipmentEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfSurveyEquipmentEntity = new EntityDeletionOrUpdateAdapter<SurveyEquipmentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `survey_equipment` SET `id` = ?,`equipmentName` = ?,`equipmentType` = ?,`serialNumber` = ?,`assignedTo` = ?,`status` = ?,`lastMaintenanceDate` = ?,`nextMaintenanceDate` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SurveyEquipmentEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getEquipmentName());
        statement.bindString(3, entity.getEquipmentType());
        if (entity.getSerialNumber() == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.getSerialNumber());
        }
        if (entity.getAssignedTo() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getAssignedTo());
        }
        statement.bindString(6, entity.getStatus());
        if (entity.getLastMaintenanceDate() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getLastMaintenanceDate());
        }
        if (entity.getNextMaintenanceDate() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getNextMaintenanceDate());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(9, _tmp);
        statement.bindString(10, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllSurveyEquipment = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM survey_equipment";
        return _query;
      }
    };
  }

  @Override
  public Object insertSurveyEquipment(final SurveyEquipmentEntity equipment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfSurveyEquipmentEntity.insert(equipment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertSurveyEquipmentList(final List<SurveyEquipmentEntity> equipment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfSurveyEquipmentEntity.insert(equipment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteSurveyEquipment(final SurveyEquipmentEntity equipment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfSurveyEquipmentEntity.handle(equipment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateSurveyEquipment(final SurveyEquipmentEntity equipment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfSurveyEquipmentEntity.handle(equipment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllSurveyEquipment(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllSurveyEquipment.acquire();
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
          __preparedStmtOfDeleteAllSurveyEquipment.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<SurveyEquipmentEntity>> getAllSurveyEquipment() {
    final String _sql = "SELECT * FROM survey_equipment";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"survey_equipment"}, new Callable<List<SurveyEquipmentEntity>>() {
      @Override
      @NonNull
      public List<SurveyEquipmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEquipmentName = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentName");
          final int _cursorIndexOfEquipmentType = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentType");
          final int _cursorIndexOfSerialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "serialNumber");
          final int _cursorIndexOfAssignedTo = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedTo");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "lastMaintenanceDate");
          final int _cursorIndexOfNextMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "nextMaintenanceDate");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SurveyEquipmentEntity> _result = new ArrayList<SurveyEquipmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SurveyEquipmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEquipmentName;
            _tmpEquipmentName = _cursor.getString(_cursorIndexOfEquipmentName);
            final String _tmpEquipmentType;
            _tmpEquipmentType = _cursor.getString(_cursorIndexOfEquipmentType);
            final String _tmpSerialNumber;
            if (_cursor.isNull(_cursorIndexOfSerialNumber)) {
              _tmpSerialNumber = null;
            } else {
              _tmpSerialNumber = _cursor.getString(_cursorIndexOfSerialNumber);
            }
            final String _tmpAssignedTo;
            if (_cursor.isNull(_cursorIndexOfAssignedTo)) {
              _tmpAssignedTo = null;
            } else {
              _tmpAssignedTo = _cursor.getString(_cursorIndexOfAssignedTo);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpLastMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfLastMaintenanceDate)) {
              _tmpLastMaintenanceDate = null;
            } else {
              _tmpLastMaintenanceDate = _cursor.getString(_cursorIndexOfLastMaintenanceDate);
            }
            final String _tmpNextMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfNextMaintenanceDate)) {
              _tmpNextMaintenanceDate = null;
            } else {
              _tmpNextMaintenanceDate = _cursor.getString(_cursorIndexOfNextMaintenanceDate);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new SurveyEquipmentEntity(_tmpId,_tmpEquipmentName,_tmpEquipmentType,_tmpSerialNumber,_tmpAssignedTo,_tmpStatus,_tmpLastMaintenanceDate,_tmpNextMaintenanceDate,_tmpIsSynced);
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
  public Object getSurveyEquipmentById(final String id,
      final Continuation<? super SurveyEquipmentEntity> $completion) {
    final String _sql = "SELECT * FROM survey_equipment WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<SurveyEquipmentEntity>() {
      @Override
      @Nullable
      public SurveyEquipmentEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEquipmentName = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentName");
          final int _cursorIndexOfEquipmentType = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentType");
          final int _cursorIndexOfSerialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "serialNumber");
          final int _cursorIndexOfAssignedTo = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedTo");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "lastMaintenanceDate");
          final int _cursorIndexOfNextMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "nextMaintenanceDate");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final SurveyEquipmentEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEquipmentName;
            _tmpEquipmentName = _cursor.getString(_cursorIndexOfEquipmentName);
            final String _tmpEquipmentType;
            _tmpEquipmentType = _cursor.getString(_cursorIndexOfEquipmentType);
            final String _tmpSerialNumber;
            if (_cursor.isNull(_cursorIndexOfSerialNumber)) {
              _tmpSerialNumber = null;
            } else {
              _tmpSerialNumber = _cursor.getString(_cursorIndexOfSerialNumber);
            }
            final String _tmpAssignedTo;
            if (_cursor.isNull(_cursorIndexOfAssignedTo)) {
              _tmpAssignedTo = null;
            } else {
              _tmpAssignedTo = _cursor.getString(_cursorIndexOfAssignedTo);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpLastMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfLastMaintenanceDate)) {
              _tmpLastMaintenanceDate = null;
            } else {
              _tmpLastMaintenanceDate = _cursor.getString(_cursorIndexOfLastMaintenanceDate);
            }
            final String _tmpNextMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfNextMaintenanceDate)) {
              _tmpNextMaintenanceDate = null;
            } else {
              _tmpNextMaintenanceDate = _cursor.getString(_cursorIndexOfNextMaintenanceDate);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new SurveyEquipmentEntity(_tmpId,_tmpEquipmentName,_tmpEquipmentType,_tmpSerialNumber,_tmpAssignedTo,_tmpStatus,_tmpLastMaintenanceDate,_tmpNextMaintenanceDate,_tmpIsSynced);
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
  public Flow<List<SurveyEquipmentEntity>> getSurveyEquipmentByAssignee(final String assignedTo) {
    final String _sql = "SELECT * FROM survey_equipment WHERE assignedTo = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, assignedTo);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"survey_equipment"}, new Callable<List<SurveyEquipmentEntity>>() {
      @Override
      @NonNull
      public List<SurveyEquipmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEquipmentName = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentName");
          final int _cursorIndexOfEquipmentType = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentType");
          final int _cursorIndexOfSerialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "serialNumber");
          final int _cursorIndexOfAssignedTo = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedTo");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "lastMaintenanceDate");
          final int _cursorIndexOfNextMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "nextMaintenanceDate");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SurveyEquipmentEntity> _result = new ArrayList<SurveyEquipmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SurveyEquipmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEquipmentName;
            _tmpEquipmentName = _cursor.getString(_cursorIndexOfEquipmentName);
            final String _tmpEquipmentType;
            _tmpEquipmentType = _cursor.getString(_cursorIndexOfEquipmentType);
            final String _tmpSerialNumber;
            if (_cursor.isNull(_cursorIndexOfSerialNumber)) {
              _tmpSerialNumber = null;
            } else {
              _tmpSerialNumber = _cursor.getString(_cursorIndexOfSerialNumber);
            }
            final String _tmpAssignedTo;
            if (_cursor.isNull(_cursorIndexOfAssignedTo)) {
              _tmpAssignedTo = null;
            } else {
              _tmpAssignedTo = _cursor.getString(_cursorIndexOfAssignedTo);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpLastMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfLastMaintenanceDate)) {
              _tmpLastMaintenanceDate = null;
            } else {
              _tmpLastMaintenanceDate = _cursor.getString(_cursorIndexOfLastMaintenanceDate);
            }
            final String _tmpNextMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfNextMaintenanceDate)) {
              _tmpNextMaintenanceDate = null;
            } else {
              _tmpNextMaintenanceDate = _cursor.getString(_cursorIndexOfNextMaintenanceDate);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new SurveyEquipmentEntity(_tmpId,_tmpEquipmentName,_tmpEquipmentType,_tmpSerialNumber,_tmpAssignedTo,_tmpStatus,_tmpLastMaintenanceDate,_tmpNextMaintenanceDate,_tmpIsSynced);
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
  public Flow<List<SurveyEquipmentEntity>> getSurveyEquipmentByStatus(final String status) {
    final String _sql = "SELECT * FROM survey_equipment WHERE status = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"survey_equipment"}, new Callable<List<SurveyEquipmentEntity>>() {
      @Override
      @NonNull
      public List<SurveyEquipmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEquipmentName = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentName");
          final int _cursorIndexOfEquipmentType = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentType");
          final int _cursorIndexOfSerialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "serialNumber");
          final int _cursorIndexOfAssignedTo = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedTo");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "lastMaintenanceDate");
          final int _cursorIndexOfNextMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "nextMaintenanceDate");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SurveyEquipmentEntity> _result = new ArrayList<SurveyEquipmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SurveyEquipmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEquipmentName;
            _tmpEquipmentName = _cursor.getString(_cursorIndexOfEquipmentName);
            final String _tmpEquipmentType;
            _tmpEquipmentType = _cursor.getString(_cursorIndexOfEquipmentType);
            final String _tmpSerialNumber;
            if (_cursor.isNull(_cursorIndexOfSerialNumber)) {
              _tmpSerialNumber = null;
            } else {
              _tmpSerialNumber = _cursor.getString(_cursorIndexOfSerialNumber);
            }
            final String _tmpAssignedTo;
            if (_cursor.isNull(_cursorIndexOfAssignedTo)) {
              _tmpAssignedTo = null;
            } else {
              _tmpAssignedTo = _cursor.getString(_cursorIndexOfAssignedTo);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpLastMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfLastMaintenanceDate)) {
              _tmpLastMaintenanceDate = null;
            } else {
              _tmpLastMaintenanceDate = _cursor.getString(_cursorIndexOfLastMaintenanceDate);
            }
            final String _tmpNextMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfNextMaintenanceDate)) {
              _tmpNextMaintenanceDate = null;
            } else {
              _tmpNextMaintenanceDate = _cursor.getString(_cursorIndexOfNextMaintenanceDate);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new SurveyEquipmentEntity(_tmpId,_tmpEquipmentName,_tmpEquipmentType,_tmpSerialNumber,_tmpAssignedTo,_tmpStatus,_tmpLastMaintenanceDate,_tmpNextMaintenanceDate,_tmpIsSynced);
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
  public Object getUnsyncedSurveyEquipment(
      final Continuation<? super List<SurveyEquipmentEntity>> $completion) {
    final String _sql = "SELECT * FROM survey_equipment WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<SurveyEquipmentEntity>>() {
      @Override
      @NonNull
      public List<SurveyEquipmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEquipmentName = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentName");
          final int _cursorIndexOfEquipmentType = CursorUtil.getColumnIndexOrThrow(_cursor, "equipmentType");
          final int _cursorIndexOfSerialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "serialNumber");
          final int _cursorIndexOfAssignedTo = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedTo");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "lastMaintenanceDate");
          final int _cursorIndexOfNextMaintenanceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "nextMaintenanceDate");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SurveyEquipmentEntity> _result = new ArrayList<SurveyEquipmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SurveyEquipmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEquipmentName;
            _tmpEquipmentName = _cursor.getString(_cursorIndexOfEquipmentName);
            final String _tmpEquipmentType;
            _tmpEquipmentType = _cursor.getString(_cursorIndexOfEquipmentType);
            final String _tmpSerialNumber;
            if (_cursor.isNull(_cursorIndexOfSerialNumber)) {
              _tmpSerialNumber = null;
            } else {
              _tmpSerialNumber = _cursor.getString(_cursorIndexOfSerialNumber);
            }
            final String _tmpAssignedTo;
            if (_cursor.isNull(_cursorIndexOfAssignedTo)) {
              _tmpAssignedTo = null;
            } else {
              _tmpAssignedTo = _cursor.getString(_cursorIndexOfAssignedTo);
            }
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpLastMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfLastMaintenanceDate)) {
              _tmpLastMaintenanceDate = null;
            } else {
              _tmpLastMaintenanceDate = _cursor.getString(_cursorIndexOfLastMaintenanceDate);
            }
            final String _tmpNextMaintenanceDate;
            if (_cursor.isNull(_cursorIndexOfNextMaintenanceDate)) {
              _tmpNextMaintenanceDate = null;
            } else {
              _tmpNextMaintenanceDate = _cursor.getString(_cursorIndexOfNextMaintenanceDate);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new SurveyEquipmentEntity(_tmpId,_tmpEquipmentName,_tmpEquipmentType,_tmpSerialNumber,_tmpAssignedTo,_tmpStatus,_tmpLastMaintenanceDate,_tmpNextMaintenanceDate,_tmpIsSynced);
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
