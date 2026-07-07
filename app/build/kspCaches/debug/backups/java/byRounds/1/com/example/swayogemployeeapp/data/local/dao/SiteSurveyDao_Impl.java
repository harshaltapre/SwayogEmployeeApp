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
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity;
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
public final class SiteSurveyDao_Impl implements SiteSurveyDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<SiteSurveyEntity> __insertionAdapterOfSiteSurveyEntity;

  private final EntityDeletionOrUpdateAdapter<SiteSurveyEntity> __updateAdapterOfSiteSurveyEntity;

  public SiteSurveyDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfSiteSurveyEntity = new EntityInsertionAdapter<SiteSurveyEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `site_surveys` (`localId`,`taskId`,`customerId`,`roofType`,`lengthFt`,`widthFt`,`obstacleNotes`,`shadowFactors`,`recommendedCapacityKw`,`coordinatesLatitude`,`coordinatesLongitude`,`localPhotoPaths`,`isSynced`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SiteSurveyEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindString(3, entity.getCustomerId());
        statement.bindString(4, entity.getRoofType());
        statement.bindDouble(5, entity.getLengthFt());
        statement.bindDouble(6, entity.getWidthFt());
        statement.bindString(7, entity.getObstacleNotes());
        statement.bindString(8, entity.getShadowFactors());
        statement.bindDouble(9, entity.getRecommendedCapacityKw());
        statement.bindDouble(10, entity.getCoordinatesLatitude());
        statement.bindDouble(11, entity.getCoordinatesLongitude());
        statement.bindString(12, entity.getLocalPhotoPaths());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(13, _tmp);
      }
    };
    this.__updateAdapterOfSiteSurveyEntity = new EntityDeletionOrUpdateAdapter<SiteSurveyEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `site_surveys` SET `localId` = ?,`taskId` = ?,`customerId` = ?,`roofType` = ?,`lengthFt` = ?,`widthFt` = ?,`obstacleNotes` = ?,`shadowFactors` = ?,`recommendedCapacityKw` = ?,`coordinatesLatitude` = ?,`coordinatesLongitude` = ?,`localPhotoPaths` = ?,`isSynced` = ? WHERE `localId` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SiteSurveyEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        statement.bindLong(2, entity.getTaskId());
        statement.bindString(3, entity.getCustomerId());
        statement.bindString(4, entity.getRoofType());
        statement.bindDouble(5, entity.getLengthFt());
        statement.bindDouble(6, entity.getWidthFt());
        statement.bindString(7, entity.getObstacleNotes());
        statement.bindString(8, entity.getShadowFactors());
        statement.bindDouble(9, entity.getRecommendedCapacityKw());
        statement.bindDouble(10, entity.getCoordinatesLatitude());
        statement.bindDouble(11, entity.getCoordinatesLongitude());
        statement.bindString(12, entity.getLocalPhotoPaths());
        final int _tmp = entity.isSynced() ? 1 : 0;
        statement.bindLong(13, _tmp);
        statement.bindLong(14, entity.getLocalId());
      }
    };
  }

  @Override
  public Object insert(final SiteSurveyEntity survey,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfSiteSurveyEntity.insertAndReturnId(survey);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final SiteSurveyEntity survey,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfSiteSurveyEntity.handle(survey);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<SiteSurveyEntity>> getAllSurveysFlow() {
    final String _sql = "SELECT * FROM site_surveys ORDER BY localId DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"site_surveys"}, new Callable<List<SiteSurveyEntity>>() {
      @Override
      @NonNull
      public List<SiteSurveyEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfRoofType = CursorUtil.getColumnIndexOrThrow(_cursor, "roofType");
          final int _cursorIndexOfLengthFt = CursorUtil.getColumnIndexOrThrow(_cursor, "lengthFt");
          final int _cursorIndexOfWidthFt = CursorUtil.getColumnIndexOrThrow(_cursor, "widthFt");
          final int _cursorIndexOfObstacleNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "obstacleNotes");
          final int _cursorIndexOfShadowFactors = CursorUtil.getColumnIndexOrThrow(_cursor, "shadowFactors");
          final int _cursorIndexOfRecommendedCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "recommendedCapacityKw");
          final int _cursorIndexOfCoordinatesLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "coordinatesLatitude");
          final int _cursorIndexOfCoordinatesLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "coordinatesLongitude");
          final int _cursorIndexOfLocalPhotoPaths = CursorUtil.getColumnIndexOrThrow(_cursor, "localPhotoPaths");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final List<SiteSurveyEntity> _result = new ArrayList<SiteSurveyEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SiteSurveyEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpCustomerId;
            _tmpCustomerId = _cursor.getString(_cursorIndexOfCustomerId);
            final String _tmpRoofType;
            _tmpRoofType = _cursor.getString(_cursorIndexOfRoofType);
            final double _tmpLengthFt;
            _tmpLengthFt = _cursor.getDouble(_cursorIndexOfLengthFt);
            final double _tmpWidthFt;
            _tmpWidthFt = _cursor.getDouble(_cursorIndexOfWidthFt);
            final String _tmpObstacleNotes;
            _tmpObstacleNotes = _cursor.getString(_cursorIndexOfObstacleNotes);
            final String _tmpShadowFactors;
            _tmpShadowFactors = _cursor.getString(_cursorIndexOfShadowFactors);
            final double _tmpRecommendedCapacityKw;
            _tmpRecommendedCapacityKw = _cursor.getDouble(_cursorIndexOfRecommendedCapacityKw);
            final double _tmpCoordinatesLatitude;
            _tmpCoordinatesLatitude = _cursor.getDouble(_cursorIndexOfCoordinatesLatitude);
            final double _tmpCoordinatesLongitude;
            _tmpCoordinatesLongitude = _cursor.getDouble(_cursorIndexOfCoordinatesLongitude);
            final String _tmpLocalPhotoPaths;
            _tmpLocalPhotoPaths = _cursor.getString(_cursorIndexOfLocalPhotoPaths);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _item = new SiteSurveyEntity(_tmpLocalId,_tmpTaskId,_tmpCustomerId,_tmpRoofType,_tmpLengthFt,_tmpWidthFt,_tmpObstacleNotes,_tmpShadowFactors,_tmpRecommendedCapacityKw,_tmpCoordinatesLatitude,_tmpCoordinatesLongitude,_tmpLocalPhotoPaths,_tmpIsSynced);
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
  public Flow<SiteSurveyEntity> getSurveyForTaskFlow(final int taskId) {
    final String _sql = "SELECT * FROM site_surveys WHERE taskId = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, taskId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"site_surveys"}, new Callable<SiteSurveyEntity>() {
      @Override
      @Nullable
      public SiteSurveyEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfRoofType = CursorUtil.getColumnIndexOrThrow(_cursor, "roofType");
          final int _cursorIndexOfLengthFt = CursorUtil.getColumnIndexOrThrow(_cursor, "lengthFt");
          final int _cursorIndexOfWidthFt = CursorUtil.getColumnIndexOrThrow(_cursor, "widthFt");
          final int _cursorIndexOfObstacleNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "obstacleNotes");
          final int _cursorIndexOfShadowFactors = CursorUtil.getColumnIndexOrThrow(_cursor, "shadowFactors");
          final int _cursorIndexOfRecommendedCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "recommendedCapacityKw");
          final int _cursorIndexOfCoordinatesLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "coordinatesLatitude");
          final int _cursorIndexOfCoordinatesLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "coordinatesLongitude");
          final int _cursorIndexOfLocalPhotoPaths = CursorUtil.getColumnIndexOrThrow(_cursor, "localPhotoPaths");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final SiteSurveyEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpCustomerId;
            _tmpCustomerId = _cursor.getString(_cursorIndexOfCustomerId);
            final String _tmpRoofType;
            _tmpRoofType = _cursor.getString(_cursorIndexOfRoofType);
            final double _tmpLengthFt;
            _tmpLengthFt = _cursor.getDouble(_cursorIndexOfLengthFt);
            final double _tmpWidthFt;
            _tmpWidthFt = _cursor.getDouble(_cursorIndexOfWidthFt);
            final String _tmpObstacleNotes;
            _tmpObstacleNotes = _cursor.getString(_cursorIndexOfObstacleNotes);
            final String _tmpShadowFactors;
            _tmpShadowFactors = _cursor.getString(_cursorIndexOfShadowFactors);
            final double _tmpRecommendedCapacityKw;
            _tmpRecommendedCapacityKw = _cursor.getDouble(_cursorIndexOfRecommendedCapacityKw);
            final double _tmpCoordinatesLatitude;
            _tmpCoordinatesLatitude = _cursor.getDouble(_cursorIndexOfCoordinatesLatitude);
            final double _tmpCoordinatesLongitude;
            _tmpCoordinatesLongitude = _cursor.getDouble(_cursorIndexOfCoordinatesLongitude);
            final String _tmpLocalPhotoPaths;
            _tmpLocalPhotoPaths = _cursor.getString(_cursorIndexOfLocalPhotoPaths);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new SiteSurveyEntity(_tmpLocalId,_tmpTaskId,_tmpCustomerId,_tmpRoofType,_tmpLengthFt,_tmpWidthFt,_tmpObstacleNotes,_tmpShadowFactors,_tmpRecommendedCapacityKw,_tmpCoordinatesLatitude,_tmpCoordinatesLongitude,_tmpLocalPhotoPaths,_tmpIsSynced);
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
  public Object getSurveyById(final long localId,
      final Continuation<? super SiteSurveyEntity> $completion) {
    final String _sql = "SELECT * FROM site_surveys WHERE localId = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, localId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<SiteSurveyEntity>() {
      @Override
      @Nullable
      public SiteSurveyEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfTaskId = CursorUtil.getColumnIndexOrThrow(_cursor, "taskId");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfRoofType = CursorUtil.getColumnIndexOrThrow(_cursor, "roofType");
          final int _cursorIndexOfLengthFt = CursorUtil.getColumnIndexOrThrow(_cursor, "lengthFt");
          final int _cursorIndexOfWidthFt = CursorUtil.getColumnIndexOrThrow(_cursor, "widthFt");
          final int _cursorIndexOfObstacleNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "obstacleNotes");
          final int _cursorIndexOfShadowFactors = CursorUtil.getColumnIndexOrThrow(_cursor, "shadowFactors");
          final int _cursorIndexOfRecommendedCapacityKw = CursorUtil.getColumnIndexOrThrow(_cursor, "recommendedCapacityKw");
          final int _cursorIndexOfCoordinatesLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "coordinatesLatitude");
          final int _cursorIndexOfCoordinatesLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "coordinatesLongitude");
          final int _cursorIndexOfLocalPhotoPaths = CursorUtil.getColumnIndexOrThrow(_cursor, "localPhotoPaths");
          final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
          final SiteSurveyEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final int _tmpTaskId;
            _tmpTaskId = _cursor.getInt(_cursorIndexOfTaskId);
            final String _tmpCustomerId;
            _tmpCustomerId = _cursor.getString(_cursorIndexOfCustomerId);
            final String _tmpRoofType;
            _tmpRoofType = _cursor.getString(_cursorIndexOfRoofType);
            final double _tmpLengthFt;
            _tmpLengthFt = _cursor.getDouble(_cursorIndexOfLengthFt);
            final double _tmpWidthFt;
            _tmpWidthFt = _cursor.getDouble(_cursorIndexOfWidthFt);
            final String _tmpObstacleNotes;
            _tmpObstacleNotes = _cursor.getString(_cursorIndexOfObstacleNotes);
            final String _tmpShadowFactors;
            _tmpShadowFactors = _cursor.getString(_cursorIndexOfShadowFactors);
            final double _tmpRecommendedCapacityKw;
            _tmpRecommendedCapacityKw = _cursor.getDouble(_cursorIndexOfRecommendedCapacityKw);
            final double _tmpCoordinatesLatitude;
            _tmpCoordinatesLatitude = _cursor.getDouble(_cursorIndexOfCoordinatesLatitude);
            final double _tmpCoordinatesLongitude;
            _tmpCoordinatesLongitude = _cursor.getDouble(_cursorIndexOfCoordinatesLongitude);
            final String _tmpLocalPhotoPaths;
            _tmpLocalPhotoPaths = _cursor.getString(_cursorIndexOfLocalPhotoPaths);
            final boolean _tmpIsSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
            _tmpIsSynced = _tmp != 0;
            _result = new SiteSurveyEntity(_tmpLocalId,_tmpTaskId,_tmpCustomerId,_tmpRoofType,_tmpLengthFt,_tmpWidthFt,_tmpObstacleNotes,_tmpShadowFactors,_tmpRecommendedCapacityKw,_tmpCoordinatesLatitude,_tmpCoordinatesLongitude,_tmpLocalPhotoPaths,_tmpIsSynced);
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
