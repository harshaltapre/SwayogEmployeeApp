# SWAYOG Employee Mobile Application

## Technical Specification, Room DB Entity Schemas, API Payloads & UI/UX Blueprints

This document defines the architecture, user experience (UI/UX) design system, local SQLite database schemas, and screen-by-screen specifications for the **SWAYOG Employee Mobile Application**. The app provides dedicated workspaces for all nine employee roles, supporting offline-first task execution, geofenced attendance logs, inventory management, design/survey submissions, and inverter troubleshooting.

---

## 1. System Architecture & Offline-First Strategy

The employee app is designed to run in remote areas (e.g., rural rooftops, solar farms) with poor or zero cellular coverage. It utilizes an **Offline-First Repository Pattern with WorkManager Sync**. The UI binds reactively to the Room database, while background workers handle API synchronization.

```
                  +---------------------------------------+
                  |         Jetpack Compose / UI          |
                  +---------------------------------------+
                                      ^
                                      | (Observes Flows / StateFlows)
                                      v
                  +---------------------------------------+
                  |       Repository / Domain Layer       |
                  +---------------------------------------+
                                      ^
                                      |
                      +----------------+----------------+
                      |                                 |
                      v                                 v
    +-----------------------------------+     +-----------------------------------+
    |     Room Local SQLite Cache       |     |     Retrofit / API Service        |
    +-----------------------------------+     +-----------------------------------+
                      ^                                         ^
                      | (WorkManager Geofence & Task Sync)      | (REST / HTTPS JSON)
                      +--------------------+--------------------+
                                           v
                                +-----------------------+
                                |     SWAYOG Server     |
                                +-----------------------+
```

### Core Architecture Rules

1. **Local State Dominance**: Task status changes, survey forms, daily commits, and check-in times are saved locally in Room first. The user receives visual confirmation instantly.
2. **Work Queueing**: Every local modification creates a transaction row in `outbox_queue` with target endpoints, payloads, and local file attachment paths.
3. **Geofence Enforcement**: Check-in and check-out logs record raw GPS coordinates from Android `FusedLocationProviderClient` alongside timestamp and geofencing validations.
4. **Resilient File Uploads**: Photo proofs, structural blueprints, and survey drafts are compressed locally before being queued for multi-part file uploads.

---

## 2. Global UI/UX Design System (Amber CleanTech Theme)

The employee application uses an **Amber CleanTech Theme** representing energy, action, and engineering efficiency. The layout is optimized for high visibility outdoors under direct sunlight.

### A. Color Palette

```kotlin
val BackgroundDark = Color(0xFF0F172A)  // Deep slate blue canvas
val SurfaceDark = Color(0xFF1E293B)     // Card panels, drawers, text inputs
val PrimaryAmber = Color(0xFFF59E0B)    // Active CTAs, alerts, highlight indicators
val EngineeringBlue = Color(0xFF3B82F6) // Survey parameters, technical drawings, dispatches
val SuccessGreen = Color(0xFF10B981)    // Check-in success, completed tasks, valid checks
val NeutralText = Color(0xFFF8FAFC)     // Main labels and values
val MutedText = Color(0xFF94A3B8)       // Subtext, timestamps, grid captions
val BorderGray = Color(0xFF334155)      // Borders, dividers, grids
```

### B. Typography & Micro-Animations

* **Typography**: `Outfit` for numerical KPIs, task titles, and roles. `Inter` for technical descriptions, logs, coordinates, and form labels.
* **Micro-Animations**:
  * *Clocking Pulse*: When the check-in timer is active, the circular border around the work clock pulsates in `SuccessGreen`.
  * *Drawer Slider*: Slide animations for technical inputs and detail panels.
  * *Camera Shutter Flash*: Subtle screen overlay flash when site survey photos are successfully taken and saved.

---

## 3. Database Schemas (Room Entity Specifications)

The local Android Room database cache handles profiles, tasks, attendance records, survey drafts, and inventory dispatch states.

### 1. User Session Entity

```kotlin
@Entity(tableName = "employee_session")
data class EmployeeSessionEntity(
    @PrimaryKey val id: String,
    val loginId: String,
    val email: String,
    val name: String,
    val role: String,        // "EMPLOYEE" or "SUB_ADMIN"
    val jobRole: String,     // "Solar Design Engineer", "Electrical Engineer", "Inventory Executive", etc.
    val employeeCode: String?,
    val reportingManagerId: String?,
    val accessToken: String,
    val refreshToken: String,
    val lastSyncTimestamp: Long
)
```

