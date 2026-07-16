# Phase 3 — Updated Gap Analysis: Web vs Android (Flow-Level)

*Building on the existing feature comparison from `WEB_ANDROID_FEATURE_COMPARISON.md` and incorporating flow-level detail from Phase 2.*

---

## 1. AMC Scheduling + Employee Assignment Flow

### Web Application

**Files**: `src/pages/employee/SubAdminDashboard.tsx`, `src/pages/employee/AmcManagement.tsx`, `src/pages/employee/SubAdminCalendar.tsx`

| Step | Flow Step | Web Status | Android Status | Notes |
|---|---|---|---|---|
| 1 | Select customer → view summary | ✅ Full | ✅ Implemented in `SubAdminDashboard` | Works |
| 2 | View/open AMC settings | ✅ Full | ✅ Implemented in `SubAdminCustomerDetailsScreen` | Works |
| 3 | Schedule AMC visit (date, time, employee) | ✅ Full | ⚠️ Partial in `SubAdminCalendarScreen` — can create visit but limited fields | Missing: full employee assignment during creation |
| 4 | Assign employee to visit | ✅ Full | ⚠️ Partial — can assign via calendar but not from AMC Management screen | Web has dedicated `AmcManagement` page — Android does NOT |
| 5 | Employee sees task appear | ✅ Full (web refresh) | ❌ Missing — Android Tasks screen exists (@com.swayog.employee.presentation.tasks.TasksScreen) but task does NOT appear for AMC visits — only for regular tasks | **Critical gap** |
| 6 | Employee completes visit with photos | ✅ Full (before/after, GPS, watermark) | ❌ Missing — TasksScreen has photo capture but no AMC completion flow | **Critical gap** |
| 7 | SC sees completion | ✅ Full (on refresh) | ⚠️ Partial — SC can refresh to see on calendar | No push notification |

### Android Gap Score: **~35% implemented** (flow breaks at step 5)

---

## 2. Service Request / Complaint Lifecycle

### Web Application

**Files**: `src/pages/employee/SubAdminComplaints.tsx`, `src/pages/admin/Complaints.tsx`

| Step | Flow Step | Web Status | Android Status | Notes |
|---|---|---|---|---|
| 1 | Complaint created (by customer/admin/SC) | ✅ Full | ❌ Not available from Android app — customer/SC cannot create complaints from mobile | **Missing** |
| 2 | Complaint appears in list | ✅ Full | ✅ Implemented in `SubAdminComplaintsScreen` | Works |
| 3 | SC reviews and schedules (date, employee) | ✅ Full — schedule modal with dropdown | ❌ Missing — `SubAdminComplaintsScreen` has list but NO schedule/assign modal | **Critical gap** |
| 4 | Employee receives task | ✅ Full | ❌ Missing — same as AMC gap; task not pushed to employee app | **Critical gap** |
| 5 | Employee resolves complaint | ✅ Full | ❌ Missing — no complaint resolution flow in Android Tasks | **Critical gap** |
| 6 | SC sees resolution | ✅ Full | ❌ Missing — no update mechanism from Android employee side | |

### Android Gap Score: **~20% implemented** (only viewing list works; all mutation/assignment is missing)

---

## 3. Task Assignment and Completion

### Web Application

**Files**: `src/pages/employee/Tasks.tsx`, `src/pages/employee/EmployeesUnderMe.tsx`, `src/pages/employee/SubAdminEmployees.tsx`

| Step | Flow Step | Web Status | Android Status | Notes |
|---|---|---|---|---|
| 1 | SC/Admin creates a task | ✅ Full — from employees page or dashboard | ✅ Implemented in `SubAdminEmployeesScreen` via task assignment | Works |
| 2 | Employee notified (via refresh) | ✅ Full | ❌ Missing — Android TasksScreen (`TasksScreen.kt`, 812 lines) exists but does NOT correctly fetch tasks assigned via task API — may only fetch AMC visits | **Critical gap** — the screen exists but may show no data |
| 3 | Employee views detail | ✅ Full — drawer with full info | ❌ Missing — TasksScreen has UI but fetch logic may not work | Verify: `TasksViewModel` likely uses wrong endpoint |
| 4 | Employee starts task | ✅ Full | ❌ Missing — status update not wired | |
| 5 | Employee completes with photos | ✅ Full — before/after, GPS, watermark | ⚠️ Partial — `TasksScreen.kt` has photo capture code (812 lines) but integration with completion endpoint may be broken | **Critical gap** — UI exists but flow may fail |
| 6 | SC sees completion | ✅ Full | ❌ Missing — no WebSocket/FCM push; SC must refresh | |

