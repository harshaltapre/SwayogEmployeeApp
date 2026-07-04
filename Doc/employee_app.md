# SWAYOG Employee Application

## Comprehensive Technical Specification, Flow, and Role Workspaces

This document defines the complete architecture, features, workflows, and page-by-page breakdown for the **SWAYOG Employee Application**. The platform supports 9 distinct employee roles across the web dashboard and mobile interface. It incorporates a unified entry point that routes users to specialized workspaces based on their `jobRole` permissions, facilitating task assignment, attendance logs, technical surveys, offline sync, and real-time solar inverter monitoring.

---

## 1. System Architecture & The "Unified App" Entry

The SWAYOG Employee App follows a **Unified Codebase** strategy. Instead of distributing different apps for different roles, a single application dynamically shifts its dashboard layout based on the authenticated user profile.

### Core Data & Sync Flow:
1. **Local State Dominance**: Task status changes, survey forms, daily commits, and check-in times are saved locally in the SQLite/Room database first.
2. **Work Queueing**: Local modifications create a transaction row in the `outbox_queue`.
3. **Geofence Enforcement**: Check-in and check-out logs record raw GPS coordinates. 
4. **Resilient Uploads**: Photo proofs and forms are compressed and queued for background upload via Android WorkManager/Service Workers when offline.

---

## 2. Global Pages (Common to All Employees)

These core pages are accessible across the application regardless of the assigned job role.

### 2.1 Authentication & Login Screen (`Login.tsx`)
- **Layout & Visuals**: A unified gateway displaying the Amber CleanTech theme. It features tabs for [Passcode/Email] and [Mobile OTP]. 
- **Features**: 
  - Dual login modes (Email/Password or Phone/OTP).
  - Quick biometric unlock functionality (Fingerprint bypass).
- **Flow**: After successful API authentication, the server returns the user profile containing `role` (e.g., `EMPLOYEE`, `SUB_ADMIN`) and `jobRole`. The App Router dynamically redirects to the correct Dashboard.

### 2.2 Geofenced Attendance Dashboard (`Attendance.tsx`)
- **Layout & Visuals**: Renders a dynamic check-in clock, an embedded Google Map / Leaflet view with a pin at current coordinates, and action buttons for checking in/out.
- **Features**: 
  - **Selfie Capture**: Triggers the device camera to take an attendance selfie.
  - **GPS Verification**: Pulls FusedLocation coordinates and compares against a 100m radius geofence threshold. 
  - **Time Tracking**: Calculates total break durations and hours spent on-site.
- **Flow**: Employee arrives -> Clicks "Check In" -> App locks GPS -> Selfie capture -> Server validates coordinates -> "Active Session" UI is displayed.

### 2.3 Daily Commit Log (`DailyCommit.tsx` & `DailyCommitTracking.tsx`)
- **Layout & Visuals**: A form-based ledger view to submit end-of-day activities. 
- **Features**: Fields for "Tasks Worked On", "Blockers/Issues", "Tomorrow's Target", and "Hours Spent". 
- **Flow**: Allows employees to self-report work hours and achievements which are tracked by Sub-Admins.

### 2.4 Profile & Settings (`Profile.tsx`, `Settings.tsx`)
- **Features**: Displays employee ID, role, assigned zones, and reporting manager. Allows updating profile pictures, resetting passwords, and viewing recent activity logs.

---

## 3. Role-by-Role Workspace Specifications

The following details the unique page configurations, features, layout structures, and workflows dynamically rendered for each of the 9 specific job roles upon login.

### Job Role 1: Service Coordinator (Sub-Admin / SC)
- **Base Route**: `/employee/subadmin-dashboard` (`SubAdminDashboard.tsx`)
- **Primary Pages & Layouts**:
  1. **SubAdmin Dashboard**: Split-screen showing customer lists and live inverter generation metrics (e.g., Growatt API).
  2. **Field Crew Map**: Interactive Leaflet map plotting active technicians and customer site coordinates.
  3. **Tasks Assignment Pane (`SubAdminEmployees.tsx`)**: Table mapping unassigned complaints to field staff, with geodistance sorting.
  4. **Calendar & Scheduling (`SubAdminCalendar.tsx`)**: Calendar grid organizing upcoming AMC visits and installations.
