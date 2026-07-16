# Phase 2 — Detailed Flow Documentation

## Workflow 1: AMC Scheduling + Employee Assignment

### Step-by-step Trace

1. **SC selects customer** on SubAdmin Dashboard (Web: `/subadmin/dashboard`, Android: `SubAdminDashboard`)
   - UI Action: Choose customer from dropdown
   - Frontend API call: `GET /api/v1/subadmin/customers/{customerId}/summary`
   - Backend route: `subadminRoutes.get("/customers/:customerId/summary", ...)`
   - Database: Reads `Customer`, `AmcSetting`, `InverterCredential` tables

2. **SC opens AMC settings** for the customer
   - UI Action: Click "AMC Settings" button
   - Modal shows: AMC type (pre-paid/post-paid/free service/corporate/on-call), frequency, next visit date
   - Frontend: No separate API call — data is already loaded from step 1

3. **SC schedules AMC visit** via Calendar (`/subadmin/calendar`) or AMC Management (`/subadmin/amc-management`)
   - UI Action: Click a date, fill visit form (customer, date, time, assigned employee)
   - Frontend API call: `POST /api/v1/subadmin/amc-visits`
   - Backend route: `subadminRoutes.post("/amc-visits", ...)` → `createAmcVisit` in `amc.controller.ts`
   - Database: Creates record in `AmcVisit` table with fields: `customerId`, `assignedToId`, `scheduledDate`, `status: "SCHEDULED"`

4. **SC assigns employee** to the visit
   - UI Action: Select employee from dropdown in the AMC visit form
   - Frontend API call: Either part of the create (POST) or via `PATCH /api/v1/subadmin/amc-visits/{visitId}`
   - Backend route: `subadminRoutes.patch("/amc-visits/:visitId", ...)` → `updateAmcVisit`
   - Database: Updates `AmcVisit.assignedToId`

5. **Employee sees the task** on their Dashboard/Tasks screen
   - Visibility: Employee opens their app → `GET /api/v1/employee/tasks` or `GET /api/v1/tasks?employeeUserId={id}`
   - The AMC visit appears as a task with type "AMC_VISIT" status "SCHEDULED"
   - Database: `Task` table may also have a corresponding record linked to `AmcVisit`

6. **Employee completes the AMC visit**
   - UI Action: Opens task detail, marks as completed, uploads before/after photos
   - Frontend API call: `POST /api/v1/subadmin/amc-visits/{visitId}/complete`
   - Backend route: `subadminRoutes.post("/amc-visits/:visitId/complete", ...)` → `markVisitCompleted`
   - Database: Updates `AmcVisit.status` to `"COMPLETED"`, sets `completedAt`

7. **SC sees completion reflected**
   - Visibility: On next refresh, calendar/dashboard shows the visit as completed
   - Customer portal (if it exists) may also show the completion

### Roles Involved

- **Service Coordinator (Sub Admin)** — Steps 1-4, 7
- **Employee (Field Tech / Service Engineer)** — Steps 5-6
- **Admin / Super Admin** — Can view via `/admin/dashboard` and `/admin/complaints`

### Real-time / Refresh Visibility

- **SC**: Immediate after refresh (no push notification currently — REST-poll-only)
- **Employee**: After opening the app / pulling to refresh
- **Customer**: Only when they log into the customer portal

---

## Workflow 2: Service Request / Complaint Lifecycle

### Step-by-step Trace

1. **Complaint is created** — by Customer, Admin, or SC
   - UI Action: Fill complaint form (customer, description, priority)
   - Frontend API call: `POST /api/v1/customers/{customerId}/service-requests` or admin creation
   - Backend: Creates record in `ServiceRequest` table with status `"PENDING"`
   - Database: `ServiceRequest` — fields: `customerId`, `description`, `status`, `createdAt`

