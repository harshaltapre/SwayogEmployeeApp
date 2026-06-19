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

#### Screen A: Authentication, Security Credentials & Role-Specific Login Flows

The mobile application utilizes a **Single Unified Authentication Screen** that dynamically shifts its configuration, branding, and post-login landing pages based on the user's verified `jobRole`.

```
 +-------------------------------------------------------------+
 |                   SWAYOG ENTERPRISE LOGON                   |
 +-------------------------------------------------------------+
 |  [ Logo: SWAYOG CleanTech ]                                 |
 |                                                             |
 |  Select Access Mode:                                        |
 |  [ ( ) Passcode/Email ]  [ (o) Mobile OTP ]                 |
 |                                                             |
 |  Username / Mobile Number:                                  |
 |  [ +91 98765 43210                                       ]  |
 |                                                             |
 |  Security Password:                                         |
 |  [ **********                                            ]  |
 |                                                             |
 |  [ SIGN IN NOW ]                                            |
 |                                                             |
 |  [ Quick Biometric Unlock (Fingerprint Icon) ]              |
 +-------------------------------------------------------------+
```

##### 1. Shared Authentication Features

* **Credential Input System**: Supports logging in via username/password or mobile number with SMS OTP.
* **Biometric Authentication Bypass**: Securely registers device fingerprint hashes using the Android Biometric Prompt API. Allows instant passcode bypass on subsequent application launches.
* **Job Role Redirection Engine**: The authentication response contains a profile payload including `role` and `jobRole`. The client-side router checks the role string against the role mappings and opens the designated dashboard view.

---

##### 2. Role-Specific Post-Login Dashboards & Features

Here is the exact specification of the landing experience, key metrics, and functional widgets displayed immediately after logging in for each of the 9 employee roles:

###### Role 1: Service Coordinator Login Dashboard

* **Route Target**: `/subadmin/dashboard`
* **Post-Login Landing View**: Splits into customer filters and inverter generation metrics.
* **Key Features**:
  * *Global Customer Search*: Search by name, project stage, or city.
  * *Inverter Control Panel*: Displays Growatt, ShineMonitor, and FoxESS/UTL API connectivity. Includes a manual credentials sync tool.
  * *Field Crew Map*: Visual overview map showing coordinates of all assigned tasks and technicians.
  * *Pending Requests Banner*: Shows notifications for new service tickets and AMC visit scheduling requests.

###### Role 2: Site Survey Engineer Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Survey layout)
* **Post-Login Landing View**: Displays a chronologically sorted checklist of assigned survey tasks.
* **Key Features**:
  * *Daily Route Tracker*: Opens a map showing routes to assigned properties.
  * *Rooftop Intake Panel*: Digital entry form for roof length/width, load-bearing tests, roof type selection, and shading points.
  * *Compressed Image Uploader*: Camera widget with custom local scaling (max 1280px, JPEG 75%) for structural photos.
  * *GPS Verification Badge*: Matches the device's location to the project site's geofence boundaries.

###### Role 3: Solar Design Engineer Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Design layout)
* **Post-Login Landing View**: Shows a queue of completed site surveys awaiting design layouts.
* **Key Features**:
  * *Survey Data Downloader*: Accesses roof coordinates, dimensions, shading analyses, and roof photos.
  * *CAD & SLD Upload Hub*: Fields to select, check, and upload structural designs (CAD drawings) and electrical schematics (Single Line Diagrams - SLD).
  * *Technical Specs Intake*: Fields to log structural tilting angles, panel models, inverter ratings, and wiring dimensions.
  * *Review Pipeline Monitor*: Visual status bars tracking submissions through the coordinator and manager reviews.

