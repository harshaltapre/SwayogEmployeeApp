# SWAYOG Employee Application - Detailed Flow & Role-Specific Specifications

This document defines the detailed user experience, navigation flows, and role-specific user interfaces for the **SWAYOG Employee Mobile Application**. 

---

## 1. The Unified App Entry & Routing Pipeline

The employee app utilizes a **single unified codebase and login screen** for all personnel. Rather than distributing separate apps, the mobile client dynamically configures its dashboard and routes based on the verified role metadata returned during login.

```
                            +──────────────────────────┐
                            │    Common Login Screen   │
                            +─────────────┬────────────┘
                                          │
                                          ▼
                            +──────────────────────────┐
                            │  JSON Auth Payload Check │
                            +─────────────┬────────────┘
                                          │
        ┌───────────────┬─────────────────┼────────────────┬────────────────┐
        ▼               ▼                 ▼                ▼                ▼
 [Service Coord.] [Survey Eng.]    [Design Eng.]    [Electrical Eng.]  [Inventory Exec.]
  /subadmin/db     /employee/db     /employee/db     /employee/db       /inventory/db
  (Growatt/Map)    (Rooftop Intake)  (CAD/SLD Upload) (Commission Pit)  (QR Stock Desk)
        │               │                 │                │                │
        ├───────────────┼─────────────────┴────────────────┼────────────────┘
        ▼               ▼                                  ▼
   [O&M Tech]     [Service Eng.]                      [Monitoring]       [Intern]
   /employee/db   /employee/db                        /employee/db       /employee/db
   (AMC Cleanings)(Complaints Desk)                   (Alert Console)    (Shadow Logs)
```

---

## 2. Common Flow: Login & Biometric Setup

### Authentication Options
1. **Passcode & Email**: Manual entry of Login ID (e.g. `EMP-5348`) and security password.
2. **Mobile OTP**: One-Time-Password sent to registered SIM card.
3. **Biometric Bypass**: Native device biometric scan. On first successful credentials validation, the app securely stores the passcode in the hardware Keystore and enables quick biometric login for subsequent sessions.

### Dynamic Dashboard Initialization
* On response success (`200 OK`), the mobile app extracts the user profile:
  ```json
  "user": {
    "role": "EMPLOYEE",
    "jobRole": "Solar Design Engineer"
  }
  ```
* The application router (`AppNavigation`) checks the `jobRole` string and applies the appropriate UI layout, navigation permissions, and local database cache scopes.

---

## 3. The 9 Post-Login Role Workspaces

Below is the detailed specification of the dashboard screen, key metrics, and unique tools for each of the 9 roles:

| Role Name | Route Target | Post-Login Home View Layout | Key Forms / Actions | UI/UX Visual Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **1. Service Coordinator** | `/subadmin/dashboard` | Split-Screen: Interactive Leaflet site coordinates map & Inverter live status charts. | Growatt/ShineMonitor credentials provision; Manual API sync trigger. | Red/Yellow/Green live status markers, custom credentials modal. |
| **2. Site Survey Engineer** | `/employee/dashboard` | Route-Optimized Checklist of assigned customer site surveys. | Rooftop measurements (ft); obstruction checklists; shadow points. | Integrated camera dashboard with custom local resizing (<500KB). |
| **3. Solar Design Engineer** | `/employee/dashboard` | Workflow queue of completed site surveys awaiting layouts. | CAD Layout PDF upload; Single Line Diagram (SLD) PDF upload; structural specs form. | Multi-file progress bars, split design status timelines. |
| **4. Electrical Engineer** | `/employee/dashboard` | System commissioning checklist and compliance audit layout. | Earthing resistance (ohms); megger resistance check; Net-Meter ID logs. | Embedded Single Line Diagram (SLD) vector viewer drawer. |
| **5. Inventory Executive** | `/inventory/dashboard` | Warehouse card panels showing active stock levels. | Barcode/QR scanner trigger; part release checklist; intake updates. | Low stock alert banners (yellow/red outlines on stock panels). |
| **6. O&M Technician** | `/employee/dashboard` | Scheduled monthly AMC cleaning visits grouped by route distance. | Clamps & cabling inspection checks; before/after image captures. | Side-by-side comparison slider, before/after preview indicators. |
| **7. Service Engineer** | `/employee/dashboard` | Active client complaint cards, sorting tickets by priority. | Spare parts requisition form; customer digital signature canvas. | Diagnostic code directory; offline Growatt/FoxESS search engine. |
| **8. Monitoring Analyst** | `/employee/dashboard` | Generation performance monitors and communication status cards. | Remote diagnostic simulation triggers; WhatsApp prefilled alert trigger. | High warning badges (drop in yield >20%), live inverter graphs. |
| **9. Intern** | `/employee/dashboard` | Daily learning shadow diary feed and senior mentor profiles. | Work shadow log form; hour tracking logs; supervisor review board. | Mentor approval status badges, skills completion tracker. |