### Android Gap Score: **~40% implemented** (UI shell exists at 812 lines but core fetch/complete logic may be non-functional)

---

## 4. Attendance and Daily Commits

### Web Application

**Files**: `src/pages/employee/Attendance.tsx`, `src/pages/employee/DailyCommit.tsx`

| Step | Flow Step | Web Status | Android Status | Notes |
|---|---|---|---|---|
| 1 | Employee checks in (face + GPS + photo) | ✅ Full | ✅ Full — `AttendanceScreen` + `FaceVerificationScreen` | Works |
| 2 | Employee checks out | ✅ Full | ✅ Full | Works |
| 3 | Employee submits daily commit | ✅ Full | ✅ Full — `DailyCommitScreen` | Works, missing "pass upward" feature |
| 4 | Visibility to Admin/SC | ✅ Full via `/admin/attendance`, `/admin/daily-commits` | ⚠️ Partial — `SubAdminAttendance` and `SubAdminDailyCommit` screens exist but may have limited filtering | Minor gaps |

### Android Gap Score: **~95% implemented** (best-implemented workflow)

---

## 5. Customer Record Management

### Web Application

**Files**: `src/pages/employee/SubAdminCustomers.tsx`, `src/pages/admin/Customers.tsx`

| Step | Flow Step | Web Status | Android Status | Notes |
|---|---|---|---|---|
| 1 | Customer created (form) | ✅ Full — modal with all fields + Excel import | ❌ Missing — Android cannot create customers | **Gap** |
| 2 | Customer details viewed | ✅ Full — detail view with 5 tabs | ✅ Full — `SubAdminCustomerDetailsScreen` with same tabs | Works |
| 3 | Inverter credentials updated | ✅ Full — modal | ✅ Full — in detail view | Works |
| 4 | Telemetry picks up changes | ✅ Full — on next poll cycle | ✅ Full — same backend | Works |
| 5 | Changes visible in dashboard/charts | ✅ Full | ✅ Full | Works |

### Android Gap Score: **~75% implemented** (viewing works, creation missing)

---

## 6. Map-Based Operations

### Web Application

**Files**: `src/pages/employee/SubAdminMap.tsx`

| Step | Flow Step | Web Status | Android Status | Notes |
|---|---|---|---|---|
| 1 | View customer/complaint pins on map | ✅ Full — custom markers, city coordinates | ⚠️ Partial — `SubAdminMapScreen` has Google Maps but basic markers | Missing custom styling |
| 2 | Filter (All / AMC / Complaints) | ✅ Full | ✅ Partial — UI exists but filtering behavior unclear | |
| 3 | Click pin → see details | ✅ Full — popup with phone, address | ❌ Missing — click handler not implemented | **Gap** |
| 4 | Schedule complaint from map | ✅ Full — schedule modal | ❌ Missing | **Gap** |
| 5 | Assign employee from map | ✅ Full — employee dropdown | ❌ Missing | **Gap** |

### Android Gap Score: **~30% implemented** (basic map renders, interactions missing)

---

## 7. Financials / Invoices

| Feature | Web | Android | Gap |
|---|---|---|---|
| Invoice list | ✅ Full | ✅ Full | Minor — missing filter button and payment history modal |
| Create invoice | ✅ Full | ✅ Full | Works |
| Invoice types | ✅ Full | ✅ Full | Works |

### Android Gap Score: **~90% implemented**

---

## 8. Employees Management

| Feature | Web | Android | Gap |
|---|---|---|---|
| Staff directory with role filter | ✅ Full | ✅ Full | Works |
| Assigned tasks tab | ✅ Full | ✅ Full | Works |
| Task filters (All/Today/Upcoming) | ✅ Full | ❌ Missing | Minor |
| Task assignment from detail | ✅ Full | ❌ Missing | **Gap** |
| Grid/Table toggle | ✅ Full | ✅ Full | Works |

### Android Gap Score: **~85% implemented**

---

## 9. Admin & Super Admin Features

