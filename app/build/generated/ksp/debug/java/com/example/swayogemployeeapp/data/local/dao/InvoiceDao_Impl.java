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
import com.example.swayogemployeeapp.data.local.entity.InvoiceEntity;
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
public final class InvoiceDao_Impl implements InvoiceDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<InvoiceEntity> __insertionAdapterOfInvoiceEntity;

  private final EntityDeletionOrUpdateAdapter<InvoiceEntity> __deletionAdapterOfInvoiceEntity;

  private final EntityDeletionOrUpdateAdapter<InvoiceEntity> __updateAdapterOfInvoiceEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllInvoices;

  public InvoiceDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfInvoiceEntity = new EntityInsertionAdapter<InvoiceEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `invoices` (`id`,`invoiceNumber`,`customerId`,`invoiceType`,`amount`,`paymentStatus`,`amountPaid`,`invoiceDate`,`paymentDate`,`zone`,`state`,`partnerId`,`createdAt`,`updatedAt`,`description`,`paymentMethod`,`proofUrl`,`isSynced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final InvoiceEntity entity) {
        statement.bindString(1, entity.getId());
        if (entity.getInvoiceNumber() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getInvoiceNumber());
        }
        statement.bindLong(3, entity.getCustomerId());
        statement.bindString(4, entity.getInvoiceType());
        statement.bindDouble(5, entity.getAmount());
        statement.bindString(6, entity.getPaymentStatus());
        statement.bindDouble(7, entity.getAmountPaid());
        statement.bindString(8, entity.getInvoiceDate());
        if (entity.getPaymentDate() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getPaymentDate());
        }
        if (entity.getZone() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getZone());
        }
        if (entity.getState() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getState());
        }
        if (entity.getPartnerId() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getPartnerId());
        }
        statement.bindString(13, entity.getCreatedAt());
        statement.bindString(14, entity.getUpdatedAt());
        if (entity.getDescription() == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.getDescription());
        }
        if (entity.getPaymentMethod() == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.getPaymentMethod());
        }
        if (entity.getProofUrl() == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.getProofUrl());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(18, _tmp);
      }
    };
    this.__deletionAdapterOfInvoiceEntity = new EntityDeletionOrUpdateAdapter<InvoiceEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `invoices` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final InvoiceEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfInvoiceEntity = new EntityDeletionOrUpdateAdapter<InvoiceEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `invoices` SET `id` = ?,`invoiceNumber` = ?,`customerId` = ?,`invoiceType` = ?,`amount` = ?,`paymentStatus` = ?,`amountPaid` = ?,`invoiceDate` = ?,`paymentDate` = ?,`zone` = ?,`state` = ?,`partnerId` = ?,`createdAt` = ?,`updatedAt` = ?,`description` = ?,`paymentMethod` = ?,`proofUrl` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final InvoiceEntity entity) {
        statement.bindString(1, entity.getId());
        if (entity.getInvoiceNumber() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getInvoiceNumber());
        }
        statement.bindLong(3, entity.getCustomerId());
        statement.bindString(4, entity.getInvoiceType());
        statement.bindDouble(5, entity.getAmount());
        statement.bindString(6, entity.getPaymentStatus());
        statement.bindDouble(7, entity.getAmountPaid());
        statement.bindString(8, entity.getInvoiceDate());
        if (entity.getPaymentDate() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getPaymentDate());
        }
        if (entity.getZone() == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.getZone());
        }
        if (entity.getState() == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.getState());
        }
        if (entity.getPartnerId() == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.getPartnerId());
        }
        statement.bindString(13, entity.getCreatedAt());
        statement.bindString(14, entity.getUpdatedAt());
        if (entity.getDescription() == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.getDescription());
        }
        if (entity.getPaymentMethod() == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.getPaymentMethod());
        }
        if (entity.getProofUrl() == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.getProofUrl());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(18, _tmp);
        statement.bindString(19, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllInvoices = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM invoices";
        return _query;
      }
    };
  }

  @Override
  public Object insertInvoice(final InvoiceEntity invoice,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfInvoiceEntity.insert(invoice);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertInvoices(final List<InvoiceEntity> invoices,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfInvoiceEntity.insert(invoices);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteInvoice(final InvoiceEntity invoice,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfInvoiceEntity.handle(invoice);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateInvoice(final InvoiceEntity invoice,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfInvoiceEntity.handle(invoice);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllInvoices(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllInvoices.acquire();
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
          __preparedStmtOfDeleteAllInvoices.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<InvoiceEntity>> getAllInvoices() {
    final String _sql = "SELECT * FROM invoices";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"invoices"}, new Callable<List<InvoiceEntity>>() {
      @Override
      @NonNull
      public List<InvoiceEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfInvoiceNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceNumber");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInvoiceType = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceType");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfAmountPaid = CursorUtil.getColumnIndexOrThrow(_cursor, "amountPaid");
          final int _cursorIndexOfInvoiceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceDate");
          final int _cursorIndexOfPaymentDate = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentDate");
          final int _cursorIndexOfZone = CursorUtil.getColumnIndexOrThrow(_cursor, "zone");
          final int _cursorIndexOfState = CursorUtil.getColumnIndexOrThrow(_cursor, "state");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "proofUrl");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<InvoiceEntity> _result = new ArrayList<InvoiceEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InvoiceEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpInvoiceNumber;
            if (_cursor.isNull(_cursorIndexOfInvoiceNumber)) {
              _tmpInvoiceNumber = null;
            } else {
              _tmpInvoiceNumber = _cursor.getString(_cursorIndexOfInvoiceNumber);
            }
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInvoiceType;
            _tmpInvoiceType = _cursor.getString(_cursorIndexOfInvoiceType);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final double _tmpAmountPaid;
            _tmpAmountPaid = _cursor.getDouble(_cursorIndexOfAmountPaid);
            final String _tmpInvoiceDate;
            _tmpInvoiceDate = _cursor.getString(_cursorIndexOfInvoiceDate);
            final String _tmpPaymentDate;
            if (_cursor.isNull(_cursorIndexOfPaymentDate)) {
              _tmpPaymentDate = null;
            } else {
              _tmpPaymentDate = _cursor.getString(_cursorIndexOfPaymentDate);
            }
            final String _tmpZone;
            if (_cursor.isNull(_cursorIndexOfZone)) {
              _tmpZone = null;
            } else {
              _tmpZone = _cursor.getString(_cursorIndexOfZone);
            }
            final String _tmpState;
            if (_cursor.isNull(_cursorIndexOfState)) {
              _tmpState = null;
            } else {
              _tmpState = _cursor.getString(_cursorIndexOfState);
            }
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final String _tmpDescription;
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _tmpDescription = null;
            } else {
              _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            }
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpProofUrl;
            if (_cursor.isNull(_cursorIndexOfProofUrl)) {
              _tmpProofUrl = null;
            } else {
              _tmpProofUrl = _cursor.getString(_cursorIndexOfProofUrl);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new InvoiceEntity(_tmpId,_tmpInvoiceNumber,_tmpCustomerId,_tmpInvoiceType,_tmpAmount,_tmpPaymentStatus,_tmpAmountPaid,_tmpInvoiceDate,_tmpPaymentDate,_tmpZone,_tmpState,_tmpPartnerId,_tmpCreatedAt,_tmpUpdatedAt,_tmpDescription,_tmpPaymentMethod,_tmpProofUrl,_tmpIsSynced);
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
  public Object getInvoiceById(final String id,
      final Continuation<? super InvoiceEntity> $completion) {
    final String _sql = "SELECT * FROM invoices WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<InvoiceEntity>() {
      @Override
      @Nullable
      public InvoiceEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfInvoiceNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceNumber");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInvoiceType = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceType");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfAmountPaid = CursorUtil.getColumnIndexOrThrow(_cursor, "amountPaid");
          final int _cursorIndexOfInvoiceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceDate");
          final int _cursorIndexOfPaymentDate = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentDate");
          final int _cursorIndexOfZone = CursorUtil.getColumnIndexOrThrow(_cursor, "zone");
          final int _cursorIndexOfState = CursorUtil.getColumnIndexOrThrow(_cursor, "state");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "proofUrl");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final InvoiceEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpInvoiceNumber;
            if (_cursor.isNull(_cursorIndexOfInvoiceNumber)) {
              _tmpInvoiceNumber = null;
            } else {
              _tmpInvoiceNumber = _cursor.getString(_cursorIndexOfInvoiceNumber);
            }
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInvoiceType;
            _tmpInvoiceType = _cursor.getString(_cursorIndexOfInvoiceType);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final double _tmpAmountPaid;
            _tmpAmountPaid = _cursor.getDouble(_cursorIndexOfAmountPaid);
            final String _tmpInvoiceDate;
            _tmpInvoiceDate = _cursor.getString(_cursorIndexOfInvoiceDate);
            final String _tmpPaymentDate;
            if (_cursor.isNull(_cursorIndexOfPaymentDate)) {
              _tmpPaymentDate = null;
            } else {
              _tmpPaymentDate = _cursor.getString(_cursorIndexOfPaymentDate);
            }
            final String _tmpZone;
            if (_cursor.isNull(_cursorIndexOfZone)) {
              _tmpZone = null;
            } else {
              _tmpZone = _cursor.getString(_cursorIndexOfZone);
            }
            final String _tmpState;
            if (_cursor.isNull(_cursorIndexOfState)) {
              _tmpState = null;
            } else {
              _tmpState = _cursor.getString(_cursorIndexOfState);
            }
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final String _tmpDescription;
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _tmpDescription = null;
            } else {
              _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            }
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpProofUrl;
            if (_cursor.isNull(_cursorIndexOfProofUrl)) {
              _tmpProofUrl = null;
            } else {
              _tmpProofUrl = _cursor.getString(_cursorIndexOfProofUrl);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new InvoiceEntity(_tmpId,_tmpInvoiceNumber,_tmpCustomerId,_tmpInvoiceType,_tmpAmount,_tmpPaymentStatus,_tmpAmountPaid,_tmpInvoiceDate,_tmpPaymentDate,_tmpZone,_tmpState,_tmpPartnerId,_tmpCreatedAt,_tmpUpdatedAt,_tmpDescription,_tmpPaymentMethod,_tmpProofUrl,_tmpIsSynced);
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
  public Flow<List<InvoiceEntity>> getInvoicesByCustomer(final int customerId) {
    final String _sql = "SELECT * FROM invoices WHERE customerId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, customerId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"invoices"}, new Callable<List<InvoiceEntity>>() {
      @Override
      @NonNull
      public List<InvoiceEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfInvoiceNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceNumber");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInvoiceType = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceType");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfAmountPaid = CursorUtil.getColumnIndexOrThrow(_cursor, "amountPaid");
          final int _cursorIndexOfInvoiceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceDate");
          final int _cursorIndexOfPaymentDate = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentDate");
          final int _cursorIndexOfZone = CursorUtil.getColumnIndexOrThrow(_cursor, "zone");
          final int _cursorIndexOfState = CursorUtil.getColumnIndexOrThrow(_cursor, "state");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "proofUrl");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<InvoiceEntity> _result = new ArrayList<InvoiceEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InvoiceEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpInvoiceNumber;
            if (_cursor.isNull(_cursorIndexOfInvoiceNumber)) {
              _tmpInvoiceNumber = null;
            } else {
              _tmpInvoiceNumber = _cursor.getString(_cursorIndexOfInvoiceNumber);
            }
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInvoiceType;
            _tmpInvoiceType = _cursor.getString(_cursorIndexOfInvoiceType);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final double _tmpAmountPaid;
            _tmpAmountPaid = _cursor.getDouble(_cursorIndexOfAmountPaid);
            final String _tmpInvoiceDate;
            _tmpInvoiceDate = _cursor.getString(_cursorIndexOfInvoiceDate);
            final String _tmpPaymentDate;
            if (_cursor.isNull(_cursorIndexOfPaymentDate)) {
              _tmpPaymentDate = null;
            } else {
              _tmpPaymentDate = _cursor.getString(_cursorIndexOfPaymentDate);
            }
            final String _tmpZone;
            if (_cursor.isNull(_cursorIndexOfZone)) {
              _tmpZone = null;
            } else {
              _tmpZone = _cursor.getString(_cursorIndexOfZone);
            }
            final String _tmpState;
            if (_cursor.isNull(_cursorIndexOfState)) {
              _tmpState = null;
            } else {
              _tmpState = _cursor.getString(_cursorIndexOfState);
            }
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final String _tmpDescription;
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _tmpDescription = null;
            } else {
              _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            }
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpProofUrl;
            if (_cursor.isNull(_cursorIndexOfProofUrl)) {
              _tmpProofUrl = null;
            } else {
              _tmpProofUrl = _cursor.getString(_cursorIndexOfProofUrl);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new InvoiceEntity(_tmpId,_tmpInvoiceNumber,_tmpCustomerId,_tmpInvoiceType,_tmpAmount,_tmpPaymentStatus,_tmpAmountPaid,_tmpInvoiceDate,_tmpPaymentDate,_tmpZone,_tmpState,_tmpPartnerId,_tmpCreatedAt,_tmpUpdatedAt,_tmpDescription,_tmpPaymentMethod,_tmpProofUrl,_tmpIsSynced);
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
  public Flow<List<InvoiceEntity>> getInvoicesByStatus(final String status) {
    final String _sql = "SELECT * FROM invoices WHERE paymentStatus = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, status);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"invoices"}, new Callable<List<InvoiceEntity>>() {
      @Override
      @NonNull
      public List<InvoiceEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfInvoiceNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceNumber");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInvoiceType = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceType");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfAmountPaid = CursorUtil.getColumnIndexOrThrow(_cursor, "amountPaid");
          final int _cursorIndexOfInvoiceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceDate");
          final int _cursorIndexOfPaymentDate = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentDate");
          final int _cursorIndexOfZone = CursorUtil.getColumnIndexOrThrow(_cursor, "zone");
          final int _cursorIndexOfState = CursorUtil.getColumnIndexOrThrow(_cursor, "state");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "proofUrl");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<InvoiceEntity> _result = new ArrayList<InvoiceEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InvoiceEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpInvoiceNumber;
            if (_cursor.isNull(_cursorIndexOfInvoiceNumber)) {
              _tmpInvoiceNumber = null;
            } else {
              _tmpInvoiceNumber = _cursor.getString(_cursorIndexOfInvoiceNumber);
            }
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInvoiceType;
            _tmpInvoiceType = _cursor.getString(_cursorIndexOfInvoiceType);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final double _tmpAmountPaid;
            _tmpAmountPaid = _cursor.getDouble(_cursorIndexOfAmountPaid);
            final String _tmpInvoiceDate;
            _tmpInvoiceDate = _cursor.getString(_cursorIndexOfInvoiceDate);
            final String _tmpPaymentDate;
            if (_cursor.isNull(_cursorIndexOfPaymentDate)) {
              _tmpPaymentDate = null;
            } else {
              _tmpPaymentDate = _cursor.getString(_cursorIndexOfPaymentDate);
            }
            final String _tmpZone;
            if (_cursor.isNull(_cursorIndexOfZone)) {
              _tmpZone = null;
            } else {
              _tmpZone = _cursor.getString(_cursorIndexOfZone);
            }
            final String _tmpState;
            if (_cursor.isNull(_cursorIndexOfState)) {
              _tmpState = null;
            } else {
              _tmpState = _cursor.getString(_cursorIndexOfState);
            }
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final String _tmpDescription;
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _tmpDescription = null;
            } else {
              _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            }
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpProofUrl;
            if (_cursor.isNull(_cursorIndexOfProofUrl)) {
              _tmpProofUrl = null;
            } else {
              _tmpProofUrl = _cursor.getString(_cursorIndexOfProofUrl);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new InvoiceEntity(_tmpId,_tmpInvoiceNumber,_tmpCustomerId,_tmpInvoiceType,_tmpAmount,_tmpPaymentStatus,_tmpAmountPaid,_tmpInvoiceDate,_tmpPaymentDate,_tmpZone,_tmpState,_tmpPartnerId,_tmpCreatedAt,_tmpUpdatedAt,_tmpDescription,_tmpPaymentMethod,_tmpProofUrl,_tmpIsSynced);
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
  public Object getUnsyncedInvoices(final Continuation<? super List<InvoiceEntity>> $completion) {
    final String _sql = "SELECT * FROM invoices WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<InvoiceEntity>>() {
      @Override
      @NonNull
      public List<InvoiceEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfInvoiceNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceNumber");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfInvoiceType = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceType");
          final int _cursorIndexOfAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "amount");
          final int _cursorIndexOfPaymentStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentStatus");
          final int _cursorIndexOfAmountPaid = CursorUtil.getColumnIndexOrThrow(_cursor, "amountPaid");
          final int _cursorIndexOfInvoiceDate = CursorUtil.getColumnIndexOrThrow(_cursor, "invoiceDate");
          final int _cursorIndexOfPaymentDate = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentDate");
          final int _cursorIndexOfZone = CursorUtil.getColumnIndexOrThrow(_cursor, "zone");
          final int _cursorIndexOfState = CursorUtil.getColumnIndexOrThrow(_cursor, "state");
          final int _cursorIndexOfPartnerId = CursorUtil.getColumnIndexOrThrow(_cursor, "partnerId");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfProofUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "proofUrl");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<InvoiceEntity> _result = new ArrayList<InvoiceEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InvoiceEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpInvoiceNumber;
            if (_cursor.isNull(_cursorIndexOfInvoiceNumber)) {
              _tmpInvoiceNumber = null;
            } else {
              _tmpInvoiceNumber = _cursor.getString(_cursorIndexOfInvoiceNumber);
            }
            final int _tmpCustomerId;
            _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            final String _tmpInvoiceType;
            _tmpInvoiceType = _cursor.getString(_cursorIndexOfInvoiceType);
            final double _tmpAmount;
            _tmpAmount = _cursor.getDouble(_cursorIndexOfAmount);
            final String _tmpPaymentStatus;
            _tmpPaymentStatus = _cursor.getString(_cursorIndexOfPaymentStatus);
            final double _tmpAmountPaid;
            _tmpAmountPaid = _cursor.getDouble(_cursorIndexOfAmountPaid);
            final String _tmpInvoiceDate;
            _tmpInvoiceDate = _cursor.getString(_cursorIndexOfInvoiceDate);
            final String _tmpPaymentDate;
            if (_cursor.isNull(_cursorIndexOfPaymentDate)) {
              _tmpPaymentDate = null;
            } else {
              _tmpPaymentDate = _cursor.getString(_cursorIndexOfPaymentDate);
            }
            final String _tmpZone;
            if (_cursor.isNull(_cursorIndexOfZone)) {
              _tmpZone = null;
            } else {
              _tmpZone = _cursor.getString(_cursorIndexOfZone);
            }
            final String _tmpState;
            if (_cursor.isNull(_cursorIndexOfState)) {
              _tmpState = null;
            } else {
              _tmpState = _cursor.getString(_cursorIndexOfState);
            }
            final String _tmpPartnerId;
            if (_cursor.isNull(_cursorIndexOfPartnerId)) {
              _tmpPartnerId = null;
            } else {
              _tmpPartnerId = _cursor.getString(_cursorIndexOfPartnerId);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final String _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            final String _tmpDescription;
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _tmpDescription = null;
            } else {
              _tmpDescription = _cursor.getString(_cursorIndexOfDescription);
            }
            final String _tmpPaymentMethod;
            if (_cursor.isNull(_cursorIndexOfPaymentMethod)) {
              _tmpPaymentMethod = null;
            } else {
              _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            }
            final String _tmpProofUrl;
            if (_cursor.isNull(_cursorIndexOfProofUrl)) {
              _tmpProofUrl = null;
            } else {
              _tmpProofUrl = _cursor.getString(_cursorIndexOfProofUrl);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new InvoiceEntity(_tmpId,_tmpInvoiceNumber,_tmpCustomerId,_tmpInvoiceType,_tmpAmount,_tmpPaymentStatus,_tmpAmountPaid,_tmpInvoiceDate,_tmpPaymentDate,_tmpZone,_tmpState,_tmpPartnerId,_tmpCreatedAt,_tmpUpdatedAt,_tmpDescription,_tmpPaymentMethod,_tmpProofUrl,_tmpIsSynced);
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
