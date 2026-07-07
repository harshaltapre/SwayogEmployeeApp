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
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity;
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
public final class InventoryItemDao_Impl implements InventoryItemDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<InventoryItemEntity> __insertionAdapterOfInventoryItemEntity;

  private final EntityDeletionOrUpdateAdapter<InventoryItemEntity> __updateAdapterOfInventoryItemEntity;

  private final SharedSQLiteStatement __preparedStmtOfUpdateStock;

  public InventoryItemDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfInventoryItemEntity = new EntityInsertionAdapter<InventoryItemEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `inventory_items` (`id`,`itemName`,`category`,`quantityInStock`,`unit`,`qrCodeHash`,`isSynced`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final InventoryItemEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getItemName());
        statement.bindString(3, entity.getCategory());
        statement.bindDouble(4, entity.getQuantityInStock());
        statement.bindString(5, entity.getUnit());
        if (entity.getQrCodeHash() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getQrCodeHash());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(7, _tmp);
      }
    };
    this.__updateAdapterOfInventoryItemEntity = new EntityDeletionOrUpdateAdapter<InventoryItemEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `inventory_items` SET `id` = ?,`itemName` = ?,`category` = ?,`quantityInStock` = ?,`unit` = ?,`qrCodeHash` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final InventoryItemEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getItemName());
        statement.bindString(3, entity.getCategory());
        statement.bindDouble(4, entity.getQuantityInStock());
        statement.bindString(5, entity.getUnit());
        if (entity.getQrCodeHash() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getQrCodeHash());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(7, _tmp);
        statement.bindString(8, entity.getId());
      }
    };
    this.__preparedStmtOfUpdateStock = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE inventory_items SET quantityInStock = ? WHERE id = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<InventoryItemEntity> items,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfInventoryItemEntity.insert(items);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insert(final InventoryItemEntity item,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfInventoryItemEntity.insert(item);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final InventoryItemEntity item,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfInventoryItemEntity.handle(item);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateStock(final String id, final double quantity,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfUpdateStock.acquire();
        int _argIndex = 1;
        _stmt.bindDouble(_argIndex, quantity);
        _argIndex = 2;
        _stmt.bindString(_argIndex, id);
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
          __preparedStmtOfUpdateStock.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<InventoryItemEntity>> getAllItemsFlow() {
    final String _sql = "SELECT * FROM inventory_items ORDER BY itemName ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"inventory_items"}, new Callable<List<InventoryItemEntity>>() {
      @Override
      @NonNull
      public List<InventoryItemEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfItemName = CursorUtil.getColumnIndexOrThrow(_cursor, "itemName");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfQuantityInStock = CursorUtil.getColumnIndexOrThrow(_cursor, "quantityInStock");
          final int _cursorIndexOfUnit = CursorUtil.getColumnIndexOrThrow(_cursor, "unit");
          final int _cursorIndexOfQrCodeHash = CursorUtil.getColumnIndexOrThrow(_cursor, "qrCodeHash");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<InventoryItemEntity> _result = new ArrayList<InventoryItemEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InventoryItemEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpItemName;
            _tmpItemName = _cursor.getString(_cursorIndexOfItemName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final double _tmpQuantityInStock;
            _tmpQuantityInStock = _cursor.getDouble(_cursorIndexOfQuantityInStock);
            final String _tmpUnit;
            _tmpUnit = _cursor.getString(_cursorIndexOfUnit);
            final String _tmpQrCodeHash;
            if (_cursor.isNull(_cursorIndexOfQrCodeHash)) {
              _tmpQrCodeHash = null;
            } else {
              _tmpQrCodeHash = _cursor.getString(_cursorIndexOfQrCodeHash);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new InventoryItemEntity(_tmpId,_tmpItemName,_tmpCategory,_tmpQuantityInStock,_tmpUnit,_tmpQrCodeHash,_tmpIsSynced);
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
  public Object getAllItemsList(final Continuation<? super List<InventoryItemEntity>> $completion) {
    final String _sql = "SELECT * FROM inventory_items ORDER BY itemName ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<InventoryItemEntity>>() {
      @Override
      @NonNull
      public List<InventoryItemEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfItemName = CursorUtil.getColumnIndexOrThrow(_cursor, "itemName");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfQuantityInStock = CursorUtil.getColumnIndexOrThrow(_cursor, "quantityInStock");
          final int _cursorIndexOfUnit = CursorUtil.getColumnIndexOrThrow(_cursor, "unit");
          final int _cursorIndexOfQrCodeHash = CursorUtil.getColumnIndexOrThrow(_cursor, "qrCodeHash");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<InventoryItemEntity> _result = new ArrayList<InventoryItemEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InventoryItemEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpItemName;
            _tmpItemName = _cursor.getString(_cursorIndexOfItemName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final double _tmpQuantityInStock;
            _tmpQuantityInStock = _cursor.getDouble(_cursorIndexOfQuantityInStock);
            final String _tmpUnit;
            _tmpUnit = _cursor.getString(_cursorIndexOfUnit);
            final String _tmpQrCodeHash;
            if (_cursor.isNull(_cursorIndexOfQrCodeHash)) {
              _tmpQrCodeHash = null;
            } else {
              _tmpQrCodeHash = _cursor.getString(_cursorIndexOfQrCodeHash);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new InventoryItemEntity(_tmpId,_tmpItemName,_tmpCategory,_tmpQuantityInStock,_tmpUnit,_tmpQrCodeHash,_tmpIsSynced);
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
  public Object getItemById(final String id,
      final Continuation<? super InventoryItemEntity> $completion) {
    final String _sql = "SELECT * FROM inventory_items WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<InventoryItemEntity>() {
      @Override
      @Nullable
      public InventoryItemEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfItemName = CursorUtil.getColumnIndexOrThrow(_cursor, "itemName");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfQuantityInStock = CursorUtil.getColumnIndexOrThrow(_cursor, "quantityInStock");
          final int _cursorIndexOfUnit = CursorUtil.getColumnIndexOrThrow(_cursor, "unit");
          final int _cursorIndexOfQrCodeHash = CursorUtil.getColumnIndexOrThrow(_cursor, "qrCodeHash");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final InventoryItemEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpItemName;
            _tmpItemName = _cursor.getString(_cursorIndexOfItemName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final double _tmpQuantityInStock;
            _tmpQuantityInStock = _cursor.getDouble(_cursorIndexOfQuantityInStock);
            final String _tmpUnit;
            _tmpUnit = _cursor.getString(_cursorIndexOfUnit);
            final String _tmpQrCodeHash;
            if (_cursor.isNull(_cursorIndexOfQrCodeHash)) {
              _tmpQrCodeHash = null;
            } else {
              _tmpQrCodeHash = _cursor.getString(_cursorIndexOfQrCodeHash);
            }
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new InventoryItemEntity(_tmpId,_tmpItemName,_tmpCategory,_tmpQuantityInStock,_tmpUnit,_tmpQrCodeHash,_tmpIsSynced);
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