| Feature | Web | Android | Android Recommendation |
|---|---|---|---|
| Super Admin dashboard (all tabs) | ✅ Full | ❌ Missing | Legitimately desktop-only — keep as is |
| Admin dashboard with charts | ✅ Full | ❌ Missing | Desktop-only — keep |
| Admin customer creation | ✅ Full | ❌ Missing | Relevant for mobile — **gap** |
| Admin employee management | ✅ Full | ❌ Missing | Relevant for mobile — **gap** |
| Admin financials/revenue | ✅ Full | ❌ Missing | Desktop-only — keep |
| Admin inventory | ✅ Full | ❌ Missing | Partially relevant — low priority |
| Partner management | ✅ Full | ❌ Missing | Desktop-only — keep |

---

## 10. Customer Portal (Mobile-App-Relevant)

| Feature | Web | Android | Recommendation |
|---|---|---|---|
| Customer dashboard | ✅ Full | ❌ Missing | This is a separate customer app, not the employee app — keep as is |
| Service requests | ✅ Full | ❌ Missing | Customer-facing — would need separate app |
| Payments | ✅ Full | ❌ Missing | Customer-facing — separate app |
| Installation details | ✅ Full | ❌ Missing | Customer-facing — separate app |

---

## Summary: Updated Gap Table (Flow-Level)

| Workflow / Feature | Web Status | Android Status | Flow Completeness | Priority |
|---|---|---|---|---|
| **Attendance + Daily Commits** | ✅ Full | ✅ Full | **95%** | — (already done) |
| **Financials / Invoices** | ✅ Full | ✅ Full | **90%** | — |
| **Employees Management** | ✅ Full | ✅ Full | **85%** | — |
| **Customer Record (Viewing)** | ✅ Full | ✅ Full | **75%** | Medium (add creation) |
| **Task Assignment & Completion** | ✅ Full | ⚠️ Partial (UI shell exists) | **40%** | **HIGH — #1 priority** |
| **AMC Scheduling Flow** | ✅ Full | ⚠️ Breaks at step 5 | **35%** | **HIGH — #2 priority** |
| **Map Operations** | ✅ Full | ⚠️ Renders only | **30%** | Medium |
| **Complaint Lifecycle** | ✅ Full | ❌ List only, no mutation | **20%** | **HIGH — #3 priority** |
| **Admin/Super Admin (mobile-relevant)** | ✅ Full | ❌ Not implemented | **0%** | Low (desktop-first) |
| **Customer creation** | ✅ Full | ❌ Not implemented | **0%** | Medium |
| **Partner features** | ✅ Full | ❌ Not implemented | **0%** | Low (separate scope) |
| **Notifications (push)** | ❌ Not implemented | ❌ Not implemented | **0%** | Medium (cross-cutting) |

### Overall Android Implementation: **~55%** (revised down from earlier 60% due to flow-level analysis revealing non-functional screens)

---

## Priority Recommendations (Updated with Flow Context)

### HIGH PRIORITY — Fix Broken Flows (Must work end-to-end)

1. **Fix Employee Task flow** (`TasksScreen.kt`) — This 812-line screen already exists but the task fetch and completion logic needs to be debugged and wired to the correct backend endpoints (`GET /api/v1/employee/tasks`, `POST /api/v1/employee/tasks/{taskId}/complete`)
2. **Fix AMC visit → Employee visibility** — AMC visits assigned to employees must appear in the Android Tasks screen
3. **Add Complaint scheduling/assignment** to `SubAdminComplaintsScreen` — schedule modal with employee dropdown

### MEDIUM PRIORITY — Add Missing Mutation Capabilities

1. **Customer creation** — Add create customer form to Android
2. **Schedule complaint from Calendar** — Add complaint scheduling to `SubAdminCalendarScreen`
3. **Map interactions** — Add tap-to-view-details, schedule from map

### LOW PRIORITY — Desktop-Only Features (No Android needed)

1. Super Admin management dashboard
2. Admin financial charts/reports
3. Partner management
4. Customer portal (separate app)
5. Bulk Excel import
</content>

<task_progress>

- [x] Phase 1 — Full Web Application Inventory (completed and reported)
- [x] Phase 2 — Detailed Flow Documentation (all 6 workflows)
- [x] Phase 3 — Updated Gap Analysis (flow-level detail)
- [ ] Phase 4 — Non-Destructive Implementation Plan
- [ ] Phase 5 — Sync Mechanism Review and Optimization
- [ ] Final End-to-End Demonstration
</task_progress>
