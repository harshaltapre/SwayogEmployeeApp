# Web → Android Parity Analysis Report

**Generated:** 2026-08-24  
**Purpose:** Comprehensive analysis to bring Android application into functional parity with Web Dashboard

---

## Executive Summary

The Swayog Energy Dashboard consists of two client applications:
- **Web Application**: React + TypeScript frontend, Express.js backend
- **Android Application**: Jetpack Compose (Kotlin) frontend, same backend API

Both applications share:
- **Backend API**: Express.js with Prisma ORM
- **Database**: PostgreSQL/Neon
- **Storage**: Cloudflare R2 for images

**Overall Parity Assessment:** ~70% - Strong core functionality, several gaps in admin/customer features

---

## Architecture Comparison

### Web Application Architecture

**Frontend Stack:**
- React with TypeScript
- Vite build system
- Tailwind CSS for styling
- Recharts for data visualization
- Leaflet for maps
- React Query for data fetching
- Wouter for routing

**Backend Stack:**
- Express.js server
- Prisma ORM with PostgreSQL/Neon
- AWS SDK S3 for Cloudflare R2
- Multer for file uploads
- JWT authentication

**Key Features:**
- Real-time inverter telemetry (8 provider integrations)
- Task management with multi-employee assignment
- AMC visit scheduling and tracking
- Customer portal with notifications
- Financial management (invoices, payments)
- Inventory management
- Partner management
- Role-based access control (8 roles)

### Android Application Architecture

**Frontend Stack:**
- Jetpack Compose (Kotlin)
- Hilt for dependency injection
- Room Database for offline storage
- WorkManager for background sync
- Retrofit for API calls
- Coil for image loading
- Google Maps SDK
- TensorFlow Lite for face recognition

**Key Features:**
- Offline-first architecture with Room DB
- Outbox queue for offline operations
- Smart sync with conflict resolution
- Native camera integration with watermarking
- GPS location services
- Face recognition for attendance
- FCM push notifications

---

## R2 Storage Implementation Analysis

### Web Application R2 Implementation

**File:** `backend/src/services/r2StorageService.ts`

**Object Key Structure:**
```
tasks/{taskType}/{customerName}/{taskId}/{type}/{uuid}.{ext}
```

**Example:**
```
tasks/amc_cleaning/john-doe/123/before/abc123.jpg
tasks/site_visit/jane-smith/456/site-visit/def456.jpg
```

**Key Features:**
- AWS SDK S3 client for Cloudflare R2
- Presigned URL generation with 7-day expiry
- In-memory caching for presigned URLs (15-minute validity)
- File type validation (JPEG, PNG, GIF, WEBP)
- File size limit: 10MB
- Automatic metadata tagging (original filename, upload timestamp)
- Mandatory R2 configuration check

