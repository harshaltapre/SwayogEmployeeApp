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
import com.example.swayogemployeeapp.data.local.entity.BillOfMaterialsEntity;
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
public final class BillOfMaterialsDao_Impl implements BillOfMaterialsDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<BillOfMaterialsEntity> __insertionAdapterOfBillOfMaterialsEntity;

  private final EntityDeletionOrUpdateAdapter<BillOfMaterialsEntity> __deletionAdapterOfBillOfMaterialsEntity;

  private final EntityDeletionOrUpdateAdapter<BillOfMaterialsEntity> __updateAdapterOfBillOfMaterialsEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllBillOfMaterials;

  public BillOfMaterialsDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfBillOfMaterialsEntity = new EntityInsertionAdapter<BillOfMaterialsEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `bill_of_materials` (`id`,`designId`,`itemId`,`quantity`,`unitCost`,`totalCost`,`notes`,`isSynced`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BillOfMaterialsEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getDesignId());
        statement.bindLong(3, entity.getItemId());
        statement.bindLong(4, entity.getQuantity());
        statement.bindDouble(5, entity.getUnitCost());
        statement.bindDouble(6, entity.getTotalCost());
        if (entity.getNotes() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getNotes());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(8, _tmp);
      }
    };
    this.__deletionAdapterOfBillOfMaterialsEntity = new EntityDeletionOrUpdateAdapter<BillOfMaterialsEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `bill_of_materials` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BillOfMaterialsEntity entity) {
        statement.bindString(1, entity.getId());
      }
    };
    this.__updateAdapterOfBillOfMaterialsEntity = new EntityDeletionOrUpdateAdapter<BillOfMaterialsEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `bill_of_materials` SET `id` = ?,`designId` = ?,`itemId` = ?,`quantity` = ?,`unitCost` = ?,`totalCost` = ?,`notes` = ?,`isSynced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final BillOfMaterialsEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getDesignId());
        statement.bindLong(3, entity.getItemId());
        statement.bindLong(4, entity.getQuantity());
        statement.bindDouble(5, entity.getUnitCost());
        statement.bindDouble(6, entity.getTotalCost());
        if (entity.getNotes() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getNotes());
        }
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(8, _tmp);
        statement.bindString(9, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAllBillOfMaterials = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM bill_of_materials";
        return _query;
      }
    };
  }

  @Override
  public Object insertBillOfMaterials(final BillOfMaterialsEntity bom,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfBillOfMaterialsEntity.insert(bom);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertBillOfMaterialsList(final List<BillOfMaterialsEntity> bomList,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfBillOfMaterialsEntity.insert(bomList);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteBillOfMaterials(final BillOfMaterialsEntity bom,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfBillOfMaterialsEntity.handle(bom);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateBillOfMaterials(final BillOfMaterialsEntity bom,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfBillOfMaterialsEntity.handle(bom);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllBillOfMaterials(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllBillOfMaterials.acquire();
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
          __preparedStmtOfDeleteAllBillOfMaterials.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<BillOfMaterialsEntity>> getAllBillOfMaterials() {
    final String _sql = "SELECT * FROM bill_of_materials";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"bill_of_materials"}, new Callable<List<BillOfMaterialsEntity>>() {
      @Override
      @NonNull
      public List<BillOfMaterialsEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDesignId = CursorUtil.getColumnIndexOrThrow(_cursor, "designId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfTotalCost = CursorUtil.getColumnIndexOrThrow(_cursor, "totalCost");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<BillOfMaterialsEntity> _result = new ArrayList<BillOfMaterialsEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BillOfMaterialsEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpDesignId;
            _tmpDesignId = _cursor.getString(_cursorIndexOfDesignId);
            final int _tmpItemId;
            _tmpItemId = _cursor.getInt(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final double _tmpTotalCost;
            _tmpTotalCost = _cursor.getDouble(_cursorIndexOfTotalCost);
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
            _item = new BillOfMaterialsEntity(_tmpId,_tmpDesignId,_tmpItemId,_tmpQuantity,_tmpUnitCost,_tmpTotalCost,_tmpNotes,_tmpIsSynced);
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
  public Object getBillOfMaterialsById(final String id,
      final Continuation<? super BillOfMaterialsEntity> $completion) {
    final String _sql = "SELECT * FROM bill_of_materials WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<BillOfMaterialsEntity>() {
      @Override
      @Nullable
      public BillOfMaterialsEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDesignId = CursorUtil.getColumnIndexOrThrow(_cursor, "designId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfTotalCost = CursorUtil.getColumnIndexOrThrow(_cursor, "totalCost");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final BillOfMaterialsEntity _result;
          if (_cursor.moveToFirst()) {
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpDesignId;
            _tmpDesignId = _cursor.getString(_cursorIndexOfDesignId);
            final int _tmpItemId;
            _tmpItemId = _cursor.getInt(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final double _tmpTotalCost;
            _tmpTotalCost = _cursor.getDouble(_cursorIndexOfTotalCost);
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
            _result = new BillOfMaterialsEntity(_tmpId,_tmpDesignId,_tmpItemId,_tmpQuantity,_tmpUnitCost,_tmpTotalCost,_tmpNotes,_tmpIsSynced);
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
  public Flow<List<BillOfMaterialsEntity>> getBillOfMaterialsByDesign(final String designId) {
    final String _sql = "SELECT * FROM bill_of_materials WHERE designId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, designId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"bill_of_materials"}, new Callable<List<BillOfMaterialsEntity>>() {
      @Override
      @NonNull
      public List<BillOfMaterialsEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDesignId = CursorUtil.getColumnIndexOrThrow(_cursor, "designId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfTotalCost = CursorUtil.getColumnIndexOrThrow(_cursor, "totalCost");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<BillOfMaterialsEntity> _result = new ArrayList<BillOfMaterialsEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BillOfMaterialsEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpDesignId;
            _tmpDesignId = _cursor.getString(_cursorIndexOfDesignId);
            final int _tmpItemId;
            _tmpItemId = _cursor.getInt(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final double _tmpTotalCost;
            _tmpTotalCost = _cursor.getDouble(_cursorIndexOfTotalCost);
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
            _item = new BillOfMaterialsEntity(_tmpId,_tmpDesignId,_tmpItemId,_tmpQuantity,_tmpUnitCost,_tmpTotalCost,_tmpNotes,_tmpIsSynced);
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
  public Flow<List<BillOfMaterialsEntity>> getBillOfMaterialsByItem(final int itemId) {
    final String _sql = "SELECT * FROM bill_of_materials WHERE itemId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, itemId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"bill_of_materials"}, new Callable<List<BillOfMaterialsEntity>>() {
      @Override
      @NonNull
      public List<BillOfMaterialsEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDesignId = CursorUtil.getColumnIndexOrThrow(_cursor, "designId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfTotalCost = CursorUtil.getColumnIndexOrThrow(_cursor, "totalCost");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<BillOfMaterialsEntity> _result = new ArrayList<BillOfMaterialsEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BillOfMaterialsEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpDesignId;
            _tmpDesignId = _cursor.getString(_cursorIndexOfDesignId);
            final int _tmpItemId;
            _tmpItemId = _cursor.getInt(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final double _tmpTotalCost;
            _tmpTotalCost = _cursor.getDouble(_cursorIndexOfTotalCost);
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
            _item = new BillOfMaterialsEntity(_tmpId,_tmpDesignId,_tmpItemId,_tmpQuantity,_tmpUnitCost,_tmpTotalCost,_tmpNotes,_tmpIsSynced);
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
  public Object getUnsyncedBillOfMaterials(
      final Continuation<? super List<BillOfMaterialsEntity>> $completion) {
    final String _sql = "SELECT * FROM bill_of_materials WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<BillOfMaterialsEntity>>() {
      @Override
      @NonNull
      public List<BillOfMaterialsEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDesignId = CursorUtil.getColumnIndexOrThrow(_cursor, "designId");
          final int _cursorIndexOfItemId = CursorUtil.getColumnIndexOrThrow(_cursor, "itemId");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfTotalCost = CursorUtil.getColumnIndexOrThrow(_cursor, "totalCost");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<BillOfMaterialsEntity> _result = new ArrayList<BillOfMaterialsEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final BillOfMaterialsEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpDesignId;
            _tmpDesignId = _cursor.getString(_cursorIndexOfDesignId);
            final int _tmpItemId;
            _tmpItemId = _cursor.getInt(_cursorIndexOfItemId);
            final int _tmpQuantity;
            _tmpQuantity = _cursor.getInt(_cursorIndexOfQuantity);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final double _tmpTotalCost;
            _tmpTotalCost = _cursor.getDouble(_cursorIndexOfTotalCost);
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
            _item = new BillOfMaterialsEntity(_tmpId,_tmpDesignId,_tmpItemId,_tmpQuantity,_tmpUnitCost,_tmpTotalCost,_tmpNotes,_tmpIsSynced);
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