2. **Complaint appears** in SC's Complaint list (`/subadmin/complaints`)
   - Frontend API call: `GET /api/v1/subadmin/service-requests`
   - Backend: `subadminRoutes.get("/service-requests")` → `getAllServiceRequests`
   - Shows all service requests with status `"PENDING"`, `"SCHEDULED"`, `"IN_PROGRESS"`, `"COMPLETED"`

3. **SC reviews and schedules** the complaint
   - UI Action: Click Schedule → select date, time, assign employee
   - Frontend API call: `PATCH /api/v1/subadmin/service-requests/{requestId}` with body `{ status: "SCHEDULED", scheduledDate, assignedToId }`
   - Backend: `subadminRoutes.patch("/service-requests/:requestId")` → `updateServiceRequest`
   - Database: Updates `ServiceRequest.status` to `"SCHEDULED"`, sets `assignedToId`, `scheduledDate`

4. **Employee receives task** for the complaint
   - Same as AMC step 5 — the task appears in employee's task list
   - The complaint may also create a `Task` record linked to the `ServiceRequest`

5. **Employee works on and resolves** the complaint
   - UI Action: Mark as completed with work notes
   - Frontend API call: `PATCH /api/v1/tasks/{taskId}/complete` or `POST /api/v1/employee/tasks/{taskId}/complete`
   - Database: Updates `ServiceRequest.status` to `"COMPLETED"`

6. **SC and Customer see resolution**
   - SC sees updated status in complaints list
   - Customer sees resolution in their service portal

### Roles Involved

- **Customer / Admin / SC** — Creation (Step 1)
- **Service Coordinator** — Steps 2-3
- **Employee (Field Tech)** — Steps 4-5
- **Customer** — Step 6

### Known Issues from Previous Work

- ID-typing bug (int vs string mismatch between controllers)
- False-success on status update (API returns 200 but DB unchanged)

---

## Workflow 3: Task Assignment and Completion

### Step-by-step Trace

1. **SC/Admin creates a task**
   - UI Action: Fill task form (title, description, assignee, due date, job type)
   - Frontend API call: `POST /api/v1/tasks` (or `POST /api/v1/admin/tasks/assign`)
   - Backend: `taskRoutes.post("/")` → `createTaskHandler` in `tasks.controller.ts`
   - Database: Creates `Task` record, `TaskAssignment` record linking employee

2. **Employee is notified** (contemporaneous check)
   - Currently: No push notification — employee must refresh app
   - Future: FCM push could be triggered on task creation
   - Visibility on refresh: `GET /api/v1/employee/tasks` returns the new task

3. **Employee views task detail**
   - UI Action: Tap on task in list
   - Frontend API call: `GET /api/v1/employee/tasks/{taskId}`
   - Backend: `employeeRoutes.get("/tasks/:taskId")` → `getTaskDetails`
   - Shows: customer info, location, job type, status, notes

4. **Employee starts task**
   - UI Action: Change status to "IN_PROGRESS"
   - Frontend API call: `PATCH /api/v1/employee/tasks/{taskId}/status`
   - Backend: `employeeRoutes.patch("/tasks/:taskId/status")` → `updateTaskStatus`
   - Database: Updates `Task.status`

5. **Employee completes task with photos**
   - UI Action: Capture before/after photos (GPS-tagged, watermarked), fill work details
   - Frontend API call: `POST /api/v1/employee/tasks/{taskId}/complete` or `PATCH /api/v1/tasks/{id}/complete`
   - Backend: `employeeRoutes.post("/tasks/:taskId/complete")` → `markTaskCompleted`
   - Database: Updates `Task.status` to `"COMPLETED"`, stores `TaskImage` records

6. **SC sees completion** on Dashboard / Calendar / Employees page
   - Visibility: Dashboard task count updates, calendar event shows completed
   - Customer: Can see completed tasks in their portal if applicable

### Roles Involved

- **SC / Admin** — Step 1
- **Employee** — Steps 2-5
- **SC / Admin** — Step 6 (oversight)

### Real-time / Refresh Visibility

