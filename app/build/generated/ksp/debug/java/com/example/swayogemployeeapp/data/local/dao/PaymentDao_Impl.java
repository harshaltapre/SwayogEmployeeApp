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
import com.example.swayogemployeeapp.data.local.entity.PaymentEntity;
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
public final class PaymentDao_Impl implements PaymentDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<PaymentEntity> __insertionAdapterOfPaymentEntity;

  private final EntityDeletionOrUpdateAdapter<PaymentEntity> __deletionAdapterOfPaymentEntity;

  private final EntityDeletionOrUpdateAdapter<PaymentEntity> __updateAdapterOfPaymentEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllPayments;

  public PaymentDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPaymentEntity = new EntityInsertionAdapter<PaymentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `payments` (`id`,`taskId`,`customerId`,`amount`,`paymentMethod`,`paymentStatus`,`transactionId`,`paidBy`,`paidAt`,`processedBy`,`notes`,`createdAt`,`updatedAt`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PaymentEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindLong(3, entity.getCustomerId());
        statement.bindDouble(4, entity.getAmount());
        if (entity.getPaymentMethod() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getPaymentMethod());
        }
        statement.bindString(6, entity.getPaymentStatus());
        if (entity.getTransactionId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getTransactionId());
        }
        if (entity.getPaidBy() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getPaidBy());
        }
        if (entity.getPaidAt() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getPaidAt());
        }
        if (entity.getProcessedBy() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getProcessedBy());
        }
        if (entity.getNotes() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getNotes());
        }
        statement.bindString(12, entity.getCreatedAt());
        statement.bindString(13, entity.getUpdatedAt());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(14, _tmp);
      }
    };
    this.__deletionAdapterOfPaymentEntity = new EntityDeletionOrUpdateAdapter<PaymentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `payments` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PaymentEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfPaymentEntity = new EntityDeletionOrUpdateAdapter<PaymentEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `payments` SET `id` = ?,`taskId` = ?,`customerId` = ?,`amount` = ?,`paymentMethod` = ?,`paymentStatus` = ?,`transactionId` = ?,`paidBy` = ?,`paidAt` = ?,`processedBy` = ?,`notes` = ?,`createdAt` = ?,`updatedAt` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PaymentEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindLong(3, entity.getCustomerId());
        statement.bindDouble(4, entity.getAmount());
        if (entity.getPaymentMethod() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getPaymentMethod());
        }
        statement.bindString(6, entity.getPaymentStatus());
        if (entity.getTransactionId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getTransactionId());
        }
        if (entity.getPaidBy() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getPaidBy());
        }
        if (entity.getPaidAt() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getPaidAt());
        }
        if (entity.getProcessedBy() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getProcessedBy());
        }
        if (entity.getNotes() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getNotes());
        }
        statement.bindString(12, entity.getCreatedAt());
        statement.bindString(13, entity.getUpdatedAt());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(14, _tmp);
        statement.bindString(15, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllPayments = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM payments";
        return _query;
      }
    };
  }

  @Override
  public Object insertPayment(final PaymentEntity payment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPaymentEntity.insert(payment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertPayments(final List<PaymentEntity> payments,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPaymentEntity.insert(payments);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deletePayment(final PaymentEntity payment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfPaymentEntity.handle(payment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updatePayment(final PaymentEntity payment,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfPaymentEntity.handle(payment);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllPayments(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllPayments.acquire();
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
          __preparedStmtOfDeleteAllPayments.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<PaymentEntity>> getAllPayments() {
    final String _sql = "SELECT * FROM payments";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"payments"}, new Callable<List<PaymentEntity>>() {
      @Override
      @NonNull
      public List<PaymentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfTransactionId = CursorUtil.getColumnIndexOrThrow(_cursor, "transactionId");
          final int _cursorIndexOfPaidBy = CursorUtil.getColumnIndexOrThrow(_cursor, "paidBy");
          final int _cursorIndexOfPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "paidAt");
          final int _cursorIndexOfProcessedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "processedBy");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PaymentEntity> _result = new ArrayList<PaymentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PaymentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final String _tmpTransactionId;
            if (_cursor.isNull(_cursorIndexOfTransactionId)) {
              _tmpTransactionId = null;
            } else {
              _tmpTransactionId = _cursor.getString(_cursorIndexOfTransactionId);
            }
            final String _tmpPaidBy;
            if (_cursor.isNull(_cursorIndexOfPaidBy)) {
              _tmpPaidBy = null;
            } else {
              _tmpPaidBy = _cursor.getString(_cursorIndexOfPaidBy);
            }
            final String _tmpPaidAt;
            if (_cursor.isNull(_cursorIndexOfPaidAt)) {
              _tmpPaidAt = null;
            } else {
              _tmpPaidAt = _cursor.getString(_cursorIndexOfPaidAt);
            }
            final String _tmpProcessedBy;
            if (_cursor.isNull(_cursorIndexOfProcessedBy)) {
              _tmpProcessedBy = null;
            } else {
              _tmpProcessedBy = _cursor.getString(_cursorIndexOfProcessedBy);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PaymentEntity(_tmpId,_tmpTaskId,_tmpCustomerId,_tmpAmount,_tmpPaymentMethod,_tmpPaymentStatus,_tmpTransactionId,_tmpPaidBy,_tmpPaidAt,_tmpProcessedBy,_tmpNotes,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Object getPaymentById(final String id,
      final Continuation<? super PaymentEntity> $completion) {
    final String _sql = "SELECT * FROM payments WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<PaymentEntity>() {
      @Override
      @Nullable
      public PaymentEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfTransactionId = CursorUtil.getColumnIndexOrThrow(_cursor, "transactionId");
          final int _cursorIndexOfPaidBy = CursorUtil.getColumnIndexOrThrow(_cursor, "paidBy");
          final int _cursorIndexOfPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "paidAt");
          final int _cursorIndexOfProcessedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "processedBy");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final PaymentEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final String _tmpTransactionId;
            if (_cursor.isNull(_cursorIndexOfTransactionId)) {
              _tmpTransactionId = null;
            } else {
              _tmpTransactionId = _cursor.getString(_cursorIndexOfTransactionId);
            }
            final String _tmpPaidBy;
            if (_cursor.isNull(_cursorIndexOfPaidBy)) {
              _tmpPaidBy = null;
            } else {
              _tmpPaidBy = _cursor.getString(_cursorIndexOfPaidBy);
            }
            final String _tmpPaidAt;
            if (_cursor.isNull(_cursorIndexOfPaidAt)) {
              _tmpPaidAt = null;
            } else {
              _tmpPaidAt = _cursor.getString(_cursorIndexOfPaidAt);
            }
            final String _tmpProcessedBy;
            if (_cursor.isNull(_cursorIndexOfProcessedBy)) {
              _tmpProcessedBy = null;
            } else {
              _tmpProcessedBy = _cursor.getString(_cursorIndexOfProcessedBy);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new PaymentEntity(_tmpId,_tmpTaskId,_tmpCustomerId,_tmpAmount,_tmpPaymentMethod,_tmpPaymentStatus,_tmpTransactionId,_tmpPaidBy,_tmpPaidAt,_tmpProcessedBy,_tmpNotes,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Flow<List<PaymentEntity>> getPaymentsByTask(final int taskId) {
    final String _sql = "SELECT * FROM payments WHERE taskId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, taskId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"payments"}, new Callable<List<PaymentEntity>>() {
      @Override
      @NonNull
      public List<PaymentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfTransactionId = CursorUtil.getColumnIndexOrThrow(_cursor, "transactionId");
          final int _cursorIndexOfPaidBy = CursorUtil.getColumnIndexOrThrow(_cursor, "paidBy");
          final int _cursorIndexOfPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "paidAt");
          final int _cursorIndexOfProcessedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "processedBy");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PaymentEntity> _result = new ArrayList<PaymentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PaymentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final String _tmpTransactionId;
            if (_cursor.isNull(_cursorIndexOfTransactionId)) {
              _tmpTransactionId = null;
            } else {
              _tmpTransactionId = _cursor.getString(_cursorIndexOfTransactionId);
            }
            final String _tmpPaidBy;
            if (_cursor.isNull(_cursorIndexOfPaidBy)) {
              _tmpPaidBy = null;
            } else {
              _tmpPaidBy = _cursor.getString(_cursorIndexOfPaidBy);
            }
            final String _tmpPaidAt;
            if (_cursor.isNull(_cursorIndexOfPaidAt)) {
              _tmpPaidAt = null;
            } else {
              _tmpPaidAt = _cursor.getString(_cursorIndexOfPaidAt);
            }
            final String _tmpProcessedBy;
            if (_cursor.isNull(_cursorIndexOfProcessedBy)) {
              _tmpProcessedBy = null;
            } else {
              _tmpProcessedBy = _cursor.getString(_cursorIndexOfProcessedBy);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PaymentEntity(_tmpId,_tmpTaskId,_tmpCustomerId,_tmpAmount,_tmpPaymentMethod,_tmpPaymentStatus,_tmpTransactionId,_tmpPaidBy,_tmpPaidAt,_tmpProcessedBy,_tmpNotes,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Flow<List<PaymentEntity>> getPaymentsByCustomer(final int customerId) {
    final String _sql = "SELECT * FROM payments WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"payments"}, new Callable<List<PaymentEntity>>() {
      @Override
      @NonNull
      public List<PaymentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfTransactionId = CursorUtil.getColumnIndexOrThrow(_cursor, "transactionId");
          final int _cursorIndexOfPaidBy = CursorUtil.getColumnIndexOrThrow(_cursor, "paidBy");
          final int _cursorIndexOfPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "paidAt");
          final int _cursorIndexOfProcessedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "processedBy");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PaymentEntity> _result = new ArrayList<PaymentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PaymentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final String _tmpTransactionId;
            if (_cursor.isNull(_cursorIndexOfTransactionId)) {
              _tmpTransactionId = null;
            } else {
              _tmpTransactionId = _cursor.getString(_cursorIndexOfTransactionId);
            }
            final String _tmpPaidBy;
            if (_cursor.isNull(_cursorIndexOfPaidBy)) {
              _tmpPaidBy = null;
            } else {
              _tmpPaidBy = _cursor.getString(_cursorIndexOfPaidBy);
            }
            final String _tmpPaidAt;
            if (_cursor.isNull(_cursorIndexOfPaidAt)) {
              _tmpPaidAt = null;
            } else {
              _tmpPaidAt = _cursor.getString(_cursorIndexOfPaidAt);
            }
            final String _tmpProcessedBy;
            if (_cursor.isNull(_cursorIndexOfProcessedBy)) {
              _tmpProcessedBy = null;
            } else {
              _tmpProcessedBy = _cursor.getString(_cursorIndexOfProcessedBy);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PaymentEntity(_tmpId,_tmpTaskId,_tmpCustomerId,_tmpAmount,_tmpPaymentMethod,_tmpPaymentStatus,_tmpTransactionId,_tmpPaidBy,_tmpPaidAt,_tmpProcessedBy,_tmpNotes,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Flow<List<PaymentEntity>> getPaymentsByStatus(final String status) {
    final String _sql = "SELECT * FROM payments WHERE paymentStatus = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"payments"}, new Callable<List<PaymentEntity>>() {
      @Override
      @NonNull
      public List<PaymentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfTransactionId = CursorUtil.getColumnIndexOrThrow(_cursor, "transactionId");
          final int _cursorIndexOfPaidBy = CursorUtil.getColumnIndexOrThrow(_cursor, "paidBy");
          final int _cursorIndexOfPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "paidAt");
          final int _cursorIndexOfProcessedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "processedBy");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PaymentEntity> _result = new ArrayList<PaymentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PaymentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final String _tmpTransactionId;
            if (_cursor.isNull(_cursorIndexOfTransactionId)) {
              _tmpTransactionId = null;
            } else {
              _tmpTransactionId = _cursor.getString(_cursorIndexOfTransactionId);
            }
            final String _tmpPaidBy;
            if (_cursor.isNull(_cursorIndexOfPaidBy)) {
              _tmpPaidBy = null;
            } else {
              _tmpPaidBy = _cursor.getString(_cursorIndexOfPaidBy);
            }
            final String _tmpPaidAt;
            if (_cursor.isNull(_cursorIndexOfPaidAt)) {
              _tmpPaidAt = null;
            } else {
              _tmpPaidAt = _cursor.getString(_cursorIndexOfPaidAt);
            }
            final String _tmpProcessedBy;
            if (_cursor.isNull(_cursorIndexOfProcessedBy)) {
              _tmpProcessedBy = null;
            } else {
              _tmpProcessedBy = _cursor.getString(_cursorIndexOfProcessedBy);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PaymentEntity(_tmpId,_tmpTaskId,_tmpCustomerId,_tmpAmount,_tmpPaymentMethod,_tmpPaymentStatus,_tmpTransactionId,_tmpPaidBy,_tmpPaidAt,_tmpProcessedBy,_tmpNotes,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
  public Object getUnsyncedPayments(final Continuation<? super List<PaymentEntity>> $completion) {
    final String _sql = "SELECT * FROM payments WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PaymentEntity>>() {
      @Override
      @NonNull
      public List<PaymentEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfTransactionId = CursorUtil.getColumnIndexOrThrow(_cursor, "transactionId");
          final int _cursorIndexOfPaidBy = CursorUtil.getColumnIndexOrThrow(_cursor, "paidBy");
          final int _cursorIndexOfPaidAt = CursorUtil.getColumnIndexOrThrow(_cursor, "paidAt");
          final int _cursorIndexOfProcessedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "processedBy");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<PaymentEntity> _result = new ArrayList<PaymentEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PaymentEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final String _tmpTransactionId;
            if (_cursor.isNull(_cursorIndexOfTransactionId)) {
              _tmpTransactionId = null;
            } else {
              _tmpTransactionId = _cursor.getString(_cursorIndexOfTransactionId);
            }
            final String _tmpPaidBy;
            if (_cursor.isNull(_cursorIndexOfPaidBy)) {
              _tmpPaidBy = null;
            } else {
              _tmpPaidBy = _cursor.getString(_cursorIndexOfPaidBy);
            }
            final String _tmpPaidAt;
            if (_cursor.isNull(_cursorIndexOfPaidAt)) {
              _tmpPaidAt = null;
            } else {
              _tmpPaidAt = _cursor.getString(_cursorIndexOfPaidAt);
            }
            final String _tmpProcessedBy;
            if (_cursor.isNull(_cursorIndexOfProcessedBy)) {
              _tmpProcessedBy = null;
            } else {
              _tmpProcessedBy = _cursor.getString(_cursorIndexOfProcessedBy);
            }
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new PaymentEntity(_tmpId,_tmpTaskId,_tmpCustomerId,_tmpAmount,_tmpPaymentMethod,_tmpPaymentStatus,_tmpTransactionId,_tmpPaidBy,_tmpPaidAt,_tmpProcessedBy,_tmpNotes,_tmpCreatedAt,_tmpUpdatedAt,_tmpIsSynced);
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