### 2. Geofenced Attendance Entity

```kotlin
@Entity(tableName = "attendance_records")
data class AttendanceRecordEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String?, // Null if not synced
    val date: String,      // YYYY-MM-DD
    val checkInTime: String, // ISO timestamp
    val checkInLatitude: Double,
    val checkInLongitude: Double,
    val checkOutTime: String?, // ISO timestamp, null if active
    val checkOutLatitude: Double?,
    val checkOutLongitude: Double?,
    val totalBreakDurationSeconds: Long = 0,
    val isSynced: Boolean = false
)
```

### 3. Work Task Entity

```kotlin
@Entity(tableName = "employee_tasks")
data class EmployeeTaskEntity(
    @PrimaryKey val id: Int,
    val jobType: String,        // "Installation", "Service", "AMC Visit", "Complaint", "Survey"
    val description: String,
    val scheduledTime: String,   // ISO timestamp
    val status: String,          // "assigned", "in_progress", "completed", "cancelled"
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val completionMessage: String?,
    val completionDocumentUrl: String?,
    val completedAt: String?
)
```

### 4. Site Survey Entity

```kotlin
@Entity(tableName = "site_surveys")
data class SiteSurveyEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val taskId: Int,
    val customerId: String,
    val roofType: String,           // "Concrete", "Tin Sheet", "Asbestos", "Ground Mount"
    val lengthFt: Double,
    val widthFt: Double,
    val obstacleNotes: String,
    val shadowFactors: String,      // JSON string of surrounding trees/buildings
    val recommendedCapacityKw: Double,
    val coordinatesLatitude: Double,
    val coordinatesLongitude: Double,
    val localPhotoPaths: String,    // Comma-separated absolute paths to local compressed photos
    val isSynced: Boolean = false
)
```

### 5. Material Dispatch / Inventory Item Entity

```kotlin
@Entity(tableName = "inventory_items")
data class InventoryItemEntity(
    @PrimaryKey val id: String,
    val itemName: String,
    val category: String, // "Module", "Inverter", "Cable", "Structure", "BOS"
    val quantityInStock: Double,
    val unit: String,
    val qrCodeHash: String?
)
```

### 6. Daily Commitment log Entity

```kotlin
@Entity(tableName = "daily_commits")
data class DailyCommitEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String?,
    val date: String,
    val taskDescription: String,
    val hoursSpent: Double,
    val isSynced: Boolean = false
)
```

---

## 4. Role-by-Role Screen Specifications & Core Features

```
               [App Splash / Entry]
                        |
            [Common Login & OTP Auth]
                        |
           [Geofenced Attendance Check]
                        |
            +-----------+-----------+ (Job Role Routing)
            |                       |
     [Management / SC]      [Field Engineer]     [Support/HQ Analyst]
      - Coordinator          - Site Survey        - Monitoring Analyst
      - Inventory            - Electrical Eng.    - Intern Shadowing
                             - O&M Tech
                             - Service Eng.
                             - Solar Design
```

### Common Workspace Screens (All Employees)

The mobile application utilizes a shared core navigation structure representing screens common to all authenticated roles. The routing, state binding, and layouts dynamically adapt depending on the user's role and authorization clearance.

---

#### Screen A: Authentication & Dynamic Redirect Routing
* **File Reference**: [LoginScreen.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/LoginScreen.kt)
* **Visual Structure**: Presents the "SWAYOG Enterprise Logon" title in `PrimaryAmber` styling. Features a tab selector allowing the user to select between "Passcode/Email" access mode and "Mobile OTP" access mode.
* **Workings & Workflow**:
  1. The user inputs their identifier (username/email or mobile number) and credentials (password or SMS OTP code).
  2. Upon pressing "SIGN IN NOW", the UI invokes the `MainViewModel.login` function, passing access variables to `UserRepository.kt`.
  3. The client issues a REST HTTP request `POST /api/v1/auth/login`.
  4. The server returns a payload confirming authentication status, access tokens (`accessToken`, `refreshToken`), and user profile parameters (including `role` and `jobRole`).
  5. The application saves these settings locally into [EmployeeSessionEntity](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/data/local/entity/EmployeeSessionEntity.kt) inside Room SQLite.
  6. The navigation router triggers [DashboardRouter.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/DashboardRouter.kt), shifting the screen stack depending on `session.jobRole`.

---

