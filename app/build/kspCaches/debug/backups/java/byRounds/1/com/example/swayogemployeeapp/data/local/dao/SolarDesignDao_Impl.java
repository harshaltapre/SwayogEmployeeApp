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
import com.example.swayogemployeeapp.data.local.entity.SolarDesignEntity;
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
public final class SolarDesignDao_Impl implements SolarDesignDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<SolarDesignEntity> __insertionAdapterOfSolarDesignEntity;

  private final EntityDeletionOrUpdateAdapter<SolarDesignEntity> __deletionAdapterOfSolarDesignEntity;

  private final EntityDeletionOrUpdateAdapter<SolarDesignEntity> __updateAdapterOfSolarDesignEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllSolarDesigns;

  public SolarDesignDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfSolarDesignEntity = new EntityInsertionAdapter<SolarDesignEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `solar_designs` (`id`,`customerId`,`engineerId`,`panelCount`,`inverterModel`,`systemCapacityKw`,`tiltAngle`,`cadLayoutPath`,`sldDiagramPath`,`designStatus`,`submittedAt`,`reviewedAt`,`reviewedBy`,`reviewNotes`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SolarDesignEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getEngineerId());
        statement.bindLong(4, entity.getPanelCount());
        statement.bindString(5, entity.getInverterModel());
        statement.bindDouble(6, entity.getSystemCapacityKw());
        statement.bindDouble(7, entity.getTiltAngle());
        if (entity.getCadLayoutPath() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getCadLayoutPath());
        }
        if (entity.getSldDiagramPath() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getSldDiagramPath());
        }
        statement.bindString(10, entity.getDesignStatus());
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
    this.__deletionAdapterOfSolarDesignEntity = new EntityDeletionOrUpdateAdapter<SolarDesignEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `solar_designs` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SolarDesignEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfSolarDesignEntity = new EntityDeletionOrUpdateAdapter<SolarDesignEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `solar_designs` SET `id` = ?,`customerId` = ?,`engineerId` = ?,`panelCount` = ?,`inverterModel` = ?,`systemCapacityKw` = ?,`tiltAngle` = ?,`cadLayoutPath` = ?,`sldDiagramPath` = ?,`designStatus` = ?,`submittedAt` = ?,`reviewedAt` = ?,`reviewedBy` = ?,`reviewNotes` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SolarDesignEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getEngineerId());
        statement.bindLong(4, entity.getPanelCount());
        statement.bindString(5, entity.getInverterModel());
        statement.bindDouble(6, entity.getSystemCapacityKw());
        statement.bindDouble(7, entity.getTiltAngle());
        if (entity.getCadLayoutPath() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getCadLayoutPath());
        }
        if (entity.getSldDiagramPath() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getSldDiagramPath());
        }
        statement.bindString(10, entity.getDesignStatus());
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
    this.__preparedStmtOfDeleteAllSolarDesigns = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM solar_designs";
        return _query;
      }
    };
  }

  @Override
  public Object insertSolarDesign(final SolarDesignEntity design,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfSolarDesignEntity.insert(design);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertSolarDesigns(final List<SolarDesignEntity> designs,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfSolarDesignEntity.insert(designs);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteSolarDesign(final SolarDesignEntity design,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfSolarDesignEntity.handle(design);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateSolarDesign(final SolarDesignEntity design,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfSolarDesignEntity.handle(design);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllSolarDesigns(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllSolarDesigns.acquire();
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
          __preparedStmtOfDeleteAllSolarDesigns.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<SolarDesignEntity>> getAllSolarDesigns() {
    final String _sql = "SELECT * FROM solar_designs";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"solar_designs"}, new Callable<List<SolarDesignEntity>>() {
      @Override
      @NonNull
      public List<SolarDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfPanelCount = CursorUtil.getColumnIndexOrThrow(_cursor, "panelCount");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfSystemCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemCapacityKw");
          final int _cursorIndexOfTiltAngle = CursorUtil.getColumnIndexOrThrow(_cursor, "tiltAngle");
          final int _cursorIndexOfCadLayoutPath = CursorUtil.getColumnIndexOrThrow(_cursor, "cadLayoutPath");
          final int _cursorIndexOfSldDiagramPath = CursorUtil.getColumnIndexOrThrow(_cursor, "sldDiagramPath");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SolarDesignEntity> _result = new ArrayList<SolarDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SolarDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final int _tmpPanelCount;
            _tmpPanelCount = _cursor.getInt(_cursorIndexOfPanelCount);
            final String _tmpInverterModel;
            _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            final double _tmpSystemCapacityKw;
            _tmpSystemCapacityKw = _cursor.getDouble(_cursorIndexOfSystemCapacityKw);
            final double _tmpTiltAngle;
            _tmpTiltAngle = _cursor.getDouble(_cursorIndexOfTiltAngle);
            final String _tmpCadLayoutPath;
            if (_cursor.isNull(_cursorIndexOfCadLayoutPath)) {
              _tmpCadLayoutPath = null;
            } else {
              _tmpCadLayoutPath = _cursor.getString(_cursorIndexOfCadLayoutPath);
            }
            final String _tmpSldDiagramPath;
            if (_cursor.isNull(_cursorIndexOfSldDiagramPath)) {
              _tmpSldDiagramPath = null;
            } else {
              _tmpSldDiagramPath = _cursor.getString(_cursorIndexOfSldDiagramPath);
            }
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
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
            _item = new SolarDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpPanelCount,_tmpInverterModel,_tmpSystemCapacityKw,_tmpTiltAngle,_tmpCadLayoutPath,_tmpSldDiagramPath,_tmpDesignStatus,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Object getSolarDesignById(final String id,
      final Continuation<? super SolarDesignEntity> $completion) {
    final String _sql = "SELECT * FROM solar_designs WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<SolarDesignEntity>() {
      @Override
      @Nullable
      public SolarDesignEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfPanelCount = CursorUtil.getColumnIndexOrThrow(_cursor, "panelCount");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfSystemCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemCapacityKw");
          final int _cursorIndexOfTiltAngle = CursorUtil.getColumnIndexOrThrow(_cursor, "tiltAngle");
          final int _cursorIndexOfCadLayoutPath = CursorUtil.getColumnIndexOrThrow(_cursor, "cadLayoutPath");
          final int _cursorIndexOfSldDiagramPath = CursorUtil.getColumnIndexOrThrow(_cursor, "sldDiagramPath");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final SolarDesignEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final int _tmpPanelCount;
            _tmpPanelCount = _cursor.getInt(_cursorIndexOfPanelCount);
            final String _tmpInverterModel;
            _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            final double _tmpSystemCapacityKw;
            _tmpSystemCapacityKw = _cursor.getDouble(_cursorIndexOfSystemCapacityKw);
            final double _tmpTiltAngle;
            _tmpTiltAngle = _cursor.getDouble(_cursorIndexOfTiltAngle);
            final String _tmpCadLayoutPath;
            if (_cursor.isNull(_cursorIndexOfCadLayoutPath)) {
              _tmpCadLayoutPath = null;
            } else {
              _tmpCadLayoutPath = _cursor.getString(_cursorIndexOfCadLayoutPath);
            }
            final String _tmpSldDiagramPath;
            if (_cursor.isNull(_cursorIndexOfSldDiagramPath)) {
              _tmpSldDiagramPath = null;
            } else {
              _tmpSldDiagramPath = _cursor.getString(_cursorIndexOfSldDiagramPath);
            }
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
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
            _result = new SolarDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpPanelCount,_tmpInverterModel,_tmpSystemCapacityKw,_tmpTiltAngle,_tmpCadLayoutPath,_tmpSldDiagramPath,_tmpDesignStatus,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Flow<List<SolarDesignEntity>> getSolarDesignsByCustomer(final int customerId) {
    final String _sql = "SELECT * FROM solar_designs WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"solar_designs"}, new Callable<List<SolarDesignEntity>>() {
      @Override
      @NonNull
      public List<SolarDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfPanelCount = CursorUtil.getColumnIndexOrThrow(_cursor, "panelCount");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfSystemCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemCapacityKw");
          final int _cursorIndexOfTiltAngle = CursorUtil.getColumnIndexOrThrow(_cursor, "tiltAngle");
          final int _cursorIndexOfCadLayoutPath = CursorUtil.getColumnIndexOrThrow(_cursor, "cadLayoutPath");
          final int _cursorIndexOfSldDiagramPath = CursorUtil.getColumnIndexOrThrow(_cursor, "sldDiagramPath");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SolarDesignEntity> _result = new ArrayList<SolarDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SolarDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final int _tmpPanelCount;
            _tmpPanelCount = _cursor.getInt(_cursorIndexOfPanelCount);
            final String _tmpInverterModel;
            _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            final double _tmpSystemCapacityKw;
            _tmpSystemCapacityKw = _cursor.getDouble(_cursorIndexOfSystemCapacityKw);
            final double _tmpTiltAngle;
            _tmpTiltAngle = _cursor.getDouble(_cursorIndexOfTiltAngle);
            final String _tmpCadLayoutPath;
            if (_cursor.isNull(_cursorIndexOfCadLayoutPath)) {
              _tmpCadLayoutPath = null;
            } else {
              _tmpCadLayoutPath = _cursor.getString(_cursorIndexOfCadLayoutPath);
            }
            final String _tmpSldDiagramPath;
            if (_cursor.isNull(_cursorIndexOfSldDiagramPath)) {
              _tmpSldDiagramPath = null;
            } else {
              _tmpSldDiagramPath = _cursor.getString(_cursorIndexOfSldDiagramPath);
            }
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
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
            _item = new SolarDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpPanelCount,_tmpInverterModel,_tmpSystemCapacityKw,_tmpTiltAngle,_tmpCadLayoutPath,_tmpSldDiagramPath,_tmpDesignStatus,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Flow<List<SolarDesignEntity>> getSolarDesignsByEngineer(final String engineerId) {
    final String _sql = "SELECT * FROM solar_designs WHERE engineerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, engineerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"solar_designs"}, new Callable<List<SolarDesignEntity>>() {
      @Override
      @NonNull
      public List<SolarDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfPanelCount = CursorUtil.getColumnIndexOrThrow(_cursor, "panelCount");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfSystemCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemCapacityKw");
          final int _cursorIndexOfTiltAngle = CursorUtil.getColumnIndexOrThrow(_cursor, "tiltAngle");
          final int _cursorIndexOfCadLayoutPath = CursorUtil.getColumnIndexOrThrow(_cursor, "cadLayoutPath");
          final int _cursorIndexOfSldDiagramPath = CursorUtil.getColumnIndexOrThrow(_cursor, "sldDiagramPath");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SolarDesignEntity> _result = new ArrayList<SolarDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SolarDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final int _tmpPanelCount;
            _tmpPanelCount = _cursor.getInt(_cursorIndexOfPanelCount);
            final String _tmpInverterModel;
            _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            final double _tmpSystemCapacityKw;
            _tmpSystemCapacityKw = _cursor.getDouble(_cursorIndexOfSystemCapacityKw);
            final double _tmpTiltAngle;
            _tmpTiltAngle = _cursor.getDouble(_cursorIndexOfTiltAngle);
            final String _tmpCadLayoutPath;
            if (_cursor.isNull(_cursorIndexOfCadLayoutPath)) {
              _tmpCadLayoutPath = null;
            } else {
              _tmpCadLayoutPath = _cursor.getString(_cursorIndexOfCadLayoutPath);
            }
            final String _tmpSldDiagramPath;
            if (_cursor.isNull(_cursorIndexOfSldDiagramPath)) {
              _tmpSldDiagramPath = null;
            } else {
              _tmpSldDiagramPath = _cursor.getString(_cursorIndexOfSldDiagramPath);
            }
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
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
            _item = new SolarDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpPanelCount,_tmpInverterModel,_tmpSystemCapacityKw,_tmpTiltAngle,_tmpCadLayoutPath,_tmpSldDiagramPath,_tmpDesignStatus,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Flow<List<SolarDesignEntity>> getSolarDesignsByStatus(final String status) {
    final String _sql = "SELECT * FROM solar_designs WHERE designStatus = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"solar_designs"}, new Callable<List<SolarDesignEntity>>() {
      @Override
      @NonNull
      public List<SolarDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfPanelCount = CursorUtil.getColumnIndexOrThrow(_cursor, "panelCount");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfSystemCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemCapacityKw");
          final int _cursorIndexOfTiltAngle = CursorUtil.getColumnIndexOrThrow(_cursor, "tiltAngle");
          final int _cursorIndexOfCadLayoutPath = CursorUtil.getColumnIndexOrThrow(_cursor, "cadLayoutPath");
          final int _cursorIndexOfSldDiagramPath = CursorUtil.getColumnIndexOrThrow(_cursor, "sldDiagramPath");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SolarDesignEntity> _result = new ArrayList<SolarDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SolarDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final int _tmpPanelCount;
            _tmpPanelCount = _cursor.getInt(_cursorIndexOfPanelCount);
            final String _tmpInverterModel;
            _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            final double _tmpSystemCapacityKw;
            _tmpSystemCapacityKw = _cursor.getDouble(_cursorIndexOfSystemCapacityKw);
            final double _tmpTiltAngle;
            _tmpTiltAngle = _cursor.getDouble(_cursorIndexOfTiltAngle);
            final String _tmpCadLayoutPath;
            if (_cursor.isNull(_cursorIndexOfCadLayoutPath)) {
              _tmpCadLayoutPath = null;
            } else {
              _tmpCadLayoutPath = _cursor.getString(_cursorIndexOfCadLayoutPath);
            }
            final String _tmpSldDiagramPath;
            if (_cursor.isNull(_cursorIndexOfSldDiagramPath)) {
              _tmpSldDiagramPath = null;
            } else {
              _tmpSldDiagramPath = _cursor.getString(_cursorIndexOfSldDiagramPath);
            }
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
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
            _item = new SolarDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpPanelCount,_tmpInverterModel,_tmpSystemCapacityKw,_tmpTiltAngle,_tmpCadLayoutPath,_tmpSldDiagramPath,_tmpDesignStatus,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
  public Object getUnsyncedSolarDesigns(
      final Continuation<? super List<SolarDesignEntity>> $completion) {
    final String _sql = "SELECT * FROM solar_designs WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<SolarDesignEntity>>() {
      @Override
      @NonNull
      public List<SolarDesignEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfEngineerId = CursorUtil.getColumnIndexOrThrow(_cursor, "engineerId");
          final int _cursorIndexOfPanelCount = CursorUtil.getColumnIndexOrThrow(_cursor, "panelCount");
          final int _cursorIndexOfInverterModel = CursorUtil.getColumnIndexOrThrow(_cursor, "inverterModel");
          final int _cursorIndexOfSystemCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "systemCapacityKw");
          final int _cursorIndexOfTiltAngle = CursorUtil.getColumnIndexOrThrow(_cursor, "tiltAngle");
          final int _cursorIndexOfCadLayoutPath = CursorUtil.getColumnIndexOrThrow(_cursor, "cadLayoutPath");
          final int _cursorIndexOfSldDiagramPath = CursorUtil.getColumnIndexOrThrow(_cursor, "sldDiagramPath");
          final int _cursorIndexOfDesignStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "designStatus");
          final int _cursorIndexOfSubmittedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "submittedAt");
          final int _cursorIndexOfReviewedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedAt");
          final int _cursorIndexOfReviewedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewedBy");
          final int _cursorIndexOfReviewNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "reviewNotes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SolarDesignEntity> _result = new ArrayList<SolarDesignEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SolarDesignEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpEngineerId;
            _tmpEngineerId = _cursor.getString(_cursorIndexOfEngineerId);
            final int _tmpPanelCount;
            _tmpPanelCount = _cursor.getInt(_cursorIndexOfPanelCount);
            final String _tmpInverterModel;
            _tmpInverterModel = _cursor.getString(_cursorIndexOfInverterModel);
            final double _tmpSystemCapacityKw;
            _tmpSystemCapacityKw = _cursor.getDouble(_cursorIndexOfSystemCapacityKw);
            final double _tmpTiltAngle;
            _tmpTiltAngle = _cursor.getDouble(_cursorIndexOfTiltAngle);
            final String _tmpCadLayoutPath;
            if (_cursor.isNull(_cursorIndexOfCadLayoutPath)) {
              _tmpCadLayoutPath = null;
            } else {
              _tmpCadLayoutPath = _cursor.getString(_cursorIndexOfCadLayoutPath);
            }
            final String _tmpSldDiagramPath;
            if (_cursor.isNull(_cursorIndexOfSldDiagramPath)) {
              _tmpSldDiagramPath = null;
            } else {
              _tmpSldDiagramPath = _cursor.getString(_cursorIndexOfSldDiagramPath);
            }
            final String _tmpDesignStatus;
            _tmpDesignStatus = _cursor.getString(_cursorIndexOfDesignStatus);
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
            _item = new SolarDesignEntity(_tmpId,_tmpCustomerId,_tmpEngineerId,_tmpPanelCount,_tmpInverterModel,_tmpSystemCapacityKw,_tmpTiltAngle,_tmpCadLayoutPath,_tmpSldDiagramPath,_tmpDesignStatus,_tmpSubmittedAt,_tmpReviewedAt,_tmpReviewedBy,_tmpReviewNotes,_tmpIsSynced);
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