- **Features**: 
  - Can configure inverter credentials (`inverterLoginId`, `password`, `deviceSn`) directly on the web app.
  - Allocates base rate payments to technicians for completing tasks.
- **Flow**: Customer creates ticket -> SC views ticket on Dashboard -> Checks map for nearest Engineer -> Clicks "Assign" -> Engineer receives Push Notification.

### Job Role 2: Site Survey Engineer
- **Base Route**: `/employee/dashboard` (Configured for Survey)
- **Primary Pages & Layouts**:
  1. **Route Tracker Dashboard**: Chronological list of scheduled rooftop surveys.
  2. **Rooftop Intake Form**: Input fields for:
     - `lengthFt` & `widthFt` (Calculates recommended system capacity).
     - `roofType` (Dropdown: Concrete, Tin Sheet, etc.).
     - `shadowFactors` (Checkboxes for Trees, Chimneys, Buildings).
  3. **Photo Proof Camera**: Camera overlay snapping compressed structural JPEG photos with GPS/Date watermarks.
- **Flow**: Engineer arrives -> Check-in Geofence -> Inputs roof specs -> Captures shading photos -> Clicks Submit. 

### Job Role 3: Solar Design Engineer
- **Base Route**: `/employee/dashboard` (Configured for Design)
- **Primary Pages & Layouts**:
  1. **Survey Pipeline**: Kanban board moving from "Surveyed" -> "Drafting" -> "Review" -> "Approved".
  2. **Technical Layout Uploader**: Form specifying `panelCount`, `inverterModel`, `tiltAngle`. 
  3. **Document Attachments**: Multi-file dropzones for CAD layout blueprints (`.dwg`/`.pdf`) and Single Line Diagrams (SLD).
- **Flow**: Engineer views completed survey specs -> Prepares AutoCAD drawing -> Enters specs on dashboard -> Uploads PDFs -> Marks for Sub-Admin review.

### Job Role 4: Electrical Engineer
- **Base Route**: `/employee/dashboard` (Configured for Commissioning)
- **Primary Pages & Layouts**:
  1. **Commissioning Checklist**: Form ensuring compliance before grid activation.
  2. **SLD Vector Viewer**: Integrated viewer allowing the engineer to zoom into the electrical schematics on-site.
  3. **Diagnostic Sheets**: Inputs for `earthingPitResistance` (< 2.0 Ohms), `meggerInsulation`, and `netMeterId`.
- **Flow**: Engineer navigates to site -> Opens diagnostic sheet -> Connects megger tools and inputs reading values -> Takes photos of Net-Meter -> Signs off and submits checklist.

### Job Role 5: Inventory Executive
- **Base Route**: `/inventory/dashboard`
- **Primary Pages & Layouts**:
  1. **Stock Overview**: Warning panels displaying stock alerts (highlighted in red if under minimum threshold). Lists Panels, Inverters, ACDBs, and cables.
  2. **QR/Barcode Dispatch Terminal**: Camera view to scan serial barcodes of inverters/panels. 
  3. **Approvals Desk**: View pending material requests from Service Coordinators to issue out to field technicians.
- **Flow**: Coordinator requests dispatch -> Inventory Exec views request -> Scans physical items leaving warehouse -> App matches serial codes -> "Approves" dispatch, automatically adjusting stock numbers.