#### Screen B: Geofenced Attendance Dashboard (Common Clock)
* **File Reference**: [AttendanceScreen.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/AttendanceScreen.kt)
* **Visual Structure**: 
  - Dynamic Time Canvas featuring an analog circular work clock that pulsates when the work day is active.
  - Profile banner displaying the employee's name, code, and assigned job title.
  - GPS status indicator displaying target pins, active coordinates, and geofencing validation states.
  - Action buttons (`CHECK IN NOW`, `START BREAK`/`END BREAK`, `CHECK OUT`, `SUBMIT TODAY'S TASK`).
* **Workings & Workflow**:
  1. **Geofenced Check-In**: Interns and engineers press `CHECK IN NOW`. The screen fetches GPS coordinates from Android `FusedLocationProviderClient`.
  2. The client calculates the distance between the user's current location and the target office/project geofence coordinates. If distance is $> 100$ meters, check-in fails with a warning dialog.
  3. If coordinates are verified, the local database table `attendance_records` writes a new check-in row (`isSynced = false`), and enqueues a `CHECK_IN` request payload to the outbox queue table.
  4. **Active Session Timer**: While checked in, a tick routine updates the UI timer every second, subtracting break durations.
  5. **Break Tracker**: Pressing `START BREAK` writes the break state. `END BREAK` accumulates the total break duration locally, updating the database record.
  6. **Check-Out**: Computes final work hours, registers checkout GPS, enqueues the `CHECK_OUT` command to the outbox queue, and halts active work logs.

---

#### Screen C: Tasks Screen (Assigned Tasks Workspace)
* **File References**: [Tasks.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/Tasks.tsx) (Web), [SurveyDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/SurveyDashboard.kt) (Android layout variations)
* **Visual Structure**: Renders a chronological list of assigned site duties (e.g. site surveys, installs, complaints, maintenance cleanings) categorized by scheduled date.
* **Workings & Workflow**:
  1. **Flow Binding**: The screen observes a Flow querying the local SQLite table `employee_tasks` filtered by the logged-in employee's `id`.
  2. **Details Card**: Selecting a task displays the customer's name, phone number, physical site address, and instructions.
  3. **Address Locator Navigation**: Features a map indicator icon. Clicking it parses coordinates or address queries to construct a navigation Intent, launching Google Maps routes:
     `geo:0,0?q=latitude,longitude(Customer Name)`
  4. **Status Lifecycle**: The task moves from `assigned` to `in_progress` once the worker checks in at the geofenced project boundaries.
  5. **Completion Logs**: Selecting "Complete Task" displays a submission form. Depending on the task's requirements (e.g., uploading site photos, CAD blueprints, or signing reports), files are captured, compressed, and attached before sending a completion request payload to the sync outbox.

---

#### Screen D: Daily Commit Screen (Daily Work Logs)
* **File References**: [DailyCommit.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/DailyCommit.tsx) (Web), [AttendanceScreen.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/AttendanceScreen.kt) (Android modal popup submission)
* **Visual Structure**: Contains form fields for log submissions:
  - *Task Title / Worked On*: Short summary of the project worked on.
  - *Work Summary / Accomplishments*: Text area to describe resolved items, issues faced, and achievements.
  - *Hours Spent*: Decimal input representing work duration (e.g., 8.0, 6.5).
  - *Blockers / Tomorrow's Plan*: Input areas for manager escalations and next-day planning.
  - *Attachment*: Button to attach documents, PDFs, or layout screenshots.
* **Workings & Workflow**:
  1. Interns/employees open the Daily Commit form.
  2. Validation checks verify that the description length is $\ge 10$ characters and hours fall within a range of $0.25 - 24.0$.
  3. Upon pressing "SUBMIT", a [DailyCommitEntity](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/data/local/entity/DailyCommitEntity.kt) record is written locally inside SQLite with `isSynced = false`.
  4. An API payload `WorkSubmissionRequest` is generated, serialized, and enqueued to [OutboxQueueEntity](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/data/local/entity/OutboxQueueEntity.kt) as a `"COMMIT"` action.
  5. `SyncManager` initiates `SyncWorker` scheduling constraints. The backend processes the commit under route `POST /api/v1/employee/submissions`.

---

