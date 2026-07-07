package com.example.swayogemployeeapp.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class EmployeeSessionDao_Impl implements EmployeeSessionDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<EmployeeSessionEntity> __insertionAdapterOfEmployeeSessionEntity;

  private final SharedSQLiteStatement __preparedStmtOfClearSession;

  public EmployeeSessionDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfEmployeeSessionEntity = new EntityInsertionAdapter<EmployeeSessionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `employee_session` (`id`,`loginId`,`email`,`name`,`role`,`jobRole`,`employeeCode`,`reportingManagerId`,`accessToken`,`refreshToken`,`lastSyncTimestamp`) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final EmployeeSessionEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getLoginId());
        statement.bindString(3, entity.getEmail());
        statement.bindString(4, entity.getName());
        statement.bindString(5, entity.getRole());
        statement.bindString(6, entity.getJobRole());
        if (entity.getEmployeeCode() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getEmployeeCode());
        }
        if (entity.getReportingManagerId() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getReportingManagerId());
        }
        statement.bindString(9, entity.getAccessToken());
        statement.bindString(10, entity.getRefreshToken());
        statement.bindLong(11, entity.getLastSyncTimestamp());
      }
    };
    this.__preparedStmtOfClearSession = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM employee_session";
        return _query;
      }
    };
  }

  @Override
  public Object insert(final EmployeeSessionEntity session,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfEmployeeSessionEntity.insert(session);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object clearSession(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfClearSession.acquire();
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
          __preparedStmtOfClearSession.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<EmployeeSessionEntity> getSessionFlow() {
    final String _sql = "SELECT * FROM employee_session LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"employee_session"}, new Callable<EmployeeSessionEntity>() {
      @Override
      @Nullable
      public EmployeeSessionEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "loginId");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfJobRole = CursorUtil.getColumnIndexOrThrow(_cursor, "jobRole");
          final int _cursorIndexOfEmployeeCode = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeCode");
          final int _cursorIndexOfReportingManagerId = CursorUtil.getColumnIndexOrThrow(_cursor, "reportingManagerId");
          final int _cursorIndexOfAccessToken = CursorUtil.getColumnIndexOrThrow(_cursor, "accessToken");
          final int _cursorIndexOfRefreshToken = CursorUtil.getColumnIndexOrThrow(_cursor, "refreshToken");
          final int _cursorIndexOfLastSyncTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "lastSyncTimestamp");
          final EmployeeSessionEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpLoginId;
            _tmpLoginId = _cursor.getString(_cursorIndexOfLoginId);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpName;
            _tmpName = _cursor.getString(_cursorIndexOfName);
            final String _tmpRole;
            _tmpRole = _cursor.getString(_cursorIndexOfRole);
            final String _tmpJobRole;
            _tmpJobRole = _cursor.getString(_cursorIndexOfJobRole);
            final String _tmpEmployeeCode;
            if (_cursor.isNull(_cursorIndexOfEmployeeCode)) {
              _tmpEmployeeCode = null;
            } else {
              _tmpEmployeeCode = _cursor.getString(_cursorIndexOfEmployeeCode);
            }
            final String _tmpReportingManagerId;
            if (_cursor.isNull(_cursorIndexOfReportingManagerId)) {
              _tmpReportingManagerId = null;
            } else {
              _tmpReportingManagerId = _cursor.getString(_cursorIndexOfReportingManagerId);
            }
            final String _tmpAccessToken;
            _tmpAccessToken = _cursor.getString(_cursorIndexOfAccessToken);
            final String _tmpRefreshToken;
            _tmpRefreshToken = _cursor.getString(_cursorIndexOfRefreshToken);
            final long _tmpLastSyncTimestamp;
            _tmpLastSyncTimestamp = _cursor.getLong(_cursorIndexOfLastSyncTimestamp);
            _result = new EmployeeSessionEntity(_tmpId,_tmpLoginId,_tmpEmail,_tmpName,_tmpRole,_tmpJobRole,_tmpEmployeeCode,_tmpReportingManagerId,_tmpAccessToken,_tmpRefreshToken,_tmpLastSyncTimestamp);
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
  public Object getSession(final Continuation<? super EmployeeSessionEntity> $completion) {
    final String _sql = "SELECT * FROM employee_session LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<EmployeeSessionEntity>() {
      @Override
      @Nullable
      public EmployeeSessionEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLoginId = CursorUtil.getColumnIndexOrThrow(_cursor, "loginId");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfJobRole = CursorUtil.getColumnIndexOrThrow(_cursor, "jobRole");
          final int _cursorIndexOfEmployeeCode = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeCode");
          final int _cursorIndexOfReportingManagerId = CursorUtil.getColumnIndexOrThrow(_cursor, "reportingManagerId");
          final int _cursorIndexOfAccessToken = CursorUtil.getColumnIndexOrThrow(_cursor, "accessToken");
          final int _cursorIndexOfRefreshToken = CursorUtil.getColumnIndexOrThrow(_cursor, "refreshToken");
          final int _cursorIndexOfLastSyncTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "lastSyncTimestamp");
          final EmployeeSessionEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpLoginId;
            _tmpLoginId = _cursor.getString(_cursorIndexOfLoginId);
            final String _tmpEmail;
            _tmpEmail = _cursor.getString(_cursorIndexOfEmail);
            final String _tmpName;
            _tmpName = _cursor.getString(_cursorIndexOfName);
            final String _tmpRole;
            _tmpRole = _cursor.getString(_cursorIndexOfRole);
            final String _tmpJobRole;
            _tmpJobRole = _cursor.getString(_cursorIndexOfJobRole);
            final String _tmpEmployeeCode;
            if (_cursor.isNull(_cursorIndexOfEmployeeCode)) {
              _tmpEmployeeCode = null;
            } else {
              _tmpEmployeeCode = _cursor.getString(_cursorIndexOfEmployeeCode);
            }
            final String _tmpReportingManagerId;
            if (_cursor.isNull(_cursorIndexOfReportingManagerId)) {
              _tmpReportingManagerId = null;
            } else {
              _tmpReportingManagerId = _cursor.getString(_cursorIndexOfReportingManagerId);
            }
            final String _tmpAccessToken;
            _tmpAccessToken = _cursor.getString(_cursorIndexOfAccessToken);
            final String _tmpRefreshToken;
            _tmpRefreshToken = _cursor.getString(_cursorIndexOfRefreshToken);
            final long _tmpLastSyncTimestamp;
            _tmpLastSyncTimestamp = _cursor.getLong(_cursorIndexOfLastSyncTimestamp);
            _result = new EmployeeSessionEntity(_tmpId,_tmpLoginId,_tmpEmail,_tmpName,_tmpRole,_tmpJobRole,_tmpEmployeeCode,_tmpReportingManagerId,_tmpAccessToken,_tmpRefreshToken,_tmpLastSyncTimestamp);
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