###### Role 4: Electrical Engineer Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Electrical layout)
* **Post-Login Landing View**: Lists projects ready for commissioning and electrical compliance checks.
* **Key Features**:
  * *Commissioning Diagnostic Sheet*: Logs earthing pit resistance (ohms), megger cable insulation, and AC grid integration values.
  * *SLD Vector Viewer*: Renders Single Line Diagrams in-app for verification during checks.
  * *Net-Meter Recorder*: Logs net-meter serial IDs, meter status, and coordinates.
  * *Commissioning Report Upload*: Document scanner interface that converts scanned documents into PDFs for coordinator audits.

###### Role 5: Inventory Executive Login Dashboard

* **Route Target**: `/inventory/dashboard`
* **Post-Login Landing View**: Opens a summary card tracking active warehouse inventory levels.
* **Key Features**:
  * *Critical Stock Alerts*: Highlights stock levels falling below minimum thresholds (e.g., panels, cables, connectors).
  * *QR/Barcode Scanner*: Activates the camera to scan serial barcodes on panels and inverters during intake and dispatch.
  * *Dispatch Approval Desk*: Lists dispatch lists sent by Service Coordinators. Enables releasing parts and updating stock counts.
  * *Offline Stock Adjustment*: Local ledger to record stock changes in offline mode, syncing updates when a network is available.

###### Role 6: O&M (Operations & Maintenance) Technician Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Maintenance layout)
* **Post-Login Landing View**: Renders the daily scheduled AMC cleaning and system checkup list.
* **Key Features**:
  * *Before/After Photo Capture*: Forces taking geotagged photos before cleaning starts and after completion.
  * *Maintenance Audit Checklist*: Steps for clamp tightness, wire inspections, and hot spot checks.
  * *Rooftop Water Checker*: Form to log site water pressure and availability.
  * *Technician Navigation Map*: Displays optimized map routes to the day's assigned cleaning sites.

###### Role 7: Service Engineer Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Service layout)
* **Post-Login Landing View**: Lists active client complaints and troubleshooting tasks.
* **Key Features**:
  * *Offline Diagnostic Guide*: Troubleshooting directory search for inverter error codes (Growatt / FoxESS) without cellular data.
  * *Parts Consumed Tracker*: Interface to search and claim warehouse parts used during site repairs.
  * *Digital Signature Capture*: Signature widget on screen allowing clients to sign off on repairs.
  * *Ticket Solve CTA*: Button that completes the service ticket, captures coordinates, and triggers an email receipt to the client.

###### Role 8: Monitoring Analyst Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Monitoring layout)
* **Post-Login Landing View**: Shows the system performance and generation monitoring dashboard.
* **Key Features**:
  * *Live Performance Alerts*: Highlights systems with >20% generation drops or communication outages.
  * *Telemetry API Simulators*: Remote options to run diagnostics and manually poll inverter APIs.
  * *One-Click Dispatch*: Shortcuts to assign O&M checks or service technicians to underperforming sites.
  * *WhatsApp Client Alerts*: Pre-configured templates to notify clients of offline systems.

###### Role 9: Intern Login Dashboard

* **Route Target**: `/employee/dashboard` (Configured for Intern layout)
* **Post-Login Landing View**: Displays the active senior mentor assignment and daily learning logs.
* **Key Features**:
  * *Daily Shadow Log Form*: Text areas to write work logs, note tasks shadowed, and log decimal hours.
  * *Supervisor Rating Feed*: View comments and log approvals from reporting mentors.
  * *Skills Checklist*: Records progress across tasks like surveying, commissioning, and repairs.

---

#### Screen B: Geofenced Attendance Dashboard

* **Dynamic Time Canvas**: Renders high-fidelity analog check-in clock. Show elapsed hours, active duration, and current status.
* **Geofence GPS Lock**: Verify location is within 100 meters of assigned customer site (if task assigned) or regional HQ office coordinates.
* **Quick Actions**:
  * `Check In` / `Check Out` button triggers GPS verification and timestamps.
  * `Start Break` / `End Break` buttons control break periods.
  * `Submit Today's Task` opens modal to describe accomplishments and input decimal hours.

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