#### Screen E: Employees Under Me (Hierarchy & Mentoring Reviews)
* **File References**: [EmployeesUnderMe.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/EmployeesUnderMe.tsx) (Web), [MainViewModel.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MainViewModel.kt) (Android reports flows)
* **Visual Structure**: Reserved for manager roles (e.g. Design Engineers tracking assigned Interns, Coordinators tracking active Technicians). Displays a list of reportees, their current location, status (Checked-In/Out), and performance score history.
* **Workings & Workflow**:
  1. **Hierarchy Resolution**: The screen requests a report of reportees matching the supervisor's manager ID. The system recursively builds the tree (reporting manager matches user ID).
  2. **Sub-employee profile detail**: Selecting a reportee displays their attendance records log calendar, daily commits summary history, and pending tasks queue.
  3. **Mentoring Feedback & Rating**: Presents a review form containing score inputs (1-5 range) and review notes fields.
  4. **Submission flow**: Submitting the review saves the evaluation under the database table `WorkSubmission` as `approved` or `revision` with comments. This updates the reportee's performance snapshots.

---

#### Screen F: Settings Screen (App Configurations & Sync Health)
* **File References**: [Settings.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/Settings.tsx) (Web), [MainViewModel.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MainViewModel.kt)
* **Visual Structure**: 
  - Change Password input card.
  - Active credentials detail configuration fields.
  - Sync Health Panel (displaying connection status, last synchronization timestamp, database schema version, and outbox count).
* **Workings & Workflow**:
  1. **Password Change**: User enters their current password, a new password, and confirms it. The form validates constraints and fires `POST /api/v1/employee/change-password`.
  2. **Credentials Update**: Toggles saving biometric credentials locally to bypass standard logins.
  3. **Sync Health Monitor**: Queries the local outbox queue. If the queue is non-empty, displays a sync badge detailing pending actions. It allows clicking "Force Sync" to manually initiate background uploads.

---

##### 2. Role-Specific Post-Login Dashboards & Variations

The application shifts layouts, access boundaries, and widgets on the home workspace depending on the authenticated role:

```
[Login Success] ---> Read session.jobRole ---> Route to Workspace
                               |
       +-----------------------+-----------------------+
       |                       |                       |
["Intern"]              ["Inventory Executive"]  ["Service Coordinator"]
- Mentor Profile card   - Warehouse stock counts - Customer Directory Search
- Shadow log forms      - QR/Barcode Scanner     - Inverter Control API Panel
- Practical checklist   - Dispatch requests list - Tech assignment maps
```

###### Variation 1: Service Coordinator Login Dashboard
* **Exposed Route / View**: [CoordinatorDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/CoordinatorDashboard.kt)
* **Custom Layout Widgets**: Splits into active site lists and inverter performance widgets.
* **Operations**: Links inverter API keys (Growatt, FoxESS), tracks pending AMC cleanings, and utilizes drag-and-drop actions to assign complaints tasks to field engineers.

###### Variation 2: Site Survey Engineer Login Dashboard
* **Exposed Route / View**: [SurveyDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/SurveyDashboard.kt)
* **Custom Layout Widgets**: Lists survey projects and active rooftop dimension calculators.
* **Operations**: Enforces geotagged camera frames, logs structural metrics (length, width, shading factors), and processes bitmap downscaling checks before queuing drafts to the outbox.

###### Variation 3: Solar Design Engineer Login Dashboard
* **Exposed Route / View**: [DesignDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/DesignDashboard.kt)
* **Custom Layout Widgets**: Displays a layout queue of completed surveys.
* **Operations**: Enables downloading survey photos, inputting CAD drawings configurations, structural tilting coordinates, and SLD schematics.

###### Variation 4: Electrical Engineer Login Dashboard
* **Exposed Route / View**: [ElectricalDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/ElectricalDashboard.kt)
* **Custom Layout Widgets**: Renders Single Line Diagram vector views and system diagnostics grids.
* **Operations**: Logs earthing pit resistance measurement parameters (ohms), Megger insulation results, net-meter specifications, and converts physical compliance scans into black-and-white PDF files.

###### Variation 5: Inventory Executive Login Dashboard
* **Exposed Route / View**: [InventoryDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/InventoryDashboard.kt)
* **Custom Layout Widgets**: Renders stock inventory cards and safety threshold panels.
* **Operations**: Runs the camera barcode decoder during incoming inventory updates and dispatches materials to customer installations.

###### Variation 6: O&M Technician Login Dashboard
* **Exposed Route / View**: [MaintenanceDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MaintenanceDashboard.kt)
* **Custom Layout Widgets**: Lists scheduled AMC washing visits.
* **Operations**: Enforces "Before/After" camera captures, applies geo-watermarks, and checks structural clamp loose audits.

###### Variation 7: Service Engineer Login Dashboard
* **Exposed Route / View**: [ServiceDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/ServiceDashboard.kt)
* **Custom Layout Widgets**: Renders complaint troubleshooting lists and canvas signature boards.
* **Operations**: Provides Growatt/FoxESS offline error diagnostics directories, logs consumed parts, and requests clients signatures.