---

## 4. Layout Specifications & UI Form Inputs

### Common Workspace Screens (All Employee Roles)
Every employee profile includes common utility screens accessible via the global bottom navigation or sidebar:
1. **Attendance Check-In Dashboard**: Renders a dynamic check-in clock. Once a check-in is initiated, the app checks if the location matches the site geofence (within 100m) and logs check-in times.
2. **Daily Commit / Timesheet Log**: An end-of-day form requiring the employee to input decimal hours (e.g. `6.5`), log achievements, list blocker issues, and select target goals for tomorrow.

---

### Workspace UI Detail Specs

#### Role 1: Service Coordinator
* **Inverter Sync Panel**: Form inputs for `inverterBrand`, `inverterLoginId`, `inverterPassword`, `apiKey`, and `deviceSn`.
* **Field Crew Map Tracker**: Displays live Leaflet/Google Maps view plotting technicians alongside customer addresses. Allows drawing bounding boxes to filter customer tickets.

#### Role 2: Site Survey Engineer
* **Rooftop Specs Form**: Double input fields for length and width. Single-choice selectors for roof type: `["Concrete", "Tin Sheet", "Asbestos", "Tile", "Ground Mount"]`.
* **Obstruction Indicators**: Multi-select checkmarks for shadow builders: trees, chimneys, electrical lines, water tanks, neighboring building heights.

#### Role 3: Solar Design Engineer
* **CAD Drafting Workspace**: Multi-file select interface. Links directly to a PDF/DWG layout. Supports adding design notes (tilt angle, inter-row spacing, DC/AC cable sizing).

#### Role 4: Electrical Engineer
* **Grid Sync Panel**: Technical diagnostic text fields:
  * Earthing Pit Resistance: Double input validation (`< 2.0 Ohms` required for sync).
  * Net-Meter ID: Monospace uppercase text validator.
  * Commissioning Report PDF: Converts camera-scanned physical documents into high-contrast black-and-white PDFs.

#### Role 5: Inventory Executive
* **Material Dispatch Terminal**: Camera view overlay displaying a red scanner guidance line. Scanning a panel/inverter barcode parses the alphanumeric serial string, deducts the unit count from the local database, and updates the task assignment record.

#### Role 6: O&M Technician
* **AMC Verification Slider**: Requires two watermarked uploads to submit. Before/after photos are overlaid with:
  * Dynamic GPS coordinates (Latitude/Longitude).
  * Synchronized Date/Time stamp.
  * Reversed geocoded physical address label.

#### Role 7: Service Engineer
* **Offline Troubleshooting Guide**: Directory layout. Search input matching inverter error codes (e.g. Growatt `Error 117` or FoxESS `Err 09`) displays root causes and troubleshooting instructions. Includes an on-screen customer sign-off canvas.

#### Role 8: Monitoring Analyst
* **Yield Alert Console**: Table listing installations. Red highlight if `actualYield < expectedYield * 0.8` (generation drop > 20%). Tapping triggers pre-formatted WhatsApp alerts.

#### Role 9: Intern
* **Shadow Log Form**: Text area input, mentor selector dropdown, decimal hours field, and a skills checklist box.

---

## 5. Offline-First Synchronization & Data Integrity

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

### Safety and Security Safeguards
1. **SQLCipher Database Encryption**: All Room SQLite database tables on the device are fully encrypted using SQLCipher, preventing local memory extraction.
2. **Strict Data Isolation**: The local Room database cache is filtered to retrieve and retain task information matching ONLY the logged-in user's ID.
3. **Anti-Spoof GPS Filters**: The geofencing system checks location provider integrity, rejecting mock location coordinates (mock flags generated by GPS simulation software).
4. **Resilient Outbox Retries**: Image uploads and form data are processed sequentially. WorkManager implements an exponential back-off strategy (10 seconds delay, doubling on successive failures) to manage spotty mobile connections.
