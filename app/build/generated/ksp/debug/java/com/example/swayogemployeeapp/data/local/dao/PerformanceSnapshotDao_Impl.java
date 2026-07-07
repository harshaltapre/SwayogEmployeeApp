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
import com.example.swayogemployeeapp.data.local.entity.PerformanceSnapshotEntity;
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
public final class PerformanceSnapshotDao_Impl implements PerformanceSnapshotDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<PerformanceSnapshotEntity> __insertionAdapterOfPerformanceSnapshotEntity;

  private final EntityDeletionOrUpdateAdapter<PerformanceSnapshotEntity> __deletionAdapterOfPerformanceSnapshotEntity;

  private final EntityDeletionOrUpdateAdapter<PerformanceSnapshotEntity> __updateAdapterOfPerformanceSnapshotEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllPerformanceSnapshots;

  public PerformanceSnapshotDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPerformanceSnapshotEntity = new EntityInsertionAdapter<PerformanceSnapshotEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `performance_snapshots` (`id`,`employeeId`,`month`,`year`,`attendancePercent`,`taskCompletionRate`,`avgWorkScore`,`totalHoursLogged`,`performanceScore`,`daysPresent`,`daysAbsent`,`tasksAssigned`,`tasksCompleted`,`workSubmissions`,`calculatedAt`,`createdAt`,`updatedAt`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PerformanceSnapshotEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getEmployeeId());
        statement.bindLong(3, entity.getMonth());
        statement.bindLong(4, entity.getYear());
        statement.bindDouble(5, entity.getAttendancePercent());
        statement.bindDouble(6, entity.getTaskCompletionRate());
        statement.bindDouble(7, entity.getAvgWorkScore());
        statement.bindDouble(8, entity.getTotalHoursLogged());
        statement.bindDouble(9, entity.getPerformanceScore());
        statement.bindLong(10, entity.getDaysPresent());
        statement.bindLong(11, entity.getDaysAbsent());
        statement.bindLong(12, entity.getTasksAssigned());
        statement.bindLong(13, entity.getTasksCompleted());
        statement.bindLong(14, entity.getWorkSubmissions());
        statement.bindString(15, entity.getCalculatedAt());
        statement.bindString(16, entity.getCreatedAt());
        statement.bindString(17, entity.getUpdatedAt());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(18, _tmp);
      }
    };
    this.__deletionAdapterOfPerformanceSnapshotEntity = new EntityDeletionOrUpdateAdapter<PerformanceSnapshotEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `performance_snapshots` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PerformanceSnapshotEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfPerformanceSnapshotEntity = new EntityDeletionOrUpdateAdapter<PerformanceSnapshotEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `performance_snapshots` SET `id` = ?,`employeeId` = ?,`month` = ?,`year` = ?,`attendancePercent` = ?,`taskCompletionRate` = ?,`avgWorkScore` = ?,`totalHoursLogged` = ?,`performanceScore` = ?,`daysPresent` = ?,`daysAbsent` = ?,`tasksAssigned` = ?,`tasksCompleted` = ?,`workSubmissions` = ?,`calculatedAt` = ?,`createdAt` = ?,`updatedAt` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PerformanceSnapshotEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getEmployeeId());
        statement.bindLong(3, entity.getMonth());
        statement.bindLong(4, entity.getYear());
        statement.bindDouble(5, entity.getAttendancePercent());
        statement.bindDouble(6, entity.getTaskCompletionRate());
        statement.bindDouble(7, entity.getAvgWorkScore());
        statement.bindDouble(8, entity.getTotalHoursLogged());
        statement.bindDouble(9, entity.getPerformanceScore());
        statement.bindLong(10, entity.getDaysPresent());
        statement.bindLong(11, entity.getDaysAbsent());
        statement.bindLong(12, entity.getTasksAssigned());
        statement.bindLong(13, entity.getTasksCompleted());
        statement.bindLong(14, entity.getWorkSubmissions());
        statement.bindString(15, entity.getCalculatedAt());
        statement.bindString(16, entity.getCreatedAt());
        statement.bindString(17, entity.getUpdatedAt());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(18, _tmp);
        statement.bindString(19, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllPerformanceSnapshots = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM performance_snapshots";
        return _query;
      }
    };
  }

  @Override
  public Object insertPerformanceSnapshot(final PerformanceSnapshotEntity snapshot,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPerformanceSnapshotEntity.insert(snapshot);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertPerformanceSnapshots(final List<PerformanceSnapshotEntity> snapshots,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPerformanceSnapshotEntity.insert(snapshots);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deletePerformanceSnapshot(final PerformanceSnapshotEntity snapshot,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfPerformanceSnapshotEntity.handle(snapshot);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updatePerformanceSnapshot(final PerformanceSnapshotEntity snapshot,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfPerformanceSnapshotEntity.handle(snapshot);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllPerformanceSnapshots(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllPerformanceSnapshots.acquire();
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
          __preparedStmtOfDeleteAllPerformanceSnapshots.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<PerformanceSnapshotEntity>> getAllPerformanceSnapshots() {
    final String _sql = "SELECT * FROM performance_snapshots";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"performance_snapshots"}, new Callable<List<PerformanceSnapshotEntity>>() {
      @Override
      @NonNull
      public List<PerformanceSnapshotEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
          final int _cursorIndexOfMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "month");
          final int _cursorIndexOfYear = CursorUtil.getColumnIndexOrThrow(_cursor, "year");
          final int _cursorIndexOfAttendancePercent = CursorUtil.getColumnIndexOrThrow(_cursor, "attendancePercent");
          final int _cursorIndexOfTaskCompletionRate = CursorUtil.getColumnIndexOrThrow(_cursor, "taskCompletionRate");
          final int _cursorIndexOfAvgWorkScore = CursorUtil.getColumnIndexOrThrow(_cursor, "avgWorkScore");
          final int _cursorIndexOfTotalHoursLogged = CursorUtil.getColumnIndexOrThrow(_cursor, "totalHoursLogged");
          final int _cursorIndexOfPerformanceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "performanceScore");
          final int _cursorIndexOfDaysPresent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysPresent");
          final int _cursorIndexOfDaysAbsent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysAbsent");
          final int _cursorIndexOfTasksAssigned = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksAssigned");
          final int _cursorIndexOfTasksCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksCompleted");
          final int _cursorIndexOfWorkSubmissions = CursorUtil.getColumnIndexOrThrow(_cursor, "workSubmissions");
          final int _cursorIndexOfCalculatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "calculatedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PerformanceSnapshotEntity> _result = new ArrayList<PerformanceSnapshotEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PerformanceSnapshotEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEmployeeId;
            _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
            final int _tmpMonth;
            _tmpMonth = _cursor.getInt(_cursorIndexOfMonth);
            final int _tmpYear;
            _tmpYear = _cursor.getInt(_cursorIndexOfYear);
            final double _tmpAttendancePercent;
            _tmpAttendancePercent = _cursor.getDouble(_cursorIndexOfAttendancePercent);
            final double _tmpTaskCompletionRate;
            _tmpTaskCompletionRate = _cursor.getDouble(_cursorIndexOfTaskCompletionRate);
            final double _tmpAvgWorkScore;
            _tmpAvgWorkScore = _cursor.getDouble(_cursorIndexOfAvgWorkScore);
            final double _tmpTotalHoursLogged;
            _tmpTotalHoursLogged = _cursor.getDouble(_cursorIndexOfTotalHoursLogged);
            final double _tmpPerformanceScore;
            _tmpPerformanceScore = _cursor.getDouble(_cursorIndexOfPerformanceScore);
            final int _tmpDaysPresent;
            _tmpDaysPresent = _cursor.getInt(_cursorIndexOfDaysPresent);
            final int _tmpDaysAbsent;
            _tmpDaysAbsent = _cursor.getInt(_cursorIndexOfDaysAbsent);
            final int _tmpTasksAssigned;
            _tmpTasksAssigned = _cursor.getInt(_cursorIndexOfTasksAssigned);
            final int _tmpTasksCompleted;
            _tmpTasksCompleted = _cursor.getInt(_cursorIndexOfTasksCompleted);
            final int _tmpWorkSubmissions;
            _tmpWorkSubmissions = _cursor.getInt(_cursorIndexOfWorkSubmissions);
            final String _tmpCalculatedAt;
            _tmpCalculatedAt = _cursor.getString(_cursorIndexOfCalculatedAt);
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PerformanceSnapshotEntity(_tmpId,_tmpEmployeeId,_tmpMonth,_tmpYear,_tmpAttendancePercent,_tmpTaskCompletionRate,_tmpAvgWorkScore,_tmpTotalHoursLogged,_tmpPerformanceScore,_tmpDaysPresent,_tmpDaysAbsent,_tmpTasksAssigned,_tmpTasksCompleted,_tmpWorkSubmissions,_tmpCalculatedAt,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Object getPerformanceSnapshotById(final String id,
      final Continuation<? super PerformanceSnapshotEntity> $completion) {
    final String _sql = "SELECT * FROM performance_snapshots WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<PerformanceSnapshotEntity>() {
      @Override
      @Nullable
      public PerformanceSnapshotEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
          final int _cursorIndexOfMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "month");
          final int _cursorIndexOfYear = CursorUtil.getColumnIndexOrThrow(_cursor, "year");
          final int _cursorIndexOfAttendancePercent = CursorUtil.getColumnIndexOrThrow(_cursor, "attendancePercent");
          final int _cursorIndexOfTaskCompletionRate = CursorUtil.getColumnIndexOrThrow(_cursor, "taskCompletionRate");
          final int _cursorIndexOfAvgWorkScore = CursorUtil.getColumnIndexOrThrow(_cursor, "avgWorkScore");
          final int _cursorIndexOfTotalHoursLogged = CursorUtil.getColumnIndexOrThrow(_cursor, "totalHoursLogged");
          final int _cursorIndexOfPerformanceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "performanceScore");
          final int _cursorIndexOfDaysPresent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysPresent");
          final int _cursorIndexOfDaysAbsent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysAbsent");
          final int _cursorIndexOfTasksAssigned = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksAssigned");
          final int _cursorIndexOfTasksCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksCompleted");
          final int _cursorIndexOfWorkSubmissions = CursorUtil.getColumnIndexOrThrow(_cursor, "workSubmissions");
          final int _cursorIndexOfCalculatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "calculatedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final PerformanceSnapshotEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEmployeeId;
            _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
            final int _tmpMonth;
            _tmpMonth = _cursor.getInt(_cursorIndexOfMonth);
            final int _tmpYear;
            _tmpYear = _cursor.getInt(_cursorIndexOfYear);
            final double _tmpAttendancePercent;
            _tmpAttendancePercent = _cursor.getDouble(_cursorIndexOfAttendancePercent);
            final double _tmpTaskCompletionRate;
            _tmpTaskCompletionRate = _cursor.getDouble(_cursorIndexOfTaskCompletionRate);
            final double _tmpAvgWorkScore;
            _tmpAvgWorkScore = _cursor.getDouble(_cursorIndexOfAvgWorkScore);
            final double _tmpTotalHoursLogged;
            _tmpTotalHoursLogged = _cursor.getDouble(_cursorIndexOfTotalHoursLogged);
            final double _tmpPerformanceScore;
            _tmpPerformanceScore = _cursor.getDouble(_cursorIndexOfPerformanceScore);
            final int _tmpDaysPresent;
            _tmpDaysPresent = _cursor.getInt(_cursorIndexOfDaysPresent);
            final int _tmpDaysAbsent;
            _tmpDaysAbsent = _cursor.getInt(_cursorIndexOfDaysAbsent);
            final int _tmpTasksAssigned;
            _tmpTasksAssigned = _cursor.getInt(_cursorIndexOfTasksAssigned);
            final int _tmpTasksCompleted;
            _tmpTasksCompleted = _cursor.getInt(_cursorIndexOfTasksCompleted);
            final int _tmpWorkSubmissions;
            _tmpWorkSubmissions = _cursor.getInt(_cursorIndexOfWorkSubmissions);
            final String _tmpCalculatedAt;
            _tmpCalculatedAt = _cursor.getString(_cursorIndexOfCalculatedAt);
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new PerformanceSnapshotEntity(_tmpId,_tmpEmployeeId,_tmpMonth,_tmpYear,_tmpAttendancePercent,_tmpTaskCompletionRate,_tmpAvgWorkScore,_tmpTotalHoursLogged,_tmpPerformanceScore,_tmpDaysPresent,_tmpDaysAbsent,_tmpTasksAssigned,_tmpTasksCompleted,_tmpWorkSubmissions,_tmpCalculatedAt,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Flow<List<PerformanceSnapshotEntity>> getPerformanceSnapshotsByEmployee(
      final String employeeId) {
    final String _sql = "SELECT * FROM performance_snapshots WHERE employeeId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, employeeId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"performance_snapshots"}, new Callable<List<PerformanceSnapshotEntity>>() {
      @Override
      @NonNull
      public List<PerformanceSnapshotEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
          final int _cursorIndexOfMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "month");
          final int _cursorIndexOfYear = CursorUtil.getColumnIndexOrThrow(_cursor, "year");
          final int _cursorIndexOfAttendancePercent = CursorUtil.getColumnIndexOrThrow(_cursor, "attendancePercent");
          final int _cursorIndexOfTaskCompletionRate = CursorUtil.getColumnIndexOrThrow(_cursor, "taskCompletionRate");
          final int _cursorIndexOfAvgWorkScore = CursorUtil.getColumnIndexOrThrow(_cursor, "avgWorkScore");
          final int _cursorIndexOfTotalHoursLogged = CursorUtil.getColumnIndexOrThrow(_cursor, "totalHoursLogged");
          final int _cursorIndexOfPerformanceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "performanceScore");
          final int _cursorIndexOfDaysPresent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysPresent");
          final int _cursorIndexOfDaysAbsent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysAbsent");
          final int _cursorIndexOfTasksAssigned = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksAssigned");
          final int _cursorIndexOfTasksCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksCompleted");
          final int _cursorIndexOfWorkSubmissions = CursorUtil.getColumnIndexOrThrow(_cursor, "workSubmissions");
          final int _cursorIndexOfCalculatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "calculatedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PerformanceSnapshotEntity> _result = new ArrayList<PerformanceSnapshotEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PerformanceSnapshotEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEmployeeId;
            _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
            final int _tmpMonth;
            _tmpMonth = _cursor.getInt(_cursorIndexOfMonth);
            final int _tmpYear;
            _tmpYear = _cursor.getInt(_cursorIndexOfYear);
            final double _tmpAttendancePercent;
            _tmpAttendancePercent = _cursor.getDouble(_cursorIndexOfAttendancePercent);
            final double _tmpTaskCompletionRate;
            _tmpTaskCompletionRate = _cursor.getDouble(_cursorIndexOfTaskCompletionRate);
            final double _tmpAvgWorkScore;
            _tmpAvgWorkScore = _cursor.getDouble(_cursorIndexOfAvgWorkScore);
            final double _tmpTotalHoursLogged;
            _tmpTotalHoursLogged = _cursor.getDouble(_cursorIndexOfTotalHoursLogged);
            final double _tmpPerformanceScore;
            _tmpPerformanceScore = _cursor.getDouble(_cursorIndexOfPerformanceScore);
            final int _tmpDaysPresent;
            _tmpDaysPresent = _cursor.getInt(_cursorIndexOfDaysPresent);
            final int _tmpDaysAbsent;
            _tmpDaysAbsent = _cursor.getInt(_cursorIndexOfDaysAbsent);
            final int _tmpTasksAssigned;
            _tmpTasksAssigned = _cursor.getInt(_cursorIndexOfTasksAssigned);
            final int _tmpTasksCompleted;
            _tmpTasksCompleted = _cursor.getInt(_cursorIndexOfTasksCompleted);
            final int _tmpWorkSubmissions;
            _tmpWorkSubmissions = _cursor.getInt(_cursorIndexOfWorkSubmissions);
            final String _tmpCalculatedAt;
            _tmpCalculatedAt = _cursor.getString(_cursorIndexOfCalculatedAt);
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PerformanceSnapshotEntity(_tmpId,_tmpEmployeeId,_tmpMonth,_tmpYear,_tmpAttendancePercent,_tmpTaskCompletionRate,_tmpAvgWorkScore,_tmpTotalHoursLogged,_tmpPerformanceScore,_tmpDaysPresent,_tmpDaysAbsent,_tmpTasksAssigned,_tmpTasksCompleted,_tmpWorkSubmissions,_tmpCalculatedAt,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Object getPerformanceSnapshotByMonthYear(final String employeeId, final int month,
      final int year, final Continuation<? super PerformanceSnapshotEntity> $completion) {
    final String _sql = "SELECT * FROM performance_snapshots WHERE employeeId = ? AND month = ? AND year = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 3);
    int _argIndex = 1;
    _statement.bindString(_argIndex, employeeId);
    _argIndex = 2;
    _statement.bindLong(_argIndex, month);
    _argIndex = 3;
    _statement.bindLong(_argIndex, year);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<PerformanceSnapshotEntity>() {
      @Override
      @Nullable
      public PerformanceSnapshotEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
          final int _cursorIndexOfMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "month");
          final int _cursorIndexOfYear = CursorUtil.getColumnIndexOrThrow(_cursor, "year");
          final int _cursorIndexOfAttendancePercent = CursorUtil.getColumnIndexOrThrow(_cursor, "attendancePercent");
          final int _cursorIndexOfTaskCompletionRate = CursorUtil.getColumnIndexOrThrow(_cursor, "taskCompletionRate");
          final int _cursorIndexOfAvgWorkScore = CursorUtil.getColumnIndexOrThrow(_cursor, "avgWorkScore");
          final int _cursorIndexOfTotalHoursLogged = CursorUtil.getColumnIndexOrThrow(_cursor, "totalHoursLogged");
          final int _cursorIndexOfPerformanceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "performanceScore");
          final int _cursorIndexOfDaysPresent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysPresent");
          final int _cursorIndexOfDaysAbsent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysAbsent");
          final int _cursorIndexOfTasksAssigned = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksAssigned");
          final int _cursorIndexOfTasksCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksCompleted");
          final int _cursorIndexOfWorkSubmissions = CursorUtil.getColumnIndexOrThrow(_cursor, "workSubmissions");
          final int _cursorIndexOfCalculatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "calculatedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final PerformanceSnapshotEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEmployeeId;
            _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
            final int _tmpMonth;
            _tmpMonth = _cursor.getInt(_cursorIndexOfMonth);
            final int _tmpYear;
            _tmpYear = _cursor.getInt(_cursorIndexOfYear);
            final double _tmpAttendancePercent;
            _tmpAttendancePercent = _cursor.getDouble(_cursorIndexOfAttendancePercent);
            final double _tmpTaskCompletionRate;
            _tmpTaskCompletionRate = _cursor.getDouble(_cursorIndexOfTaskCompletionRate);
            final double _tmpAvgWorkScore;
            _tmpAvgWorkScore = _cursor.getDouble(_cursorIndexOfAvgWorkScore);
            final double _tmpTotalHoursLogged;
            _tmpTotalHoursLogged = _cursor.getDouble(_cursorIndexOfTotalHoursLogged);
            final double _tmpPerformanceScore;
            _tmpPerformanceScore = _cursor.getDouble(_cursorIndexOfPerformanceScore);
            final int _tmpDaysPresent;
            _tmpDaysPresent = _cursor.getInt(_cursorIndexOfDaysPresent);
            final int _tmpDaysAbsent;
            _tmpDaysAbsent = _cursor.getInt(_cursorIndexOfDaysAbsent);
            final int _tmpTasksAssigned;
            _tmpTasksAssigned = _cursor.getInt(_cursorIndexOfTasksAssigned);
            final int _tmpTasksCompleted;
            _tmpTasksCompleted = _cursor.getInt(_cursorIndexOfTasksCompleted);
            final int _tmpWorkSubmissions;
            _tmpWorkSubmissions = _cursor.getInt(_cursorIndexOfWorkSubmissions);
            final String _tmpCalculatedAt;
            _tmpCalculatedAt = _cursor.getString(_cursorIndexOfCalculatedAt);
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new PerformanceSnapshotEntity(_tmpId,_tmpEmployeeId,_tmpMonth,_tmpYear,_tmpAttendancePercent,_tmpTaskCompletionRate,_tmpAvgWorkScore,_tmpTotalHoursLogged,_tmpPerformanceScore,_tmpDaysPresent,_tmpDaysAbsent,_tmpTasksAssigned,_tmpTasksCompleted,_tmpWorkSubmissions,_tmpCalculatedAt,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Object getUnsyncedPerformanceSnapshots(
      final Continuation<? super List<PerformanceSnapshotEntity>> $completion) {
    final String _sql = "SELECT * FROM performance_snapshots WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PerformanceSnapshotEntity>>() {
      @Override
      @NonNull
      public List<PerformanceSnapshotEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
          final int _cursorIndexOfMonth = CursorUtil.getColumnIndexOrThrow(_cursor, "month");
          final int _cursorIndexOfYear = CursorUtil.getColumnIndexOrThrow(_cursor, "year");
          final int _cursorIndexOfAttendancePercent = CursorUtil.getColumnIndexOrThrow(_cursor, "attendancePercent");
          final int _cursorIndexOfTaskCompletionRate = CursorUtil.getColumnIndexOrThrow(_cursor, "taskCompletionRate");
          final int _cursorIndexOfAvgWorkScore = CursorUtil.getColumnIndexOrThrow(_cursor, "avgWorkScore");
          final int _cursorIndexOfTotalHoursLogged = CursorUtil.getColumnIndexOrThrow(_cursor, "totalHoursLogged");
          final int _cursorIndexOfPerformanceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "performanceScore");
          final int _cursorIndexOfDaysPresent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysPresent");
          final int _cursorIndexOfDaysAbsent = CursorUtil.getColumnIndexOrThrow(_cursor, "daysAbsent");
          final int _cursorIndexOfTasksAssigned = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksAssigned");
          final int _cursorIndexOfTasksCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "tasksCompleted");
          final int _cursorIndexOfWorkSubmissions = CursorUtil.getColumnIndexOrThrow(_cursor, "workSubmissions");
          final int _cursorIndexOfCalculatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "calculatedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PerformanceSnapshotEntity> _result = new ArrayList<PerformanceSnapshotEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PerformanceSnapshotEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpEmployeeId;
            _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
            final int _tmpMonth;
            _tmpMonth = _cursor.getInt(_cursorIndexOfMonth);
            final int _tmpYear;
            _tmpYear = _cursor.getInt(_cursorIndexOfYear);
            final double _tmpAttendancePercent;
            _tmpAttendancePercent = _cursor.getDouble(_cursorIndexOfAttendancePercent);
            final double _tmpTaskCompletionRate;
            _tmpTaskCompletionRate = _cursor.getDouble(_cursorIndexOfTaskCompletionRate);
            final double _tmpAvgWorkScore;
            _tmpAvgWorkScore = _cursor.getDouble(_cursorIndexOfAvgWorkScore);
            final double _tmpTotalHoursLogged;
            _tmpTotalHoursLogged = _cursor.getDouble(_cursorIndexOfTotalHoursLogged);
            final double _tmpPerformanceScore;
            _tmpPerformanceScore = _cursor.getDouble(_cursorIndexOfPerformanceScore);
            final int _tmpDaysPresent;
            _tmpDaysPresent = _cursor.getInt(_cursorIndexOfDaysPresent);
            final int _tmpDaysAbsent;
            _tmpDaysAbsent = _cursor.getInt(_cursorIndexOfDaysAbsent);
            final int _tmpTasksAssigned;
            _tmpTasksAssigned = _cursor.getInt(_cursorIndexOfTasksAssigned);
            final int _tmpTasksCompleted;
            _tmpTasksCompleted = _cursor.getInt(_cursorIndexOfTasksCompleted);
            final int _tmpWorkSubmissions;
            _tmpWorkSubmissions = _cursor.getInt(_cursorIndexOfWorkSubmissions);
            final String _tmpCalculatedAt;
            _tmpCalculatedAt = _cursor.getString(_cursorIndexOfCalculatedAt);
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PerformanceSnapshotEntity(_tmpId,_tmpEmployeeId,_tmpMonth,_tmpYear,_tmpAttendancePercent,_tmpTaskCompletionRate,_tmpAvgWorkScore,_tmpTotalHoursLogged,_tmpPerformanceScore,_tmpDaysPresent,_tmpDaysAbsent,_tmpTasksAssigned,_tmpTasksCompleted,_tmpWorkSubmissions,_tmpCalculatedAt,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