###### Variation 8: Monitoring Analyst Login Dashboard
* **Exposed Route / View**: [MonitoringDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MonitoringDashboard.kt)
* **Custom Layout Widgets**: Generation analytics panels and telemetry connection charts.
* **Operations**: Displays warning flags for underperforming customer inverters and handles one-click tech dispatches or pre-filled WhatsApp customer alerts.

###### Variation 9: Intern Login Dashboard
* **Exposed Route / View**: [InternDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/InternDashboard.kt)
* **Custom Layout Widgets**: Assigned Mentor details, daily shadow category tabs, achievements field, and practical checklist.
* **Operations**: Handles writing logs, tracking internship checklist milestones, and showing feedback ratings received from reporting mentors.

---

---

### Job Role 1: Service Coordinator (Sub-Admin / SC)

*Exposed under Route: `/subadmin/dashboard`*

```
+-------------------------------------------------------------+
| [Sub-Admin Layout] Dashboard  Complaints  AMC  Financials   |
+-------------------------------------------------------------+
| [City: Mumbai] [Customer Search...                        ] |
| +-------------------------+ +-----------------------------+ |
| | SELECTED CUSTOMER INFO  | | LIVE INVERTER GENERATION    | |
| | - Name: John Doe        | | - Current: 3.2 kW (Growatt) | |
| | - Size: 5.4 kW          | | - Daily Yield: 18.4 kWh    | |
| | - Status: Online        | | - [Refresh Data]            | |
| +-------------------------+ +-----------------------------+ |
| [Update Inverter Credentials]  [Assign Task to Engineer v]  |
+-------------------------------------------------------------+
```

* **Customer Directory & Location Filters**: Search customers by name, code, phone number, and filter by city.
* **Live Inverter Analytics Panel**:
  * Displays system size, active capacity, and device online/offline status.
  * Connects to inverter telemetry APIs (Growatt, ShineMonitor, FoxESS/UTL APIs).
* **Inverter Credential Manager**:
  * Modal to update `inverterBrand`, `inverterLoginId`, `inverterPassword`, `apiKey`, and `deviceSn`.
  * Triggers background API test-sync on credentials save.
* **Workflow Task Assigner**:
  * Interactive map plotting customers with pending surveys, services, or complaints.
  * Dropdown selector listing nearby active field engineers. Click "Assign Task" to generate an automatic push notification on the engineer's device.

---

### Job Role 2: Site Survey Engineer

*Exposed under Route: `/employee/survey`*

```
+-------------------------------------------------------------+
| < Back   SITE SURVEY REPORT Form (TASK-0492)                |
+-------------------------------------------------------------+
| 1. Roof Dimensions: Length [ 45 ft ]  Width [ 30 ft ]       |
| 2. Roof Type: [ Concrete (Flat)  v]                         |
| 3. Structural Stability: (*) Safe   ( ) Needs Reinforcement |
| 4. Shading Analysis Obstacles: [ Trees to the South-West ] |
| 5. GPS Verification: Lat: 19.123456  Lng: 72.890123 [Match] |
| 6. Photo Proofs: [Photo1.jpg][Photo2.jpg] [+ Take Picture]  |
|                                                             |
| [SUBMIT REPORT (Saves to Outbox if Offline)]                |
+-------------------------------------------------------------+
```

* **Roof Survey Intake Form**:
  * Text fields: Length (ft), Width (ft), roof type dropdown (Concrete, Tin, Asbestos, Tile).
  * Shading factor checklists: Trees, nearby building structures, towers, overhead cables.
  * Structural stability check toggle.
* **GPS Site Marker**:
  * Validates coordinates to pin the exact proposed inverter location.
* **Camera Capture with Compression**:
  * Form requires a minimum of 4 site photos: Roof surface, electrical meter board, structural brackets, and a wide-angle shadow scan.
  * Captures are processed through bitmap compression: Rescales max bounds to 1280px and compresses to JPEG 75% (<500KB) to ensure transfer over 2G networks.

---

### Job Role 3: Solar Design Engineer

*Exposed under Route: `/employee/designs`*

