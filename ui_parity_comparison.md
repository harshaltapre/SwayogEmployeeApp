# SWAYOG Android App vs. Web Dashboard: UI Parity & Integration Blueprint

This engineering guide provides a detailed comparative audit of all **9 employee dashboards**, the **Authentication Screen**, and the **5 common workspace panels** between the SWAYOG Web Dashboard (`dashboard_swayog`) and the Kotlin Android app (`SwayogEmployeeApp`). It maps the exact visual states, form fields, and behaviors required to achieve complete feature parity, allowing you to implement the missing UI elements directly in Kotlin.

---

## 1. Core Architecture Differences & Integration Model

| System Layer | React Web Dashboard (`dashboard_swayog`) | Android Mobile Application (`SwayogEmployeeApp`) |
| :--- | :--- | :--- |
| **State Management** | React useState, React Query, Zustand (auth) | Compose State / MutableState, Room Flow, Kotlin StateFlow |
| **API Client** | Axios/Fetch wrapper with React Query Hooks | Retrofit with OkHttp Auth Interceptor |
| **Database** | PostgreSQL (direct query via serverless API routes) | SQLite (Room DB cache) + Local Outbox Queue |
| **Network Operation** | Online-only (blocks actions on network failure) | Offline-first (local writes first, enqueued in background) |
| **File Management** | Direct file browser input (CAD drawing, SLD) | Local camera capture, bitmap compression (JPEG 75%), & path mapping |
| **Geofencing** | Simple browser navigator location coordinates checks | Local Haversine formula verification (<100m geofence) on FusedLocation |

---

## 2. Authentication Screen Comparison & Redirection Gaps

### Web Portal Login (`Login.tsx`) vs. Android Client Login (`LoginScreen.kt`)

```
WEB LOGIN ROLES SELECTOR GRID
+-----------------------------------------------------------------+
|  [Super Admin]  [Admin]  [Employee]  [Partner]  [Customer]      |
+-----------------------------------------------------------------+

VS.

ANDROID LOGIN CREDENTIAL MODE TABS
+-----------------------------------------------------------------+
|               [ Passcode/Email ]   [ Mobile OTP ]               |
+-----------------------------------------------------------------+
```

#### A. Parameter and Field Auditing
* **Web UI Components**:
  * Role Grid Selector (Super Admin, Admin, Employee, Partner, Customer) at the bottom.
  * Credential input modes toggling between "Email" and "Login ID".
  * Identifier field (autofill placeholder adapts dynamically to role: e.g., `SADM-XXXXXX` for Super Admin, `EMP-XXXXXX` for Employee).
  * Security password text field with eye toggle.
  * Checkbox: "Keep me logged in for 30 days".
  * Button: "Create Customer Account" (visible only if Customer role is active).
* **Android UI Components (Existing)**:
  * Tab Selector row: "Passcode/Email" vs "Mobile OTP".
  * OutlinedTextField for Email/Username (changes to Mobile number input in OTP mode).
  * OutlinedTextField for Password (changes to SMS OTP code input in OTP mode).
  * Submit Button: "SIGN IN NOW".

#### B. Functional Gaps & Parity Requirements
1. **Role Scope Exclusion**: The Android application is strictly built for employee-tier logins. The navigation router (`DashboardRouter.kt`) parses `session.jobRole` to display the appropriate dashboard. Admins, Partners, and Customers must use the Web portal.
2. **Missing Token Refresher**: Android needs to securely store the `refreshToken` in Room or EncryptedSharedPreferences and implement the `EmployeeAuthInterceptor` flow to automatically refresh expired HTTP `401` session states.

---

## 3. Common Workspace Panels: Screen-by-Screen Parity Blueprint

These common views are shared across all login roles.

---

