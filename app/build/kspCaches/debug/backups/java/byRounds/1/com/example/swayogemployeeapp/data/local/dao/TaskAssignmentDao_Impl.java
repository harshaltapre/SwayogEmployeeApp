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
import com.example.swayogemployeeapp.data.local.entity.TaskAssignmentEntity;
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
public final class TaskAssignmentDao_Impl implements TaskAssignmentDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<TaskAssignmentEntity> __insertionAdapterOfTaskAssignmentEntity;

  private final EntityDeletionOrUpdateAdapter<TaskAssignmentEntity> __deletionAdapterOfTaskAssignmentEntity;

  private final EntityDeletionOrUpdateAdapter<TaskAssignmentEntity> __updateAdapterOfTaskAssignmentEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllTaskAssignments;

  public TaskAssignmentDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfTaskAssignmentEntity = new EntityInsertionAdapter<TaskAssignmentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `task_assignments` (`id`,`taskId`,`employeeUserId`,`assignedAt`,`status`,`isSynced`) VALUES (?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TaskAssignmentEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindString(3, entity.getEmployeeUserId());
        statement.bindString(4, entity.getAssignedAt());
        statement.bindString(5, entity.getStatus());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(6, _tmp);
      }
    };
    this.__deletionAdapterOfTaskAssignmentEntity = new EntityDeletionOrUpdateAdapter<TaskAssignmentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `task_assignments` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TaskAssignmentEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfTaskAssignmentEntity = new EntityDeletionOrUpdateAdapter<TaskAssignmentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `task_assignments` SET `id` = ?,`taskId` = ?,`employeeUserId` = ?,`assignedAt` = ?,`status` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TaskAssignmentEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindString(3, entity.getEmployeeUserId());
        statement.bindString(4, entity.getAssignedAt());
        statement.bindString(5, entity.getStatus());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(6, _tmp);
        statement.bindString(7, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllTaskAssignments = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM task_assignments";
        return _query;
      }
    };
  }

  @Override
  public Object insertTaskAssignment(final TaskAssignmentEntity assignment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfTaskAssignmentEntity.insert(assignment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertTaskAssignments(final List<TaskAssignmentEntity> assignments,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfTaskAssignmentEntity.insert(assignments);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteTaskAssignment(final TaskAssignmentEntity assignment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfTaskAssignmentEntity.handle(assignment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateTaskAssignment(final TaskAssignmentEntity assignment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfTaskAssignmentEntity.handle(assignment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllTaskAssignments(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllTaskAssignments.acquire();
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
          __preparedStmtOfDeleteAllTaskAssignments.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<TaskAssignmentEntity>> getAllTaskAssignments() {
    final String _sql = "SELECT * FROM task_assignments";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_assignments"}, new Callable<List<TaskAssignmentEntity>>() {
      @Override
      @NonNull
      public List<TaskAssignmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfAssignedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedAt");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskAssignmentEntity> _result = new ArrayList<TaskAssignmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskAssignmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpAssignedAt;
            _tmpAssignedAt = _cursor.getString(_cursorIndexOfAssignedAt);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskAssignmentEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpAssignedAt,_tmpStatus,_tmpIsSynced);
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
  public Object getTaskAssignmentById(final String id,
      final Continuation<? super TaskAssignmentEntity> $completion) {
    final String _sql = "SELECT * FROM task_assignments WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<TaskAssignmentEntity>() {
      @Override
      @Nullable
      public TaskAssignmentEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfAssignedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedAt");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final TaskAssignmentEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpAssignedAt;
            _tmpAssignedAt = _cursor.getString(_cursorIndexOfAssignedAt);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new TaskAssignmentEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpAssignedAt,_tmpStatus,_tmpIsSynced);
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
  public Flow<List<TaskAssignmentEntity>> getTaskAssignmentsByTask(final int taskId) {
    final String _sql = "SELECT * FROM task_assignments WHERE taskId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, taskId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_assignments"}, new Callable<List<TaskAssignmentEntity>>() {
      @Override
      @NonNull
      public List<TaskAssignmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfAssignedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedAt");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskAssignmentEntity> _result = new ArrayList<TaskAssignmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskAssignmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpAssignedAt;
            _tmpAssignedAt = _cursor.getString(_cursorIndexOfAssignedAt);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskAssignmentEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpAssignedAt,_tmpStatus,_tmpIsSynced);
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
  public Flow<List<TaskAssignmentEntity>> getTaskAssignmentsByEmployee(final String employeeId) {
    final String _sql = "SELECT * FROM task_assignments WHERE employeeUserId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, employeeId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_assignments"}, new Callable<List<TaskAssignmentEntity>>() {
      @Override
      @NonNull
      public List<TaskAssignmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfAssignedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedAt");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskAssignmentEntity> _result = new ArrayList<TaskAssignmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskAssignmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpAssignedAt;
            _tmpAssignedAt = _cursor.getString(_cursorIndexOfAssignedAt);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskAssignmentEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpAssignedAt,_tmpStatus,_tmpIsSynced);
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
  public Flow<List<TaskAssignmentEntity>> getTaskAssignmentsByStatus(final String status) {
    final String _sql = "SELECT * FROM task_assignments WHERE status = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_assignments"}, new Callable<List<TaskAssignmentEntity>>() {
      @Override
      @NonNull
      public List<TaskAssignmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfAssignedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedAt");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskAssignmentEntity> _result = new ArrayList<TaskAssignmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskAssignmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpAssignedAt;
            _tmpAssignedAt = _cursor.getString(_cursorIndexOfAssignedAt);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskAssignmentEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpAssignedAt,_tmpStatus,_tmpIsSynced);
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
  public Object getUnsyncedTaskAssignments(
      final Continuation<? super List<TaskAssignmentEntity>> $completion) {
    final String _sql = "SELECT * FROM task_assignments WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<TaskAssignmentEntity>>() {
      @Override
      @NonNull
      public List<TaskAssignmentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfAssignedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedAt");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskAssignmentEntity> _result = new ArrayList<TaskAssignmentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskAssignmentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpAssignedAt;
            _tmpAssignedAt = _cursor.getString(_cursorIndexOfAssignedAt);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskAssignmentEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpAssignedAt,_tmpStatus,_tmpIsSynced);
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
