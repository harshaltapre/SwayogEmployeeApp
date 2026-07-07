package com.example.swayogemployeeapp.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity;
import java.lang.Class;
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
public final class OutboxQueueDao_Impl implements OutboxQueueDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<OutboxQueueEntity> __insertionAdapterOfOutboxQueueEntity;

  private final SharedSQLiteStatement __preparedStmtOfDequeue;

  private final SharedSQLiteStatement __preparedStmtOfUpdateProcessingStatus;

  public OutboxQueueDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfOutboxQueueEntity = new EntityInsertionAdapter<OutboxQueueEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `outbox_queue` (`localId`,`actionType`,`endpoint`,`payloadJson`,`localAttachmentPaths`,`createdAt`,`isProcessing`) VALUES (nullif(?, 0),?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final OutboxQueueEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        statement.bindString(2, entity.getActionType());
        statement.bindString(3, entity.getEndpoint());
        statement.bindString(4, entity.getPayloadJson());
        if (entity.getLocalAttachmentPaths() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getLocalAttachmentPaths());
        }
        statement.bindLong(6, entity.getCreatedAt());
        final int _tmp = entity.isProcessing() ? 1 : 0;
        statement.bindLong(7, _tmp);
      }
    };
    this.__preparedStmtOfDequeue = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM outbox_queue WHERE localId = ?";
        return _query;
      }
    };
    this.__preparedStmtOfUpdateProcessingStatus = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE outbox_queue SET isProcessing = ? WHERE localId = ?";
        return _query;
      }
    };
  }

  @Override
  public Object enqueue(final OutboxQueueEntity item,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfOutboxQueueEntity.insertAndReturnId(item);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object dequeue(final long localId, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDequeue.acquire();
        int _argIndex = 1;
        _stmt.bindLong(_argIndex, localId);
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
          __preparedStmtOfDequeue.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object updateProcessingStatus(final long localId, final boolean isProcessing,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfUpdateProcessingStatus.acquire();
        int _argIndex = 1;
        final int _tmp = isProcessing ? 1 : 0;
        _stmt.bindLong(_argIndex, _tmp);
        _argIndex = 2;
        _stmt.bindLong(_argIndex, localId);
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
          __preparedStmtOfUpdateProcessingStatus.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object getQueue(final Continuation<? super List<OutboxQueueEntity>> $completion) {
    final String _sql = "SELECT * FROM outbox_queue ORDER BY localId ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<OutboxQueueEntity>>() {
      @Override
      @NonNull
      public List<OutboxQueueEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfActionType = CursorUtil.getColumnIndexOrThrow(_cursor, "actionType");
          final int _cursorIndexOfEndpoint = CursorUtil.getColumnIndexOrThrow(_cursor, "endpoint");
          final int _cursorIndexOfPayloadJson = CursorUtil.getColumnIndexOrThrow(_cursor, "payloadJson");
          final int _cursorIndexOfLocalAttachmentPaths = CursorUtil.getColumnIndexOrThrow(_cursor, "localAttachmentPaths");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsProcessing = CursorUtil.getColumnIndexOrThrow(_cursor, "isProcessing");
          final List<OutboxQueueEntity> _result = new ArrayList<OutboxQueueEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final OutboxQueueEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final String _tmpActionType;
            _tmpActionType = _cursor.getString(_cursorIndexOfActionType);
            final String _tmpEndpoint;
            _tmpEndpoint = _cursor.getString(_cursorIndexOfEndpoint);
            final String _tmpPayloadJson;
            _tmpPayloadJson = _cursor.getString(_cursorIndexOfPayloadJson);
            final String _tmpLocalAttachmentPaths;
            if (_cursor.isNull(_cursorIndexOfLocalAttachmentPaths)) {
              _tmpLocalAttachmentPaths = null;
            } else {
              _tmpLocalAttachmentPaths = _cursor.getString(_cursorIndexOfLocalAttachmentPaths);
            }
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final boolean _tmpIsProcessing;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsProcessing);
            _tmpIsProcessing = _tmp != 0;
            _item = new OutboxQueueEntity(_tmpLocalId,_tmpActionType,_tmpEndpoint,_tmpPayloadJson,_tmpLocalAttachmentPaths,_tmpCreatedAt,_tmpIsProcessing);
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
  public Flow<List<OutboxQueueEntity>> getQueueFlow() {
    final String _sql = "SELECT * FROM outbox_queue ORDER BY localId ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"outbox_queue"}, new Callable<List<OutboxQueueEntity>>() {
      @Override
      @NonNull
      public List<OutboxQueueEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfActionType = CursorUtil.getColumnIndexOrThrow(_cursor, "actionType");
          final int _cursorIndexOfEndpoint = CursorUtil.getColumnIndexOrThrow(_cursor, "endpoint");
          final int _cursorIndexOfPayloadJson = CursorUtil.getColumnIndexOrThrow(_cursor, "payloadJson");
          final int _cursorIndexOfLocalAttachmentPaths = CursorUtil.getColumnIndexOrThrow(_cursor, "localAttachmentPaths");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfIsProcessing = CursorUtil.getColumnIndexOrThrow(_cursor, "isProcessing");
          final List<OutboxQueueEntity> _result = new ArrayList<OutboxQueueEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final OutboxQueueEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final String _tmpActionType;
            _tmpActionType = _cursor.getString(_cursorIndexOfActionType);
            final String _tmpEndpoint;
            _tmpEndpoint = _cursor.getString(_cursorIndexOfEndpoint);
            final String _tmpPayloadJson;
            _tmpPayloadJson = _cursor.getString(_cursorIndexOfPayloadJson);
            final String _tmpLocalAttachmentPaths;
            if (_cursor.isNull(_cursorIndexOfLocalAttachmentPaths)) {
              _tmpLocalAttachmentPaths = null;
            } else {
              _tmpLocalAttachmentPaths = _cursor.getString(_cursorIndexOfLocalAttachmentPaths);
            }
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final boolean _tmpIsProcessing;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsProcessing);
            _tmpIsProcessing = _tmp != 0;
            _item = new OutboxQueueEntity(_tmpLocalId,_tmpActionType,_tmpEndpoint,_tmpPayloadJson,_tmpLocalAttachmentPaths,_tmpCreatedAt,_tmpIsProcessing);
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

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
