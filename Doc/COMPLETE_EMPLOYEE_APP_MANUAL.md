# SWAYOG Employee Mobile Application: Complete Implementation & Screen Manual

This document provides a highly detailed, screen-by-screen manual for the **SWAYOG Employee Mobile Application**. It contains UI/UX blueprints, Compose state structures, data bindings, and action parameters for **every common screen** and **every role-specific page** across all 9 personnel roles.

---

## Part 1: Common Application Pages (All Roles)

These pages are shared across all employee roles and are bound to the core navigation layout.

### Page 1: Login & Authentication Screen (`LoginScreen.kt`)
*   **Purpose:** Initial user entry point, supporting secure login credentials validation.
*   **UI Layout & Components:**
    *   **Header Section:** Logo vector asset, title `SWAYOG Energy Portal`, subtitle `Enter credentials to access your workspace`.
    *   **Toggle Row:** Flat buttons with active highlight: `[ Email & Passcode ]` | `[ Mobile OTP ]`.
    *   **Credential Form Card:**
        *   If Email mode: OutlinedTextField for `Login ID / Email` (with validation checks) and OutlinedTextField for `Password` (with visibility toggle icon).
        *   If OTP mode: OutlinedTextField for `Phone Number` (with numeric filter), `[ Send OTP ]` button, and subsequent 6-digit verification code input.
    *   **Action Button:** Full-width `[ Sign In ]` button with loading indicator overlay during API request lifecycle.
*   **Component State Variables (Compose):**
    *   `loginMode` (Enum: `EMAIL`, `OTP`)
    *   `identifier` (String)
    *   `password` (String)
    *   `phoneNumber` (String)
    *   `otpCode` (String)
    *   `isLoading` (Boolean)
*   **API Interactivity:**
    *   Sends request to `POST /api/v1/auth/login`. On success (`200 OK`), parses the token pair and profile data.

---

### Page 2: Biometric Configuration Screen (`BiometricSetupScreen.kt`)
*   **Purpose:** Registering finger/face print parameters to bypass password inputs on subsequent logins.
*   **UI Layout & Components:**
    *   **Center Section:** Large fingerprint lock animation vector asset.
    *   **Description:** `Enable one-touch biometric verification to securely access your field workspace without typing your password.`
    *   **CTAs:** `[ Enable Biometrics ]` (triggers native Android BiometricPrompt APIs) and `[ Skip for Now ]` link text.
*   **System Action:**
    *   Extracts `accessToken` from Room `employee_session` table, encrypts it using Android Keystore `AES/GCM/NoPadding` key, and saves it into local encrypted shared preferences.

---

### Page 3: Geofenced Attendance Dashboard (`AttendanceDashboard.kt`)
*   **Purpose:** Live geofence check-in/out console tracking field technicians.
*   **UI Layout & Components:**
    *   **Attendance Clock Card:** Large digit stopwatch displaying hours worked (`08:42:15`), active status indicator (`Checked In` in Green, `Checked Out` in Red).
    *   **GPS Status Card:** Renders geofencing parameters:
        *   Target coordinates: `19.1234, 72.8901`
        *   Current coordinates: `19.1236, 72.8904`
        *   Relative Distance: `32 meters`
        *   Geofence Limit Status: `[ Geofence Matched - OK ]` (Green Badge) or `[ Outside Boundary ]` (Red Warning Banner).
    *   **Action button:** Large circular `[ Check In ]` / `[ Check Out ]` button that prompts camera upload for check-in selfie validation.
*   **Component State Variables (Compose):**
    *   `currentLocation` (Location? - Lat/Lng/Accuracy)
    *   `distance` (Double - computed distance to geofence pin)
    *   `isCheckedIn` (Boolean - local clock controller)
    *   `selfieUri` (Uri? - check-in verification photo)

---

### Page 4: Daily Timesheet & Work Commit Screen (`TimesheetScreen.kt`)
*   **Purpose:** End-of-day timesheet compilation detailing hours and goal achievements.
*   **UI Layout & Components:**
    *   **Header Card:** Date selector (default: Today) and total logged hours indicator.
    *   **Inputs:**
        *   `Work Hours (Decimal)`: OutlinedTextField restricting entries to `0.0 - 16.0` range.
        *   `Category`: Dropdown selector `["Survey", "Layout", "Electrical", "Cleaning", "Repair", "Training"]`.
        *   `Achievements / Tasks Completed`: Large text area allowing rich descriptions.
        *   `Blockers / Issues`: OutlinedTextField to list issues requiring supervisor review.
        *   `Goal for Tomorrow`: OutlinedTextField.
    *   **Action Button:** `[ Submit Timesheet ]` (saves record locally, enqueues Outbox queue, and fires WorkManager sync).
