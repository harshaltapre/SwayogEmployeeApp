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
import com.example.swayogemployeeapp.data.local.entity.DispatchRecordEntity;
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
public final class DispatchRecordDao_Impl implements DispatchRecordDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<DispatchRecordEntity> __insertionAdapterOfDispatchRecordEntity;

  private final EntityDeletionOrUpdateAdapter<DispatchRecordEntity> __deletionAdapterOfDispatchRecordEntity;

  private final EntityDeletionOrUpdateAdapter<DispatchRecordEntity> __updateAdapterOfDispatchRecordEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllDispatchRecords;

  public DispatchRecordDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfDispatchRecordEntity = new EntityInsertionAdapter<DispatchRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `dispatch_records` (`id`,`customerId`,`itemId`,`quantity`,`dispatchedAt`,`notes`,`isSynced`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DispatchRecordEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getItemId());
        statement.bindLong(4, entity.getQuantity());
        statement.bindString(5, entity.getDispatchedAt());
        if (entity.getNotes() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getNotes());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(7, _tmp);
      }
    };
    this.__deletionAdapterOfDispatchRecordEntity = new EntityDeletionOrUpdateAdapter<DispatchRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `dispatch_records` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DispatchRecordEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfDispatchRecordEntity = new EntityDeletionOrUpdateAdapter<DispatchRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `dispatch_records` SET `id` = ?,`customerId` = ?,`itemId` = ?,`quantity` = ?,`dispatchedAt` = ?,`notes` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DispatchRecordEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getItemId());
        statement.bindLong(4, entity.getQuantity());
        statement.bindString(5, entity.getDispatchedAt());
        if (entity.getNotes() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getNotes());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(7, _tmp);
        statement.bindString(8, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllDispatchRecords = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM dispatch_records";
        return _query;
      }
    };
  }

  @Override
  public Object insertDispatchRecord(final DispatchRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfDispatchRecordEntity.insert(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertDispatchRecords(final List<DispatchRecordEntity> records,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfDispatchRecordEntity.insert(records);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteDispatchRecord(final DispatchRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfDispatchRecordEntity.handle(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateDispatchRecord(final DispatchRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfDispatchRecordEntity.handle(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllDispatchRecords(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllDispatchRecords.acquire();
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
          __preparedStmtOfDeleteAllDispatchRecords.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<DispatchRecordEntity>> getAllDispatchRecords() {
    final String _sql = "SELECT * FROM dispatch_records";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"dispatch_records"}, new Callable<List<DispatchRecordEntity>>() {
      @Override
      @NonNull
      public List<DispatchRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfDispatchedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "dispatchedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<DispatchRecordEntity> _result = new ArrayList<DispatchRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DispatchRecordEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpItemId;
            _tmpItemId = _cursor.getString(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final String _tmpDispatchedAt;
            _tmpDispatchedAt = _cursor.getString(_cursorIndexOfDispatchedAt);
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new DispatchRecordEntity(_tmpId,_tmpCustomerId,_tmpItemId,_tmpQuantity,_tmpDispatchedAt,_tmpNotes,_tmpIsSynced);
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
  public Object getDispatchRecordById(final String id,
      final Continuation<? super DispatchRecordEntity> $completion) {
    final String _sql = "SELECT * FROM dispatch_records WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<DispatchRecordEntity>() {
      @Override
      @Nullable
      public DispatchRecordEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfDispatchedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "dispatchedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final DispatchRecordEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpItemId;
            _tmpItemId = _cursor.getString(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final String _tmpDispatchedAt;
            _tmpDispatchedAt = _cursor.getString(_cursorIndexOfDispatchedAt);
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new DispatchRecordEntity(_tmpId,_tmpCustomerId,_tmpItemId,_tmpQuantity,_tmpDispatchedAt,_tmpNotes,_tmpIsSynced);
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
  public Flow<List<DispatchRecordEntity>> getDispatchRecordsByCustomer(final int customerId) {
    final String _sql = "SELECT * FROM dispatch_records WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"dispatch_records"}, new Callable<List<DispatchRecordEntity>>() {
      @Override
      @NonNull
      public List<DispatchRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfDispatchedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "dispatchedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<DispatchRecordEntity> _result = new ArrayList<DispatchRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DispatchRecordEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpItemId;
            _tmpItemId = _cursor.getString(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final String _tmpDispatchedAt;
            _tmpDispatchedAt = _cursor.getString(_cursorIndexOfDispatchedAt);
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new DispatchRecordEntity(_tmpId,_tmpCustomerId,_tmpItemId,_tmpQuantity,_tmpDispatchedAt,_tmpNotes,_tmpIsSynced);
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
  public Object getUnsyncedDispatchRecords(
      final Continuation<? super List<DispatchRecordEntity>> $completion) {
    final String _sql = "SELECT * FROM dispatch_records WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<DispatchRecordEntity>>() {
      @Override
      @NonNull
      public List<DispatchRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfDispatchedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "dispatchedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<DispatchRecordEntity> _result = new ArrayList<DispatchRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DispatchRecordEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpItemId;
            _tmpItemId = _cursor.getString(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final String _tmpDispatchedAt;
            _tmpDispatchedAt = _cursor.getString(_cursorIndexOfDispatchedAt);
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new DispatchRecordEntity(_tmpId,_tmpCustomerId,_tmpItemId,_tmpQuantity,_tmpDispatchedAt,_tmpNotes,_tmpIsSynced);
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
