# Web → Android Parity Implementation Plan

**Generated:** 2026-08-24  
**Purpose:** Detailed implementation plan to bring Android application into functional parity with Web Dashboard

---

## Executive Summary

This implementation plan addresses the gaps identified in the Web → Android Parity Analysis. The plan is organized into 4 phases, with Phase 1 addressing critical issues and Phase 4 focusing on testing and polish.

**Overall Parity Target:** 95% (from current ~70%)  
**Estimated Timeline:** 6-8 weeks  
**Risk Level:** Medium (standardized endpoints, existing backend infrastructure)

---

## Phase 1: Critical Core Functionality (Week 1-2)

### Priority 1: Standardize Task Completion Endpoint

**Issue:** Web uses `PATCH /tasks/:id/complete`, Android uses `POST /employee/tasks/:id/complete`

**Decision:** Standardize on `PATCH /tasks/:id/complete` (web endpoint)

#### Backend Changes

**File:** `backend/src/modules/employee/employee.routes.ts`

**Action:** Remove Android-specific task completion endpoints

**Changes:**
```typescript
// DELETE these lines (236-245):
employeeRoutes.post(
  "/tasks/:taskId/complete",
  employeeAuth,
  asyncHandler(markTaskCompleted)
);
employeeRoutes.patch(
  "/tasks/:taskId/complete",
  employeeAuth,
  asyncHandler(markTaskCompleted)
);
```

**File:** `backend/src/modules/tasks/tasks.routes.ts`

**Action:** Ensure `PATCH /tasks/:id/complete` supports all required fields

**Verification:** Confirm `completeTaskSchema` includes:
- `completionMessage`
- `completionDocumentUrl`
- `beforeImageUrl`
- `afterImageUrl`
- `beforeLatitude`
- `beforeLongitude`
- `afterLatitude`
- `afterLongitude`
- `sitePhotos` (array)
- `images` (array)

#### Android Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt`

**Action:** Replace Android-specific endpoint with web endpoint

**Changes:**
```kotlin
// DELETE this line (248-252):
@POST("employee/tasks/{taskId}/complete")
suspend fun completeTask(
    @Path("taskId") taskId: String,
    @Body request: CompleteTaskRequest
): Response<ApiResponse<Task>>

// ADD this line:
@PATCH("tasks/{taskId}/complete")
suspend fun completeTask(
    @Path("taskId") taskId: String,
    @Body request: CompleteTaskRequest
): Response<ApiResponse<Task>>
```

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/TaskRepository.kt`

**Action:** Update `completeTask` function to use new endpoint

**Changes:**
```kotlin
// Line 598: Change from apiService.completeTask(cleanTaskId, req)
// to apiService.completeTask(cleanTaskId, req) (same call, different endpoint)
```

**Testing:**
- Test task completion on Android
- Verify images upload to R2
- Verify task status updates in database
- Verify notifications are sent

---

### Priority 2: Fix Image Upload Transaction Flow

**Issue:** Images may fail to upload after task is marked complete

#### Backend Changes

**File:** `backend/src/modules/tasks/tasks.service.ts`

**Action:** Wrap task completion in database transaction

**Changes:**
```typescript
// In completeTaskHandler function, wrap in transaction:
const result = await prisma.$transaction(async (tx) => {
  // 1. Upload images to R2
  const uploadedImages = await processAndSaveBase64Photos(...);
  
  // 2. Save image metadata to TaskImage
  await tx.taskImage.createMany({ data: uploadedImages });
  
  // 3. Update task status
  const task = await tx.task.update({ ... });
  
  // 4. Create notifications
  await createNotifications(...);
  
  return task;
});
```

**File:** `backend/src/modules/tasks/tasks.controller.ts`

**Action:** Add rollback on upload failure

**Changes:**
```typescript
// Add error handling:
if (imageUploadFailed) {
  // Rollback task status update
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'IN_PROGRESS' }
  });
  throw new Error('Image upload failed, task status rolled back');
}
```

#### Android Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/TaskRepository.kt`

**Action:** Add retry logic for image upload failures

**Changes:**
```kotlin
// Add retry mechanism in completeTask function:
suspend fun completeTaskWithRetry(
    taskId: String,
    completionMessage: String,
    images: List<String>?,
    maxRetries: Int = 3
): Result<Task> {
    repeat(maxRetries) { attempt ->
        val result = completeTask(taskId, completionMessage, images = images)
        if (result.isSuccess) return result
        if (attempt < maxRetries - 1) {
            delay(1000L * (attempt + 1)) // Exponential backoff
        }
    }
    return Result.failure(Exception("Failed after $maxRetries attempts"))
}
```

