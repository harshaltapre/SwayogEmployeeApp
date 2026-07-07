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
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity;
import java.lang.Class;
import java.lang.Double;
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
public final class EmployeeTaskDao_Impl implements EmployeeTaskDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<EmployeeTaskEntity> __insertionAdapterOfEmployeeTaskEntity;

  private final EntityDeletionOrUpdateAdapter<EmployeeTaskEntity> __updateAdapterOfEmployeeTaskEntity;

  private final SharedSQLiteStatement __preparedStmtOfClearTasks;

  public EmployeeTaskDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfEmployeeTaskEntity = new EntityInsertionAdapter<EmployeeTaskEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `employee_tasks` (`id`,`jobType`,`description`,`scheduledTime`,`status`,`customerName`,`customerPhone`,`address`,`latitude`,`longitude`,`completionMessage`,`completionDocumentUrl`,`completedAt`,`employeeUserId`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final EmployeeTaskEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getJobType());
        statement.bindString(3, entity.getDescription());
        statement.bindString(4, entity.getScheduledTime());
        statement.bindString(5, entity.getStatus());
        statement.bindString(6, entity.getCustomerName());
        statement.bindString(7, entity.getCustomerPhone());
        statement.bindString(8, entity.getAddress());
        if (entity.getLatitude() == null) {
          statement.bindNull(9);
        } else {
          statement.bindDouble(9, entity.getLatitude());
        }
        if (entity.getLongitude() == null) {
          statement.bindNull(10);
        } else {
          statement.bindDouble(10, entity.getLongitude());
        }
        if (entity.getCompletionMessage() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getCompletionMessage());
        }
        if (entity.getCompletionDocumentUrl() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getCompletionDocumentUrl());
        }
        if (entity.getCompletedAt() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getCompletedAt());
        }
        if (entity.getEmployeeUserId() == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.getEmployeeUserId());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
      }
    };
    this.__updateAdapterOfEmployeeTaskEntity = new EntityDeletionOrUpdateAdapter<EmployeeTaskEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `employee_tasks` SET `id` = ?,`jobType` = ?,`description` = ?,`scheduledTime` = ?,`status` = ?,`customerName` = ?,`customerPhone` = ?,`address` = ?,`latitude` = ?,`longitude` = ?,`completionMessage` = ?,`completionDocumentUrl` = ?,`completedAt` = ?,`employeeUserId` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final EmployeeTaskEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getJobType());
        statement.bindString(3, entity.getDescription());
        statement.bindString(4, entity.getScheduledTime());
        statement.bindString(5, entity.getStatus());
        statement.bindString(6, entity.getCustomerName());
        statement.bindString(7, entity.getCustomerPhone());
        statement.bindString(8, entity.getAddress());
        if (entity.getLatitude() == null) {
          statement.bindNull(9);
        } else {
          statement.bindDouble(9, entity.getLatitude());
        }
        if (entity.getLongitude() == null) {
          statement.bindNull(10);
        } else {
          statement.bindDouble(10, entity.getLongitude());
        }
        if (entity.getCompletionMessage() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getCompletionMessage());
        }
        if (entity.getCompletionDocumentUrl() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getCompletionDocumentUrl());
        }
        if (entity.getCompletedAt() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getCompletedAt());
        }
        if (entity.getEmployeeUserId() == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.getEmployeeUserId());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
        statement.bindLong(16, entity.getId());
      }
    };
    this.__preparedStmtOfClearTasks = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM employee_tasks";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<EmployeeTaskEntity> tasks,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfEmployeeTaskEntity.insert(tasks);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insert(final EmployeeTaskEntity task,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfEmployeeTaskEntity.insert(task);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final EmployeeTaskEntity task,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfEmployeeTaskEntity.handle(task);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object clearTasks(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfClearTasks.acquire();
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
          __preparedStmtOfClearTasks.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<EmployeeTaskEntity>> getAllTasksFlow() {
    final String _sql = "SELECT * FROM employee_tasks ORDER BY id DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"employee_tasks"}, new Callable<List<EmployeeTaskEntity>>() {
      @Override
      @NonNull
      public List<EmployeeTaskEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfJobType = CursorUtil.getColumnIndexOrThrow(_cursor, "jobType");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfScheduledTime = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledTime");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCustomerName = CursorUtil.getColumnIndexOrThrow(_cursor, "customerName");
          final int _cursorIndexOfCustomerPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "customerPhone");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCompletionMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "completionMessage");
          final int _cursorIndexOfCompletionDocumentUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "completionDocumentUrl");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<EmployeeTaskEntity> _result = new ArrayList<EmployeeTaskEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final EmployeeTaskEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpJobType;
            _tmpJobType = _cursor.getString(_cursorIndexOfJobType);
            final String _tmpDescription;
            _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            final String _tmpScheduledTime;
            _tmpScheduledTime = _cursor.getString(_cursorIndexOfScheduledTime);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCustomerName;
            _tmpCustomerName = _cursor.getString(_cursorIndexOfCustomerName);
            final String _tmpCustomerPhone;
            _tmpCustomerPhone = _cursor.getString(_cursorIndexOfCustomerPhone);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
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
            final String _tmpCompletionMessage;
            if (_cursor.isNull(_cursorIndexOfCompletionMessage)) {
              _tmpCompletionMessage = null;
            } else {
              _tmpCompletionMessage = _cursor.getString(_cursorIndexOfCompletionMessage);
            }
            final String _tmpCompletionDocumentUrl;
            if (_cursor.isNull(_cursorIndexOfCompletionDocumentUrl)) {
              _tmpCompletionDocumentUrl = null;
            } else {
              _tmpCompletionDocumentUrl = _cursor.getString(_cursorIndexOfCompletionDocumentUrl);
            }
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpEmployeeUserId;
            if (_cursor.isNull(_cursorIndexOfEmployeeUserId)) {
              _tmpEmployeeUserId = null;
            } else {
              _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new EmployeeTaskEntity(_tmpId,_tmpJobType,_tmpDescription,_tmpScheduledTime,_tmpStatus,_tmpCustomerName,_tmpCustomerPhone,_tmpAddress,_tmpLatitude,_tmpLongitude,_tmpCompletionMessage,_tmpCompletionDocumentUrl,_tmpCompletedAt,_tmpEmployeeUserId,_tmpIsSynced);
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
  public Object getAllTasksList(final Continuation<? super List<EmployeeTaskEntity>> $completion) {
    final String _sql = "SELECT * FROM employee_tasks ORDER BY id DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<EmployeeTaskEntity>>() {
      @Override
      @NonNull
      public List<EmployeeTaskEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfJobType = CursorUtil.getColumnIndexOrThrow(_cursor, "jobType");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfScheduledTime = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledTime");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCustomerName = CursorUtil.getColumnIndexOrThrow(_cursor, "customerName");
          final int _cursorIndexOfCustomerPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "customerPhone");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCompletionMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "completionMessage");
          final int _cursorIndexOfCompletionDocumentUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "completionDocumentUrl");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<EmployeeTaskEntity> _result = new ArrayList<EmployeeTaskEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final EmployeeTaskEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpJobType;
            _tmpJobType = _cursor.getString(_cursorIndexOfJobType);
            final String _tmpDescription;
            _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            final String _tmpScheduledTime;
            _tmpScheduledTime = _cursor.getString(_cursorIndexOfScheduledTime);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCustomerName;
            _tmpCustomerName = _cursor.getString(_cursorIndexOfCustomerName);
            final String _tmpCustomerPhone;
            _tmpCustomerPhone = _cursor.getString(_cursorIndexOfCustomerPhone);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
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
            final String _tmpCompletionMessage;
            if (_cursor.isNull(_cursorIndexOfCompletionMessage)) {
              _tmpCompletionMessage = null;
            } else {
              _tmpCompletionMessage = _cursor.getString(_cursorIndexOfCompletionMessage);
            }
            final String _tmpCompletionDocumentUrl;
            if (_cursor.isNull(_cursorIndexOfCompletionDocumentUrl)) {
              _tmpCompletionDocumentUrl = null;
            } else {
              _tmpCompletionDocumentUrl = _cursor.getString(_cursorIndexOfCompletionDocumentUrl);
            }
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpEmployeeUserId;
            if (_cursor.isNull(_cursorIndexOfEmployeeUserId)) {
              _tmpEmployeeUserId = null;
            } else {
              _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new EmployeeTaskEntity(_tmpId,_tmpJobType,_tmpDescription,_tmpScheduledTime,_tmpStatus,_tmpCustomerName,_tmpCustomerPhone,_tmpAddress,_tmpLatitude,_tmpLongitude,_tmpCompletionMessage,_tmpCompletionDocumentUrl,_tmpCompletedAt,_tmpEmployeeUserId,_tmpIsSynced);
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
  public Flow<EmployeeTaskEntity> getTaskByIdFlow(final int taskId) {
    final String _sql = "SELECT * FROM employee_tasks WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, taskId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"employee_tasks"}, new Callable<EmployeeTaskEntity>() {
      @Override
      @Nullable
      public EmployeeTaskEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfJobType = CursorUtil.getColumnIndexOrThrow(_cursor, "jobType");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfScheduledTime = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledTime");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCustomerName = CursorUtil.getColumnIndexOrThrow(_cursor, "customerName");
          final int _cursorIndexOfCustomerPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "customerPhone");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCompletionMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "completionMessage");
          final int _cursorIndexOfCompletionDocumentUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "completionDocumentUrl");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final EmployeeTaskEntity _result;
          if (_cursor.moveToFirst()) {
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpJobType;
            _tmpJobType = _cursor.getString(_cursorIndexOfJobType);
            final String _tmpDescription;
            _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            final String _tmpScheduledTime;
            _tmpScheduledTime = _cursor.getString(_cursorIndexOfScheduledTime);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCustomerName;
            _tmpCustomerName = _cursor.getString(_cursorIndexOfCustomerName);
            final String _tmpCustomerPhone;
            _tmpCustomerPhone = _cursor.getString(_cursorIndexOfCustomerPhone);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
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
            final String _tmpCompletionMessage;
            if (_cursor.isNull(_cursorIndexOfCompletionMessage)) {
              _tmpCompletionMessage = null;
            } else {
              _tmpCompletionMessage = _cursor.getString(_cursorIndexOfCompletionMessage);
            }
            final String _tmpCompletionDocumentUrl;
            if (_cursor.isNull(_cursorIndexOfCompletionDocumentUrl)) {
              _tmpCompletionDocumentUrl = null;
            } else {
              _tmpCompletionDocumentUrl = _cursor.getString(_cursorIndexOfCompletionDocumentUrl);
            }
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpEmployeeUserId;
            if (_cursor.isNull(_cursorIndexOfEmployeeUserId)) {
              _tmpEmployeeUserId = null;
            } else {
              _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new EmployeeTaskEntity(_tmpId,_tmpJobType,_tmpDescription,_tmpScheduledTime,_tmpStatus,_tmpCustomerName,_tmpCustomerPhone,_tmpAddress,_tmpLatitude,_tmpLongitude,_tmpCompletionMessage,_tmpCompletionDocumentUrl,_tmpCompletedAt,_tmpEmployeeUserId,_tmpIsSynced);
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
  public Object getTaskById(final int taskId,
      final Continuation<? super EmployeeTaskEntity> $completion) {
    final String _sql = "SELECT * FROM employee_tasks WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, taskId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<EmployeeTaskEntity>() {
      @Override
      @Nullable
      public EmployeeTaskEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfJobType = CursorUtil.getColumnIndexOrThrow(_cursor, "jobType");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfScheduledTime = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledTime");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCustomerName = CursorUtil.getColumnIndexOrThrow(_cursor, "customerName");
          final int _cursorIndexOfCustomerPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "customerPhone");
          final int _cursorIndexOfAddress = CursorUtil.getColumnIndexOrThrow(_cursor, "address");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfCompletionMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "completionMessage");
          final int _cursorIndexOfCompletionDocumentUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "completionDocumentUrl");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final EmployeeTaskEntity _result;
          if (_cursor.moveToFirst()) {
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final String _tmpJobType;
            _tmpJobType = _cursor.getString(_cursorIndexOfJobType);
            final String _tmpDescription;
            _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            final String _tmpScheduledTime;
            _tmpScheduledTime = _cursor.getString(_cursorIndexOfScheduledTime);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCustomerName;
            _tmpCustomerName = _cursor.getString(_cursorIndexOfCustomerName);
            final String _tmpCustomerPhone;
            _tmpCustomerPhone = _cursor.getString(_cursorIndexOfCustomerPhone);
            final String _tmpAddress;
            _tmpAddress = _cursor.getString(_cursorIndexOfAddress);
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
            final String _tmpCompletionMessage;
            if (_cursor.isNull(_cursorIndexOfCompletionMessage)) {
              _tmpCompletionMessage = null;
            } else {
              _tmpCompletionMessage = _cursor.getString(_cursorIndexOfCompletionMessage);
            }
            final String _tmpCompletionDocumentUrl;
            if (_cursor.isNull(_cursorIndexOfCompletionDocumentUrl)) {
              _tmpCompletionDocumentUrl = null;
            } else {
              _tmpCompletionDocumentUrl = _cursor.getString(_cursorIndexOfCompletionDocumentUrl);
            }
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpEmployeeUserId;
            if (_cursor.isNull(_cursorIndexOfEmployeeUserId)) {
              _tmpEmployeeUserId = null;
            } else {
              _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new EmployeeTaskEntity(_tmpId,_tmpJobType,_tmpDescription,_tmpScheduledTime,_tmpStatus,_tmpCustomerName,_tmpCustomerPhone,_tmpAddress,_tmpLatitude,_tmpLongitude,_tmpCompletionMessage,_tmpCompletionDocumentUrl,_tmpCompletedAt,_tmpEmployeeUserId,_tmpIsSynced);
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

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