*   **Component State Variables (Compose):**
    *   `hoursLogged` (String), `selectedCategory` (String), `achievements` (String), `blockers` (String), `nextGoals` (String).

---

### Page 5: Profile & Settings Screen (`SettingsScreen.kt`)
*   **Purpose:** Manage employee profile data, view password details, and inspect sync state logs.
*   **UI Layout & Components:**
    *   **Profile Card:** Circular profile photo placeholder, Employee Name, Alphanumeric Employee Code (e.g. `EMP-3048`), Job Role Badge (`Intern`, `Design Engineer`, etc.).
    *   **Metadata Pane:** Displaying:
        *   Active Base Zone: `Pune (West)`
        *   Salary / Compensation details: `₹28,500 / month` (if configured)
        *   Assigned Mentor / Supervisor details.
    *   **Settings Actions:**
        *   `[ Change Password ]`: Opens slide-up sheet requesting old and new passwords.
        *   `[ Force Database Sync ]`: Manual trigger to flush the Outbox transaction queue immediately.
*   **Component State Variables (Compose):**
    *   `oldPassword` (String), `newPassword` (String), `syncLogList` (List of log strings).

---

## Part 2: The 9 Role-Specific Workspaces

### Role 1: Service Coordinator Workspace Pages

#### A. Live Dispatch Map Page (`MapTrackerPage.kt`)
*   **Purpose:** Track active installers and assign coordinate pins.
*   **UI Components:**
    *   **Top Bar:** Search field for technician names and dropdown to filter by zone.
    *   **Map view:** Leaflet/Google Map rendering coordinate pins for both **Customer installations** (Blue Markers) and **Technicians** (Red markers showing last active check-in position).
    *   **Customer Detail Sheet:** Clicking a map marker slides up a card showing customer details, inverter status, and coordinates.

#### B. Inverter Telemetry Credentials Page (`TelemetryCredentialsPage.kt`)
*   **Purpose:** Provision API endpoints and SN values for solar inverter telemetry syncing.
*   **UI Components:**
    *   **Inverter Brand Dropdown:** `["Growatt", "Waaree", "FoxESS", "Solax", "Growatt-Shine"]`.
    *   **Authentication Forms:** Alphanumeric fields for `API Key`, `Secret Key`, `Login ID`, `Inverter Password`, and `Datalogger Serial Number (SN)`.
    *   **CTAs:** `[ Test API Sync ]` (tries connecting to inverter cloud server) and `[ Save Credentials ]`.

#### C. Crew Task Dispatcher Drawer (`CrewDispatcherDrawer.kt`)
*   **Purpose:** Create new installation or complaint tasks.
*   **UI Components:**
    *   **Form fields:** Dropdown for crew selection, customer ID lookup, task type selection (`"Survey"`, `"AMC Visit"`, `"Complaint"`), and detailed instruction input fields.

---

### Role 2: Site Survey Engineer Workspace Pages

#### A. Assigned Survey List Page (`SurveyListPage.kt`)
*   **Purpose:** Group assigned site surveys chronologically.
*   **UI Components:**
    *   Cards containing: Customer Name, Site Address, Appointment Time, and Distance (meters) to target coordinates.
    *   Status indicator: `Pending`, `Completed`, `Synced`.

#### B. Rooftop Specs Intake Form Page (`RooftopIntakePage.kt`)
*   **Purpose:** Document physical dimensions and shade obstruction profiles of customer roofs.
*   **UI Components:**
    *   **Dimensions Panel:** Double text input fields for Length (ft) and Width (ft).
    *   **Roof Material Grid:** Selection grid: `[Concrete]` `[Tin Sheet]` `[Asbestos]` `[Tile]` `[Ground Mount]`.
    *   **Shadow Obstacle checklist:** Multi-select switches: Trees, Nearby Buildings, Neighborhood structures, Cables, Water Tanks.
    *   **Obstruction Description:** Textbox.

#### C. Compressed Image Uploader Page (`SurveyPhotoPage.kt`)
*   **Purpose:** Capture and compress required site survey images before upload.
*   **UI Components:**
    *   **Photo Grid:** 4 panels (`Rooftop View`, `Surrounding Obstacles`, `Inverter Location`, `Net Meter location`).
    *   **Camera Trigger:** Pressing a card opens the device camera. On capture, automatically scales the image to `1280px` max dimension and applies 75% JPEG compression.