```
+-------------------------------------------------------------+
| DESIGN WORKSPACE - Site Drafts & Uploads                    |
+-------------------------------------------------------------+
| Survey Folder: [SW-101 (John Doe) v] [View Survey Info]    |
| - Dimensions: 45ft x 30ft concrete. No shading.             |
|                                                             |
| Upload Drafting Output:                                     |
| - CAD Structural Layout: [Click to select PDF/DWG File...]  |
| - Single Line Diagram (SLD): [Click to select SLD PDF...]   |
|                                                             |
| Design Notes:                                               |
| [ Enter panel configurations, structural spacing details...] |
|                                                             |
| [ UPLOAD TO QUEUE ]                                         |
+-------------------------------------------------------------+
```

* **Site Survey Reports Access**:
  * Displays a list of surveys submitted by Site Survey Engineers.
  * Allows downloading roof dimensions, shading factors, and photos.
* **Design File Submissions**:
  * Input forms to enter final design details: Panel orientation (tilt angle, structural height), panel brand and count, inverter size, and cables lengths.
  * File selection attachments: CAD Layout PDF, Single Line Diagram (SLD) PDF, and structural calculation sheets.
* **Design Status Pipeline Tracker**:
  * Shows step-by-step progress of designs: *Survey Submitted -> Design Drafting -> Pending Coordinator Approval -> Admin Approved*.

---

### Job Role 4: Electrical Engineer

*Exposed under Route: `/employee/electrical`*

```
+-------------------------------------------------------------+
| COMMISSIONING CHECKLIST - Project: SW-101                   |
+-------------------------------------------------------------+
| [x] AC Cable Insulation Resistance Test (Megger Check)      |
| [x] Inverter Grounding & Earthing Resistance Check (<2 Ohm) |
| [ ] Solar Net-Meter Installation Verified                   |
| [ ] ACDB / DCDB Internal Surge Protection check             |
|                                                             |
| Net Meter No: [ NM-98273612-B ]                             |
| Commissioning Report: [Click to attach signed PDF...]       |
|                                                             |
| [ SUBMIT FOR AUDIT ]                                        |
+-------------------------------------------------------------+
```

* **System Commissioning Checks**:
  * Diagnostic checklist covering grounding check (ohms reading), cable continuity tests, grid phase sequence check, and net-meter connection verification.
  * Numeric inputs: Earthing pit resistance values, DC open-circuit voltage (Voc) measurements, and AC line-to-neutral voltage.
* **Engineering SLD Inspector**:
  * Embedded vector PDF reader displaying the approved Single Line Diagram (SLD) for real-time validation.
* **Upload Signed Commissioning Report**:
  * Camera scan tool that converts physical signing sheets into black-and-white PDFs and submits them to `POST /api/v1/employee/commissioning`.

---

### Job Role 5: Inventory Executive

*Exposed under Route: `/inventory/dashboard`*

```
+-------------------------------------------------------------+
| INVENTORY WORKSPACE                                         |
+-------------------------------------------------------------+
| Active Stock Levels:                                        |
| - Mono PERC Panels: 124 Units   - Growatt Inverters: 12 Pcs |
| - ACDB Cabinets: 4 Units        - 4sqmm DC Cable: 1200 m    |
|                                                             |
| Actions:                                                    |
| [ SCAN QR / BARCODE TO ISSUE ]                              |
| [ VIEW PENDING DISPATCH REQUESTS (3 Requests) ]             |
| [ RECORD SYSTEM INTAKE ]                                    |
+-------------------------------------------------------------+
```

* **Real-time Stock Ledger Dashboard**:
  * Displays list of key warehouse materials categorized by type (Modules, Inverters, Structures, Cables, Balance of System).
  * highlights item levels below safety stock limits.
* **QR / Barcode Scanner**:
  * Activates the camera to scan serial barcodes on panels and inverters.
  * Automates entry of serial codes to match dispatches with specific customer projects.
* **Dispatch Approval Pipeline**:
  * Lists dispatch orders requested by Service Coordinators.
  * Shows dispatch items checklist. Click "Approve and Release" to generate delivery receipts.

---

### Job Role 6: O&M (Operations & Maintenance) Technician

*Exposed under Route: `/employee/maintenance`*

```
+-------------------------------------------------------------+
| O&M CLEANING & INSPECTION - Visit 2 of 4 (SW-101)           |
+-------------------------------------------------------------+
| Task: Scheduled AMC Panel Cleaning                          |
|                                                             |
| Checklist:                                                  |
| [x] Dust layer completely washed and dried                  |
| [x] Checked structural clamps for physical looseness        |
| [ ] Visual inspection for micro-cracks or hot spots         |
|                                                             |
| Telemetry Verification:                                     |
| - Inverter Active Generation: 3.2 kW [Matches capacity]     |
|                                                             |
| Upload Cleaning Photos: [Before.jpg] [After.jpg]            |
|                                                             |
| [ COMPLETE AMC VISIT ]                                      |
+-------------------------------------------------------------+
```

