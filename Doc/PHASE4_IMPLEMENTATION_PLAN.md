# Phase 4 — Non-Destructive Implementation Plan

## Approved Implementation Order (Based on Phase 3 Gap Analysis)

The implementation will proceed one workflow at a time. After each workflow, verify:

1. The Phase 0 baseline (no existing Android screen breaks)
2. The specific end-to-end test for the workflow just fixed

---

## Item 1: Fix Employee Task Fetch & Completion (HIGHEST PRIORITY)

### Current State

- `TasksViewModel.kt` calls `TaskRepository.refreshTasks(id)` → calls `apiService.getTasks(employeeUserId)`
- Backend `GET /api/v1/tasks` has `employeeUserId` query param → returns tasks assigned to that employee
- `TaskRepository.completeTask` calls `apiService.completeTask(taskId, ...)` → `PATCH /api/v1/tasks/{taskId}/complete`
- The 812-line `TasksScreen.kt` has full UI for photo capture, GPS, watermark, status updates

### Regression Risk Assessment

- **Files touched**: `TasksScreen.kt`, `TasksViewModel.kt`, `TaskRepository.kt`, `TaskModels.kt`, `ApiService.kt`
- **Shared data models**: `Task` model is shared with `DashboardScreen` (dashboard shows task counts) and `SubAdminEmployeesScreen` (task assignment)
- **Risk**: MODERATE — changes to TaskRepository or ApiService could affect dashboard task counts

### Fix Plan

1. Verify ApiService.getTasks() returns correct data format matching Task model
2. Debug TasksViewModel.init() to ensure local DB flow + remote refresh work together
3. Test completeTask() flow end-to-end with before/after photos
4. No structural changes to shared models — only logic/debug fixes

### Verification

- Log in as SC on web → create and assign a task to employee
- Log in as employee on Android → confirm task appears in TasksScreen
- Complete the task with photos → confirm SC sees completion on web

---

## Item 2: Add AMC Visit Visibility to Employee Tasks (HIGH PRIORITY)

### Current State

- AMC visits are created in `AmcVisit` table (separate from `Task` table)
- Android TasksScreen only fetches from `Task` table
- Employee never sees assigned AMC visits

### Regression Risk Assessment

- **Files touched**: `ApiService.kt` (add AMC fetch endpoint), `TaskRepository.kt` (add AMC fetch), `TasksViewModel.kt` (merge task + AMC data), `TasksScreen.kt` (show AMC badge)
- **Risk**: LOW — adding new data source doesn't change existing task fetch

### Fix Plan: Backend Approach

- Option A (chosen): In `employee.routes.ts` employee endpoint `GET /api/v1/employee/tasks`, merge regular tasks + AMC visits assigned to employee
- Option B: Create a new endpoint `GET /api/v1/employee/amc-visits` for Android to call separately
- Option C: When creating AMC visit, also create a Task record linked to it

Best approach: **Option A** — Modify the backend `employee/controller.ts` to include AMC visits in the task list response. This is the cleanest approach since the employee route already exists.

### Backend Changes Required

- Modify `employee.controller.ts` `getMyTasks` to query both `Task` and `AmcVisit` tables
- Return a merged response with a `type` field differentiating tasks from AMC visits

### Verification

- SC schedules AMC visit with employee assignment
- Employee opens Android Tasks → sees both regular tasks and AMC visits

---

## Item 3: Add Complaint Scheduling/Assignment to Android (HIGH PRIORITY)

### Current State

- `SubAdminComplaintsScreen.kt` shows complaint list but has no schedule/assign modal
- Web has full schedule modal with date, time, employee dropdown

### Regression Risk Assessment

- **Files touched**: `SubAdminComplaintsScreen.kt`, `SubAdminComplaintsViewModel.kt`
- **Risk**: LOW — adding UI to existing screen; doesn't affect other screens

### Fix Plan

1. Add "Schedule" button to each complaint item
2. Create schedule modal (date picker, time picker, employee dropdown)
3. Call `PATCH /api/v1/subadmin/service-requests/{requestId}`

### Verification

- SC opens Android complaints → taps Schedule → selects date/time/employee → confirms
- Employee sees the complaint as a task → completes it
- SC sees status updated to COMPLETED

---

## Item 4: Customer Creation on Android (MEDIUM PRIORITY)

### Current State

