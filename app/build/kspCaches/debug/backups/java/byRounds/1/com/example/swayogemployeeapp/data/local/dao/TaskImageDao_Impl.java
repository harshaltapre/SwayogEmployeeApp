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
import com.example.swayogemployeeapp.data.local.entity.TaskImageEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Float;
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
public final class TaskImageDao_Impl implements TaskImageDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<TaskImageEntity> __insertionAdapterOfTaskImageEntity;

  private final EntityDeletionOrUpdateAdapter<TaskImageEntity> __deletionAdapterOfTaskImageEntity;

  private final EntityDeletionOrUpdateAdapter<TaskImageEntity> __updateAdapterOfTaskImageEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllTaskImages;

  public TaskImageDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfTaskImageEntity = new EntityInsertionAdapter<TaskImageEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `task_images` (`id`,`taskId`,`employeeUserId`,`type`,`url`,`latitude`,`longitude`,`watermarkText`,`uploadedAt`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TaskImageEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindString(3, entity.getEmployeeUserId());
        statement.bindString(4, entity.getType());
        statement.bindString(5, entity.getUrl());
        if (entity.getLatitude() == null) {
          statement.bindNull(6);
        } else {
          statement.bindDouble(6, entity.getLatitude());
        }
        if (entity.getLongitude() == null) {
          statement.bindNull(7);
        } else {
          statement.bindDouble(7, entity.getLongitude());
        }
        if (entity.getWatermarkText() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getWatermarkText());
        }
        statement.bindString(9, entity.getUploadedAt());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(10, _tmp);
      }
    };
    this.__deletionAdapterOfTaskImageEntity = new EntityDeletionOrUpdateAdapter<TaskImageEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `task_images` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TaskImageEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfTaskImageEntity = new EntityDeletionOrUpdateAdapter<TaskImageEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `task_images` SET `id` = ?,`taskId` = ?,`employeeUserId` = ?,`type` = ?,`url` = ?,`latitude` = ?,`longitude` = ?,`watermarkText` = ?,`uploadedAt` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TaskImageEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindString(3, entity.getEmployeeUserId());
        statement.bindString(4, entity.getType());
        statement.bindString(5, entity.getUrl());
        if (entity.getLatitude() == null) {
          statement.bindNull(6);
        } else {
          statement.bindDouble(6, entity.getLatitude());
        }
        if (entity.getLongitude() == null) {
          statement.bindNull(7);
        } else {
          statement.bindDouble(7, entity.getLongitude());
        }
        if (entity.getWatermarkText() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getWatermarkText());
        }
        statement.bindString(9, entity.getUploadedAt());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(10, _tmp);
        statement.bindString(11, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllTaskImages = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM task_images";
        return _query;
      }
    };
  }

  @Override
  public Object insertTaskImage(final TaskImageEntity image,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfTaskImageEntity.insert(image);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertTaskImages(final List<TaskImageEntity> images,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfTaskImageEntity.insert(images);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteTaskImage(final TaskImageEntity image,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfTaskImageEntity.handle(image);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateTaskImage(final TaskImageEntity image,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfTaskImageEntity.handle(image);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllTaskImages(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllTaskImages.acquire();
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
          __preparedStmtOfDeleteAllTaskImages.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<TaskImageEntity>> getAllTaskImages() {
    final String _sql = "SELECT * FROM task_images";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_images"}, new Callable<List<TaskImageEntity>>() {
      @Override
      @NonNull
      public List<TaskImageEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "url");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfWatermarkText = CursorUtil.getColumnIndexOrThrow(_cursor, "watermarkText");
          final int _cursorIndexOfUploadedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "uploadedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskImageEntity> _result = new ArrayList<TaskImageEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskImageEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpUrl;
            _tmpUrl = _cursor.getString(_cursorIndexOfUrl);
            final Float _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getFloat(_cursorIndexOfLatitude);
            }
            final Float _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getFloat(_cursorIndexOfLongitude);
            }
            final String _tmpWatermarkText;
            if (_cursor.isNull(_cursorIndexOfWatermarkText)) {
              _tmpWatermarkText = null;
            } else {
              _tmpWatermarkText = _cursor.getString(_cursorIndexOfWatermarkText);
            }
            final String _tmpUploadedAt;
            _tmpUploadedAt = _cursor.getString(_cursorIndexOfUploadedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskImageEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpType,_tmpUrl,_tmpLatitude,_tmpLongitude,_tmpWatermarkText,_tmpUploadedAt,_tmpIsSynced);
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
  public Object getTaskImageById(final String id,
      final Continuation<? super TaskImageEntity> $completion) {
    final String _sql = "SELECT * FROM task_images WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<TaskImageEntity>() {
      @Override
      @Nullable
      public TaskImageEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "url");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfWatermarkText = CursorUtil.getColumnIndexOrThrow(_cursor, "watermarkText");
          final int _cursorIndexOfUploadedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "uploadedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final TaskImageEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpUrl;
            _tmpUrl = _cursor.getString(_cursorIndexOfUrl);
            final Float _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getFloat(_cursorIndexOfLatitude);
            }
            final Float _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getFloat(_cursorIndexOfLongitude);
            }
            final String _tmpWatermarkText;
            if (_cursor.isNull(_cursorIndexOfWatermarkText)) {
              _tmpWatermarkText = null;
            } else {
              _tmpWatermarkText = _cursor.getString(_cursorIndexOfWatermarkText);
            }
            final String _tmpUploadedAt;
            _tmpUploadedAt = _cursor.getString(_cursorIndexOfUploadedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new TaskImageEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpType,_tmpUrl,_tmpLatitude,_tmpLongitude,_tmpWatermarkText,_tmpUploadedAt,_tmpIsSynced);
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
  public Flow<List<TaskImageEntity>> getTaskImagesByTask(final int taskId) {
    final String _sql = "SELECT * FROM task_images WHERE taskId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, taskId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_images"}, new Callable<List<TaskImageEntity>>() {
      @Override
      @NonNull
      public List<TaskImageEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "url");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfWatermarkText = CursorUtil.getColumnIndexOrThrow(_cursor, "watermarkText");
          final int _cursorIndexOfUploadedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "uploadedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskImageEntity> _result = new ArrayList<TaskImageEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskImageEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpUrl;
            _tmpUrl = _cursor.getString(_cursorIndexOfUrl);
            final Float _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getFloat(_cursorIndexOfLatitude);
            }
            final Float _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getFloat(_cursorIndexOfLongitude);
            }
            final String _tmpWatermarkText;
            if (_cursor.isNull(_cursorIndexOfWatermarkText)) {
              _tmpWatermarkText = null;
            } else {
              _tmpWatermarkText = _cursor.getString(_cursorIndexOfWatermarkText);
            }
            final String _tmpUploadedAt;
            _tmpUploadedAt = _cursor.getString(_cursorIndexOfUploadedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskImageEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpType,_tmpUrl,_tmpLatitude,_tmpLongitude,_tmpWatermarkText,_tmpUploadedAt,_tmpIsSynced);
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
  public Flow<List<TaskImageEntity>> getTaskImagesByEmployee(final String employeeId) {
    final String _sql = "SELECT * FROM task_images WHERE employeeUserId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, employeeId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_images"}, new Callable<List<TaskImageEntity>>() {
      @Override
      @NonNull
      public List<TaskImageEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "url");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfWatermarkText = CursorUtil.getColumnIndexOrThrow(_cursor, "watermarkText");
          final int _cursorIndexOfUploadedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "uploadedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskImageEntity> _result = new ArrayList<TaskImageEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskImageEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpUrl;
            _tmpUrl = _cursor.getString(_cursorIndexOfUrl);
            final Float _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getFloat(_cursorIndexOfLatitude);
            }
            final Float _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getFloat(_cursorIndexOfLongitude);
            }
            final String _tmpWatermarkText;
            if (_cursor.isNull(_cursorIndexOfWatermarkText)) {
              _tmpWatermarkText = null;
            } else {
              _tmpWatermarkText = _cursor.getString(_cursorIndexOfWatermarkText);
            }
            final String _tmpUploadedAt;
            _tmpUploadedAt = _cursor.getString(_cursorIndexOfUploadedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskImageEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpType,_tmpUrl,_tmpLatitude,_tmpLongitude,_tmpWatermarkText,_tmpUploadedAt,_tmpIsSynced);
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
  public Flow<List<TaskImageEntity>> getTaskImagesByType(final String type) {
    final String _sql = "SELECT * FROM task_images WHERE type = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, type);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"task_images"}, new Callable<List<TaskImageEntity>>() {
      @Override
      @NonNull
      public List<TaskImageEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "url");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfWatermarkText = CursorUtil.getColumnIndexOrThrow(_cursor, "watermarkText");
          final int _cursorIndexOfUploadedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "uploadedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskImageEntity> _result = new ArrayList<TaskImageEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskImageEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpUrl;
            _tmpUrl = _cursor.getString(_cursorIndexOfUrl);
            final Float _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getFloat(_cursorIndexOfLatitude);
            }
            final Float _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getFloat(_cursorIndexOfLongitude);
            }
            final String _tmpWatermarkText;
            if (_cursor.isNull(_cursorIndexOfWatermarkText)) {
              _tmpWatermarkText = null;
            } else {
              _tmpWatermarkText = _cursor.getString(_cursorIndexOfWatermarkText);
            }
            final String _tmpUploadedAt;
            _tmpUploadedAt = _cursor.getString(_cursorIndexOfUploadedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskImageEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpType,_tmpUrl,_tmpLatitude,_tmpLongitude,_tmpWatermarkText,_tmpUploadedAt,_tmpIsSynced);
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
  public Object getUnsyncedTaskImages(
      final Continuation<? super List<TaskImageEntity>> $completion) {
    final String _sql = "SELECT * FROM task_images WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<TaskImageEntity>>() {
      @Override
      @NonNull
      public List<TaskImageEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfEmployeeUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeUserId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "url");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfWatermarkText = CursorUtil.getColumnIndexOrThrow(_cursor, "watermarkText");
          final int _cursorIndexOfUploadedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "uploadedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<TaskImageEntity> _result = new ArrayList<TaskImageEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TaskImageEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpEmployeeUserId;
            _tmpEmployeeUserId = _cursor.getString(_cursorIndexOfEmployeeUserId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpUrl;
            _tmpUrl = _cursor.getString(_cursorIndexOfUrl);
            final Float _tmpLatitude;
            if (_cursor.isNull(_cursorIndexOfLatitude)) {
              _tmpLatitude = null;
            } else {
              _tmpLatitude = _cursor.getFloat(_cursorIndexOfLatitude);
            }
            final Float _tmpLongitude;
            if (_cursor.isNull(_cursorIndexOfLongitude)) {
              _tmpLongitude = null;
            } else {
              _tmpLongitude = _cursor.getFloat(_cursorIndexOfLongitude);
            }
            final String _tmpWatermarkText;
            if (_cursor.isNull(_cursorIndexOfWatermarkText)) {
              _tmpWatermarkText = null;
            } else {
              _tmpWatermarkText = _cursor.getString(_cursorIndexOfWatermarkText);
            }
            final String _tmpUploadedAt;
            _tmpUploadedAt = _cursor.getString(_cursorIndexOfUploadedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new TaskImageEntity(_tmpId,_tmpTaskId,_tmpEmployeeUserId,_tmpType,_tmpUrl,_tmpLatitude,_tmpLongitude,_tmpWatermarkText,_tmpUploadedAt,_tmpIsSynced);
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