- Currently REST-refresh-only. No WebSocket/FCM push for task assignment.

---

## Workflow 4: Attendance and Daily Commits

### Step-by-step Trace

1. **Employee checks in**
   - UI Action: Face verification + GPS location capture + selfie with watermark
   - Frontend API call: `POST /api/v1/employee/attendance/check-in` (body: faceEmbedding, latitude, longitude, photo)
   - Backend: `attendanceRoutes.post("/check-in")` in `routes/attendance.js`
   - Database: Creates `Attendance` record with `checkInTime`, `status: "PRESENT"`, face vector

2. **Employee checks out**
   - UI Action: Face verification again + GPS
   - Frontend API call: `POST /api/v1/employee/attendance/check-out`
   - Backend: Updates `Attendance` record with `checkOutTime`, calculates hours

3. **Employee submits daily commit**
   - UI Action: Fill daily commit form (task, summary, hours, blockers, tomorrow plan, file)
   - Frontend API call: `POST /api/v1/employee/daily-commits`
   - Backend: `dailyCommitsRoutes.post("/")` → creates `DailyCommit` record
   - Database: `DailyCommit` — fields: `employeeId`, `date`, `taskWorkedOn`, `workSummary`, `hoursSpent`, `issues`, `tomorrowPlan`, `attachmentUrl`

4. **Visibility to Admin/SC**
   - Admin: `GET /api/v1/admin/daily-commits` or via `/admin/daily-commits` page
   - SC: `GET /api/v1/subadmin/daily-commits` or via `/subadmin/daily-commit` page
   - Team Lead: `GET /api/v1/employee/daily-commits/team` shows direct reports' commits
   - Database: Reads `DailyCommit` filtered by date range and managed employees

### Roles Involved

- **Employee** — Steps 1-3
- **Admin / SC / Team Lead** — Step 4
- **HR / Admin** — Can view attendance reports and monthly summaries

### Real-time / Refresh Visibility

- Attendance: Real-time during check-in/out (immediate API response)
- Daily Commits: REST-refresh-only for visibility to managers

---

## Workflow 5: Customer Record Management

### Step-by-step Trace

1. **Customer is created** by Admin/SC/Partner
   - UI Action: Fill customer creation form (name, address, phone, system details, inverter credentials)
   - Frontend API call: `POST /api/v1/customers`
   - Backend: `customerRoutes.post("/")` → `createCustomerHandler`
   - Database: Creates `Customer` record, may also create `InverterCredential`, `AmcSetting`

2. **Customer details are edited**
   - UI Action: Edit customer fields in detail view
   - Frontend API call: `PATCH /api/v1/customers/{id}`
   - Backend: `customerRoutes.patch("/:id")` → `updateCustomerHandler`
   - Database: Updates `Customer` record

3. **Inverter credentials are updated**
   - UI Action: Edit in credentials modal/dialog
   - Frontend API call: `PATCH /api/v1/subadmin/customers/{customerId}`
   - Backend: `subadminRoutes.patch("/customers/:customerId")` → `updateCustomerCredentials`
   - Database: Updates `InverterCredential` — inverter brand, login ID, password, API key, device SN

4. **Impact on telemetry fetching**
   - If inverter credentials change → **immediate effect** on next telemetry poll cycle
   - Growatt scheduler (`startGrowattScheduler`) and Waaree scheduler (`startWaareeScheduler`) run on intervals
   - WebSocket telemetry poller (`startTelemetryPoller`) also refreshes data
   - **Actual behavior**: Changes are picked up on next poll cycle — NOT real-time. The poll runs every few minutes.

5. **Changes propagate to visible data**
   - Generation charts update on next poll
   - Dashboard reflects new inverter data
   - No notification is sent when credentials change

### Roles Involved

- **Admin / Super Admin / SC / Partner** — Steps 1-3
- **System (Telemetry Pollers)** — Step 4
- **All roles viewing customer** — Step 5

