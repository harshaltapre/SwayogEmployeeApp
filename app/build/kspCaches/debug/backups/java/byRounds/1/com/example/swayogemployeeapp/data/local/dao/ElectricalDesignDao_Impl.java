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
import com.example.swayogemployeeapp.data.local.entity.ElectricalDesignEntity;
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
public final class ElectricalDesignDao_Impl implements ElectricalDesignDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ElectricalDesignEntity> __insertionAdapterOfElectricalDesignEntity;

  private final EntityDeletionOrUpdateAdapter<ElectricalDesignEntity> __deletionAdapterOfElectricalDesignEntity;

  private final EntityDeletionOrUpdateAdapter<ElectricalDesignEntity> __updateAdapterOfElectricalDesignEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllElectricalDesigns;

  public ElectricalDesignDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfElectricalDesignEntity = new EntityInsertionAdapter<ElectricalDesignEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `electrical_designs` (`id`,`customerId`,`engineerId`,`systemSizeKw`,`mainBreakerSize`,`cableSize`,`designStatus`,`schematicUrl`,`loadCalculations`,`complianceCheck`,`submittedAt`,`reviewedAt`,`reviewedBy`,`reviewNotes`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ElectricalDesignEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getEngineerId());
        statement.bindDouble(4, entity.getSystemSizeKw());
        statement.bindDouble(5, entity.getMainBreakerSize());
        statement.bindString(6, entity.getCableSize());
        statement.bindString(7, entity.getDesignStatus());
        if (entity.getSchematicUrl() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getSchematicUrl());
        }
        if (entity.getLoadCalculations() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getLoadCalculations());
        }
        if (entity.getComplianceCheck() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getComplianceCheck());
        }
        statement.bindString(11, entity.getSubmittedAt());
        if (entity.getReviewedAt() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getReviewedAt());
        }
        if (entity.getReviewedBy() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getReviewedBy());
        }
        if (entity.getReviewNotes() == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.getReviewNotes());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
      }
    };
    this.__deletionAdapterOfElectricalDesignEntity = new EntityDeletionOrUpdateAdapter<ElectricalDesignEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `electrical_designs` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ElectricalDesignEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfElectricalDesignEntity = new EntityDeletionOrUpdateAdapter<ElectricalDesignEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `electrical_designs` SET `id` = ?,`customerId` = ?,`engineerId` = ?,`systemSizeKw` = ?,`mainBreakerSize` = ?,`cableSize` = ?,`designStatus` = ?,`schematicUrl` = ?,`loadCalculations` = ?,`complianceCheck` = ?,`submittedAt` = ?,`reviewedAt` = ?,`reviewedBy` = ?,`reviewNotes` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ElectricalDesignEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getEngineerId());
        statement.bindDouble(4, entity.getSystemSizeKw());
        statement.bindDouble(5, entity.getMainBreakerSize());
        statement.bindString(6, entity.getCableSize());
        statement.bindString(7, entity.getDesignStatus());
        if (entity.getSchematicUrl() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getSchematicUrl());
        }
        if (entity.getLoadCalculations() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getLoadCalculations());
        }
        if (entity.getComplianceCheck() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getComplianceCheck());
        }
        statement.bindString(11, entity.getSubmittedAt());
        if (entity.getReviewedAt() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getReviewedAt());
        }
        if (entity.getReviewedBy() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getReviewedBy());
        }
        if (entity.getReviewNotes() == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.getReviewNotes());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
        statement.bindString(16, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllElectricalDesigns = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM electrical_designs";
        return _query;
      }
    };
  }

  @Override
  public Object insertElectricalDesign(final ElectricalDesignEntity design,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfElectricalDesignEntity.insert(design);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertElectricalDesigns(final List<ElectricalDesignEntity> designs,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfElectricalDesignEntity.insert(designs);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteElectricalDesign(final ElectricalDesignEntity design,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfElectricalDesignEntity.handle(design);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateElectricalDesign(final ElectricalDesignEntity design,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfElectricalDesignEntity.handle(design);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllElectricalDesigns(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllElectricalDesigns.acquire();
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
          __preparedStmtOfDeleteAllElectricalDesigns.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<ElectricalDesignEntity>> getAllElectricalDesigns() {
    final String _sql = "SELECT * FROM electrical_designs";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_designs"}, new Callable<List<ElectricalDesignEntity>>() {
      @Override
      @NonNull
      public List<ElectricalDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfMainBreakerSize = CursorUtil.getColumnIndexOrThrow(_cursor, "mainBreakerSize");
          final int _cursorIndexOfCableSize = CursorUtil.getColumnIndexOrThrow(_cursor, "cableSize");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSchematicUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "schematicUrl");
          final int _cursorIndexOfLoadCalculations = CursorUtil.getColumnIndexOrThrow(_cursor, "loadCalculations");
          final int _cursorIndexOfComplianceCheck = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceCheck");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalDesignEntity> _result = new ArrayList<ElectricalDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final double _tmpMainBreakerSize;
            _tmpMainBreakerSize = _cursor.getDouble(_cursorIndexOfMainBreakerSize);
            final String _tmpCableSize;
            _tmpCableSize = _cursor.getString(_cursorIndexOfCableSize);
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
            final String _tmpSchematicUrl;
            if (_cursor.isNull(_cursorIndexOfSchematicUrl)) {
              _tmpSchematicUrl = null;
            } else {
              _tmpSchematicUrl = _cursor.getString(_cursorIndexOfSchematicUrl);
            }
            final String _tmpLoadCalculations;
            if (_cursor.isNull(_cursorIndexOfLoadCalculations)) {
              _tmpLoadCalculations = null;
            } else {
              _tmpLoadCalculations = _cursor.getString(_cursorIndexOfLoadCalculations);
            }
            final String _tmpComplianceCheck;
            if (_cursor.isNull(_cursorIndexOfComplianceCheck)) {
              _tmpComplianceCheck = null;
            } else {
              _tmpComplianceCheck = _cursor.getString(_cursorIndexOfComplianceCheck);
            }
            final String _tmpSubmittedAt;
            _tmpSubmittedAt = _cursor.getString(_cursorIndexOfSubmittedAt);
            final String _tmpReviewedAt;
            if (_cursor.isNull(_cursorIndexOfReviewedAt)) {
              _tmpReviewedAt = null;
            } else {
              _tmpReviewedAt = _cursor.getString(_cursorIndexOfReviewedAt);
            }
            final String _tmpReviewedBy;
            if (_cursor.isNull(_cursorIndexOfReviewedBy)) {
              _tmpReviewedBy = null;
            } else {
              _tmpReviewedBy = _cursor.getString(_cursorIndexOfReviewedBy);
            }
            final String _tmpReviewNotes;
            if (_cursor.isNull(_cursorIndexOfReviewNotes)) {
              _tmpReviewNotes = null;
            } else {
              _tmpReviewNotes = _cursor.getString(_cursorIndexOfReviewNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpSystemSizeKw,_tmpMainBreakerSize,_tmpCableSize,_tmpDesignStatus,_tmpSchematicUrl,_tmpLoadCalculations,_tmpComplianceCheck,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Object getElectricalDesignById(final String id,
      final Continuation<? super ElectricalDesignEntity> $completion) {
    final String _sql = "SELECT * FROM electrical_designs WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<ElectricalDesignEntity>() {
      @Override
      @Nullable
      public ElectricalDesignEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfMainBreakerSize = CursorUtil.getColumnIndexOrThrow(_cursor, "mainBreakerSize");
          final int _cursorIndexOfCableSize = CursorUtil.getColumnIndexOrThrow(_cursor, "cableSize");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSchematicUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "schematicUrl");
          final int _cursorIndexOfLoadCalculations = CursorUtil.getColumnIndexOrThrow(_cursor, "loadCalculations");
          final int _cursorIndexOfComplianceCheck = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceCheck");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final ElectricalDesignEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final double _tmpMainBreakerSize;
            _tmpMainBreakerSize = _cursor.getDouble(_cursorIndexOfMainBreakerSize);
            final String _tmpCableSize;
            _tmpCableSize = _cursor.getString(_cursorIndexOfCableSize);
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
            final String _tmpSchematicUrl;
            if (_cursor.isNull(_cursorIndexOfSchematicUrl)) {
              _tmpSchematicUrl = null;
            } else {
              _tmpSchematicUrl = _cursor.getString(_cursorIndexOfSchematicUrl);
            }
            final String _tmpLoadCalculations;
            if (_cursor.isNull(_cursorIndexOfLoadCalculations)) {
              _tmpLoadCalculations = null;
            } else {
              _tmpLoadCalculations = _cursor.getString(_cursorIndexOfLoadCalculations);
            }
            final String _tmpComplianceCheck;
            if (_cursor.isNull(_cursorIndexOfComplianceCheck)) {
              _tmpComplianceCheck = null;
            } else {
              _tmpComplianceCheck = _cursor.getString(_cursorIndexOfComplianceCheck);
            }
            final String _tmpSubmittedAt;
            _tmpSubmittedAt = _cursor.getString(_cursorIndexOfSubmittedAt);
            final String _tmpReviewedAt;
            if (_cursor.isNull(_cursorIndexOfReviewedAt)) {
              _tmpReviewedAt = null;
            } else {
              _tmpReviewedAt = _cursor.getString(_cursorIndexOfReviewedAt);
            }
            final String _tmpReviewedBy;
            if (_cursor.isNull(_cursorIndexOfReviewedBy)) {
              _tmpReviewedBy = null;
            } else {
              _tmpReviewedBy = _cursor.getString(_cursorIndexOfReviewedBy);
            }
            final String _tmpReviewNotes;
            if (_cursor.isNull(_cursorIndexOfReviewNotes)) {
              _tmpReviewNotes = null;
            } else {
              _tmpReviewNotes = _cursor.getString(_cursorIndexOfReviewNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new ElectricalDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpSystemSizeKw,_tmpMainBreakerSize,_tmpCableSize,_tmpDesignStatus,_tmpSchematicUrl,_tmpLoadCalculations,_tmpComplianceCheck,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Flow<List<ElectricalDesignEntity>> getElectricalDesignsByCustomer(final int customerId) {
    final String _sql = "SELECT * FROM electrical_designs WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_designs"}, new Callable<List<ElectricalDesignEntity>>() {
      @Override
      @NonNull
      public List<ElectricalDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfMainBreakerSize = CursorUtil.getColumnIndexOrThrow(_cursor, "mainBreakerSize");
          final int _cursorIndexOfCableSize = CursorUtil.getColumnIndexOrThrow(_cursor, "cableSize");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSchematicUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "schematicUrl");
          final int _cursorIndexOfLoadCalculations = CursorUtil.getColumnIndexOrThrow(_cursor, "loadCalculations");
          final int _cursorIndexOfComplianceCheck = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceCheck");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalDesignEntity> _result = new ArrayList<ElectricalDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final double _tmpMainBreakerSize;
            _tmpMainBreakerSize = _cursor.getDouble(_cursorIndexOfMainBreakerSize);
            final String _tmpCableSize;
            _tmpCableSize = _cursor.getString(_cursorIndexOfCableSize);
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
            final String _tmpSchematicUrl;
            if (_cursor.isNull(_cursorIndexOfSchematicUrl)) {
              _tmpSchematicUrl = null;
            } else {
              _tmpSchematicUrl = _cursor.getString(_cursorIndexOfSchematicUrl);
            }
            final String _tmpLoadCalculations;
            if (_cursor.isNull(_cursorIndexOfLoadCalculations)) {
              _tmpLoadCalculations = null;
            } else {
              _tmpLoadCalculations = _cursor.getString(_cursorIndexOfLoadCalculations);
            }
            final String _tmpComplianceCheck;
            if (_cursor.isNull(_cursorIndexOfComplianceCheck)) {
              _tmpComplianceCheck = null;
            } else {
              _tmpComplianceCheck = _cursor.getString(_cursorIndexOfComplianceCheck);
            }
            final String _tmpSubmittedAt;
            _tmpSubmittedAt = _cursor.getString(_cursorIndexOfSubmittedAt);
            final String _tmpReviewedAt;
            if (_cursor.isNull(_cursorIndexOfReviewedAt)) {
              _tmpReviewedAt = null;
            } else {
              _tmpReviewedAt = _cursor.getString(_cursorIndexOfReviewedAt);
            }
            final String _tmpReviewedBy;
            if (_cursor.isNull(_cursorIndexOfReviewedBy)) {
              _tmpReviewedBy = null;
            } else {
              _tmpReviewedBy = _cursor.getString(_cursorIndexOfReviewedBy);
            }
            final String _tmpReviewNotes;
            if (_cursor.isNull(_cursorIndexOfReviewNotes)) {
              _tmpReviewNotes = null;
            } else {
              _tmpReviewNotes = _cursor.getString(_cursorIndexOfReviewNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpSystemSizeKw,_tmpMainBreakerSize,_tmpCableSize,_tmpDesignStatus,_tmpSchematicUrl,_tmpLoadCalculations,_tmpComplianceCheck,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Flow<List<ElectricalDesignEntity>> getElectricalDesignsByEngineer(
      final String engineerId) {
    final String _sql = "SELECT * FROM electrical_designs WHERE engineerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, engineerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_designs"}, new Callable<List<ElectricalDesignEntity>>() {
      @Override
      @NonNull
      public List<ElectricalDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfMainBreakerSize = CursorUtil.getColumnIndexOrThrow(_cursor, "mainBreakerSize");
          final int _cursorIndexOfCableSize = CursorUtil.getColumnIndexOrThrow(_cursor, "cableSize");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSchematicUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "schematicUrl");
          final int _cursorIndexOfLoadCalculations = CursorUtil.getColumnIndexOrThrow(_cursor, "loadCalculations");
          final int _cursorIndexOfComplianceCheck = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceCheck");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalDesignEntity> _result = new ArrayList<ElectricalDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final double _tmpMainBreakerSize;
            _tmpMainBreakerSize = _cursor.getDouble(_cursorIndexOfMainBreakerSize);
            final String _tmpCableSize;
            _tmpCableSize = _cursor.getString(_cursorIndexOfCableSize);
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
            final String _tmpSchematicUrl;
            if (_cursor.isNull(_cursorIndexOfSchematicUrl)) {
              _tmpSchematicUrl = null;
            } else {
              _tmpSchematicUrl = _cursor.getString(_cursorIndexOfSchematicUrl);
            }
            final String _tmpLoadCalculations;
            if (_cursor.isNull(_cursorIndexOfLoadCalculations)) {
              _tmpLoadCalculations = null;
            } else {
              _tmpLoadCalculations = _cursor.getString(_cursorIndexOfLoadCalculations);
            }
            final String _tmpComplianceCheck;
            if (_cursor.isNull(_cursorIndexOfComplianceCheck)) {
              _tmpComplianceCheck = null;
            } else {
              _tmpComplianceCheck = _cursor.getString(_cursorIndexOfComplianceCheck);
            }
            final String _tmpSubmittedAt;
            _tmpSubmittedAt = _cursor.getString(_cursorIndexOfSubmittedAt);
            final String _tmpReviewedAt;
            if (_cursor.isNull(_cursorIndexOfReviewedAt)) {
              _tmpReviewedAt = null;
            } else {
              _tmpReviewedAt = _cursor.getString(_cursorIndexOfReviewedAt);
            }
            final String _tmpReviewedBy;
            if (_cursor.isNull(_cursorIndexOfReviewedBy)) {
              _tmpReviewedBy = null;
            } else {
              _tmpReviewedBy = _cursor.getString(_cursorIndexOfReviewedBy);
            }
            final String _tmpReviewNotes;
            if (_cursor.isNull(_cursorIndexOfReviewNotes)) {
              _tmpReviewNotes = null;
            } else {
              _tmpReviewNotes = _cursor.getString(_cursorIndexOfReviewNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpSystemSizeKw,_tmpMainBreakerSize,_tmpCableSize,_tmpDesignStatus,_tmpSchematicUrl,_tmpLoadCalculations,_tmpComplianceCheck,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Flow<List<ElectricalDesignEntity>> getElectricalDesignsByStatus(final String status) {
    final String _sql = "SELECT * FROM electrical_designs WHERE designStatus = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"electrical_designs"}, new Callable<List<ElectricalDesignEntity>>() {
      @Override
      @NonNull
      public List<ElectricalDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfMainBreakerSize = CursorUtil.getColumnIndexOrThrow(_cursor, "mainBreakerSize");
          final int _cursorIndexOfCableSize = CursorUtil.getColumnIndexOrThrow(_cursor, "cableSize");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSchematicUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "schematicUrl");
          final int _cursorIndexOfLoadCalculations = CursorUtil.getColumnIndexOrThrow(_cursor, "loadCalculations");
          final int _cursorIndexOfComplianceCheck = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceCheck");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalDesignEntity> _result = new ArrayList<ElectricalDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final double _tmpMainBreakerSize;
            _tmpMainBreakerSize = _cursor.getDouble(_cursorIndexOfMainBreakerSize);
            final String _tmpCableSize;
            _tmpCableSize = _cursor.getString(_cursorIndexOfCableSize);
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
            final String _tmpSchematicUrl;
            if (_cursor.isNull(_cursorIndexOfSchematicUrl)) {
              _tmpSchematicUrl = null;
            } else {
              _tmpSchematicUrl = _cursor.getString(_cursorIndexOfSchematicUrl);
            }
            final String _tmpLoadCalculations;
            if (_cursor.isNull(_cursorIndexOfLoadCalculations)) {
              _tmpLoadCalculations = null;
            } else {
              _tmpLoadCalculations = _cursor.getString(_cursorIndexOfLoadCalculations);
            }
            final String _tmpComplianceCheck;
            if (_cursor.isNull(_cursorIndexOfComplianceCheck)) {
              _tmpComplianceCheck = null;
            } else {
              _tmpComplianceCheck = _cursor.getString(_cursorIndexOfComplianceCheck);
            }
            final String _tmpSubmittedAt;
            _tmpSubmittedAt = _cursor.getString(_cursorIndexOfSubmittedAt);
            final String _tmpReviewedAt;
            if (_cursor.isNull(_cursorIndexOfReviewedAt)) {
              _tmpReviewedAt = null;
            } else {
              _tmpReviewedAt = _cursor.getString(_cursorIndexOfReviewedAt);
            }
            final String _tmpReviewedBy;
            if (_cursor.isNull(_cursorIndexOfReviewedBy)) {
              _tmpReviewedBy = null;
            } else {
              _tmpReviewedBy = _cursor.getString(_cursorIndexOfReviewedBy);
            }
            final String _tmpReviewNotes;
            if (_cursor.isNull(_cursorIndexOfReviewNotes)) {
              _tmpReviewNotes = null;
            } else {
              _tmpReviewNotes = _cursor.getString(_cursorIndexOfReviewNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpSystemSizeKw,_tmpMainBreakerSize,_tmpCableSize,_tmpDesignStatus,_tmpSchematicUrl,_tmpLoadCalculations,_tmpComplianceCheck,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Object getUnsyncedElectricalDesigns(
      final Continuation<? super List<ElectricalDesignEntity>> $completion) {
    final String _sql = "SELECT * FROM electrical_designs WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<ElectricalDesignEntity>>() {
      @Override
      @NonNull
      public List<ElectricalDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfSystemSizeKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemSizeKw");
          final int _cursorIndexOfMainBreakerSize = CursorUtil.getColumnIndexOrThrow(_cursor, "mainBreakerSize");
          final int _cursorIndexOfCableSize = CursorUtil.getColumnIndexOrThrow(_cursor, "cableSize");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSchematicUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "schematicUrl");
          final int _cursorIndexOfLoadCalculations = CursorUtil.getColumnIndexOrThrow(_cursor, "loadCalculations");
          final int _cursorIndexOfComplianceCheck = CursorUtil.getColumnIndexOrThrow(_cursor, "complianceCheck");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<ElectricalDesignEntity> _result = new ArrayList<ElectricalDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ElectricalDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final double _tmpSystemSizeKw;
            _tmpSystemSizeKw = _cursor.getDouble(_cursorIndexOfSystemSizeKw);
            final double _tmpMainBreakerSize;
            _tmpMainBreakerSize = _cursor.getDouble(_cursorIndexOfMainBreakerSize);
            final String _tmpCableSize;
            _tmpCableSize = _cursor.getString(_cursorIndexOfCableSize);
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
            final String _tmpSchematicUrl;
            if (_cursor.isNull(_cursorIndexOfSchematicUrl)) {
              _tmpSchematicUrl = null;
            } else {
              _tmpSchematicUrl = _cursor.getString(_cursorIndexOfSchematicUrl);
            }
            final String _tmpLoadCalculations;
            if (_cursor.isNull(_cursorIndexOfLoadCalculations)) {
              _tmpLoadCalculations = null;
            } else {
              _tmpLoadCalculations = _cursor.getString(_cursorIndexOfLoadCalculations);
            }
            final String _tmpComplianceCheck;
            if (_cursor.isNull(_cursorIndexOfComplianceCheck)) {
              _tmpComplianceCheck = null;
            } else {
              _tmpComplianceCheck = _cursor.getString(_cursorIndexOfComplianceCheck);
            }
            final String _tmpSubmittedAt;
            _tmpSubmittedAt = _cursor.getString(_cursorIndexOfSubmittedAt);
            final String _tmpReviewedAt;
            if (_cursor.isNull(_cursorIndexOfReviewedAt)) {
              _tmpReviewedAt = null;
            } else {
              _tmpReviewedAt = _cursor.getString(_cursorIndexOfReviewedAt);
            }
            final String _tmpReviewedBy;
            if (_cursor.isNull(_cursorIndexOfReviewedBy)) {
              _tmpReviewedBy = null;
            } else {
              _tmpReviewedBy = _cursor.getString(_cursorIndexOfReviewedBy);
            }
            final String _tmpReviewNotes;
            if (_cursor.isNull(_cursorIndexOfReviewNotes)) {
              _tmpReviewNotes = null;
            } else {
              _tmpReviewNotes = _cursor.getString(_cursorIndexOfReviewNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new ElectricalDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpSystemSizeKw,_tmpMainBreakerSize,_tmpCableSize,_tmpDesignStatus,_tmpSchematicUrl,_tmpLoadCalculations,_tmpComplianceCheck,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