### Job Role 6: O&M (Operations & Maintenance) Technician
- **Base Route**: `/employee/dashboard` (`AmcManagement.tsx` Integration)
- **Primary Pages & Layouts**:
  1. **AMC Cleaning Roster**: Card list of sites scheduled for washing.
  2. **Inspection Checklist**: Options for "Dust Washed", "Structural Clamps Tightened", "Cable Inspection", and "Water Pressure".
  3. **Before/After Geotag Camera**: Split-screen capture enforcing the technician to show dirty panels (Before) and clean panels (After) with un-editable GPS location overlays.
- **Flow**: Tech clicks task -> "Capture Before Photo" -> Washes Panels -> "Capture After Photo" -> Ticks checklist -> "Complete Task". 

### Job Role 7: Service Engineer
- **Base Route**: `/employee/dashboard` (`SubAdminComplaints.tsx` task queue)
- **Primary Pages & Layouts**:
  1. **Complaint Tickets List**: Cards indicating priority (Red/Critical, Yellow/Major).
  2. **Offline Diagnostic Toolkit**: Search directory allowing tech to type "Error 117" and see troubleshooting guides offline for Growatt/UTL/FoxESS systems.
  3. **Resolution Form & Sign-off**: Text area for the repair summary, spare parts used selector, and an interactive touch-canvas for the Customer's Digital Signature.
- **Flow**: Tech reviews complaint -> Searches error code -> Replaces part -> Selects parts used from form -> Asks customer to draw signature on screen -> Ticket marked resolved.

### Job Role 8: Monitoring Analyst
- **Base Route**: `/employee/dashboard` (`WaareeSolarDashboard.tsx` Integration)
- **Primary Pages & Layouts**:
  1. **Generation Alert Dashboard**: UI filtering systems dropping > 20% expected generation or losing communication.
  2. **Inverter Remote Control**: Interactive telemetry panel showing live Watts, voltages, and daily kWh curves.
  3. **Action Triggers**: Buttons to dispatch technicians or auto-open WhatsApp with pre-filled warnings for clients.
- **Flow**: Analyst spots "Red Alert" on generation -> Runs manual API diagnostic check -> If hardware fault, creates Service Ticket -> Assings Service Engineer.

### Job Role 9: Intern
- **Base Route**: `/employee/dashboard`
- **Primary Pages & Layouts**:
  1. **Intern Log Dashboard**: Lists the active assigned Senior Mentor.
  2. **Shadow Entry Form**: Text area detailing "Learning Accomplished", checklist of skills shadowed (Survey, Commissioning, Service), and decimal hours worked.
  3. **Mentor Review Feed**: Status labels showing if the Mentor has "Approved" or "Rejected" the intern's daily log.
- **Flow**: Intern follows Senior Tech -> Opens Log Form -> Details what they learned -> Selects Mentor from dropdown -> Submits. Mentor later reviews log in their dashboard.

---

## 4. End-to-End Field Task Lifecycle (Data Flow)

Regardless of the specific field role, all task executions (Survey, Cleaning, Commissioning, Repair) follow a strict data integrity workflow:

1. **Assignment**: Sub-Admin schedules the task. Database writes to `Task` and `TaskAssignment` (handling multiple employees per task). Push notification sent.
2. **Geofence Check-in**: Employee opens the specific task. `FusedLocationProvider` cross-references device coordinates with customer site coordinates (100m strict radius).
3. **Task Form / Photo Watermarking**: Employee fills role-specific forms. The camera module writes an immutable graphical watermark onto images containing:
   - Latitude/Longitude
   - Timestamp
   - Address string
4. **Offline Synchronization Mechanism**:
   - If offline: Data is packed into a JSON payload and inserted into local SQLite `outbox_queue` with `isSynced = false`. 
   - Android WorkManager periodically listens for `NetworkType.CONNECTED`.
   - Once online, multi-part requests upload forms and compressed photos sequentially to `POST /api/v1/employee/submissions`.
5. **Completion & Finance**: Task is marked "completed". Sub-Admin reviews the photos. Payroll calculation engine reads the task base rate and splits it based on employee assignments. Customer is billed, and payment gateway completes the ledger.
