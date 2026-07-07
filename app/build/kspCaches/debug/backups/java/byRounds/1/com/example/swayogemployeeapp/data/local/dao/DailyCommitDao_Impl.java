package com.example.swayogemployeeapp.data.local.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity;
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
public final class DailyCommitDao_Impl implements DailyCommitDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<DailyCommitEntity> __insertionAdapterOfDailyCommitEntity;

  private final EntityDeletionOrUpdateAdapter<DailyCommitEntity> __updateAdapterOfDailyCommitEntity;

  public DailyCommitDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfDailyCommitEntity = new EntityInsertionAdapter<DailyCommitEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `daily_commits` (`localId`,`remoteId`,`date`,`taskDescription`,`hoursSpent`,`isSynced`) VALUES (nullif(?, 0),?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DailyCommitEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        if (entity.getRemoteId() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getRemoteId());
        }
        statement.bindString(3, entity.getDate());
        statement.bindString(4, entity.getTaskDescription());
        statement.bindDouble(5, entity.getHoursSpent());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(6, _tmp);
      }
    };
    this.__updateAdapterOfDailyCommitEntity = new EntityDeletionOrUpdateAdapter<DailyCommitEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `daily_commits` SET `localId` = ?,`remoteId` = ?,`date` = ?,`taskDescription` = ?,`hoursSpent` = ?,`isSynced` = ? WHERE `localId` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DailyCommitEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        if (entity.getRemoteId() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getRemoteId());
        }
        statement.bindString(3, entity.getDate());
        statement.bindString(4, entity.getTaskDescription());
        statement.bindDouble(5, entity.getHoursSpent());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(6, _tmp);
        statement.bindLong(7, entity.getLocalId());
      }
    };
  }

  @Override
  public Object insert(final DailyCommitEntity commit,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfDailyCommitEntity.insertAndReturnId(commit);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertAll(final List<DailyCommitEntity> commits,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfDailyCommitEntity.insert(commits);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final DailyCommitEntity commit,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfDailyCommitEntity.handle(commit);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<DailyCommitEntity>> getAllCommitsFlow() {
    final String _sql = "SELECT * FROM daily_commits ORDER BY localId DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"daily_commits"}, new Callable<List<DailyCommitEntity>>() {
      @Override
      @NonNull
      public List<DailyCommitEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfTaskDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "taskDescription");
          final int _cursorIndexOfHoursSpent = CursorUtil.getColumnIndexOrThrow(_cursor, "hoursSpent");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<DailyCommitEntity> _result = new ArrayList<DailyCommitEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DailyCommitEntity _item;
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
            final String _tmpTaskDescription;
            _tmpTaskDescription = _cursor.getString(_cursorIndexOfTaskDescription);
            final double _tmpHoursSpent;
            _tmpHoursSpent = _cursor.getDouble(_cursorIndexOfHoursSpent);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new DailyCommitEntity(_tmpLocalId,_tmpRemoteId,_tmpDate,_tmpTaskDescription,_tmpHoursSpent,_tmpIsSynced);
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
