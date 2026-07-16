# Implementation Plan - Re-implement Database Caching and Fix 401 Error Visibility

The project seems to have been reverted to a state where database caching is missing. This plan aims to re-implement the "Single Source of Truth" (DB-first) logic to ensure data remains visible even if a 401 error occurs, and to improve the UI to show these errors non-intrusively.

## Proposed Changes

### Data Layer (DAOs & Entities)

#### [MODIFY] [UserDao.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/local/dao/UserDao.kt)
- Add `getUsersByRole(role: String): Flow<List<UserEntity>>`
- Add `getAllUsers(): Flow<List<UserEntity>>`
- Add `insertUsers(users: List<UserEntity>)`

#### [MODIFY] [TaskDao.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/local/dao/TaskDao.kt)
- Add `getAllTasks(): Flow<List<TaskEntity>>`

#### [MODIFY] [UserEntity.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/local/entity/UserEntity.kt)
- Ensure it has the `rating` field (and increment DB version if needed, or rely on `fallbackToDestructiveMigration`).

### Repository Layer

#### [MODIFY] [EmployeeRepository.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/repository/EmployeeRepository.kt)
- Update `getInternalUsers` to save results to the database.
- Add `getInternalUsersFlow(role: String?): Flow<List<Employee>>`.

#### [MODIFY] [TaskRepository.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/repository/TaskRepository.kt)
- Update `getAllTasks` to save results to the database.
- Add `getAllTasksFlow(): Flow<List<Task>>`.

### Presentation Layer (ViewModel & UI)

#### [MODIFY] [SubAdminEmployeesViewModel.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/presentation/subadmin/SubAdminEmployeesViewModel.kt)
- Implement `observeData()` to collect from database flows.
- Update `loadData()` to only trigger background refreshes and manage the `isLoading` state correctly with cached data.
- Specifically handle 401 errors with a user-friendly message.

#### [MODIFY] [SubAdminEmployeesScreen.kt](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/presentation/subadmin/SubAdminEmployeesScreen.kt)
- Re-apply `SwayogTopBar` with `onNavigateBack`.
- Show a non-blocking warning card if `uiState.error` is present but data is available.

## Verification Plan

### Automated Tests
- Run `gradle_build assembleDebug` to verify compilation.
- Run `analyze_file` on modified files.

### Manual Verification
- Verify that if a 401 error occurs (simulated or real), the screen still displays cached employees and tasks instead of a blank screen with an error message.