### Screen A: Geofenced Attendance Dashboard (Common Clock)
* **Web View (`DashboardHome.tsx`)**: Renders check-in/check-out timestamp markers, dynamic elapsed work timer, "Start Break"/"End Break" buttons, and weekly work summary KPIs.
* **Android View (`AttendanceScreen.kt`)**: Displays a pulsating green circle canvas around the active elapsed hours clock, target site geofence pins, and action buttons.
* **UI Difference / Gaps**:
  * The Web dashboard does not calculate coordinates checks locally. The Android app checks current coordinates against target office geofences using the **Haversine formula** on-device:
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_1) \cos(lat_2) \sin^2\left(\frac{\Delta lng}{2}\right)}\right)$$
  * The Android app blocks checking in if coordinates exceed 100 meters, writing a local record to SQLite first, then enqueuing a background `CHECK_IN` outbox payload.
* **Kotlin Parity Implementation**:
  Ensure FusedLocation API integration checks permissions before calling `calculateDistanceInMeters()`.

---

### Screen B: Daily Commit Screen (Daily Work Logs)
* **Web View (`DailyCommit.tsx`)**: Standard textarea form for accomplishments, decimal hours, and optional uploader for files/receipts.
* **Android View (`AttendanceScreen.kt` Modal)**: Submits daily logs.
* **UI Difference / Gaps**:
  * Android logs are enqueued locally as a JSON payload in `outbox_queue` with action type `"COMMIT"`.
  * The uploader field is currently missing from the Android modal.
* **Kotlin Parity Implementation**:
  Extend the `AlertDialog` in [AttendanceScreen.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/AttendanceScreen.kt) to support document attachments:
  ```kotlin
  // Add attachment button & state to the commit modal:
  var attachedFilePath by remember { mutableStateOf<String?>(null) }
  Button(onClick = { /* trigger file picker Intent */ }) {
      Text(attachedFilePath ?: "Attach PDF/Receipt Log")
  }
  ```

---

### Screen C: Tasks Screen (Assigned Tasks Workspace)
* **Web View (`Tasks.tsx`)**: Tabs for *Today*, *Upcoming*, and *Completed*. Displays details card, phone trigger call button, Google Maps navigation links, and notes section.
* **Android View (Integrated in Dashboards)**: Handled individually inside screens (e.g. `SurveyDashboard` lists surveys, `ElectricalDashboard` lists installations).
* **UI Difference / Gaps**:
  * Android lacks a centralized `TasksScreen` where a user can view all assigned tasks of *any* type in one place, categorizing them by tabs (Today/Upcoming/Completed) as in the Web UI.
* **Kotlin Parity Implementation**:
  Create a unified `TasksScreen.kt` using standard Compose `TabRow`:
  ```kotlin
  @Composable
  fun UnifiedTasksScreen(viewModel: MainViewModel) {
      var tabIndex by remember { mutableIntStateOf(0) }
      val tabs = listOf("Today", "Upcoming", "Completed")
      Column {
          TabRow(selectedTabIndex = tabIndex) {
              tabs.forEachIndexed { index, title ->
                  Tab(selected = tabIndex == index, onClick = { tabIndex = index }, text = { Text(title) })
              }
          }
          // Filter tasksState by schedule date and status
      }
  }
  ```

---

### Screen D: Employees Under Me (Hierarchy Panel)
* **Web View (`EmployeesUnderMe.tsx`)**: Displays reportee listings, active locations, calendar schedules, and performance history.
* **Android View**: Currently missing.
* **UI Difference / Gaps**:
  * Android has no panel for managers to review interns or crew members.
* **Kotlin Parity Implementation**:
  Create `EmployeesUnderMeScreen.kt` utilizing a `LazyColumn` showing reportees fetched via `MainViewModel`. Allow managers to submit score ratings (1-5) and feedback notes.

---

### Screen E: Settings Screen (App Settings & Sync Health)
* **Web View (`Settings.tsx`)**: Profile fields, Password Reset, and Telemetry API credentials configuration.
* **Android View**: Currently missing.
* **UI Difference / Gaps**:
  * Missing offline sync health monitor dashboard showing pending outbox items count, manual sync triggers, and biometric login toggles.
* **Kotlin Parity Implementation**:
  Create `SettingsScreen.kt`:
  ```kotlin
  @Composable
  fun SettingsScreen(viewModel: MainViewModel, onForceSync: () -> Unit) {
      val outboxCount by viewModel.outboxCount.collectAsState()
      Card {
          Column {
              Text("OFFLINE OUTBOX QUEUE", fontWeight = FontWeight.Bold)
              Text("Pending uploads: $outboxCount tasks")
              Button(onClick = onForceSync, enabled = outboxCount > 0) {
                Text("FORCE NETWORK SYNC NOW")
              }
          }
      }
  }
  ```

