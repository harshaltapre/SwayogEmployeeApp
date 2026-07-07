package com.swayog.employee.di

import android.content.Context
import androidx.room.Room
import com.swayog.employee.data.local.dao.*
import com.swayog.employee.data.local.database.AppDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "swayog_employee_database"
        )
            .fallbackToDestructiveMigration()
            .build()
    }
    
    @Provides
    @Singleton
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }
    
    @Provides
    @Singleton
    fun provideTaskDao(database: AppDatabase): TaskDao {
        return database.taskDao()
    }
    
    @Provides
    @Singleton
    fun provideAttendanceDao(database: AppDatabase): AttendanceDao {
        return database.attendanceDao()
    }
    
    @Provides
    @Singleton
    fun provideDailyCommitDao(database: AppDatabase): DailyCommitDao {
        return database.dailyCommitDao()
    }
    
    @Provides
    @Singleton
    fun provideCustomerDao(database: AppDatabase): CustomerDao {
        return database.customerDao()
    }
    
    @Provides
    @Singleton
    fun provideOutboxQueueDao(database: AppDatabase): OutboxQueueDao {
        return database.outboxQueueDao()
    }
}