---

### Role 3: Solar Design Engineer Workspace Pages

#### A. Survey Review Queue Page (`DesignQueuePage.kt`)
*   **Purpose:** View completed site survey report inputs sent by field engineers.
*   **UI Components:**
    *   Details pane displaying Length, Width, Material type, Obstacles list, and a clickable thumbnail gallery of compressed site images.

#### B. Inverter Mapping & Specifications Page (`DesignSpecsPage.kt`)
*   **Purpose:** Select target equipment configuration variables.
*   **UI Components:**
    *   **Inverter Brand Selector:** Dropdown lists `Growatt`, `FoxESS`, `Waaree`.
    *   **Panel Selection Form:** Numeric input for panel count, dropdown for panel wattage size (`["400W", "450W", "500W", "550W"]`).
    *   **Tilt Angle Input:** Number input (Degrees).

#### C. Design Layout PDF Uploader Page (`DesignUploaderPage.kt`)
*   **Purpose:** Attach completed CAD and Single Line Diagram (SLD) layout drawings.
*   **UI Components:**
    *   **Uploader panels:** Large boxes for **CAD Layout Drawing** and **Single Line Diagram (SLD)** files.
    *   **Progress bars:** Dynamic upload bar showing transfer stats.

---

### Role 4: Electrical Engineer Workspace Pages

#### A. Compliance & Grid Sync Page (`ElectricalSyncPage.kt`)
*   **Purpose:** Perform safety electrical audits prior to net-meter commissioning.
*   **UI Components:**
    *   **Compliance Checklist:** Checklist validating Megger insulation test, Grid sync, Earth pit grounding checks.
    *   **Ohms Validator:** Text input for Earthing Pit Resistance. Restricts form submission if entered value is >2.0 Ohms.
    *   **Net-Meter ID Form:** Input field validating uppercase alphanumeric characters.

#### B. Single Line Diagram (SLD) Vector Viewer Page (`SldViewerPage.kt`)
*   **Purpose:** View and verify electrical line connections.
*   **UI Components:**
    *   **Canvas Viewport:** A dynamic vector layout rendered on an Android `Canvas` interface showing the AC/DC schematics, junction boxes, DC fuses, and inverter routing.

#### C. Document scanner Page (`DocumentScannerPage.kt`)
*   **Purpose:** Scan and save black-and-white physical commissioning certificates.
*   **UI Components:**
    *   **Scanner Viewfinder:** Camera viewfinder box. Captures the document and runs contrast filter logic to convert the image into a clean B&W scan before PDF assembly.

---

### Role 5: Inventory Executive Workspace Pages

#### A. Stock Ledger Page (`StockLedgerPage.kt`)
*   **Purpose:** View active stock counts of panels, inverters, and mounts.
*   **UI Components:**
    *   Ledger list cards showing Part Name, Category, Stock SKU Code, and Stock Count.
    *   Outlined in red/yellow when count is below warning thresholds.

#### B. Barcode Scanner Overlay Page (`StockScannerPage.kt`)
*   **Purpose:** Scan serial numbers on panels and dataloggers.
*   **UI Components:**
    *   Camera viewport overlay displaying a red scanning line. Decodes serial numbers (e.g. `SW-GWT-10293`) on successful capture.

#### C. Material Dispatch Queue Page (`DispatchQueuePage.kt`)
*   **Purpose:** Release stock units based on coordinator dispatch requests.
*   **UI Components:**
    *   List of dispatch tickets containing Customer Name, Project ID, and requested item quantities.
    *   `[ Release Stock ]` button (deducts items from ledger and saves transaction log).

---

### Role 6: O&M Technician Workspace Pages

#### A. AMC Route Schedule Page (`AmcSchedulePage.kt`)
*   **Purpose:** List assigned monthly customer AMC cleanings.
*   **UI Components:**
    *   Technician route checklist sorting client installations by distance to technician's current location.
    *   `[ Navigate ]` button (fires Google Maps route intent).

#### B. Watermarked Photo Capture Page (`AmcPhotoCapturePage.kt`)
*   **Purpose:** Capture before/after photos with embedded watermark overlays.
*   **UI Components:**
    *   Double camera card frames: `Before Cleaning (Dirty)` and `After Cleaning (Clean)`.
    *   **Watermarking Overlay:** Images are stamped with:
        *   GPS coordinates: `Lat 19.1235 / Lng 72.8906`
        *   Date & Timestamp: `2026-07-03 16:15:32`
        *   Address string: `Swayog Industrial Area, Pune`