- Android has `SubAdminCustomersScreen` and `SubAdminCustomerDetailsScreen` for viewing/editing
- No create customer form exists

### Regression Risk Assessment

- **Files touched**: `SubAdminCustomersScreen.kt`, `SubAdminCustomersViewModel.kt`
- **Risk**: LOW — adding UI to existing screen

### Fix Plan

1. Add FAB or "Add Customer" button to customer list
2. Create customer form matching web modal fields
3. Call `POST /api/v1/customers`

### Verification

- SC opens Android customers → taps Add → fills form → confirms
- New customer appears in list and web

---

## Item 5: Map Interaction Improvements (MEDIUM PRIORITY)

### Current State

- `SubAdminMapScreen.kt` renders map with basic markers
- No tap-to-view-details, no schedule modal

### Regression Risk Assessment

- **Files touched**: `SubAdminMapScreen.kt`, `SubAdminMapViewModel.kt`
- **Risk**: LOW

### Fix Plan

1. Add custom marker styling (green for AMC, red/blue for complaints)
2. Add marker click → show detail popup with phone, address
3. Add schedule button in popup → opens schedule modal

### Verification

- SC opens map → sees properly colored markers → taps marker → sees details → can schedule

---

## Item 6: Complaint Scheduling from Calendar (LOW PRIORITY)

### Current State

- `SubAdminCalendarScreen.kt` has AMC visit creation but no complaint scheduling

### Fix Plan

1. Add "Schedule Complaint" option in calendar
2. Reuse schedule modal from complaints screen

### Verification

- SC opens calendar → schedules a complaint → confirmed

---

## Implementation Order Summary

| Order | Item | Priority | Risk Level | Est. Effort |
|---|---|---|---|---|
| 1 | Fix Employee Task fetch & completion | HIGH | MODERATE | 1-2 days |
| 2 | AMC visits visible in Employee Tasks | HIGH | LOW | 1 day |
| 3 | Complaint scheduling/assignment on Android | HIGH | LOW | 1-2 days |
| 4 | Customer creation on Android | MEDIUM | LOW | 1 day |
| 5 | Map interaction improvements | MEDIUM | LOW | 2-3 days |
| 6 | Calendar complaint scheduling | LOW | LOW | 1 day |

---

## Baseline Verification (Phase 0 Check)

Before implementing Item 1, confirm the following screens/features ARE currently working on Android:

### Employee Screens (Role: employee)

- [x] Login → `LoginScreen.kt`
- [x] Dashboard → `DashboardScreen.kt` (task counts, attendance status, check-in/out buttons)
- [x] Attendance → `AttendanceScreen.kt` (check-in/out with face verification, GPS, break management)
- [x] Daily Commit → `DailyCommitScreen.kt` (submit work log, history)
- [x] Profile → `ProfileScreen.kt` (view/edit profile)
- [x] Settings → `SettingsScreen.kt` (theme, face enrollment, logout)

### Sub-Admin / Service Coordinator Screens (Role: sub_admin)

- [x] Dashboard → `ServiceCoordinatorDashboardContent.kt` (customer selection, generation data, charts)
- [x] Customers list → `SubAdminCustomersScreen.kt`
- [x] Customer details → `SubAdminCustomerDetailsScreen.kt` (5 tabs: Overview, Generation, AMC, Credentials, Tasks)
- [x] Complaints list → `SubAdminComplaintsScreen.kt`
- [x] Calendar → `SubAdminCalendarScreen.kt`
- [x] Map → `SubAdminMapScreen.kt` (basic rendering)
- [x] Employees → `SubAdminEmployeesScreen.kt` (directory with role filters, grid/table toggle)
- [x] Financials → `SubAdminFinancialsScreen.kt` (invoice list, create invoice)

### Known Issues (pre-existing, not to be regressed)

- ID typing bug (int/string mismatch in some controller params)
- False-success on status update (API returns 200 but DB unchanged)
</content>

<task_progress>

- [x] Phase 1 — Full Web Application Inventory
- [x] Phase 2 — Detailed Flow Documentation (all 6 workflows)
- [x] Phase 3 — Updated Gap Analysis (flow-level detail)
- [x] Phase 4 — Non-Destructive Implementation Plan with baseline verification
- [ ] Phase 5 — Sync Mechanism Review and Optimization
- [ ] Final End-to-End Demonstration
</task_progress>
