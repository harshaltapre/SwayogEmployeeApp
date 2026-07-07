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
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity;
import java.lang.Class;
import java.lang.Double;
import java.lang.Exception;
import java.lang.Long;
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
public final class AttendanceRecordDao_Impl implements AttendanceRecordDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<AttendanceRecordEntity> __insertionAdapterOfAttendanceRecordEntity;

  private final EntityDeletionOrUpdateAdapter<AttendanceRecordEntity> __updateAdapterOfAttendanceRecordEntity;

  public AttendanceRecordDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfAttendanceRecordEntity = new EntityInsertionAdapter<AttendanceRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `attendance_records` (`localId`,`remoteId`,`date`,`checkInTime`,`checkInLatitude`,`checkInLongitude`,`checkOutTime`,`checkOutLatitude`,`checkOutLongitude`,`totalBreakDurationSeconds`,`isSynced`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final AttendanceRecordEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        if (entity.getRemoteId() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getRemoteId());
        }
        statement.bindString(3, entity.getDate());
        statement.bindString(4, entity.getCheckInTime());
        statement.bindDouble(5, entity.getCheckInLatitude());
        statement.bindDouble(6, entity.getCheckInLongitude());
        if (entity.getCheckOutTime() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getCheckOutTime());
        }
        if (entity.getCheckOutLatitude() == null) {
          statement.bindNull(8);
        } else {
          statement.bindDouble(8, entity.getCheckOutLatitude());
        }
        if (entity.getCheckOutLongitude() == null) {
          statement.bindNull(9);
        } else {
          statement.bindDouble(9, entity.getCheckOutLongitude());
        }
        statement.bindLong(10, entity.getTotalBreakDurationSeconds());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(11, _tmp);
      }
    };
    this.__updateAdapterOfAttendanceRecordEntity = new EntityDeletionOrUpdateAdapter<AttendanceRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `attendance_records` SET `localId` = ?,`remoteId` = ?,`date` = ?,`checkInTime` = ?,`checkInLatitude` = ?,`checkInLongitude` = ?,`checkOutTime` = ?,`checkOutLatitude` = ?,`checkOutLongitude` = ?,`totalBreakDurationSeconds` = ?,`isSynced` = ? WHERE `localId` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final AttendanceRecordEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        if (entity.getRemoteId() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getRemoteId());
        }
        statement.bindString(3, entity.getDate());
        statement.bindString(4, entity.getCheckInTime());
        statement.bindDouble(5, entity.getCheckInLatitude());
        statement.bindDouble(6, entity.getCheckInLongitude());
        if (entity.getCheckOutTime() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getCheckOutTime());
        }
        if (entity.getCheckOutLatitude() == null) {
          statement.bindNull(8);
        } else {
          statement.bindDouble(8, entity.getCheckOutLatitude());
        }
        if (entity.getCheckOutLongitude() == null) {
          statement.bindNull(9);
        } else {
          statement.bindDouble(9, entity.getCheckOutLongitude());
        }
        statement.bindLong(10, entity.getTotalBreakDurationSeconds());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(11, _tmp);
        statement.bindLong(12, entity.getLocalId());
      }
    };
  }

  @Override
  public Object insert(final AttendanceRecordEntity record,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfAttendanceRecordEntity.insertAndReturnId(record);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final AttendanceRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfAttendanceRecordEntity.handle(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<AttendanceRecordEntity>> getAllRecordsFlow() {
    final String _sql = "SELECT * FROM attendance_records ORDER BY localId DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"attendance_records"}, new Callable<List<AttendanceRecordEntity>>() {
      @Override
      @NonNull
      public List<AttendanceRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfCheckInTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInTime");
          final int _cursorIndexOfCheckInLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLatitude");
          final int _cursorIndexOfCheckInLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLongitude");
          final int _cursorIndexOfCheckOutTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutTime");
          final int _cursorIndexOfCheckOutLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLatitude");
          final int _cursorIndexOfCheckOutLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLongitude");
          final int _cursorIndexOfTotalBreakDurationSeconds = CursorUtil.getColumnIndexOrThrow(_cursor, "totalBreakDurationSeconds");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AttendanceRecordEntity> _result = new ArrayList<AttendanceRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AttendanceRecordEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final String _tmpRemoteId;
            if (_cursor.isNull(_cursorIndexOfRemoteId)) {
              _tmpRemoteId = null;
            } else {
              _tmpRemoteId = _cursor.getString(_cursorIndexOfRemoteId);
            }
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpCheckInTime;
            _tmpCheckInTime = _cursor.getString(_cursorIndexOfCheckInTime);
            final double _tmpCheckInLatitude;
            _tmpCheckInLatitude = _cursor.getDouble(_cursorIndexOfCheckInLatitude);
            final double _tmpCheckInLongitude;
            _tmpCheckInLongitude = _cursor.getDouble(_cursorIndexOfCheckInLongitude);
            final String _tmpCheckOutTime;
            if (_cursor.isNull(_cursorIndexOfCheckOutTime)) {
              _tmpCheckOutTime = null;
            } else {
              _tmpCheckOutTime = _cursor.getString(_cursorIndexOfCheckOutTime);
            }
            final Double _tmpCheckOutLatitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLatitude)) {
              _tmpCheckOutLatitude = null;
            } else {
              _tmpCheckOutLatitude = _cursor.getDouble(_cursorIndexOfCheckOutLatitude);
            }
            final Double _tmpCheckOutLongitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLongitude)) {
              _tmpCheckOutLongitude = null;
            } else {
              _tmpCheckOutLongitude = _cursor.getDouble(_cursorIndexOfCheckOutLongitude);
            }
            final long _tmpTotalBreakDurationSeconds;
            _tmpTotalBreakDurationSeconds = _cursor.getLong(_cursorIndexOfTotalBreakDurationSeconds);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AttendanceRecordEntity(_tmpLocalId,_tmpRemoteId,_tmpDate,_tmpCheckInTime,_tmpCheckInLatitude,_tmpCheckInLongitude,_tmpCheckOutTime,_tmpCheckOutLatitude,_tmpCheckOutLongitude,_tmpTotalBreakDurationSeconds,_tmpIsSynced);
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
  public Flow<AttendanceRecordEntity> getRecordForDateFlow(final String date) {
    final String _sql = "SELECT * FROM attendance_records WHERE date = ? ORDER BY localId DESC LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, date);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"attendance_records"}, new Callable<AttendanceRecordEntity>() {
      @Override
      @Nullable
      public AttendanceRecordEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfCheckInTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInTime");
          final int _cursorIndexOfCheckInLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLatitude");
          final int _cursorIndexOfCheckInLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLongitude");
          final int _cursorIndexOfCheckOutTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutTime");
          final int _cursorIndexOfCheckOutLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLatitude");
          final int _cursorIndexOfCheckOutLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLongitude");
          final int _cursorIndexOfTotalBreakDurationSeconds = CursorUtil.getColumnIndexOrThrow(_cursor, "totalBreakDurationSeconds");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final AttendanceRecordEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final String _tmpRemoteId;
            if (_cursor.isNull(_cursorIndexOfRemoteId)) {
              _tmpRemoteId = null;
            } else {
              _tmpRemoteId = _cursor.getString(_cursorIndexOfRemoteId);
            }
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpCheckInTime;
            _tmpCheckInTime = _cursor.getString(_cursorIndexOfCheckInTime);
            final double _tmpCheckInLatitude;
            _tmpCheckInLatitude = _cursor.getDouble(_cursorIndexOfCheckInLatitude);
            final double _tmpCheckInLongitude;
            _tmpCheckInLongitude = _cursor.getDouble(_cursorIndexOfCheckInLongitude);
            final String _tmpCheckOutTime;
            if (_cursor.isNull(_cursorIndexOfCheckOutTime)) {
              _tmpCheckOutTime = null;
            } else {
              _tmpCheckOutTime = _cursor.getString(_cursorIndexOfCheckOutTime);
            }
            final Double _tmpCheckOutLatitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLatitude)) {
              _tmpCheckOutLatitude = null;
            } else {
              _tmpCheckOutLatitude = _cursor.getDouble(_cursorIndexOfCheckOutLatitude);
            }
            final Double _tmpCheckOutLongitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLongitude)) {
              _tmpCheckOutLongitude = null;
            } else {
              _tmpCheckOutLongitude = _cursor.getDouble(_cursorIndexOfCheckOutLongitude);
            }
            final long _tmpTotalBreakDurationSeconds;
            _tmpTotalBreakDurationSeconds = _cursor.getLong(_cursorIndexOfTotalBreakDurationSeconds);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new AttendanceRecordEntity(_tmpLocalId,_tmpRemoteId,_tmpDate,_tmpCheckInTime,_tmpCheckInLatitude,_tmpCheckInLongitude,_tmpCheckOutTime,_tmpCheckOutLatitude,_tmpCheckOutLongitude,_tmpTotalBreakDurationSeconds,_tmpIsSynced);
          } else {
            _result = null;
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
  public Object getRecordForDate(final String date,
      final Continuation<? super AttendanceRecordEntity> $completion) {
    final String _sql = "SELECT * FROM attendance_records WHERE date = ? ORDER BY localId DESC LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, date);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<AttendanceRecordEntity>() {
      @Override
      @Nullable
      public AttendanceRecordEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfCheckInTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInTime");
          final int _cursorIndexOfCheckInLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLatitude");
          final int _cursorIndexOfCheckInLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLongitude");
          final int _cursorIndexOfCheckOutTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutTime");
          final int _cursorIndexOfCheckOutLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLatitude");
          final int _cursorIndexOfCheckOutLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLongitude");
          final int _cursorIndexOfTotalBreakDurationSeconds = CursorUtil.getColumnIndexOrThrow(_cursor, "totalBreakDurationSeconds");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final AttendanceRecordEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final String _tmpRemoteId;
            if (_cursor.isNull(_cursorIndexOfRemoteId)) {
              _tmpRemoteId = null;
            } else {
              _tmpRemoteId = _cursor.getString(_cursorIndexOfRemoteId);
            }
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpCheckInTime;
            _tmpCheckInTime = _cursor.getString(_cursorIndexOfCheckInTime);
            final double _tmpCheckInLatitude;
            _tmpCheckInLatitude = _cursor.getDouble(_cursorIndexOfCheckInLatitude);
            final double _tmpCheckInLongitude;
            _tmpCheckInLongitude = _cursor.getDouble(_cursorIndexOfCheckInLongitude);
            final String _tmpCheckOutTime;
            if (_cursor.isNull(_cursorIndexOfCheckOutTime)) {
              _tmpCheckOutTime = null;
            } else {
              _tmpCheckOutTime = _cursor.getString(_cursorIndexOfCheckOutTime);
            }
            final Double _tmpCheckOutLatitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLatitude)) {
              _tmpCheckOutLatitude = null;
            } else {
              _tmpCheckOutLatitude = _cursor.getDouble(_cursorIndexOfCheckOutLatitude);
            }
            final Double _tmpCheckOutLongitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLongitude)) {
              _tmpCheckOutLongitude = null;
            } else {
              _tmpCheckOutLongitude = _cursor.getDouble(_cursorIndexOfCheckOutLongitude);
            }
            final long _tmpTotalBreakDurationSeconds;
            _tmpTotalBreakDurationSeconds = _cursor.getLong(_cursorIndexOfTotalBreakDurationSeconds);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new AttendanceRecordEntity(_tmpLocalId,_tmpRemoteId,_tmpDate,_tmpCheckInTime,_tmpCheckInLatitude,_tmpCheckInLongitude,_tmpCheckOutTime,_tmpCheckOutLatitude,_tmpCheckOutLongitude,_tmpTotalBreakDurationSeconds,_tmpIsSynced);
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
  public Object getUnsyncedRecords(
      final Continuation<? super List<AttendanceRecordEntity>> $completion) {
    final String _sql = "SELECT * FROM attendance_records WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<AttendanceRecordEntity>>() {
      @Override
      @NonNull
      public List<AttendanceRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfCheckInTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInTime");
          final int _cursorIndexOfCheckInLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLatitude");
          final int _cursorIndexOfCheckInLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkInLongitude");
          final int _cursorIndexOfCheckOutTime = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutTime");
          final int _cursorIndexOfCheckOutLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLatitude");
          final int _cursorIndexOfCheckOutLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "checkOutLongitude");
          final int _cursorIndexOfTotalBreakDurationSeconds = CursorUtil.getColumnIndexOrThrow(_cursor, "totalBreakDurationSeconds");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AttendanceRecordEntity> _result = new ArrayList<AttendanceRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AttendanceRecordEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final String _tmpRemoteId;
            if (_cursor.isNull(_cursorIndexOfRemoteId)) {
              _tmpRemoteId = null;
            } else {
              _tmpRemoteId = _cursor.getString(_cursorIndexOfRemoteId);
            }
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpCheckInTime;
            _tmpCheckInTime = _cursor.getString(_cursorIndexOfCheckInTime);
            final double _tmpCheckInLatitude;
            _tmpCheckInLatitude = _cursor.getDouble(_cursorIndexOfCheckInLatitude);
            final double _tmpCheckInLongitude;
            _tmpCheckInLongitude = _cursor.getDouble(_cursorIndexOfCheckInLongitude);
            final String _tmpCheckOutTime;
            if (_cursor.isNull(_cursorIndexOfCheckOutTime)) {
              _tmpCheckOutTime = null;
            } else {
              _tmpCheckOutTime = _cursor.getString(_cursorIndexOfCheckOutTime);
            }
            final Double _tmpCheckOutLatitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLatitude)) {
              _tmpCheckOutLatitude = null;
            } else {
              _tmpCheckOutLatitude = _cursor.getDouble(_cursorIndexOfCheckOutLatitude);
            }
            final Double _tmpCheckOutLongitude;
            if (_cursor.isNull(_cursorIndexOfCheckOutLongitude)) {
              _tmpCheckOutLongitude = null;
            } else {
              _tmpCheckOutLongitude = _cursor.getDouble(_cursorIndexOfCheckOutLongitude);
            }
            final long _tmpTotalBreakDurationSeconds;
            _tmpTotalBreakDurationSeconds = _cursor.getLong(_cursorIndexOfTotalBreakDurationSeconds);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AttendanceRecordEntity(_tmpLocalId,_tmpRemoteId,_tmpDate,_tmpCheckInTime,_tmpCheckInLatitude,_tmpCheckInLongitude,_tmpCheckOutTime,_tmpCheckOutLatitude,_tmpCheckOutLongitude,_tmpTotalBreakDurationSeconds,_tmpIsSynced);
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
