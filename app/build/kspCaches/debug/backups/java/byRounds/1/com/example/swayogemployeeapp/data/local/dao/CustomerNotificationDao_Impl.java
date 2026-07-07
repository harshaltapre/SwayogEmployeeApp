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
import com.example.swayogemployeeapp.data.local.entity.CustomerNotificationEntity;
import java.lang.Class;
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
public final class CustomerNotificationDao_Impl implements CustomerNotificationDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<CustomerNotificationEntity> __insertionAdapterOfCustomerNotificationEntity;

  private final EntityDeletionOrUpdateAdapter<CustomerNotificationEntity> __deletionAdapterOfCustomerNotificationEntity;

  private final EntityDeletionOrUpdateAdapter<CustomerNotificationEntity> __updateAdapterOfCustomerNotificationEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllCustomerNotifications;

  public CustomerNotificationDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfCustomerNotificationEntity = new EntityInsertionAdapter<CustomerNotificationEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `customer_notifications` (`id`,`customerId`,`type`,`message`,`taskId`,`imageUrl`,`isRead`,`createdAt`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CustomerNotificationEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getType());
        statement.bindString(4, entity.getMessage());
        if (entity.getTaskId() == null) {
          statement.bindNull(5);
        } else {
          statement.bindLong(5, entity.getTaskId());
        }
        if (entity.getImageUrl() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getImageUrl());
        }
        final int _tmp = entity.isRead() ? 1 : 0;
        statement.bindLong(7, _tmp);
        statement.bindString(8, entity.getCreatedAt());
        final int _tmp_1 = entity.isSynced() ? 1 : 0;
        statement.bindLong(9, _tmp_1);
      }
    };
    this.__deletionAdapterOfCustomerNotificationEntity = new EntityDeletionOrUpdateAdapter<CustomerNotificationEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `customer_notifications` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CustomerNotificationEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfCustomerNotificationEntity = new EntityDeletionOrUpdateAdapter<CustomerNotificationEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `customer_notifications` SET `id` = ?,`customerId` = ?,`type` = ?,`message` = ?,`taskId` = ?,`imageUrl` = ?,`isRead` = ?,`createdAt` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CustomerNotificationEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getType());
        statement.bindString(4, entity.getMessage());
        if (entity.getTaskId() == null) {
          statement.bindNull(5);
        } else {
          statement.bindLong(5, entity.getTaskId());
        }
        if (entity.getImageUrl() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getImageUrl());
        }
        final int _tmp = entity.isRead() ? 1 : 0;
        statement.bindLong(7, _tmp);
        statement.bindString(8, entity.getCreatedAt());
        final int _tmp_1 = entity.isSynced() ? 1 : 0;
        statement.bindLong(9, _tmp_1);
        statement.bindString(10, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllCustomerNotifications = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM customer_notifications";
        return _query;
      }
    };
  }

  @Override
  public Object insertCustomerNotification(final CustomerNotificationEntity notification,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfCustomerNotificationEntity.insert(notification);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertCustomerNotifications(final List<CustomerNotificationEntity> notifications,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfCustomerNotificationEntity.insert(notifications);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteCustomerNotification(final CustomerNotificationEntity notification,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfCustomerNotificationEntity.handle(notification);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateCustomerNotification(final CustomerNotificationEntity notification,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfCustomerNotificationEntity.handle(notification);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllCustomerNotifications(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllCustomerNotifications.acquire();
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
          __preparedStmtOfDeleteAllCustomerNotifications.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<CustomerNotificationEntity>> getAllCustomerNotifications() {
    final String _sql = "SELECT * FROM customer_notifications";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"customer_notifications"}, new Callable<List<CustomerNotificationEntity>>() {
      @Override
      @NonNull
      public List<CustomerNotificationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerNotificationEntity> _result = new ArrayList<CustomerNotificationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerNotificationEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpMessage;
            _tmpMessage = _cursor.getString(_cursorIndexOfMessage);
            final Integer _tmpTaskId;
            if (_cursor.isNull(_cursorIndexOfTaskId)) {
              _tmpTaskId = null;
            } else {
              _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            }
            final String _tmpImageUrl;
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _tmpImageUrl = null;
            } else {
              _tmpImageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final boolean _tmpIsSynced;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp_1 != 0;
            _item = new CustomerNotificationEntity(_tmpId,_tmpCustomerId,_tmpType,_tmpMessage,_tmpTaskId,_tmpImageUrl,_tmpIsRead,_tmpCreatedAt,_tmpIsSynced);
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
  public Object getCustomerNotificationById(final String id,
      final Continuation<? super CustomerNotificationEntity> $completion) {
    final String _sql = "SELECT * FROM customer_notifications WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<CustomerNotificationEntity>() {
      @Override
      @Nullable
      public CustomerNotificationEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final CustomerNotificationEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpMessage;
            _tmpMessage = _cursor.getString(_cursorIndexOfMessage);
            final Integer _tmpTaskId;
            if (_cursor.isNull(_cursorIndexOfTaskId)) {
              _tmpTaskId = null;
            } else {
              _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            }
            final String _tmpImageUrl;
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _tmpImageUrl = null;
            } else {
              _tmpImageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final boolean _tmpIsSynced;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp_1 != 0;
            _result = new CustomerNotificationEntity(_tmpId,_tmpCustomerId,_tmpType,_tmpMessage,_tmpTaskId,_tmpImageUrl,_tmpIsRead,_tmpCreatedAt,_tmpIsSynced);
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
  public Flow<List<CustomerNotificationEntity>> getCustomerNotificationsByCustomer(
      final int customerId) {
    final String _sql = "SELECT * FROM customer_notifications WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"customer_notifications"}, new Callable<List<CustomerNotificationEntity>>() {
      @Override
      @NonNull
      public List<CustomerNotificationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerNotificationEntity> _result = new ArrayList<CustomerNotificationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerNotificationEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpMessage;
            _tmpMessage = _cursor.getString(_cursorIndexOfMessage);
            final Integer _tmpTaskId;
            if (_cursor.isNull(_cursorIndexOfTaskId)) {
              _tmpTaskId = null;
            } else {
              _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            }
            final String _tmpImageUrl;
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _tmpImageUrl = null;
            } else {
              _tmpImageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final boolean _tmpIsSynced;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp_1 != 0;
            _item = new CustomerNotificationEntity(_tmpId,_tmpCustomerId,_tmpType,_tmpMessage,_tmpTaskId,_tmpImageUrl,_tmpIsRead,_tmpCreatedAt,_tmpIsSynced);
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
  public Flow<List<CustomerNotificationEntity>> getCustomerNotificationsByType(final String type) {
    final String _sql = "SELECT * FROM customer_notifications WHERE type = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, type);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"customer_notifications"}, new Callable<List<CustomerNotificationEntity>>() {
      @Override
      @NonNull
      public List<CustomerNotificationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerNotificationEntity> _result = new ArrayList<CustomerNotificationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerNotificationEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpMessage;
            _tmpMessage = _cursor.getString(_cursorIndexOfMessage);
            final Integer _tmpTaskId;
            if (_cursor.isNull(_cursorIndexOfTaskId)) {
              _tmpTaskId = null;
            } else {
              _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            }
            final String _tmpImageUrl;
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _tmpImageUrl = null;
            } else {
              _tmpImageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final boolean _tmpIsSynced;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp_1 != 0;
            _item = new CustomerNotificationEntity(_tmpId,_tmpCustomerId,_tmpType,_tmpMessage,_tmpTaskId,_tmpImageUrl,_tmpIsRead,_tmpCreatedAt,_tmpIsSynced);
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
  public Flow<List<CustomerNotificationEntity>> getCustomerNotificationsByReadStatus(
      final boolean isRead) {
    final String _sql = "SELECT * FROM customer_notifications WHERE isRead = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    final int _tmp = isRead ? 1 : 0;
    _statement.bindLong(_argIndex, _tmp);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"customer_notifications"}, new Callable<List<CustomerNotificationEntity>>() {
      @Override
      @NonNull
      public List<CustomerNotificationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerNotificationEntity> _result = new ArrayList<CustomerNotificationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerNotificationEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpMessage;
            _tmpMessage = _cursor.getString(_cursorIndexOfMessage);
            final Integer _tmpTaskId;
            if (_cursor.isNull(_cursorIndexOfTaskId)) {
              _tmpTaskId = null;
            } else {
              _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            }
            final String _tmpImageUrl;
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _tmpImageUrl = null;
            } else {
              _tmpImageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            final boolean _tmpIsRead;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp_1 != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final boolean _tmpIsSynced;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp_2 != 0;
            _item = new CustomerNotificationEntity(_tmpId,_tmpCustomerId,_tmpType,_tmpMessage,_tmpTaskId,_tmpImageUrl,_tmpIsRead,_tmpCreatedAt,_tmpIsSynced);
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
  public Object getUnsyncedCustomerNotifications(
      final Continuation<? super List<CustomerNotificationEntity>> $completion) {
    final String _sql = "SELECT * FROM customer_notifications WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<CustomerNotificationEntity>>() {
      @Override
      @NonNull
      public List<CustomerNotificationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfIsRead = CursorUtil.getColumnIndexOrThrow(_cursor, "isRead");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<CustomerNotificationEntity> _result = new ArrayList<CustomerNotificationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final CustomerNotificationEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpMessage;
            _tmpMessage = _cursor.getString(_cursorIndexOfMessage);
            final Integer _tmpTaskId;
            if (_cursor.isNull(_cursorIndexOfTaskId)) {
              _tmpTaskId = null;
            } else {
              _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            }
            final String _tmpImageUrl;
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _tmpImageUrl = null;
            } else {
              _tmpImageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            final boolean _tmpIsRead;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsRead);
            _tmpIsRead = _tmp != 0;
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final boolean _tmpIsSynced;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp_1 != 0;
            _item = new CustomerNotificationEntity(_tmpId,_tmpCustomerId,_tmpType,_tmpMessage,_tmpTaskId,_tmpImageUrl,_tmpIsRead,_tmpCreatedAt,_tmpIsSynced);
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