**Environment Variables Required:**
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ACCOUNT_ID`

### Android Application R2 Integration

**Current Status:** Android uses the same backend R2 service via API

**Image Upload Flow:**
1. Capture image with camera
2. Apply watermark (timestamp + location)
3. Convert to Base64
4. Send to backend via API
5. Backend uploads to R2
6. Backend returns R2 URL
7. Android stores URL in local DB

**Gap:** Android does not directly interact with R2 - all R2 operations go through backend API

---

## Task Workflow Analysis

### Web Application Task Workflow

**File:** `backend/src/modules/tasks/tasks.service.ts`

**Task Types:**
- `REGULAR` - Standard service tasks
- `SITE_VISIT` - Site survey/inspection (4-10 photos)
- `AMC_VISIT` - AMC cleaning/maintenance (1 before + 1 after)
- `INSTALLATION` - New installation tasks
- `SERVICE` - General service tasks
- `COMPLAINT` - Customer complaints
- `SURVEY` - Site survey tasks

**Image Requirements by Task Type:**

| Task Type | Before Photo | After Photo | Site Photos | Total Required |
|----------|-------------|------------|-------------|----------------|
| AMC_CLEANING | ✅ Required | ✅ Required | ❌ No | 2 |
| AMC_MAINTENANCE | ✅ Required | ✅ Required | ❌ No | 2 |
| SITE_VISIT | ❌ No | ❌ No | ✅ 4-10 | 4-10 |
| REGULAR | ✅ Required | ✅ Required | ❌ No | 2 |
| INSTALLATION | ✅ Required | ✅ Required | ❌ No | 2 |

**Task Assignment:**
- Multi-employee support via `TaskAssignment` model
- Hierarchical assignment (manager → team lead → employee)
- Service coordinator assignment
- Bulk assignment to multiple employees

**Task Completion Flow:**
1. Validate required images based on task type
2. Upload images to R2 via `processAndSaveBase64Photos()`
3. Save image metadata to `TaskImage` table
4. Update task status to `COMPLETED`
5. Create notifications (admin, customer, employee)
6. Update performance metrics

**API Endpoints:**
- `GET /tasks` = List tasks with filters
- `POST /tasks` = Create single task
- `POST /tasks/bulk` = Create bulk tasks
- `PATCH /tasks/{id}/complete` = Complete task
- `PATCH /tasks/{id}/photos` = Update task photos
- `POST /tasks/{id}/rate` = Rate completed task

### Android Application Task Workflow

**File:** `android-app/app/src/main/java/com/swayog/employee/data/repository/TaskRepository.kt`

**Task Type Detection:**
```kotlin
val isAmcVisit: Boolean
    get() = taskType == "AMC_VISIT" || 
            jobType?.lowercase()?.contains("amc") == true || 
            id.startsWith("amc_")

val isSiteVisit: Boolean
    get() = taskType == "SITE_VISIT" || 
            jobType?.lowercase()?.contains("site") == true || 
            jobType?.lowercase()?.contains("survey") == true
```

**Image Requirements:**
```kotlin
val requiredImageCount: Int
    get() = when {
        isSiteVisit -> 4
        else -> 2 // 1 before + 1 after
    }