* **AMC Visit Checklist**:
  * Step-by-step cleaning log: Dust cleaning validation, structural clamp tension tests, module cabling inspection, and site water availability confirmation.
* **Before / After Photo Comparison**:
  * Requires taking a "Before" photo showing dirty solar arrays and an "After" photo showing cleaned structures.
  * Applies automatic location and timestamp watermarks directly to images before queuing for sync.
* **Navigation and Routing**:
  * Displays Google Maps routes linking scheduled cleaning sites, sorting visits by geographical distance.

---

### Job Role 7: Service Engineer

*Exposed under Route: `/employee/service`*

```
+-------------------------------------------------------------+
| COMPLAINT TROUBLESHOOTING - Ticket #CMP-0211                |
+-------------------------------------------------------------+
| Customer: Jane Smith   Issue: Inverter Red Light On         |
|                                                             |
| Offline Diagnostic Lookup:                                  |
| [ Search Growatt/FoxESS Error Code... e.g. Error 117 ]      |
| Code 117 Description: PV Voltage High. Check string Voc.     |
|                                                             |
| Work Done: [ Re-configured string array config to reduce Voc] |
| Spare Parts Used: [None v]                                  |
| Customer Digital Signature:                                 |
| [ Draw signature here...                                  ] |
|                                                             |
| [ SOLVE TICKET ]                                            |
+-------------------------------------------------------------+
```

* **Complaint Diagnostic Desk**:
  * Displays assigned complaints tickets listing fault descriptions.
  * Provides offline-first error code directory for Growatt and FoxESS/UTL.
* **Spare Parts Requisition Intake**:
  * Search inventory parts (e.g., connectors, circuit breakers) to mark parts used during troubleshooting.
  * Sends inventory update payload automatically.
* **Client Digital Signature Capture**:
  * Canvas input widget on screen allowing customers to sign off on repairs.
  * Converts signatures into PNG bytes and appends them to final service logs.

---

### Job Role 8: Monitoring Analyst

*Exposed under Route: `/employee/monitoring`*

```
+-------------------------------------------------------------+
| SYSTEM PERFORMANCE MONITORS                                 |
+-------------------------------------------------------------+
| Active Alerts:                                              |
| [!] ALERT: SW-101 (Growatt) - Generation Drop > 20%         |
| [!] ALERT: SW-204 (UTL/Fox) - Communication Offline         |
|                                                             |
| Inverter Metric Simulator:                                  |
| [ Growatt API Status: NORMAL ] [ FoxESS API Status: NORMAL ]|
|                                                             |
| Action Log:                                                 |
| - Sent WhatsApp Alert to customer (SW-101)                  |
| - Assigned O&M site check to Technician #3                  |
+-------------------------------------------------------------+
```

* **Performance Alert Console**:
  * Displays active warning flags: "Communication Offline" (inverter offline > 24 hours) or "Low Generation" (actual yield < expected target by > 20%).
* **Simulation Verification Engine**:
  * Compares customer generation profiles with regional solar irradiance APIs.
  * Manual API sync buttons to retry pulling metrics from inverter cloud endpoints.
* **Direct Intervention Controls**:
  * Buttons to dispatch service engineers, request panel cleanings, or message customers directly from alert detail pages.

---

### Job Role 9: Intern

*Exposed under Route: `/employee/intern`*

```
+-------------------------------------------------------------+
| INTERN SHADOW LOG & CHECKS                                  |
+-------------------------------------------------------------+
| Assigned Senior Mentor: [ Senior Eng. Rajesh Kumar v]       |
| Active Tasks: Shadowing Site Survey - Task #0492            |
|                                                             |
| Learning Logs:                                              |
| [ Participated in rooftop structural measurements and     |
|   shading analysis using a sun path diagram.               ] |
|                                                             |
| Hours: [ 6.5 ]                                              |
|                                                             |
| [ SUBMIT SHADOW LOG FOR REVIEW ]                            |
+-------------------------------------------------------------+
```

* **Shadow Log Intake Form**:
  * Select assigned mentor from staff dropdown.
  * Log text area: Describe shadowing achievements, equipment operated, and design concepts studied.
* **Learning Tracker Checklist**:
  * Select task types shadowed: Rooftop surveys, installation checks, inverter commissioning, or troubleshooting repairs.
* **Commit History Log**:
  * Lists intern shadow logs showing comments and approvals from reporting supervisors.

---