**Testing:**
- Test with slow network
- Test with R2 temporarily unavailable
- Verify rollback on failure
- Verify retry logic works

---

### Priority 3: Centralize Task Type Detection

**Issue:** Task type detection logic is duplicated between web and Android

#### Backend Changes

**File:** `backend/src/modules/tasks/tasks.service.ts`

**Action:** Add centralized task type detection function

**Changes:**
```typescript
// ADD new function:
export function detectTaskType(
    jobType?: string | null,
    taskType?: string | null
): string {
    const normalizedJobType = jobType?.toLowerCase() || '';
    const normalizedTaskType = taskType?.toLowerCase() || '';
    
    if (normalizedTaskType.includes('amc') || normalizedJobType.contains('amc')) {
        return 'AMC_VISIT';
    }
    if (normalizedTaskType.contains('site') || normalizedJobType.contains('site') || 
        normalizedJobType.contains('survey')) {
        return 'SITE_VISIT';
    }
    if (normalizedTaskType.contains('installation')) {
        return 'INSTALLATION';
    }
    if (normalizedTaskType.contains('complaint')) {
        return 'COMPLAINT';
    }
    return 'REGULAR';
}

// ADD new endpoint:
taskRoutes.get("/:id/type", authenticateAccessToken, asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!task) throw new ApiError(404, "Task not found");
    
    const detectedType = detectTaskType(task.jobType, task.taskType);
    res.json({ success: true, taskType: detectedType });
}));
```

#### Android Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt`

**Action:** Add endpoint to fetch task type from backend

**Changes:**
```kotlin
// ADD new endpoint:
@GET("tasks/{taskId}/type")
suspend fun getTaskType(
    @Path("taskId") taskId: String
): Response<ApiResponse<Map<String, String>>>
```

**File:** `android-app/app/src/main/java/com/swayog/employee/data/model/TaskModels.kt`

**Action:** Remove local task type detection logic

**Changes:**
```kotlin
// DELETE or COMMENT OUT these properties (lines 38-50):
val isAmcVisit: Boolean
    get() = taskType == "AMC_VISIT" || 
            jobType?.lowercase()?.contains("amc") == true || 
            id.startsWith("amc_")

val isSiteVisit: Boolean
    get() = taskType == "SITE_VISIT" || 
            jobType?.lowercase()?.contains("site") == true || 
            jobType?.lowercase()?.contains("survey") == true

// REPLACE with backend-driven detection:
suspend fun fetchTaskTypeFromBackend(taskId: String): String {
    val response = apiService.getTaskType(taskId)
    return if (response.isSuccessful && response.body()?.data != null) {
        response.body()!!.data!!["taskType"] ?: "REGULAR"
    } else {
        "REGULAR"
    }
}
```

**Testing:**
- Test all task types
- Verify backend detection matches Android detection
- Test with edge cases (null values, mixed case)

---

## Phase 2: Missing Core Features (Week 3-4)

### Priority 4: Implement Customer Portal in Android

