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
import com.example.swayogemployeeapp.data.local.entity.AmcVisitEntity;
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
public final class AmcVisitDao_Impl implements AmcVisitDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<AmcVisitEntity> __insertionAdapterOfAmcVisitEntity;

  private final EntityDeletionOrUpdateAdapter<AmcVisitEntity> __deletionAdapterOfAmcVisitEntity;

  private final EntityDeletionOrUpdateAdapter<AmcVisitEntity> __updateAdapterOfAmcVisitEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllAmcVisits;

  public AmcVisitDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfAmcVisitEntity = new EntityInsertionAdapter<AmcVisitEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `amc_visits` (`id`,`customerId`,`scheduledDate`,`status`,`completedAt`,`notes`,`assignedEmployeeId`,`completedByEmployeeId`,`completedByName`,`visitNotes`,`beforeImageUrl`,`afterImageUrl`,`cleaningNumber`,`timeSlot`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final AmcVisitEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getScheduledDate());
        statement.bindString(4, entity.getStatus());
        if (entity.getCompletedAt() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getCompletedAt());
        }
        if (entity.getNotes() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getNotes());
        }
        if (entity.getAssignedEmployeeId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getAssignedEmployeeId());
        }
        if (entity.getCompletedByEmployeeId() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getCompletedByEmployeeId());
        }
        if (entity.getCompletedByName() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getCompletedByName());
        }
        if (entity.getVisitNotes() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getVisitNotes());
        }
        if (entity.getBeforeImageUrl() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getBeforeImageUrl());
        }
        if (entity.getAfterImageUrl() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getAfterImageUrl());
        }
        if (entity.getCleaningNumber() == null) {
          statement.bindNull(13);
        } else {
          statement.bindLong(13, entity.getCleaningNumber());
        }
        if (entity.getTimeSlot() == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.getTimeSlot());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
      }
    };
    this.__deletionAdapterOfAmcVisitEntity = new EntityDeletionOrUpdateAdapter<AmcVisitEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `amc_visits` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final AmcVisitEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfAmcVisitEntity = new EntityDeletionOrUpdateAdapter<AmcVisitEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `amc_visits` SET `id` = ?,`customerId` = ?,`scheduledDate` = ?,`status` = ?,`completedAt` = ?,`notes` = ?,`assignedEmployeeId` = ?,`completedByEmployeeId` = ?,`completedByName` = ?,`visitNotes` = ?,`beforeImageUrl` = ?,`afterImageUrl` = ?,`cleaningNumber` = ?,`timeSlot` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final AmcVisitEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCustomerId());
        statement.bindString(3, entity.getScheduledDate());
        statement.bindString(4, entity.getStatus());
        if (entity.getCompletedAt() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getCompletedAt());
        }
        if (entity.getNotes() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getNotes());
        }
        if (entity.getAssignedEmployeeId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getAssignedEmployeeId());
        }
        if (entity.getCompletedByEmployeeId() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getCompletedByEmployeeId());
        }
        if (entity.getCompletedByName() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getCompletedByName());
        }
        if (entity.getVisitNotes() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getVisitNotes());
        }
        if (entity.getBeforeImageUrl() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getBeforeImageUrl());
        }
        if (entity.getAfterImageUrl() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getAfterImageUrl());
        }
        if (entity.getCleaningNumber() == null) {
          statement.bindNull(13);
        } else {
          statement.bindLong(13, entity.getCleaningNumber());
        }
        if (entity.getTimeSlot() == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.getTimeSlot());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
        statement.bindString(16, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllAmcVisits = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM amc_visits";
        return _query;
      }
    };
  }

  @Override
  public Object insertAmcVisit(final AmcVisitEntity visit,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfAmcVisitEntity.insert(visit);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertAmcVisits(final List<AmcVisitEntity> visits,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfAmcVisitEntity.insert(visits);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAmcVisit(final AmcVisitEntity visit,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfAmcVisitEntity.handle(visit);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateAmcVisit(final AmcVisitEntity visit,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfAmcVisitEntity.handle(visit);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllAmcVisits(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllAmcVisits.acquire();
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
          __preparedStmtOfDeleteAllAmcVisits.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<AmcVisitEntity>> getAllAmcVisits() {
    final String _sql = "SELECT * FROM amc_visits";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"amc_visits"}, new Callable<List<AmcVisitEntity>>() {
      @Override
      @NonNull
      public List<AmcVisitEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfScheduledDate = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCompletedByEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByEmployeeId");
          final int _cursorIndexOfCompletedByName = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByName");
          final int _cursorIndexOfVisitNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "visitNotes");
          final int _cursorIndexOfBeforeImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "beforeImageUrl");
          final int _cursorIndexOfAfterImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "afterImageUrl");
          final int _cursorIndexOfCleaningNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningNumber");
          final int _cursorIndexOfTimeSlot = CursorUtil.getColumnIndexOrThrow(_cursor, "timeSlot");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AmcVisitEntity> _result = new ArrayList<AmcVisitEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AmcVisitEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpScheduledDate;
            _tmpScheduledDate = _cursor.getString(_cursorIndexOfScheduledDate);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final String _tmpCompletedByEmployeeId;
            if (_cursor.isNull(_cursorIndexOfCompletedByEmployeeId)) {
              _tmpCompletedByEmployeeId = null;
            } else {
              _tmpCompletedByEmployeeId = _cursor.getString(_cursorIndexOfCompletedByEmployeeId);
            }
            final String _tmpCompletedByName;
            if (_cursor.isNull(_cursorIndexOfCompletedByName)) {
              _tmpCompletedByName = null;
            } else {
              _tmpCompletedByName = _cursor.getString(_cursorIndexOfCompletedByName);
            }
            final String _tmpVisitNotes;
            if (_cursor.isNull(_cursorIndexOfVisitNotes)) {
              _tmpVisitNotes = null;
            } else {
              _tmpVisitNotes = _cursor.getString(_cursorIndexOfVisitNotes);
            }
            final String _tmpBeforeImageUrl;
            if (_cursor.isNull(_cursorIndexOfBeforeImageUrl)) {
              _tmpBeforeImageUrl = null;
            } else {
              _tmpBeforeImageUrl = _cursor.getString(_cursorIndexOfBeforeImageUrl);
            }
            final String _tmpAfterImageUrl;
            if (_cursor.isNull(_cursorIndexOfAfterImageUrl)) {
              _tmpAfterImageUrl = null;
            } else {
              _tmpAfterImageUrl = _cursor.getString(_cursorIndexOfAfterImageUrl);
            }
            final Integer _tmpCleaningNumber;
            if (_cursor.isNull(_cursorIndexOfCleaningNumber)) {
              _tmpCleaningNumber = null;
            } else {
              _tmpCleaningNumber = _cursor.getInt(_cursorIndexOfCleaningNumber);
            }
            final String _tmpTimeSlot;
            if (_cursor.isNull(_cursorIndexOfTimeSlot)) {
              _tmpTimeSlot = null;
            } else {
              _tmpTimeSlot = _cursor.getString(_cursorIndexOfTimeSlot);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AmcVisitEntity(_tmpId,_tmpCustomerId,_tmpScheduledDate,_tmpStatus,_tmpCompletedAt,_tmpNotes,_tmpAssignedEmployeeId,_tmpCompletedByEmployeeId,_tmpCompletedByName,_tmpVisitNotes,_tmpBeforeImageUrl,_tmpAfterImageUrl,_tmpCleaningNumber,_tmpTimeSlot,_tmpIsSynced);
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
  public Object getAmcVisitById(final String id,
      final Continuation<? super AmcVisitEntity> $completion) {
    final String _sql = "SELECT * FROM amc_visits WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<AmcVisitEntity>() {
      @Override
      @Nullable
      public AmcVisitEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfScheduledDate = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCompletedByEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByEmployeeId");
          final int _cursorIndexOfCompletedByName = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByName");
          final int _cursorIndexOfVisitNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "visitNotes");
          final int _cursorIndexOfBeforeImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "beforeImageUrl");
          final int _cursorIndexOfAfterImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "afterImageUrl");
          final int _cursorIndexOfCleaningNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningNumber");
          final int _cursorIndexOfTimeSlot = CursorUtil.getColumnIndexOrThrow(_cursor, "timeSlot");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final AmcVisitEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpScheduledDate;
            _tmpScheduledDate = _cursor.getString(_cursorIndexOfScheduledDate);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final String _tmpCompletedByEmployeeId;
            if (_cursor.isNull(_cursorIndexOfCompletedByEmployeeId)) {
              _tmpCompletedByEmployeeId = null;
            } else {
              _tmpCompletedByEmployeeId = _cursor.getString(_cursorIndexOfCompletedByEmployeeId);
            }
            final String _tmpCompletedByName;
            if (_cursor.isNull(_cursorIndexOfCompletedByName)) {
              _tmpCompletedByName = null;
            } else {
              _tmpCompletedByName = _cursor.getString(_cursorIndexOfCompletedByName);
            }
            final String _tmpVisitNotes;
            if (_cursor.isNull(_cursorIndexOfVisitNotes)) {
              _tmpVisitNotes = null;
            } else {
              _tmpVisitNotes = _cursor.getString(_cursorIndexOfVisitNotes);
            }
            final String _tmpBeforeImageUrl;
            if (_cursor.isNull(_cursorIndexOfBeforeImageUrl)) {
              _tmpBeforeImageUrl = null;
            } else {
              _tmpBeforeImageUrl = _cursor.getString(_cursorIndexOfBeforeImageUrl);
            }
            final String _tmpAfterImageUrl;
            if (_cursor.isNull(_cursorIndexOfAfterImageUrl)) {
              _tmpAfterImageUrl = null;
            } else {
              _tmpAfterImageUrl = _cursor.getString(_cursorIndexOfAfterImageUrl);
            }
            final Integer _tmpCleaningNumber;
            if (_cursor.isNull(_cursorIndexOfCleaningNumber)) {
              _tmpCleaningNumber = null;
            } else {
              _tmpCleaningNumber = _cursor.getInt(_cursorIndexOfCleaningNumber);
            }
            final String _tmpTimeSlot;
            if (_cursor.isNull(_cursorIndexOfTimeSlot)) {
              _tmpTimeSlot = null;
            } else {
              _tmpTimeSlot = _cursor.getString(_cursorIndexOfTimeSlot);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new AmcVisitEntity(_tmpId,_tmpCustomerId,_tmpScheduledDate,_tmpStatus,_tmpCompletedAt,_tmpNotes,_tmpAssignedEmployeeId,_tmpCompletedByEmployeeId,_tmpCompletedByName,_tmpVisitNotes,_tmpBeforeImageUrl,_tmpAfterImageUrl,_tmpCleaningNumber,_tmpTimeSlot,_tmpIsSynced);
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
  public Flow<List<AmcVisitEntity>> getAmcVisitsByCustomer(final int customerId) {
    final String _sql = "SELECT * FROM amc_visits WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"amc_visits"}, new Callable<List<AmcVisitEntity>>() {
      @Override
      @NonNull
      public List<AmcVisitEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfScheduledDate = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCompletedByEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByEmployeeId");
          final int _cursorIndexOfCompletedByName = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByName");
          final int _cursorIndexOfVisitNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "visitNotes");
          final int _cursorIndexOfBeforeImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "beforeImageUrl");
          final int _cursorIndexOfAfterImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "afterImageUrl");
          final int _cursorIndexOfCleaningNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningNumber");
          final int _cursorIndexOfTimeSlot = CursorUtil.getColumnIndexOrThrow(_cursor, "timeSlot");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AmcVisitEntity> _result = new ArrayList<AmcVisitEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AmcVisitEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpScheduledDate;
            _tmpScheduledDate = _cursor.getString(_cursorIndexOfScheduledDate);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final String _tmpCompletedByEmployeeId;
            if (_cursor.isNull(_cursorIndexOfCompletedByEmployeeId)) {
              _tmpCompletedByEmployeeId = null;
            } else {
              _tmpCompletedByEmployeeId = _cursor.getString(_cursorIndexOfCompletedByEmployeeId);
            }
            final String _tmpCompletedByName;
            if (_cursor.isNull(_cursorIndexOfCompletedByName)) {
              _tmpCompletedByName = null;
            } else {
              _tmpCompletedByName = _cursor.getString(_cursorIndexOfCompletedByName);
            }
            final String _tmpVisitNotes;
            if (_cursor.isNull(_cursorIndexOfVisitNotes)) {
              _tmpVisitNotes = null;
            } else {
              _tmpVisitNotes = _cursor.getString(_cursorIndexOfVisitNotes);
            }
            final String _tmpBeforeImageUrl;
            if (_cursor.isNull(_cursorIndexOfBeforeImageUrl)) {
              _tmpBeforeImageUrl = null;
            } else {
              _tmpBeforeImageUrl = _cursor.getString(_cursorIndexOfBeforeImageUrl);
            }
            final String _tmpAfterImageUrl;
            if (_cursor.isNull(_cursorIndexOfAfterImageUrl)) {
              _tmpAfterImageUrl = null;
            } else {
              _tmpAfterImageUrl = _cursor.getString(_cursorIndexOfAfterImageUrl);
            }
            final Integer _tmpCleaningNumber;
            if (_cursor.isNull(_cursorIndexOfCleaningNumber)) {
              _tmpCleaningNumber = null;
            } else {
              _tmpCleaningNumber = _cursor.getInt(_cursorIndexOfCleaningNumber);
            }
            final String _tmpTimeSlot;
            if (_cursor.isNull(_cursorIndexOfTimeSlot)) {
              _tmpTimeSlot = null;
            } else {
              _tmpTimeSlot = _cursor.getString(_cursorIndexOfTimeSlot);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AmcVisitEntity(_tmpId,_tmpCustomerId,_tmpScheduledDate,_tmpStatus,_tmpCompletedAt,_tmpNotes,_tmpAssignedEmployeeId,_tmpCompletedByEmployeeId,_tmpCompletedByName,_tmpVisitNotes,_tmpBeforeImageUrl,_tmpAfterImageUrl,_tmpCleaningNumber,_tmpTimeSlot,_tmpIsSynced);
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
  public Flow<List<AmcVisitEntity>> getAmcVisitsByStatus(final String status) {
    final String _sql = "SELECT * FROM amc_visits WHERE status = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"amc_visits"}, new Callable<List<AmcVisitEntity>>() {
      @Override
      @NonNull
      public List<AmcVisitEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfScheduledDate = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCompletedByEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByEmployeeId");
          final int _cursorIndexOfCompletedByName = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByName");
          final int _cursorIndexOfVisitNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "visitNotes");
          final int _cursorIndexOfBeforeImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "beforeImageUrl");
          final int _cursorIndexOfAfterImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "afterImageUrl");
          final int _cursorIndexOfCleaningNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningNumber");
          final int _cursorIndexOfTimeSlot = CursorUtil.getColumnIndexOrThrow(_cursor, "timeSlot");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AmcVisitEntity> _result = new ArrayList<AmcVisitEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AmcVisitEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpScheduledDate;
            _tmpScheduledDate = _cursor.getString(_cursorIndexOfScheduledDate);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final String _tmpCompletedByEmployeeId;
            if (_cursor.isNull(_cursorIndexOfCompletedByEmployeeId)) {
              _tmpCompletedByEmployeeId = null;
            } else {
              _tmpCompletedByEmployeeId = _cursor.getString(_cursorIndexOfCompletedByEmployeeId);
            }
            final String _tmpCompletedByName;
            if (_cursor.isNull(_cursorIndexOfCompletedByName)) {
              _tmpCompletedByName = null;
            } else {
              _tmpCompletedByName = _cursor.getString(_cursorIndexOfCompletedByName);
            }
            final String _tmpVisitNotes;
            if (_cursor.isNull(_cursorIndexOfVisitNotes)) {
              _tmpVisitNotes = null;
            } else {
              _tmpVisitNotes = _cursor.getString(_cursorIndexOfVisitNotes);
            }
            final String _tmpBeforeImageUrl;
            if (_cursor.isNull(_cursorIndexOfBeforeImageUrl)) {
              _tmpBeforeImageUrl = null;
            } else {
              _tmpBeforeImageUrl = _cursor.getString(_cursorIndexOfBeforeImageUrl);
            }
            final String _tmpAfterImageUrl;
            if (_cursor.isNull(_cursorIndexOfAfterImageUrl)) {
              _tmpAfterImageUrl = null;
            } else {
              _tmpAfterImageUrl = _cursor.getString(_cursorIndexOfAfterImageUrl);
            }
            final Integer _tmpCleaningNumber;
            if (_cursor.isNull(_cursorIndexOfCleaningNumber)) {
              _tmpCleaningNumber = null;
            } else {
              _tmpCleaningNumber = _cursor.getInt(_cursorIndexOfCleaningNumber);
            }
            final String _tmpTimeSlot;
            if (_cursor.isNull(_cursorIndexOfTimeSlot)) {
              _tmpTimeSlot = null;
            } else {
              _tmpTimeSlot = _cursor.getString(_cursorIndexOfTimeSlot);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AmcVisitEntity(_tmpId,_tmpCustomerId,_tmpScheduledDate,_tmpStatus,_tmpCompletedAt,_tmpNotes,_tmpAssignedEmployeeId,_tmpCompletedByEmployeeId,_tmpCompletedByName,_tmpVisitNotes,_tmpBeforeImageUrl,_tmpAfterImageUrl,_tmpCleaningNumber,_tmpTimeSlot,_tmpIsSynced);
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
  public Flow<List<AmcVisitEntity>> getAmcVisitsByEmployee(final String employeeId) {
    final String _sql = "SELECT * FROM amc_visits WHERE assignedEmployeeId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, employeeId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"amc_visits"}, new Callable<List<AmcVisitEntity>>() {
      @Override
      @NonNull
      public List<AmcVisitEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfScheduledDate = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCompletedByEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByEmployeeId");
          final int _cursorIndexOfCompletedByName = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByName");
          final int _cursorIndexOfVisitNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "visitNotes");
          final int _cursorIndexOfBeforeImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "beforeImageUrl");
          final int _cursorIndexOfAfterImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "afterImageUrl");
          final int _cursorIndexOfCleaningNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningNumber");
          final int _cursorIndexOfTimeSlot = CursorUtil.getColumnIndexOrThrow(_cursor, "timeSlot");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AmcVisitEntity> _result = new ArrayList<AmcVisitEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AmcVisitEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpScheduledDate;
            _tmpScheduledDate = _cursor.getString(_cursorIndexOfScheduledDate);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final String _tmpCompletedByEmployeeId;
            if (_cursor.isNull(_cursorIndexOfCompletedByEmployeeId)) {
              _tmpCompletedByEmployeeId = null;
            } else {
              _tmpCompletedByEmployeeId = _cursor.getString(_cursorIndexOfCompletedByEmployeeId);
            }
            final String _tmpCompletedByName;
            if (_cursor.isNull(_cursorIndexOfCompletedByName)) {
              _tmpCompletedByName = null;
            } else {
              _tmpCompletedByName = _cursor.getString(_cursorIndexOfCompletedByName);
            }
            final String _tmpVisitNotes;
            if (_cursor.isNull(_cursorIndexOfVisitNotes)) {
              _tmpVisitNotes = null;
            } else {
              _tmpVisitNotes = _cursor.getString(_cursorIndexOfVisitNotes);
            }
            final String _tmpBeforeImageUrl;
            if (_cursor.isNull(_cursorIndexOfBeforeImageUrl)) {
              _tmpBeforeImageUrl = null;
            } else {
              _tmpBeforeImageUrl = _cursor.getString(_cursorIndexOfBeforeImageUrl);
            }
            final String _tmpAfterImageUrl;
            if (_cursor.isNull(_cursorIndexOfAfterImageUrl)) {
              _tmpAfterImageUrl = null;
            } else {
              _tmpAfterImageUrl = _cursor.getString(_cursorIndexOfAfterImageUrl);
            }
            final Integer _tmpCleaningNumber;
            if (_cursor.isNull(_cursorIndexOfCleaningNumber)) {
              _tmpCleaningNumber = null;
            } else {
              _tmpCleaningNumber = _cursor.getInt(_cursorIndexOfCleaningNumber);
            }
            final String _tmpTimeSlot;
            if (_cursor.isNull(_cursorIndexOfTimeSlot)) {
              _tmpTimeSlot = null;
            } else {
              _tmpTimeSlot = _cursor.getString(_cursorIndexOfTimeSlot);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AmcVisitEntity(_tmpId,_tmpCustomerId,_tmpScheduledDate,_tmpStatus,_tmpCompletedAt,_tmpNotes,_tmpAssignedEmployeeId,_tmpCompletedByEmployeeId,_tmpCompletedByName,_tmpVisitNotes,_tmpBeforeImageUrl,_tmpAfterImageUrl,_tmpCleaningNumber,_tmpTimeSlot,_tmpIsSynced);
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
  public Object getUnsyncedAmcVisits(final Continuation<? super List<AmcVisitEntity>> $completion) {
    final String _sql = "SELECT * FROM amc_visits WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<AmcVisitEntity>>() {
      @Override
      @NonNull
      public List<AmcVisitEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfScheduledDate = CursorUtil.getColumnIndexOrThrow(_cursor, "scheduledDate");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfCompletedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "completedAt");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfAssignedEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedEmployeeId");
          final int _cursorIndexOfCompletedByEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByEmployeeId");
          final int _cursorIndexOfCompletedByName = CursorUtil.getColumnIndexOrThrow(_cursor, "completedByName");
          final int _cursorIndexOfVisitNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "visitNotes");
          final int _cursorIndexOfBeforeImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "beforeImageUrl");
          final int _cursorIndexOfAfterImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "afterImageUrl");
          final int _cursorIndexOfCleaningNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "cleaningNumber");
          final int _cursorIndexOfTimeSlot = CursorUtil.getColumnIndexOrThrow(_cursor, "timeSlot");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<AmcVisitEntity> _result = new ArrayList<AmcVisitEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AmcVisitEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpScheduledDate;
            _tmpScheduledDate = _cursor.getString(_cursorIndexOfScheduledDate);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final String _tmpCompletedAt;
            if (_cursor.isNull(_cursorIndexOfCompletedAt)) {
              _tmpCompletedAt = null;
            } else {
              _tmpCompletedAt = _cursor.getString(_cursorIndexOfCompletedAt);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpAssignedEmployeeId;
            if (_cursor.isNull(_cursorIndexOfAssignedEmployeeId)) {
              _tmpAssignedEmployeeId = null;
            } else {
              _tmpAssignedEmployeeId = _cursor.getString(_cursorIndexOfAssignedEmployeeId);
            }
            final String _tmpCompletedByEmployeeId;
            if (_cursor.isNull(_cursorIndexOfCompletedByEmployeeId)) {
              _tmpCompletedByEmployeeId = null;
            } else {
              _tmpCompletedByEmployeeId = _cursor.getString(_cursorIndexOfCompletedByEmployeeId);
            }
            final String _tmpCompletedByName;
            if (_cursor.isNull(_cursorIndexOfCompletedByName)) {
              _tmpCompletedByName = null;
            } else {
              _tmpCompletedByName = _cursor.getString(_cursorIndexOfCompletedByName);
            }
            final String _tmpVisitNotes;
            if (_cursor.isNull(_cursorIndexOfVisitNotes)) {
              _tmpVisitNotes = null;
            } else {
              _tmpVisitNotes = _cursor.getString(_cursorIndexOfVisitNotes);
            }
            final String _tmpBeforeImageUrl;
            if (_cursor.isNull(_cursorIndexOfBeforeImageUrl)) {
              _tmpBeforeImageUrl = null;
            } else {
              _tmpBeforeImageUrl = _cursor.getString(_cursorIndexOfBeforeImageUrl);
            }
            final String _tmpAfterImageUrl;
            if (_cursor.isNull(_cursorIndexOfAfterImageUrl)) {
              _tmpAfterImageUrl = null;
            } else {
              _tmpAfterImageUrl = _cursor.getString(_cursorIndexOfAfterImageUrl);
            }
            final Integer _tmpCleaningNumber;
            if (_cursor.isNull(_cursorIndexOfCleaningNumber)) {
              _tmpCleaningNumber = null;
            } else {
              _tmpCleaningNumber = _cursor.getInt(_cursorIndexOfCleaningNumber);
            }
            final String _tmpTimeSlot;
            if (_cursor.isNull(_cursorIndexOfTimeSlot)) {
              _tmpTimeSlot = null;
            } else {
              _tmpTimeSlot = _cursor.getString(_cursorIndexOfTimeSlot);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new AmcVisitEntity(_tmpId,_tmpCustomerId,_tmpScheduledDate,_tmpStatus,_tmpCompletedAt,_tmpNotes,_tmpAssignedEmployeeId,_tmpCompletedByEmployeeId,_tmpCompletedByName,_tmpVisitNotes,_tmpBeforeImageUrl,_tmpAfterImageUrl,_tmpCleaningNumber,_tmpTimeSlot,_tmpIsSynced);
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
