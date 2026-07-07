package com.swayog.employee.di

import com.swayog.employee.data.repository.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    
    @Provides
    @Singleton
    fun provideAuthRepository(
        dataStoreManager: com.swayog.employee.data.local.preferences.DataStoreManager,
        userDao: com.swayog.employee.data.local.dao.UserDao
    ): AuthRepository {
        return AuthRepository(dataStoreManager, userDao)
    }
    
    @Provides
    @Singleton
    fun provideTaskRepository(
        taskDao: com.swayog.employee.data.local.dao.TaskDao,
        outboxQueueDao: com.swayog.employee.data.local.dao.OutboxQueueDao
    ): TaskRepository {
        return TaskRepository(taskDao, outboxQueueDao)
    }
    
    @Provides
    @Singleton
    fun provideAttendanceRepository(
        attendanceDao: com.swayog.employee.data.local.dao.AttendanceDao
    ): AttendanceRepository {
        return AttendanceRepository(attendanceDao)
    }
    
    @Provides
    @Singleton
    fun provideCustomerRepository(
        customerDao: com.swayog.employee.data.local.dao.CustomerDao
    ): CustomerRepository {
        return CustomerRepository(customerDao)
    }
    
    @Provides
    @Singleton
    fun provideDailyCommitRepository(
        dailyCommitDao: com.swayog.employee.data.local.dao.DailyCommitDao
    ): DailyCommitRepository {
        return DailyCommitRepository(dailyCommitDao)
    }
}