---

## 4. Role-Specific Dashboards: Comprehensive Gaps & Blueprints

---

### Job Role 1: Service Coordinator Login Dashboard
* **Web File**: [SubAdminDashboard.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/SubAdminDashboard.tsx)
* **Android File**: [CoordinatorDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/CoordinatorDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**:
  * **AMC Cleanings Summary**: Circular progress bar showing completed vs pending cleaning visits.
  * **Complaints Panel**: Resolution stats dashboard.
  * **Visit Log Table**: Columns for date, timeslot, technician name, cleaning completion status, and reviewer remarks.
  * **Telemetry API credentials links**: Buttons to launch Growatt/ShineMonitor web portals and copy username/passwords.
* **Android App**:
  * Simplified Search & filter.
  * Inverter telemetry fluctuations simulator.
  * Credentials modal and Task assigner.
  * **Missing Gaps**: AMC Cleaning summary counts, complaints resolution analytics, visit log table, and live portal launchers with copy buttons.

#### B. Compose Blueprint for Parity
Add the AMC logs and copyable credentials inside [CoordinatorDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/CoordinatorDashboard.kt):
```kotlin
// Copyable credentials layout
Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("SHINEMONITOR INTEGRATION PORTAL", color = EngineeringBlue, fontWeight = FontWeight.Bold)
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Text("Username: growatt_client_j", color = NeutralText)
            IconButton(onClick = { /* copy text to clipboard */ }) {
                Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Copy")
            }
        }
    }
}
```

---

### Job Role 2: Site Survey Engineer Login Dashboard
* **Web File**: Integrated in completion drawers inside [Tasks.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/Tasks.tsx)
* **Android File**: [SurveyDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/SurveyDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Online form requesting length, width, roof type, shading factors, and photo attachments.
* **Android App**: Offline survey form with GPS geofence validation, dynamic capacity estimators, checklist variables, and camera mockup compressing pictures.
* **Gaps**: Parity is mostly achieved. Ensure the camera uploader enforces a strict minimum of **4 photos** (roof surface, meter board, structural brackets, shadow scans) and resizes photos to $1280px$ at $75\%$ JPEG quality before queueing.

#### B. Compose Blueprint for Parity
Implement photo counts verification logic in [SurveyDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/SurveyDashboard.kt):
```kotlin
Button(
    onClick = { /* Submit survey details to Room */ },
    enabled = gpsVerified && mockPhotosCount >= 4,
    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
) {
    Text("SUBMIT SITE REPORT")
}
```

---

### Job Role 3: Solar Design Engineer Login Dashboard
* **Web File**: [AmcManagement.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/AmcManagement.tsx) / design view queues
* **Android File**: [DesignDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/DesignDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Queue of completed surveys. File selectors to upload CAD Structural Layout PDFs and Single Line Diagram (SLD) PDFs.
* **Android App**: Renders design review pipeline steps, inputs structural tilt angle, panel count/brand, inverter recommended size, and mock attachments uploader.
* **Gaps**: Android uploader uses mock files.
* **Kotlin Implementation Plan**: Integrate an actual Android storage file picker Intent to allow the engineer to select real PDF/DWG files from the local storage.

#### B. Compose Blueprint for Parity
Add storage picker in [DesignDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/DesignDashboard.kt):
```kotlin
val launcher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.GetContent()
) { uri: Uri? ->
    cadFileAttached = uri?.lastPathSegment
}
Button(onClick = { launcher.launch("application/pdf") }) {
    Text(if (cadFileAttached != null) "CAD Drawing Attached" else "ATTACH CAD PDF")
}
```

---

### Job Role 4: Electrical Engineer Login Dashboard
* **Web File**: Integrated in [Tasks.tsx](file:///d:/intrnship/dashboard_swayog/src/pages/employee/Tasks.tsx) completion logic
* **Android File**: [ElectricalDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/ElectricalDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Compliance forms and commissioning reports inputs.
* **Android App**: Custom dynamic `Canvas` vector drawing rendering Single Line Diagrams (SLD), AC/DC compliance checklist, measured system inputs (voltage, earthing ohms), and scanner uploader.
* **Gaps**: Android features the custom Canvas drawing vector view. Make sure the compliance check validations block submission if earthing resistance exceeds $2.0 \Omega$.

#### B. Compose Canvas Vector SLD Implementation
The Canvas in [ElectricalDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/ElectricalDashboard.kt) renders lines, circles, and blocks dynamically to assist field validation:
```kotlin
Canvas(modifier = Modifier.fillMaxWidth().height(180.dp)) {
    // 1. Draw PV string rectangle
    drawRect(color = EngineeringBlue, topLeft = Offset(10f, 60f), size = Size(100f, 60f), style = Stroke(3f))
    // 2. Draw connecting cable lines
    drawLine(color = PrimaryAmber, start = Offset(110f, 90f), end = Offset(200f, 90f), strokeWidth = 4f)
    // 3. Draw Inverter box
    drawRect(color = PrimaryAmber, topLeft = Offset(200f, 50f), size = Size(140f, 80f), style = Stroke(3f))
    // 4. Draw Net meter circle
    drawCircle(color = SuccessGreen, center = Offset(410f, 90f), radius = 35f, style = Stroke(3f))
}
```

---

### Job Role 5: Inventory Executive Login Dashboard
* **Web File**: `/inventory/dashboard`
* **Android File**: [InventoryDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/InventoryDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Renders stock inventory catalogs, dispatches orders queue, and handles release receipts.
* **Android App**: Local stock ledger list cached in SQLite, critical alert banners, direct adjustment dialogs, simulated barcode scanner, and dispatch order desk releases.
* **Gaps**: Complete parity. Ensure the camera scan parses real barcode streams to verify inverter serials.

#### B. Compose Blueprint for Parity
Stock Deductions in [InventoryDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/InventoryDashboard.kt):
```kotlin
// Dispatch releases trigger local stock updates
Button(onClick = {
    viewModel.deductStock(itemId = "itm_001", quantity = 10.0)
    viewModel.enqueueStockSync("itm_001", -10.0)
}) {
    Text("RELEASE & DEDUCT STOCK")
}
```

---

### Job Role 6: O&M Technician Login Dashboard
* **Web File**: `/employee/maintenance` scheduling
* **Android File**: [MaintenanceDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MaintenanceDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Schedule cleanings and check audit entries.
* **Android App**: Lists AMC cleanings, Google Maps external intents, "Before" (Dirty) vs "After" (Cleaned) photo slots, watermarks overlays, and clamps audit checkboxes.
* **Gaps**: Ensure photos show coordinate and time watermarks locally overlayed on the captured bitmaps before enqueuing.

#### B. Compose Blueprint for Parity
Watermarked Photo Boxes in [MaintenanceDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MaintenanceDashboard.kt):
```kotlin
// Draw a black watermark banner overlay on image previews
Box(modifier = Modifier.fillMaxSize()) {
    Image(bitmap = beforePhotoBitmap, contentDescription = "Before Wash")
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .align(Alignment.BottomStart)
            .background(Color.Black.copy(alpha = 0.6f))
            .padding(4.dp)
    ) {
        Text("Lat: 19.1234 • Lng: 72.8901 • Jun 19 2026", color = Color.White, fontSize = 9.sp)
    }
}
```

---

### Job Role 7: Service Engineer Login Dashboard
* **Web File**: `/employee/service` complaint ticket resolutions
* **Android File**: [ServiceDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/ServiceDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Resolution details and customer sign-off.
* **Android App**: Lists complaint tickets, offline-first error code dictionary (codes 117, 120, 301, 402, 105), spare parts lists, and a vector drawing canvas signature pad.
* **Gaps**: Perfect feature parity. Ensure drawn paths are rasterized to PNG bytes and saved locally as attachments.

#### B. Digital Signature Pad Implementation
The drawing canvas in [ServiceDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/ServiceDashboard.kt) captures customer sign-offs:
```kotlin
val signaturePaths = remember { mutableStateListOf<Path>() }
var currentPath by remember { mutableStateOf<Path?>(null) }
Box(modifier = Modifier.fillMaxWidth().height(140.dp).border(1.dp, BorderGray)) {
    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { offset ->
                        val path = Path().apply { moveTo(offset.x, offset.y) }
                        currentPath = path
                        signaturePaths.add(path)
                    },
                    onDrag = { change, _ ->
                        currentPath?.lineTo(change.position.x, change.position.y)
                        // Trigger re-draw by swapping paths references
                        val temp = currentPath
                        currentPath = null
                        currentPath = temp
                    }
                )
            }
    ) {
        signaturePaths.forEach { path ->
            drawPath(path = path, color = PrimaryAmber, style = Stroke(width = 4f))
        }
    }
}
```

---

### Job Role 8: Monitoring Analyst Login Dashboard
* **Web File**: Integrated in dashboard alert metrics
* **Android File**: [MonitoringDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MonitoringDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Active warning flags and generation charts.
* **Android App**: Active alerts lists, telemetry solar irradiance API checkers, pre-filled WhatsApp alert templates triggers, and auto-dispatch technician shortcut.
* **Gaps**: The web dashboard integrates Recharts graphing elements showing monthly inverter yield drops.
* **Kotlin Implementation Plan**: Add a simple visual bar chart or progress grid representing generation drop comparison (expected vs actual yield) in Compose.

#### B. Compose Blueprint for Parity
Add yield drops bar graph indicators in [MonitoringDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/MonitoringDashboard.kt):
```kotlin
Row(modifier = Modifier.fillMaxWidth().height(100.dp), verticalAlignment = Alignment.Bottom) {
    // Expected yield bar
    Box(modifier = Modifier.weight(1f).height(90.dp).background(EngineeringBlue)) {
        Text("Expected: 18.4 kWh", color = Color.White, fontSize = 9.sp, modifier = Modifier.align(Alignment.TopCenter))
    }
    Spacer(modifier = Modifier.width(16.dp))
    // Actual yield bar
    Box(modifier = Modifier.weight(1f).height(60.dp).background(Color.Red)) {
        Text("Actual: 12.1 kWh", color = Color.White, fontSize = 9.sp, modifier = Modifier.align(Alignment.TopCenter))
    }
}
```

---

### Job Role 9: Intern Login Dashboard
* **Web File**: `/employee/intern`
* **Android File**: [InternDashboard.kt](file:///d:/intrnship/SwayogEmployeeApp/app/src/main/java/com/example/swayogemployeeapp/ui/screens/InternDashboard.kt)

#### A. Comparison & UI Gaps
* **Web Dashboard**: Basic logging fields.
* **Android App**: Assigned Senior Mentor profile card, daily shadow category selector, achievements input field, decimal hours, milestones matrix checklist (tracked in SharedPreferences), and supervisor feedback remarks feed.
* **Gaps**: Fully aligned. Android implements detailed learning workflows and checklists tailored specifically for training milestones.

---

## 6. Offline Outbox Queue & SQLite Sync Flow

To support offline work in rural solar locations, all forms must write data locally first.

```
[Form submission trigger]
           |
           v
[Insert entity locally (isSynced = false)]
           |
           v
[Enqueue API details to OutboxQueueEntity]
           |
           v
[Call SyncManager.enqueueSync(context)]
           |
           v
[WorkManager constraints check: Network connected]
           |
           v
[SyncWorker runs HTTP Retrofit calls]
           |
           v
[On Success: remove Outbox row & set isSynced = true]
```

### Outbox Entity Structure
Ensure the outbox queue represents JSON parameters to reconstruct API calls:
```kotlin
@Entity(tableName = "outbox_queue")
data class OutboxQueueEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val actionType: String,      // "CHECK_IN", "COMMIT", "SURVEY", "DESIGN"
    val endpoint: String,        // e.g., "/api/v1/employee/surveys"
    val payloadJson: String,     // JSON serialized request data
    val attachmentPaths: String? // Comma-separated absolute paths to local compressed photos
)
```