```

**Task Completion Flow:**
1. Capture images with camera
2. Apply watermark via `WatermarkHelper`
3. Capture GPS coordinates
4. Save to local Room DB with `isSynced = false`
5. Add to `OutboxQueue` for sync
6. If online: upload immediately via API
7. If offline: queue for background sync via WorkManager

**API Endpoints Used:**
- `GET /tasks` ✅
- `POST /tasks` ✅
- `POST /employee/tasks/{id}/complete` ⚠️ (Different from web)
- `PATCH /tasks/{id}/photos` ✅
- `POST /tasks/{id}/rate` ✅

**Key Difference:**
- Web uses: `PATCH /tasks/{id}/complete`
- Android uses: `POST /employee/tasks/{id}/complete`

**Smart Sync Mechanism:**
- Detects locally completed tasks that backend shows as not completed
- Re-queues completion for sync
- Merges local and backend state to prevent conflicts
- Purges stale synced tasks before inserting fresh API data

---

## Database Schema Analysis

### Core Models (Shared)

**User Management:**
- `User` - Base user accounts with roles
- `EmployeeProfile` - Employee-specific data
- `PartnerProfile` - Partner-specific data
- `RefreshToken` - Token management
- `AuditLog` - Audit trail

**Task Management:**
- `Task` - Service tasks
- `TaskAssignment` - Multi-employee assignments
- `TaskImage` - Before/after images with GPS
- `WorkSubmission` - Work submissions

**Customer Management:**
- `Customer` - Customer records with inverter credentials
- `Apartment` - Apartment/grouping
- `ServiceRequest` - Customer service requests
- `CustomerNotification` - Customer notifications

**AMC Management:**
- `AmcContract` - AMC contracts
- `AmcVisit` - Scheduled visits with before/after images

**Financial:**
- `Invoice` - Billing
- `Payment` - Payment records
- `Expense` - Expense tracking
- `DispatchRecord` - Material dispatches

**Attendance:**
- `AttendanceRecord` - Daily attendance
- `CheckIn` - Check-in records with face verification
- `FaceEnrollment` - Face recognition data
- `PerformanceSnapshot` - Monthly performance
- `DailyCommit` - Work logging

**Inverter Data:**
- `InverterInstallation` - Multi-inverter system
- `GenerationLog` - Historical generation data
- `InverterCache` - Cached inverter data
- Provider-specific tables (GrowattCustomer, WaareeGeneration, etc.)

### Android-Specific Local Storage

**Room Database Tables:**
- `TaskEntity` - Local task cache with sync status
- `UserEntity` - User profile cache
- `CustomerEntity` - Customer cache
- `OutboxQueueEntity` - Pending sync operations

**Sync Status Tracking:**
- `isSynced` - Boolean flag on TaskEntity
- `createdAt` - Timestamp for outbox items
- Automatic retry on network restoration

---

## API Endpoints Comparison

### Authentication & Authorization

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `POST /auth/login` | ✅ | ✅ | ✅ MATCH |
| `POST /auth/refresh` | ✅ | ✅ | ✅ MATCH |
| `POST /auth/logout` | ✅ | ✅ | ✅ MATCH |
| `GET /auth/me` | ✅ | ✅ | ✅ MATCH |
| `POST /auth/register` | ✅ | ✅ | ✅ MATCH |
| `POST /auth/change-password` | ✅ | ❌ | ❌ MISSING |

### Task Management

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `GET /tasks` | ✅ | ✅ Same filters | ✅ MATCH |
| `POST /tasks` | ✅ | ✅ | ✅ MATCH |
| `POST /tasks/bulk` | ✅ | ❌ | ❌ MISSING |
| `PATCH /tasks/{id}/complete` | ✅ | ❌ | ⚠️ DIFFERENT |
| `POST /employee/tasks/{id}/complete` | ❌ | ✅ | ⚠️ ANDROID-ONLY |
| `PATCH /tasks/{id}/photos` | ✅ | ✅ | ✅ MATCH |
| `POST /tasks/{id}/rate` | ✅ | ✅ | ✅ MATCH |
| `DELETE /tasks/{id}` | ✅ | ❌ | ❌ MISSING |

### Customer Management

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `GET /customers` | ✅ | ✅ | ✅ MATCH |
| `GET /customers/{id}` | ✅ | ✅ | ✅ MATCH |
| `POST /customers` | ✅ | ✅ | ✅ MATCH |
| `PATCH /customers/{id}` | ✅ | ✅ | ✅ MATCH |
| `DELETE /customers/{id}` | ✅ | ✅ | ✅ MATCH |
| `GET /subadmin/customers/{id}/summary` | ✅ | ✅ | ✅ MATCH |
| `PATCH /subadmin/customers/{id}` | ✅ | ✅ | ✅ MATCH |

### Employee Management

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `GET /users/internal` | ✅ | ✅ | ✅ MATCH |
| `GET /subadmin/employees` | ✅ | ✅ | ✅ MATCH |
| `POST /subadmin/employees` | ✅ | ✅ | ✅ MATCH |
| `PATCH /subadmin/employees/{id}` | ✅ | ✅ | ✅ MATCH |
| `DELETE /subadmin/employees/{id}` | ✅ | ✅ | ✅ MATCH |
| `POST /subadmin/employees/bulk-import` | ✅ | ✅ | ✅ MATCH |

### AMC Management

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `GET /subadmin/amc/customers` | ✅ | ✅ | ✅ MATCH |
| `PATCH /subadmin/customers/{id}/amc-settings` | ✅ | ✅ | ✅ MATCH |
| `GET /subadmin/amc-visits` | ✅ | ✅ | ✅ MATCH |
| `POST /subadmin/amc-visits` | ✅ | ✅ | ✅ MATCH |
| `PATCH /subadmin/amc-visits/{id}` | ✅ | ✅ | ✅ MATCH |
| `POST /subadmin/amc-visits/{id}/complete` | ✅ | ✅ | ✅ MATCH |

### Inverter Data

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `GET /subadmin/customers/{id}/inverter-generation` | ✅ | ✅ | ✅ MATCH |
| `GET /subadmin/customers/{id}/inverter-generation-history` | ✅ | ✅ | ✅ MATCH |

### Notifications

| Endpoint | Web | Android | Status |
|----------|-----|---------|--------|
| `GET /employee/notifications` | ❌ | ✅ | ⚠️ ANDROID-ONLY |
| `GET /employee/notifications/unread-count` | ❌ | ✅ | ⚠️ ANDROID-ONLY |
| `POST /employee/notifications/{id}/read` | ❌ | ✅ | ⚠️ ANDROID-ONLY |
| `GET /customer/notifications` | ✅ | ❌ | ❌ MISSING |

---

## Feature Parity Matrix

### Authentication & Authorization

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| User Login | ✅ | ✅ | ✅ FULL | Same endpoint |
| Token Refresh | ✅ | ✅ | ✅ FULL | Same endpoint |
| Logout | ✅ | ✅ | ✅ FULL | Same endpoint |
| Register | ✅ | ✅ | ✅ FULL | Same endpoint |
| Change Password | ✅ | ❌ | ❌ MISSING | Web has this |
| Get Current User | ✅ | ✅ | ✅ FULL | Same endpoint |
| Profile Photo Upload | ✅ | ✅ | ✅ FULL | Android has multipart + JSON |
| Role-based Access | ✅ | ✅ | ✅ FULL | 8 roles supported |

### Dashboard

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Employee Dashboard | ✅ | ✅ | ✅ FULL | Task counts, attendance, performance |
| Sub-Admin Dashboard | ✅ | ✅ | ✅ FULL | Customer selection, inverter telemetry |
| Admin Dashboard | ✅ | ⚠️ | ⚠️ PARTIAL | Android missing charts, map, activity feed |
| Revenue Chart | ✅ | ❌ | ❌ MISSING | Web has Recharts visualization |
| Installation Chart | ✅ | ❌ | ❌ MISSING | Web has bar chart |
| Active Jobs by Zone | ✅ | ❌ | ❌ MISSING | Web has zone grouping |
| Interactive Map | ✅ | ⚠️ | ⚠️ PARTIAL | Android has Google Maps but not admin map |
| Recent Activity Feed | ✅ | ❌ | ❌ MISSING | Web has activity timeline |
| Quick Actions | ✅ | ❌ | ❌ MISSING | Web has action buttons |

### Task Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| List Tasks with Filters | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Create Single Task | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Create Bulk Tasks | ✅ | ❌ | ❌ MISSING | Web has bulk creation |
| Complete Task | ✅ | ✅ | ⚠️ DIFFERENT | Different endpoint but equivalent |
| Rate Task | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Before/After Images | ✅ | ✅ | ✅ FULL | Android has camera + watermark |
| GPS Coordinates | ✅ | ✅ | ✅ FULL | Android has fused location |
| Watermark Support | ✅ | ✅ | ✅ FULL | Android has WatermarkHelper |
| Task Assignment | ✅ | ✅ | ✅ FULL | Multi-employee support |
| Task History | ✅ | ✅ | ✅ FULL | Same data structure |
| Delete Task | ✅ | ❌ | ❌ MISSING | Web has delete |

### Task Types & Image Requirements

| Task Type | Web | Android | Parity | Notes |
|----------|-----|---------|--------|-------|
| AMC Cleaning | ✅ | ✅ | ✅ FULL | 1 before + 1 after |
| AMC Maintenance | ✅ | ✅ | ✅ FULL | 1 before + 1 after |
| Site Visit | ✅ | ✅ | ✅ FULL | 4-10 photos |
| Regular Task | ✅ | ✅ | ✅ FULL | 1 before + 1 after |
| Installation | ✅ | ✅ | ✅ FULL | 1 before + 1 after |
| Service | ✅ | ✅ | ✅ FULL | 1 before + 1 after |
| Complaint | ✅ | ✅ | ✅ FULL | 1 before + 1 after |
| Survey | ✅ | ✅ | ✅ FULL | 1 before + 1 after |

### Customer Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Customer Listing | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Search & Filter | ✅ | ✅ | ✅ FULL | Same filters |
| Create Customer | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Edit Customer | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Delete Customer | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Import from Excel | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Export to Excel | ✅ | ❌ | ❌ MISSING | Web has export |
| Warranty Badge | ✅ | ❌ | ❌ MISSING | Web has visual indicator |
| Portal Credential Management | ✅ | ✅ | ✅ FULL | Same fields |
| AMC Status Indicators | ✅ | ✅ | ✅ FULL | Same data |
| Partner Assignment | ✅ | ⚠️ | ⚠️ PARTIAL | May be limited in Android |
| Customer Summary | ✅ | ✅ | ✅ FULL | Same API endpoint |

### Employee Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Employee Listing | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Grid/Table View | ✅ | ⚠️ | ⚠️ PARTIAL | Android may only have one view |
| Create Employee | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Edit Employee | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Delete Employee | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Import from Excel | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Export to Excel | ✅ | ❌ | ❌ MISSING | Web has export |
| Bulk Task Assignment | ✅ | ❌ | ❌ MISSING | Web has bulk assignment |
| Performance Display | ✅ | ⚠️ | ⚠️ PARTIAL | Limited in Android |
| Attendance Status | ✅ | ✅ | ✅ FULL | Same data |
| Active Tasks per Employee | ✅ | ⚠️ | ⚠️ PARTIAL | Limited in Android |

### AMC Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| AMC Customer List | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Search & Filter | ✅ | ✅ | ✅ FULL | Same filters |
| Group by Apartment | ✅ | ✅ | ✅ FULL | Same data structure |
| Individual Settings | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Apartment Bulk Settings | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Excel Import | ✅ | ✅ | ✅ FULL | Same API endpoint |
| AMC Visit Scheduling | ✅ | ✅ | ✅ FULL | Same API endpoint |
| AMC Visit Tracking | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Before/After Images | ✅ | ✅ | ✅ FULL | Same workflow |

### Attendance Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Check-in with Selfie | ✅ | ✅ | ✅ FULL | Android has camera |
| GPS Location | ✅ | ✅ | ✅ FULL | Android has fused location |
| Check-out | ✅ | ✅ | ✅ FULL | Same workflow |
| Work Description | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Face Recognition | ✅ | ✅ | ✅ FULL | Android has TensorFlow Lite |
| Attendance History | ✅ | ✅ | ✅ FULL | Same data structure |
| Performance Metrics | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Monthly Attendance | ✅ | ✅ | ✅ FULL | Same API endpoint |

### Inverter Integration

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Real-time Generation | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Historical Generation | ✅ | ✅ | ✅ FULL | Same API endpoint |
| K-Solar Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| Growatt Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| FoxESS Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| Solarman Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| SolisCloud Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| UTL Solar Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| Waaree Integration | ✅ | ✅ | ✅ FULL | Same backend provider |
| Generic REST | ✅ | ✅ | ✅ FULL | Same backend provider |
| Simulation Fallback | ✅ | ✅ | ✅ FULL | Same fallback logic |
| Credentials Update | ✅ | ✅ | ✅ FULL | Same API endpoint |

### Financial Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Invoice List | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Create Invoice | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Update Invoice | ✅ | ❌ | ❌ MISSING | Web has update |
| Delete Invoice | ✅ | ❌ | ❌ MISSING | Web has delete |
| Financial Summary | ✅ | ⚠️ | ⚠️ PARTIAL | Android has basic screen |
| Monthly P&L | ✅ | ❌ | ❌ MISSING | Web has charts |
| Zone Breakdown | ✅ | ❌ | ❌ MISSING | Web has analytics |
| AMC Contracts | ✅ | ❌ | ❌ MISSING | Web has list |
| Partner Payouts | ✅ | ❌ | ❌ MISSING | Web has tracking |

### Inventory Management

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Inventory List | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Create Item | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Update Item | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Delete Item | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Dispatch List | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Create Dispatch | ✅ | ✅ | ✅ FULL | Same API endpoint |
| Update Dispatch | ✅ | ❌ | ❌ MISSING | Web has update |
| Delete Dispatch | ✅ | ❌ | ❌ MISSING | Web has delete |

### Customer Portal

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Project Trajectory | ✅ | ❌ | ❌ MISSING | No customer portal in Android |
| Pending Task Reviews | ✅ | ❌ | ❌ MISSING | |
| System Details | ✅ | ❌ | ❌ MISSING | |
| AMC Visit History | ✅ | ❌ | ❌ MISSING | |
| Notifications | ✅ | ❌ | ❌ MISSING | |
| Payment Integration | ✅ | ❌ | ❌ MISSING | Razorpay in web |

### Partner Portal

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Partner Profile | ✅ | ❌ | ❌ MISSING | No partner portal in Android |
| Partner Statistics | ✅ | ❌ | ❌ MISSING | |
| Service Requests | ✅ | ❌ | ❌ MISSING | |

### Notifications

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Employee Notifications | ❌ | ✅ | ⚠️ ANDROID-ONLY | Android has FCM |
| Customer Notifications | ✅ | ❌ | ❌ MISSING | Web has customer notifications |
| Admin Notifications | ✅ | ❌ | ❌ MISSING | Web has admin alerts |
| In-App Notification Center | ✅ | ⚠️ | ⚠️ PARTIAL | Android has basic screen |

### Offline Support

| Feature | Web | Android | Parity | Notes |
|---------|-----|---------|--------|-------|
| Local Storage | ❌ | ✅ | ✅ ANDROID-ONLY | Android has Room DB |
| Offline Task Completion | ❌ | ✅ | ✅ ANDROID-ONLY | Android has outbox queue |
| Auto-Sync on Reconnect | ❌ | ✅ | ✅ ANDROID-ONLY | Android has WorkManager |
| Conflict Resolution | ❌ | ✅ | ✅ ANDROID-ONLY | Android has smart sync |

---

## Critical Issues Identified

### Issue 1: Task Completion Endpoint Mismatch

**Problem:**
- Web uses: `PATCH /tasks/{id}/complete`
- Android uses: `POST /employee/tasks/{id}/complete`

**Impact:**
- Different code paths in backend
- Potential for inconsistent behavior
- Maintenance burden

**Recommendation:**
- Standardize on one endpoint
- Verify both endpoints have identical logic
- Update Android to use web endpoint OR update web to use Android endpoint

### Issue 2: Missing Customer Portal in Android

**Problem:**
- Web has full customer portal
- Android has no customer portal UI

**Impact:**
- Customers cannot use Android app
- Missing notifications for customers
- Missing payment integration

**Recommendation:**
- Implement customer portal screens in Android
- Add customer notification endpoints to Android API
- Integrate Razorpay for Android payments

### Issue 3: Missing Admin Dashboard Features in Android

**Problem:**
- Web has comprehensive admin dashboard with charts, maps, activity feed
- Android has basic admin dashboard

**Impact:**
- Admins cannot get full overview on mobile
- Missing revenue/installation charts
- Missing interactive map

**Recommendation:**
- Add chart libraries (MPAndroidChart or similar)
- Implement admin map with custom markers
- Add activity feed screen

### Issue 4: Missing Bulk Operations in Android

**Problem:**
- Web has bulk task creation, bulk employee import
- Android lacks these features

**Impact:**
- Admins cannot efficiently manage bulk operations on mobile
- Reduced productivity for admins

**Recommendation:**
- Add bulk task creation UI
- Add Excel import/export for employees
- Add bulk task assignment UI

---

## Risks & Regressions

### High Risk

1. **Task Completion Endpoint Divergence**
   - Risk: Different behavior between web and Android
   - Regression: Fixing one endpoint may break the other
   - Mitigation: Standardize on single endpoint before making changes

2. **R2 Configuration Dependency**
   - Risk: Android assumes R2 is configured
   - Regression: If R2 misconfigured, task completion fails
   - Mitigation: Add proper error handling and fallback

3. **Offline Sync Conflicts**
   - Risk: Local changes may conflict with server state
   - Regression: Smart sync may not handle all edge cases
   - Mitigation: Comprehensive testing of sync scenarios

### Medium Risk

4. **Image Upload Failure Handling**
   - Risk: Image upload may fail after task marked complete
   - Regression: Task shows completed but images missing
   - Mitigation: Transaction-based completion (upload → save → complete)

5. **Task Type Detection Logic**
   - Risk: Inconsistent task type detection between web and Android
   - Regression: Wrong image requirements applied
   - Mitigation: Centralize task type detection in backend

6. **GPS Coordinate Accuracy**
   - Risk: Different GPS providers may give different accuracy
   - Regression: Location data inconsistency
   - Mitigation: Use same location provider logic

### Low Risk

7. **Notification Delivery**
   - Risk: FCM may not deliver notifications reliably
   - Regression: Users miss important alerts
   - Mitigation: Fallback to in-app notification center

8. **Database Schema Changes**
   - Risk: Schema changes may break Android Room DB
   - Regression: App crashes on schema mismatch
   - Mitigation: Version migration strategy for Room DB

---

## Implementation Priority

### Phase 1: Critical Core Functionality (Week 1-2)

1. **Standardize Task Completion Endpoint**
   - Choose single endpoint (recommend web endpoint)
   - Update Android to use standardized endpoint
   - Test both platforms with same endpoint

2. **Fix Image Upload Transaction Flow**
   - Ensure R2 upload completes before task marked complete
   - Add rollback on upload failure
   - Test offline scenario

3. **Verify Task Type Detection**
   - Centralize task type detection in backend
   - Update Android to use backend detection
   - Test all task types

### Phase 2: Missing Core Features (Week 3-4)

4. **Implement Customer Portal in Android**
   - Customer login flow
   - Customer dashboard
   - Task review screen
   - Notifications screen
   - Payment integration

5. **Add Admin Dashboard Features**
   - Revenue chart (MPAndroidChart)
   - Installation chart
   - Zone-based job grouping
   - Interactive admin map
   - Activity feed

6. **Implement Bulk Operations**
   - Bulk task creation UI
   - Bulk employee import/export
   - Bulk task assignment

### Phase 3: Enhanced Features (Week 5-6)

7. **Add Financial Management UI**
   - Monthly P&L chart
   - Zone breakdown
   - AMC contracts list
   - Partner payouts

8. **Implement Notification Center**
   - In-app notification screen
   - Notification settings
   - Notification history

9. **Add Export Functionality**
   - Customer export to Excel
   - Employee export to Excel
   - Task export to Excel

### Phase 4: Testing & Polish (Week 7-8)

10. **End-to-End Testing**
    - Test all task types
    - Test offline scenarios
    - Test sync scenarios
    - Test multi-user scenarios

11. **Performance Optimization**
    - Optimize image loading
    - Optimize sync performance
    - Reduce battery usage

12. **Documentation**
    - Update API documentation
    - Update user documentation
    - Create troubleshooting guide

---

## Conclusion

The Android application has strong core functionality parity with the web application for:
- Authentication & authorization
- Task management (with different endpoint)
- Attendance management
- Inverter integration
- AMC management
- Customer/employee management (basic)

Key gaps that need to be addressed:
1. Customer portal (completely missing)
2. Admin dashboard features (charts, maps, activity feed)
3. Bulk operations (task creation, import/export)
4. Financial management UI
5. Notification center
6. Partner portal

The architecture is sound with both applications sharing the same backend API and database. The main work needed is:
- Standardize task completion endpoint
- Implement missing UI screens
- Add visualization libraries for charts
- Implement customer portal
- Add export functionality

**Overall Parity: ~70%**
**Estimated Implementation Time: 6-8 weeks**