### Important Note

- Editing customer basic info (name, address, phone) → immediate DB update, visible on next read
- Editing inverter credentials → affects telemetry on next poll cycle, not immediately
- **No cascading updates** to other systems when customer data changes

---

## Workflow 6: Notifications

### What Actions Trigger Notifications

| Action | Trigger | Channel | Current Status |
|---|---|---|---|
| Task assigned | Task creation/assignment | In-app (on refresh), No push | Only visible when user opens app |
| Task completed | Employee marks task complete | None to SC/Customer | SC must refresh to see |
| AMC visit scheduled | SC creates AMC visit | None to Employee | Employee must open app |
| Complaint scheduled | SC schedules complaint | None to Employee/Customer | Must refresh to see |
| Attendance check-in | Employee checks in | None to Admin | Admin must check attendance page |
| Daily commit submitted | Employee submits commit | None to Manager | Manager must refresh |
| Invoice created | SC creates invoice | None to Customer | Customer must check payments page |
| System notification (maintenance, alerts) | Admin triggers | In-app banner | When user has app open |

### Current State of Notifications

- **In-app notifications**: None implemented in either web or Android beyond basic Toast/Snackbar for immediate action feedback
- **Push notifications (FCM)**: Not implemented. The Android app does not have FCM integration
- **Email notifications**: Not implemented for any workflow
- **Real-time sync (WebSocket)**: Only used for telemetry data (inverter generation) — NOT for task/AMC/complaint updates

### Roles and Notification Targets

| Action | Who Should Be Notified | Current Method |
|---|---|---|
| Task assigned → Employee | Employee | Must refresh Tasks screen |
| Task completed → SC | Service Coordinator | Must refresh Dashboard |
| Complaint created → SC | Service Coordinator | Must refresh Complaints |
| Complaint scheduled → Employee | Employee | Must refresh Tasks |
| AMC visit assigned → Employee | Employee | Must refresh Tasks |
| Check-in anomaly → Admin | Admin | Must check Attendance page |
| Daily commit submitted → Manager | Team Lead / Dept Head | Must check Daily Commits page |

### Real-time / Refresh Visibility Summary

- All notifications are currently **pull-based**: the recipient must open the relevant screen and the data refreshes on API call
- No push, no WebSocket event emission for workflow updates
- The existing WebSocket server (`telemetry-ws.js`) only broadcasts inverter telemetry data
- For true real-time, FCM push would need to be added for task assignment, AMC scheduling, complaint updates

---

## Summary: Current Real-time / Refresh Visibility by Role

| Role | What They See Immediately | What Requires Manual Refresh |
|---|---|---|
| Employee | Own task list (on app open), attendance status | New task assignments, AMC visit assignments |
| Service Coordinator | Customer inverter data (via WebSocket), dashboard stats | Task completion by employees, complaint updates |
| Admin | Dashboard KPIs, revenue charts | Employee attendance, daily commits, task status |
| Customer | Portal data (on login) | Service request updates, payment status |
| Partner | Own dashboard, project data | Project status changes, earnings updates |

</content>
<task_progress>
- [x] Phase 1 — Full Web Application Inventory (completed and reported)
- [x] Phase 2 — Detailed Flow Documentation - AMC Scheduling
- [x] Phase 2 — Detailed Flow Documentation - Service Request Lifecycle
- [x] Phase 2 — Detailed Flow Documentation - Task Assignment and Completion
- [x] Phase 2 — Detailed Flow Documentation - Attendance and Daily Commits
- [x] Phase 2 — Detailed Flow Documentation - Customer Record Management
- [x] Phase 2 — Detailed Flow Documentation - Notifications
- [ ] Phase 3 — Updated Gap Analysis (flow-level detail)
- [ ] Phase 4 — Non-Destructive Implementation Plan
- [ ] Phase 5 — Sync Mechanism Review and Optimization
- [ ] Final End-to-End Demonstration
</task_progress>