#### C. Clamp & Inspection Checklists Page (`InspectionCheckPage.kt`)
*   **Purpose:** Document structural and electrical checklist checks.
*   **UI Components:**
    *   Checklist: Frame bolts tightened, Cable conduits routed properly, Panel alignment checked, Site water availability checked.

---

### Role 7: Service Engineer Workspace Pages

#### A. Active Tickets Queue Page (`TicketsQueuePage.kt`)
*   **Purpose:** Display and manage assigned customer complaints.
*   **UI Components:**
    *   Complaint cards sorted by severity (Red badge for High, Yellow for Medium, Green for Low).
    *   Includes customer name, address, and complaint description.

#### B. Offline Diagnostics Directory Page (`DiagnosticsPage.kt`)
*   **Purpose:** Reference inverter error code root causes offline.
*   **UI Components:**
    *   Search bar for code queries.
    *   Details pane displaying root cause and troubleshooting instructions (e.g. `PV Voltage High - Reduce panels in string`).

#### C. Customer Signature Sign-Off Page (`SignatureSignOffPage.kt`)
*   **Purpose:** Capture digital signature validating task resolution.
*   **UI Components:**
    *   **Drawing Canvas:** White signature capture card framing drawing path coordinates.
    *   **Action button:** `[ Clear Signature ]` (wipes path lists) and `[ Confirm Resolution ]`.

---

### Role 8: Monitoring Analyst Workspace Pages

#### A. PV Outage Alerts Page (`OutageAlertsPage.kt`)
*   **Purpose:** Track underperforming customer solar plants.
*   **UI Components:**
    *   Console list highlighting customers with generation drops >20% compared to expected sunlight irradiance.
    *   Displays Expected kWh versus Actual kWh.

#### B. Notification Dispatch Page (`NotificationDispatchPage.kt`)
*   **Purpose:** Send pre-formatted outage notices to customers.
*   **UI Components:**
    *   Pre-composed SMS/WhatsApp template form.
    *   `[ Send WhatsApp Alert ]` CTA (opens WhatsApp with pre-filled message text).

#### C. Crew Deploy Form Page (`CrewDeployFormPage.kt`)
*   **Purpose:** Dispatch field technicians directly to underperforming sites.
*   **UI Components:**
    *   Form pre-filled with customer details, coordinates, and error details. Includes technician assignment selection dropdown.

---

### Role 9: Intern Workspace Pages

#### A. Shadow Log Form Page (`ShadowLogFormPage.kt`)
*   **Purpose:** Submit daily shadow log accomplishments.
*   **UI Components:**
    *   Form fields: Shadow Category selection dropdown, decimal hours worked input field, and Achievements description textarea.
    *   CTA: `[ Submit Shadow Log ]` (inserts record to local Room DB and outbox queue).

#### B. Skills Milestone checklist Page (`SkillsTrackerPage.kt`)
*   **Purpose:** Track practical learning progression.
*   **UI Components:**
    *   Checklist: Surveying, CAD Design Layouts, Commissioning Checks, Inverter Diagnostic Repairs.
    *   Checking a skill triggers a local profile update that syncs to the supervisor's dashboard.

#### C. Mentor Feedback Timeline Page (`MentorFeedbackPage.kt`)
*   **Purpose:** Review comments and ratings submitted by mentors.
*   **UI Components:**
    *   Timeline cards displaying Mentor Name, rating score (e.g., `4.5 / 5.0`), comment text, and date.

---

## Part 3: Offline Sync & WorkManager Sequence Flow

```
     User Action (Form/Image)
                 │
                 ▼
         [Local Room Cache]  ──> (UI updates instantly)
                 │
                 ▼
        [outbox_queue] (isSynced = false)
                 │
         Network Connectivity Check
                 │
                 ├─────── (No Connection) ───────┐
                 │                               ▼
                 │                         Queue Retained
                 │
                 └─────── (Connected) ───────────┐
                                                 ▼
                                    [WorkManager Background Worker]
                                                 │
                                                 ▼
                                     [REST API JSON Payload]
                                                 │
                                                 ▼
                                     [Remote Postgres Update]
                                                 │
                                                 ▼
                                     [Set Local isSynced = true]
```

### Sync Constraints Configuration (`SyncManager.kt`)
Enforces system conditions before running outbox transfers:
```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .build()

val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(constraints)
    .build()

WorkManager.getInstance(context).enqueueUniqueWork(
    "SwayogSyncWork",
    ExistingWorkPolicy.KEEP, // Retain existing task, reject duplicate schedules
    syncRequest
)
```
