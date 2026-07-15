# Walkthrough - Fixing 401 Error and Implementing Database-First Logic in Staff Section

I have implemented a local database caching layer for the Staff Section. This ensures that employees and tasks are visible even if the network call fails (e.g., due to an expired session/401 error) and resolves the issue where an error message blocked the entire screen.

## Changes Made

### 1. Database & Schema Updates
- **[UserEntity](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/local/entity/UserEntity.kt)**: Added `rating` field to store employee ratings locally.
- **[UserDao](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/local/dao/UserDao.kt)**: Added methods to fetch users by role and insert multiple users in bulk.
- **[TaskDao](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/local/dao/TaskDao.kt)**: Added `getAllTasks()` to observe all tasks from the database.

### 2. Repository Layer (Offline Support)
- **[EmployeeRepository](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/repository/EmployeeRepository.kt)**:
    - Now stores fetched internal users into the `users` table.
    - Provides `getInternalUsersFlow()` to observe employees from the database.
- **[TaskRepository](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/data/repository/TaskRepository.kt)**:
    - Updated `getAllTasks()` to persist results in the `tasks` table.
    - Added `getAllTasksFlow()` for continuous observation of all tasks.

### 3. ViewModel Logic
- **[SubAdminEmployeesViewModel](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/presentation/subadmin/SubAdminEmployeesViewModel.kt)**:
    - Switched to a "Single Source of Truth" pattern. It now observes Database Flows.
    - `loadData()` now triggers a background refresh.
    - Improved error messages: Specifically detects 401 errors and displays "Session Expired. Please login again. (Showing cached data)".

### 4. UI Enhancements
- **[SubAdminEmployeesScreen](file:///E:/SwayogEmployeeApp/android-app/app/src/main/java/com/swayog/employee/presentation/subadmin/SubAdminEmployeesScreen.kt)**:
    - Removed the blocking error state. If data exists in the database, it is displayed immediately.
    - Network errors (like the 401 reported) are now shown as a non-intrusive warning card at the top, allowing the user to still browse the cached staff directory and tasks.

## Verification Results

### Build & Compilation
- Successfully executed `assembleDebug`.
- Room schema change handled by `fallbackToDestructiveMigration()`.

### Logic Verification
- ViewModel correctly combines database observation with background network refresh.
- Error handling in the Screen now checks `uiState.employees.isEmpty()` before showing a full-screen loading/error state.