## 5. API Payload Specifications (JSON Reference Schema)

### 1. `POST /api/v1/employee/attendance/check-in`

* **Request**:

```json
{
  "date": "2026-06-19",
  "checkInTime": "2026-06-19T09:00:00.000Z",
  "latitude": 19.123456,
  "longitude": 72.890123
}
```

* **Success Response (`200 OK`)**:

```json
{
  "success": true,
  "data": {
    "attendanceId": "att-98273-k",
    "status": "active"
  }
}
```

### 2. `POST /api/v1/employee/submissions`

* **Request**:

```json
{
  "title": "Today's Task Update",
  "description": "Completed rooftop site measurements and shading checklist for project SW-101.",
  "hoursSpent": 6.5,
  "taskId": "492"
}
```

* **Success Response (`201 Created`)**:

```json
{
  "success": true,
  "message": "Daily work submission successfully recorded."
}
```

### 3. `POST /api/v1/employee/surveys`

* **Multipart Request Body**:
  * `taskId`: 492
  * `customerId`: "usr-8a2b-9c3d"
  * `roofType`: "Concrete"
  * `lengthFt`: 45.0
  * `widthFt`: 30.0
  * `obstacleNotes`: "Small brick room in North-West corner."
  * `shadowFactors`: "{\"trees\": true, \"buildings\": false}"
  * `recommendedCapacityKw`: 5.4
  * `latitude`: 19.123456
  * `longitude`: 72.890123
  * `photos`: [Binary File Payload (Photo 1), Binary File Payload (Photo 2)]
* **Success Response (`201 Created`)**:

```json
{
  "success": true,
  "surveyId": "srv-927361",
  "message": "Site survey submitted for engineering draft review."
}
```

### 4. `POST /api/v1/employee/designs`

* **Multipart Request Body**:
  * `customerId`: "usr-8a2b-9c3d"
  * `panelCount`: 10
  * `inverterModel`: "Growatt 5000TL3-S"
  * `systemCapacityKw`: 5.4
  * `tiltAngle`: 15.0
  * `cadLayout`: Binary file (CAD PDF layout blueprint)
  * `sldDiagram`: Binary file (Electrical SLD PDF)
* **Success Response (`201 Created`)**:

```json
{
  "success": true,
  "designId": "dsg-992384",
  "message": "System design files successfully uploaded."
}
```

### 5. `POST /api/v1/employee/tasks/{taskId}/complete`

* **Request**:

```json
{
  "completionMessage": "Repair completed. PV-string terminal block replaced.",
  "completionDocumentUrl": "https://swayog-dashboard-delta.vercel.app/uploads/receipts/rec-9823.pdf"
}
```

* **Success Response (`200 OK`)**:

```json
{
  "success": true,
  "message": "Task marked as completed."
}
```

---

## 6. Token Lifecycle & API Interceptor

All API transactions are processed through an interceptor that handles credentials injection and token refresh routines.

```kotlin
class EmployeeAuthInterceptor(private val context: Context) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = getSavedAccessToken() // Fetches from EncryptedSharedPreferences

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .header("X-App-Platform", "Android-Employee")
            .build()

        val response = chain.proceed(authenticatedRequest)

        if (response.code == 401) { // Access token expired
            synchronized(this) {
                val newAccessToken = requestTokenRefresh()
                if (newAccessToken != null) {
                    val retriedRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newAccessToken")
                        .header("X-App-Platform", "Android-Employee")
                        .build()
                    response.close()
                    return chain.proceed(retriedRequest)
                }
            }
        }
        return response
    }
}
```

---

## 7. Safety, Security & Performance Guidelines

1. **Local Security Safeguards**:
   * Encrypted database storage mapping: Access credentials and user profile information are saved using SQLCipher-enabled SQLite databases.
   * Session revocation triggers biometric unlock if stored tokens expire or device integrity check fails.
2. **Offline Outbox Handling**:
   * Saves transaction commands locally when offline with state `isSynced = false`.
   * Configures a WorkManager background worker constrained to run on network connection, uploading files and task forms sequentially.
3. **Data Isolation Policies**:
   * Limits local task logs and customer summaries strictly to entities assigned to the authenticated user ID.
   * Restricts cross-role data access; Site Survey Engineers cannot edit warehouse inventory data, and Inventory Executives cannot modify solar blueprints.
4. **GPS Integrity Checks**:
   * Verifies location data accuracy (GPS provider only, rejects mock provider flags).
   * Cross-references device coordinates with the customer's coordinates before enabling the "Complete Task" button.