#### New Android Screens

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerLoginScreen.kt`

**Action:** Create customer login screen

**New File Content:**
```kotlin
@Composable
fun CustomerLoginScreen(
    onLoginSuccess: (customer: Customer) -> Unit,
    navController: NavController
) {
    // Customer login with customerCode and portalPassword
    // Uses POST /auth/login with role: CUSTOMER
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerDashboardScreen.kt`

**Action:** Create customer dashboard

**New File Content:**
```kotlin
@Composable
fun CustomerDashboardScreen(
    customerId: Int,
    navController: NavController
) {
    // Display:
    // - Project trajectory (system size, installation date)
    // - Pending task reviews
    // - System details (inverter info)
    // - AMC visit history
    // - Notifications
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerTasksScreen.kt`

**Action:** Create customer tasks screen

**New File Content:**
```kotlin
@Composable
fun CustomerTasksScreen(
    customerId: Int,
    navController: NavController
) {
    // List tasks assigned to customer's projects
    // Allow rating completed tasks
    // View task photos
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerNotificationsScreen.kt`

**Action:** Create customer notifications screen

**New File Content:**
```kotlin
@Composable
fun CustomerNotificationsScreen(
    customerId: Int,
    navController: NavController
) {
    // Display customer notifications
    // Mark as read
    // Filter by type
}
```

#### Android API Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt`

**Action:** Add customer-specific endpoints

**Changes:**
```kotlin
// ADD customer endpoints:
@GET("customer/notifications")
suspend fun getCustomerNotifications(
    @Query("customerId") customerId: Int
): Response<ApiResponse<List<CustomerNotification>>>

@POST("customer/notifications/{notificationId}/read")
suspend fun markCustomerNotificationAsRead(
    @Path("notificationId") notificationId: String
): Response<ApiResponse<Unit>>

@GET("customer/tasks")
suspend fun getCustomerTasks(
    @Query("customerId") customerId: Int
): Response<ApiResponse<List<Task>>>
```

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/CustomerRepository.kt`

**Action:** Add customer repository methods

**Changes:**
```kotlin
// ADD new methods:
suspend fun getCustomerNotifications(customerId: Int): Result<List<CustomerNotification>>
suspend fun markNotificationAsRead(notificationId: String): Result<Unit>
suspend fun getCustomerTasks(customerId: Int): Result<List<Task>>
```

**File:** `android-app/app/src/main/java/com/swayog/employee/data/model/CustomerModels.kt`

**Action:** Add customer notification model

**Changes:**
```kotlin
// ADD new data class:
data class CustomerNotification(
    val id: String,
    val customerId: Int,
    val type: String,
    val message: String,
    val taskId: Int?,
    val imageUrl: String?,
    val isRead: Boolean,
    val createdAt: String
)
```

#### Backend Changes

**File:** `backend/src/modules/customer/customer.routes.ts` (NEW FILE)

**Action:** Create customer routes

**New File Content:**
```typescript
import { Router } from 'express';
import { authenticateAccessToken, authorizeRoles } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { getCustomerNotifications, markNotificationAsRead, getCustomerTasks } from './customer.controller.js';

export const customerRoutes = Router();

customerRoutes.get(
  '/notifications',
  authenticateAccessToken,
  authorizeRoles(UserRole.CUSTOMER),
  asyncHandler(getCustomerNotifications)
);

customerRoutes.post(
  '/notifications/:notificationId/read',
  authenticateAccessToken,
  authorizeRoles(UserRole.CUSTOMER),
  asyncHandler(markNotificationAsRead)
);

customerRoutes.get(
  '/tasks',
  authenticateAccessToken,
  authorizeRoles(UserRole.CUSTOMER),
  asyncHandler(getCustomerTasks)
);
```

**File:** `backend/src/modules/customer/customer.controller.ts` (NEW FILE)

**Action:** Create customer controller

**New File Content:**
```typescript
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../middleware/error.js';

export async function getCustomerNotifications(req, res) {
  const customerId = req.auth.userId;
  const notifications = await prisma.customerNotification.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json({ success: true, data: notifications });
}

export async function markNotificationAsRead(req, res) {
  const { notificationId } = req.params;
  await prisma.customerNotification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
  res.json({ success: true });
}

export async function getCustomerTasks(req, res) {
  const customerId = req.auth.userId;
  const tasks = await prisma.task.findMany({
    where: { customerId },
    orderBy: { scheduledTime: 'desc' }
  });
  res.json({ success: true, data: tasks });
}
```

**File:** `backend/src/index.ts`

**Action:** Register customer routes

**Changes:**
```typescript
import { customerRoutes } from './modules/customer/customer.routes.js';

// ADD:
app.use('/customer', customerRoutes);
```

**Testing:**
- Test customer login
- Test customer dashboard
- Test task listing
- Test notifications
- Test task rating

---

### Priority 5: Add Admin Dashboard Features

#### Android Dependencies

**File:** `android-app/app/build.gradle.kts` (Module: app)

**Action:** Add chart library

**Changes:**
```kotlin
dependencies {
    // ADD:
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    implementation("com.google.maps.android:android-maps-utils:2.3.0")
}
```

#### New Android Screens

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/AdminDashboardScreen.kt`

**Action:** Create comprehensive admin dashboard

**New File Content:**
```kotlin
@Composable
fun AdminDashboardScreen(
    navController: NavController,
    viewModel: AdminDashboardViewModel = hiltViewModel()
) {
    val dashboardStats by viewModel.dashboardStats.collectAsState()
    
    Column {
        // Revenue Chart (Line Chart)
        RevenueChart(dashboardStats.revenueData)
        
        // Installation Chart (Bar Chart)
        InstallationChart(dashboardStats.installationData)
        
        // Active Jobs by Zone (Pie Chart)
        ZoneJobsChart(dashboardStats.zoneData)
        
        // Interactive Map
        AdminMap(dashboardStats.taskLocations)
        
        // Recent Activity Feed
        ActivityFeed(dashboardStats.activities)
        
        // Quick Actions
        QuickActions(navController)
    }
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/charts/RevenueChart.kt`

**Action:** Create revenue chart component

**New File Content:**
```kotlin
@Composable
fun RevenueChart(data: List<RevenueDataPoint>) {
    AndroidView(
        factory = { context ->
            LineChart(context).apply {
                // Configure chart
                data = LineData(...).apply {
                    // Add data sets
                }
            }
        },
        update = { chart ->
            // Update chart with new data
        }
    )
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/charts/InstallationChart.kt`

**Action:** Create installation chart component

**New File Content:**
```kotlin
@Composable
fun InstallationChart(data: List<InstallationDataPoint>) {
    AndroidView(
        factory = { context ->
            BarChart(context).apply {
                // Configure bar chart
            }
        }
    )
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/AdminMap.kt`

**Action:** Create admin map component

**New File Content:**
```kotlin
@Composable
fun AdminMap(taskLocations: List<TaskLocation>) {
    val cameraPositionState = rememberCameraPositionState {
        CameraPosition.fromLatLngZoom(LatLng(18.5204, 73.8567), 12f)
    }
    
    GoogleMap(
        cameraPositionState = cameraPositionState,
        properties = MapProperties(
            isMyLocationEnabled = true
        )
    ) {
        taskLocations.forEach { location ->
            Marker(
                state = MarkerState(position = LatLng(location.latitude, location.longitude)),
                title = location.customerName,
                snippet = location.taskType
            )
        }
    }
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/ActivityFeed.kt`

**Action:** Create activity feed component

**New File Content:**
```kotlin
@Composable
fun ActivityFeed(activities: List<ActivityItem>) {
    LazyColumn {
        items(activities) { activity ->
            ActivityItemCard(activity)
        }
    }
}

@Composable
fun ActivityItemCard(activity: ActivityItem) {
    Card {
        Row {
            Icon(activity.icon)
            Column {
                Text(activity.title)
                Text(activity.timestamp)
                Text(activity.description)
            }
        }
    }
}
```

#### Android ViewModel

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/AdminDashboardViewModel.kt`

**Action:** Create admin dashboard view model

**New File Content:**
```kotlin
@HiltViewModel
class AdminDashboardViewModel @Inject constructor(
    private val adminRepository: AdminRepository
) : ViewModel() {
    
    private val _dashboardStats = mutableStateOf<DashboardStats?>(null)
    val dashboardStats: State<DashboardStats?> = _dashboardStats
    
    init {
        loadDashboardStats()
    }
    
    private fun loadDashboardStats() {
        viewModelScope.launch {
            _dashboardStats.value = adminRepository.getDashboardStats()
        }
    }
}
```

#### Android Repository

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/AdminDashboardRepository.kt`

**Action:** Create admin dashboard repository

**New File Content:**
```kotlin
@Singleton
class AdminDashboardRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getDashboardStats(): DashboardStats {
        val response = apiService.getAdminDashboard()
        return if (response.isSuccessful && response.body()?.data != null) {
            response.body()!!.data!!
        } else {
            DashboardStats() // Return empty stats on error
        }
    }
}
```

#### Android Models

**File:** `android-app/app/src/main/java/com/swayog/employee/data/model/AdminModels.kt`

**Action:** Add admin dashboard models

**New File Content:**
```kotlin
data class DashboardStats(
    val totalCustomers: Int = 0,
    val totalEmployees: Int = 0,
    val activeTasks: Int = 0,
    val completedTasks: Int = 0,
    val totalRevenue: Double = 0.0,
    val monthlyRevenue: Double = 0.0,
    val pendingServiceRequests: Int = 0,
    val amcCustomers: Int = 0,
    val revenueData: List<RevenueDataPoint> = emptyList(),
    val installationData: List<InstallationDataPoint> = emptyList(),
    val zoneData: List<ZoneDataPoint> = emptyList(),
    val taskLocations: List<TaskLocation> = emptyList(),
    val activities: List<ActivityItem> = emptyList()
)

data class RevenueDataPoint(
    val month: String,
    val amount: Double
)

data class InstallationDataPoint(
    val zone: String,
    val count: Int
)

data class ZoneDataPoint(
    val zone: String,
    val activeJobs: Int
)

data class TaskLocation(
    val customerId: Int,
    val customerName: String,
    val taskType: String,
    val latitude: Double,
    val longitude: Double
)

data class ActivityItem(
    val id: String,
    val title: String,
    val description: String,
    val timestamp: String,
    val icon: ImageVector
)
```

**Testing:**
- Test revenue chart rendering
- Test installation chart rendering
- Test map markers
- Test activity feed
- Test quick actions

---

### Priority 6: Implement Bulk Operations

#### Android Screens

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/BulkTaskCreationScreen.kt`

**Action:** Create bulk task creation screen

**New File Content:**
```kotlin
@Composable
fun BulkTaskCreationScreen(
    navController: NavController,
    viewModel: BulkTaskViewModel = hiltViewModel()
) {
    val selectedEmployees by viewModel.selectedEmployees.collectAsState()
    val taskDetails by viewModel.taskDetails.collectAsState()
    
    Column {
        // Employee selection (multi-select)
        EmployeeMultiSelector(
            selectedEmployees = selectedEmployees,
            onSelectionChanged = { viewModel.updateSelectedEmployees(it) }
        )
        
        // Task details form
        TaskDetailsForm(
            taskDetails = taskDetails,
            onDetailsChanged = { viewModel.updateTaskDetails(it) }
        )
        
        // Create button
        Button(onClick = { viewModel.createBulkTasks() }) {
            Text("Create Bulk Tasks")
        }
    }
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/BulkImportScreen.kt`

**Action:** Create bulk import screen

**New File Content:**
```kotlin
@Composable
fun BulkImportScreen(
    navController: NavController,
    viewModel: BulkImportViewModel = hiltViewModel()
) {
    val selectedFile by viewModel.selectedFile.collectAsState()
    val importType by viewModel.importType.collectAsState()
    
    Column {
        // Import type selection (Employees/Customers)
        ImportTypeSelector(
            selectedType = importType,
            onTypeSelected = { viewModel.updateImportType(it) }
        )
        
        // File picker
        FilePicker(
            selectedFile = selectedFile,
            onFileSelected = { viewModel.updateSelectedFile(it) }
        )
        
        // Import button
        Button(onClick = { viewModel.importData() }) {
            Text("Import Data")
        }
    }
}
```

#### Android API Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt`

**Action:** Add bulk operations endpoints

**Changes:**
```kotlin
// ADD bulk endpoints:
@POST("tasks/bulk")
suspend fun createBulkTasks(
    @Body request: CreateBulkTasksRequest
): Response<ApiResponse<List<Task>>>

@POST("subadmin/employees/bulk-import")
suspend fun importEmployeesFromExcel(
    @Body data: List<Map<String, String>>
): Response<ApiResponse<Unit>>

@POST("subadmin/customers/bulk-import")
suspend fun importCustomersFromExcel(
    @Body data: List<Map<String, String>>
): Response<ApiResponse<Unit>>
```

#### Android Repository

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/BulkOperationsRepository.kt`

**Action:** Create bulk operations repository

**New File Content:**
```kotlin
@Singleton
class BulkOperationsRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun createBulkTasks(
        employeeIds: List<String>,
        taskDetails: CreateTaskRequest
    ): Result<List<Task>> {
        return try {
            val request = CreateBulkTasksRequest(
                employeeUserIds = employeeIds,
                jobType = taskDetails.jobType,
                description = taskDetails.description,
                customerName = taskDetails.customerName,
                customerPhone = taskDetails.customerPhone,
                address = taskDetails.address,
                latitude = taskDetails.latitude,
                longitude = taskDetails.longitude,
                scheduledTime = taskDetails.scheduledTime
            )
            val response = apiService.createBulkTasks(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to create bulk tasks"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun importEmployees(data: List<Map<String, String>>): Result<Unit> {
        return try {
            val response = apiService.importEmployeesFromExcel(data)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to import employees"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun importCustomers(data: List<Map<String, String>>): Result<Unit> {
        return try {
            val response = apiService.importCustomersFromExcel(data)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to import customers"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### Android Models

**File:** `android-app/app/src/main/java/com/swayog/employee/data/model/BulkModels.kt`

**Action:** Add bulk operations models

**New File Content:**
```kotlin
data class CreateBulkTasksRequest(
    val employeeUserIds: List<String>,
    val jobType: String,
    val description: String,
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val scheduledTime: String
)
```

**Testing:**
- Test bulk task creation
- Test employee import
- Test customer import
- Verify data integrity after import

---

## Phase 3: Enhanced Features (Week 5-6)

### Priority 7: Add Financial Management UI

#### Android Screens

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/FinancialDashboardScreen.kt`

**Action:** Create financial dashboard

**New File Content:**
```kotlin
@Composable
fun FinancialDashboardScreen(
    navController: NavController,
    viewModel: FinancialViewModel = hiltViewModel()
) {
    val financialData by viewModel.financialData.collectAsState()
    
    Column {
        // Monthly P&L Chart
        MonthlyProfitLossChart(financialData.profitLossData)
        
        // Zone Breakdown
        ZoneBreakdownChart(financialData.zoneData)
        
        // AMC Contracts List
        AmcContractsList(financialData.amcContracts)
        
        // Partner Payouts
        PartnerPayoutsList(financialData.partnerPayouts)
    }
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/admin/FinancialViewModel.kt`

**Action:** Create financial view model

**New File Content:**
```kotlin
@HiltViewModel
class FinancialViewModel @Inject constructor(
    private val financialRepository: FinancialRepository
) : ViewModel() {
    
    private val _financialData = mutableStateOf<FinancialData?>(null)
    val financialData: State<FinancialData?> = _financialData
    
    init {
        loadFinancialData()
    }
    
    private fun loadFinancialData() {
        viewModelScope.launch {
            _financialData.value = financialRepository.getFinancialData()
        }
    }
}
```

#### Android API Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt`

**Action:** Add financial endpoints

**Changes:**
```kotlin
// ADD financial endpoints:
@GET("admin/financial/summary")
suspend fun getFinancialSummary(
    @Query("period") period: String = "monthly"
): Response<ApiResponse<FinancialSummary>>

@GET("admin/financial/amc-contracts")
suspend fun getAmcContracts(
    @Query("status") status: String?
): Response<ApiResponse<List<AmcContract>>>

@GET("admin/financial/partner-payouts")
suspend fun getPartnerPayouts(
    @Query("partnerId") partnerId: String?
): Response<ApiResponse<List<PartnerPayout>>>
```

**Testing:**
- Test financial dashboard
- Test P&L chart
- Test zone breakdown
- Test AMC contracts list
- Test partner payouts

---

### Priority 8: Implement Notification Center

#### Android Screens

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/common/NotificationCenterScreen.kt`

**Action:** Create unified notification center

**New File Content:**
```kotlin
@Composable
fun NotificationCenterScreen(
    navController: NavController,
    viewModel: NotificationViewModel = hiltViewModel()
) {
    val notifications by viewModel.notifications.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    
    Column {
        // Header with unread count
        NotificationHeader(unreadCount)
        
        // Filter tabs
        NotificationFilterTabs(
            selectedFilter = viewModel.selectedFilter,
            onFilterSelected = { viewModel.updateFilter(it) }
        )
        
        // Notification list
        LazyColumn {
            items(notifications) { notification ->
                NotificationCard(
                    notification = notification,
                    onClick = { viewModel.markAsRead(notification.id) }
                )
            }
        }
    }
}
```

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/common/NotificationViewModel.kt`

**Action:** Create notification view model

**New File Content:**
```kotlin
@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val notificationRepository: NotificationRepository
) : ViewModel() {
    
    private val _notifications = mutableStateOf<List<Notification>>(emptyList())
    val notifications: State<List<Notification>> = _notifications
    
    private val _unreadCount = mutableStateOf(0)
    val unreadCount: State<Int> = _unreadCount
    
    var selectedFilter by mutableStateOf("all")
    
    init {
        loadNotifications()
        loadUnreadCount()
    }
    
    private fun loadNotifications() {
        viewModelScope.launch {
            _notifications.value = notificationRepository.getNotifications()
        }
    }
    
    private fun loadUnreadCount() {
        viewModelScope.launch {
            _unreadCount.value = notificationRepository.getUnreadCount()
        }
    }
    
    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            notificationRepository.markAsRead(notificationId)
            loadNotifications()
            loadUnreadCount()
        }
    }
}
```

**Testing:**
- Test notification listing
- Test filter functionality
- Test mark as read
- Test unread count updates

---

### Priority 9: Add Export Functionality

#### Android API Changes

**File:** `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt`

**Action:** Add export endpoints

**Changes:**
```kotlin
// ADD export endpoints:
@GET("subadmin/customers/export")
suspend fun exportCustomersToExcel(): Response<ApiResponse<String>>

@GET("subadmin/employees/export")
suspend fun exportEmployeesToExcel(): Response<ApiResponse<String>>

@GET("subadmin/tasks/export")
suspend fun exportTasksToExcel(): Response<ApiResponse<String>>
```

#### Android Repository

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/ExportRepository.kt`

**Action:** Create export repository

**New File Content:**
```kotlin
@Singleton
class ExportRepository @Inject constructor(
    private val apiService: ApiService,
    @ApplicationContext private val context: Context
) {
    suspend fun exportCustomers(): Result<Uri> {
        return try {
            val response = apiService.exportCustomersToExcel()
            if (response.isSuccessful && response.body()?.data != null) {
                val downloadUrl = response.body()!!.data!!
                val file = downloadFile(downloadUrl, "customers_export.xlsx")
                Result.success(Uri.fromFile(file))
            } else {
                Result.failure(Exception("Failed to export customers"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private suspend fun downloadFile(url: String, fileName: String): File {
        // Download file from URL to local storage
        val request = Request.Builder().url(url).build()
        val response = OkHttpClient().newCall(request).execute()
        val file = File(context.getExternalFilesDir(null), fileName)
        file.writeBytes(response.body!!.bytes())
        return file
    }
}
```

**Testing:**
- Test customer export
- Test employee export
- Test task export
- Verify file download
- Verify file format

---

## Phase 4: Testing & Polish (Week 7-8)

### Priority 10: End-to-End Testing

#### Test Plan

**Task Completion Flow:**
1. Create task via Android
2. Assign to employee
3. Employee completes task with photos
4. Verify photos in R2
5. Verify task status in database
6. Verify notifications sent

**Customer Portal Flow:**
1. Customer login
2. View dashboard
3. View tasks
4. Rate completed task
5. View notifications

**Admin Dashboard Flow:**
1. Admin login
2. View dashboard charts
3. View map with task locations
4. View activity feed
5. Create bulk tasks
6. Import employees

**Offline Sync Flow:**
1. Complete task offline
2. Verify local storage
3. Reconnect network
4. Verify sync to server
5. Verify conflict resolution

#### Test Automation

**File:** `android-app/app/src/androidTest/java/com/swayog/employee/TaskCompletionTest.kt`

**Action:** Create automated test for task completion

**New File Content:**
```kotlin
@RunWith(AndroidJUnit4::class)
class TaskCompletionTest {
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Test
    fun completeTask_withPhotos_success() {
        // Test task completion with photos
        composeTestRule.setContent {
            TaskCompletionScreen(taskId = "123")
        }
        
        // Fill completion form
        composeTestRule.onNodeWithText("Completion Message")
            .performTextInput("Task completed successfully")
        
        // Add photos
        composeTestRule.onNodeWithText("Add Photo")
            .performClick()
        
        // Submit
        composeTestRule.onNodeWithText("Complete Task")
            .performClick()
        
        // Verify success
        composeTestRule.onNodeWithText("Task Completed")
            .assertIsDisplayed()
    }
}
```

---

### Priority 11: Performance Optimization

#### Image Loading Optimization

**File:** `android-app/app/src/main/java/com/swayog/employee/presentation/common/ImageLoader.kt`

**Action:** Optimize image loading with Coil

**Changes:**
```kotlin
@Composable
fun OptimizedImage(
    url: String,
    contentDescription: String?,
    modifier: Modifier = Modifier
) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(url)
            .crossfade(true)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .diskCachePolicy(CachePolicy.ENABLED)
            .size(800, 600) // Resize images
            .build(),
        contentDescription = contentDescription,
        modifier = modifier,
        contentScale = ContentScale.Fit
    )
}
```

#### Sync Performance Optimization

**File:** `android-app/app/src/main/java/com/swayog/employee/data/sync/SyncWorker.kt`

**Action:** Optimize sync worker

**Changes:**
```kotlin
class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {
    
    override suspend fun doWork(): Result {
        return try {
            // Batch sync operations
            val outboxItems = outboxQueueDao.getPendingItems()
            
            // Process in batches of 10
            outboxItems.chunked(10).forEach { batch ->
                batch.forEach { item ->
                    processOutboxItem(item)
                }
            }
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

---

### Priority 12: Documentation

#### API Documentation Update

**File:** `API_ENDPOINTS_DOCUMENTATION.md`

**Action:** Add new endpoints to documentation

**Changes:**
- Add customer portal endpoints
- Add admin dashboard endpoints
- Add bulk operations endpoints
- Add financial endpoints
- Add export endpoints

#### User Documentation Update

**File:** `docs/USER_GUIDE.md` (NEW FILE)

**Action:** Create user guide

**New File Content:**
```markdown
# Swayog Employee App - User Guide

## Customer Portal

### Login
1. Open app
2. Select "Customer Portal"
3. Enter customer code
4. Enter portal password
5. Tap "Login"

### Dashboard
- View project trajectory
- View pending tasks
- View system details
- View AMC history

### Tasks
- View assigned tasks
- Rate completed tasks
- View task photos

## Admin Dashboard

### Dashboard
- View revenue charts
- View installation charts
- View zone breakdown
- View interactive map
- View activity feed

### Bulk Operations
- Create bulk tasks
- Import employees
- Import customers
- Export data
```

---

## Risk Mitigation

### Risk 1: Task Completion Endpoint Standardization

**Mitigation:**
- Test both endpoints before removing Android-specific one
- Keep Android-specific endpoint as fallback during transition
- Monitor for errors during transition period

### Risk 2: Database Schema Changes

**Mitigation:**
- Use Prisma migrations for schema changes
- Test migrations on staging environment
- Backup database before migration
- Rollback plan ready

### Risk 3: Offline Sync Conflicts

**Mitigation:**
- Implement conflict resolution strategy (last-write-wins)
- Add conflict detection and user notification
- Provide manual conflict resolution UI
- Test with multiple concurrent users

### Risk 4: Performance Degradation

**Mitigation:**
- Profile app performance before and after changes
- Optimize database queries
- Implement caching strategies
- Add performance monitoring

---

## Rollback Plan

### Phase 1 Rollback

If task completion standardization fails:
1. Revert Android API changes
2. Revert backend route changes
3. Keep both endpoints active
4. Monitor usage of both endpoints

### Phase 2 Rollback

If customer portal implementation fails:
1. Disable customer portal routes
2. Remove customer portal screens
3. Keep backend changes isolated
4. Revert Android navigation changes

### Phase 3 Rollback

If admin dashboard features fail:
1. Remove new chart dependencies
1. Revert to simple dashboard
2. Keep existing admin functionality
3. Disable new features via feature flags

---

## Success Criteria

### Phase 1 Success Criteria
- [x] Task completion endpoint standardized
- [x] Image upload transaction flow fixed
- [x] Task type detection centralized
- [x] All tests passing

### Phase 2 Success Criteria
- [ ] Customer portal functional
- [ ] Admin dashboard charts working
- [ ] Bulk operations functional
- [ ] All tests passing

### Phase 3 Success Criteria
- [ ] Financial dashboard functional
- [ ] Notification center functional
- [ ] Export functionality working
- [ ] All tests passing

### Phase 4 Success Criteria
- [ ] End-to-end tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User acceptance testing passed

---

## Timeline Summary

| Week | Phase | Tasks |
|------|-------|-------|
| 1-2 | Phase 1 | Critical core functionality |
| 3-4 | Phase 2 | Missing core features |
| 5-6 | Phase 3 | Enhanced features |
| 7-8 | Phase 4 | Testing & polish |

---

## File Modification Summary

### Backend Files to Modify
1. `backend/src/modules/employee/employee.routes.ts` - Remove Android-specific endpoints
2. `backend/src/modules/tasks/tasks.service.ts` - Add transaction support, task type detection
3. `backend/src/modules/tasks/tasks.routes.ts` - Add task type endpoint
4. `backend/src/modules/customer/customer.routes.ts` - NEW FILE
5. `backend/src/modules/customer/customer.controller.ts` - NEW FILE
6. `backend/src/index.ts` - Register customer routes

### Android Files to Modify
1. `android-app/app/build.gradle.kts` - Add chart library
2. `android-app/app/src/main/java/com/swayog/employee/data/api/ApiService.kt` - Update endpoints
3. `android-app/app/src/main/java/com/swayog/employee/data/repository/TaskRepository.kt` - Update task completion
4. `android-app/app/src/main/java/com/swayog/employee/data/model/TaskModels.kt` - Remove local detection
5. `android-app/app/src/main/java/com/swayog/employee/data/model/CustomerModels.kt` - Add customer models
6. `android-app/app/src/main/java/com/swayog/employee/data/repository/CustomerRepository.kt` - Add customer methods
7. `android-app/app/src/main/java/com/swayog/employee/data/repository/BulkOperationsRepository.kt` - NEW FILE
8. `android-app/app/src/main/java/com/swayog/employee/data/repository/ExportRepository.kt` - NEW FILE
9. `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerLoginScreen.kt` - NEW FILE
10. `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerDashboardScreen.kt` - NEW FILE
11. `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerTasksScreen.kt` - NEW FILE
12. `android-app/app/src/main/java/com/swayog/employee/presentation/customer/CustomerNotificationsScreen.kt` - NEW FILE
13. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/AdminDashboardScreen.kt` - NEW FILE
14. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/charts/RevenueChart.kt` - NEW FILE
15. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/charts/InstallationChart.kt` - NEW FILE
16. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/AdminMap.kt` - NEW FILE
17. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/ActivityFeed.kt` - NEW FILE
18. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/BulkTaskCreationScreen.kt` - NEW FILE
19. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/BulkImportScreen.kt` - NEW FILE
20. `android-app/app/src/main/java/com/swayog/employee/presentation/admin/FinancialDashboardScreen.kt` - NEW FILE
21. `android-app/app/src/main/java/com/swayog/employee/presentation/common/NotificationCenterScreen.kt` - NEW FILE

---

## Next Steps

1. **Review and approve this implementation plan**
2. **Set up staging environment for testing**
3. **Begin Phase 1 implementation**
4. **Weekly progress reviews**
5. **Adjust timeline as needed based on progress**

---

## Contact

For questions or clarifications about this implementation plan, please contact:
- **Technical Lead:** [Contact]
- **Project Manager:** [Contact]
- **Android Developer:** [Contact]
- **Backend Developer:** [Contact]
