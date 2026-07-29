# Android App Parity Tasklist

**Audit Date:** January 2025  
**Platform:** Android (Kotlin + Jetpack Compose)  
**Comparison:** Web App vs Android App

---

## Overview

This document compares the Android application functionality against the web application and identifies gaps, missing features, and parity status.

---

## Parity Legend

- ✅ **FULL PARITY** - Feature fully implemented in Android
- ⚠️ **PARTIAL PARITY** - Feature partially implemented or with limitations
- ❌ **MISSING** - Feature not implemented in Android
- 🔄 **DIFFERENT** - Feature implemented differently

---

## 1. Authentication & Authorization

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| User Login | ✅ | ✅ | ✅ FULL | Android uses `/employee/login` endpoint with flat response |
| Token Refresh | ✅ | ✅ | ✅ FULL | Android uses `/employee/token/refresh` |
| Logout | ✅ | ✅ | ✅ FULL | |
| Register | ✅ | ❌ | ❌ MISSING | Registration not exposed in Android |
| Change Password | ✅ | ❌ | ❌ MISSING | |
| Get Current User | ✅ | ✅ | ✅ FULL | |
| Profile Photo Upload | ✅ | ❌ | ❌ MISSING | Web has this, Android doesn't |
| Role-based Access | ✅ | ✅ | ✅ FULL | All roles supported |

**Tasks:**
- [ ] Add user registration flow to Android
- [ ] Add change password functionality
- [ ] Add profile photo upload
- [ ] Ensure all 8 user roles work correctly in Android

---

## 2. Admin Dashboard

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Dashboard Summary | ✅ | ⚠️ | ⚠️ PARTIAL | Android has dashboard but different layout |
| Revenue Chart | ✅ | ❌ | ❌ MISSING | |
| Installation Chart | ✅ | ❌ | ❌ MISSING | |
| Active Jobs by Zone | ✅ | ❌ | ❌ MISSING | |
| Interactive Map | ✅ | ⚠️ | ⚠️ PARTIAL | Android has SubAdminMapScreen but not admin map |
| Recent Activity Feed | ✅ | ❌ | ❌ MISSING | |
| Quick Actions | ✅ | ❌ | ❌ MISSING | |

**Tasks:**
- [ ] Add full admin dashboard with charts
- [ ] Add revenue chart visualization
- [ ] Add installation chart visualization
- [ ] Add zone-based job grouping
- [ ] Add interactive map for admin
- [ ] Add activity feed
- [ ] Add quick action buttons

---

## 3. Admin - Customer Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Customer Listing | ✅ | ✅ | ✅ FULL | Android has SubAdminCustomersScreen |
| Search & Filter | ✅ | ✅ | ✅ FULL | |
| Create Customer | ✅ | ⚠️ | ⚠️ PARTIAL | Android has EditCustomerDialog but may not have full create flow |
| Edit Customer | ✅ | ✅ | ✅ FULL | Android has EditCustomerDialog |
| Delete Customer | ✅ | ❌ | ❌ MISSING | |
| Import from Excel | ✅ | ❌ | ❌ MISSING | |
| Export to Excel | ✅ | ❌ | ❌ MISSING | |
| Warranty Badge | ✅ | ❌ | ❌ MISSING | |
| Portal Credential Management | ✅ | ✅ | ✅ FULL | |
| AMC Status Indicators | ✅ | ✅ | ✅ FULL | |
| Partner Assignment | ✅ | ⚠️ | ⚠️ PARTIAL | May be limited in Android |

**Tasks:**
- [ ] Add delete customer functionality
- [ ] Add Excel import
- [ ] Add Excel export
- [ ] Add warranty badge display
- [ ] Ensure full partner assignment workflow

---

## 4. Admin - Employee Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Employee Listing | ✅ | ✅ | ✅ FULL | Android has SubAdminEmployeesScreen |
| Grid/Table View | ✅ | ⚠️ | ⚠️ PARTIAL | Android may only have one view |
| Create Employee | ✅ | ❌ | ❌ MISSING | |
| Edit Employee | ✅ | ❌ | ❌ MISSING | |
| Delete Employee | ✅ | ❌ | ❌ MISSING | |
| Import from Excel | ✅ | ❌ | ❌ MISSING | |
| Export to Excel | ✅ | ❌ | ❌ MISSING | |
| Bulk Task Assignment | ✅ | ❌ | ❌ MISSING | |
| Performance Display | ✅ | ⚠️ | ⚠️ PARTIAL | Limited in Android |
| Attendance Status | ✅ | ✅ | ✅ FULL | |
| Active Tasks per Employee | ✅ | ⚠️ | ⚠️ PARTIAL | |

**Tasks:**
- [ ] Add create employee flow
- [ ] Add edit employee functionality
- [ ] Add delete employee
- [ ] Add Excel import/export
- [ ] Add bulk task assignment
- [ ] Enhance performance display
- [ ] Show active tasks per employee

---

## 5. Employee Dashboard

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Personal Task List | ✅ | ✅ | ✅ FULL | Android has TasksScreen |
| Attendance Status | ✅ | ✅ | ✅ FULL | Android has AttendanceScreen |
| Performance Metrics | ✅ | ✅ | ✅ FULL | |
| Work Description Input | ✅ | ✅ | ✅ FULL | |
| Role-based Redirection | ✅ | ✅ | ✅ FULL | Android has role detection |

**Tasks:**
- None - Good parity

---

## 6. Sub-Admin Dashboard

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Customer Selection | ✅ | ✅ | ✅ FULL | |
| City-based Filtering | ✅ | ✅ | ✅ FULL | |
| AMC Cleaning Summaries | ✅ | ✅ | ✅ FULL | |
| Service Request Statistics | ✅ | ✅ | ✅ FULL | Android has SubAdminComplaintsScreen |
| Customer/Inverter Details | ✅ | ✅ | ✅ FULL | Android has SubAdminCustomerDetailsScreen |
| Inverter Credential Updates | ✅ | ✅ | ✅ FULL | |
| Real-time Generation Monitoring | ✅ | ✅ | ✅ FULL | |
| Historical Generation Data | ✅ | ✅ | ✅ FULL | |
| Inverter API Integration | ✅ | ✅ | ✅ FULL | All 8 brands supported |
| Simulation Fallback | ✅ | ✅ | ✅ FULL | |

**Tasks:**
- None - Excellent parity

---

## 7. AMC Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Customer Listing with AMC | ✅ | ✅ | ✅ FULL | Android has AmcManagementScreen |
| Search & Filter | ✅ | ✅ | ✅ FULL | |
| Group by Apartment | ✅ | ✅ | ✅ FULL | |
| Individual Settings | ✅ | ✅ | ✅ FULL | Android has AmcSettingsDialog |
| Apartment Bulk Settings | ✅ | ✅ | ✅ FULL | |
| Excel Import | ✅ | ⚠️ | ⚠️ PARTIAL | Android has Excel import dialog |
- [ ] Ensure Excel import works fully

---

## 8. Task Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| List Tasks with Filters | ✅ | ✅ | ✅ FULL | Android has TasksScreen |
| Create Single Task | ✅ | ❌ | ❌ MISSING | Android can complete but not create |
| Create Bulk Tasks | ✅ | ❌ | ❌ MISSING | |
| Complete Task | ✅ | ✅ | ✅ FULL | Android has completion with images |
| Rate Task | ✅ | ❌ | ❌ MISSING | |
| Before/After Images | ✅ | ✅ | ✅ FULL | Android has camera integration |
| GPS Coordinates | ✅ | ✅ | ✅ FULL | Android has location services |
| Watermark Support | ✅ | ✅ | ✅ FULL | Android has WatermarkHelper |
| Customer Rating | ✅ | ❌ | ❌ MISSING | |
| Fix Charges | ✅ | ❌ | ❌ MISSING | |
| Invoice Generation | ✅ | ❌ | ❌ MISSING | Backend auto-generates, but UI missing |
| Notifications | ✅ | ⚠️ | ⚠️ PARTIAL | Android has FCM but may not show task notifications |
| AMC Visit Integration | ✅ | ✅ | ✅ FULL | |
| Performance Tracking | ✅ | ✅ | ✅ FULL | |

**Tasks:**
- [ ] Add task creation UI
- [ ] Add bulk task creation
- [ ] Add task rating UI
- [ ] Add fix charges UI
- [ ] Show invoice generation confirmation
- [ ] Ensure task notifications work in Android
- [ ] Add customer feedback display

---

## 9. Customer Portal

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Project Trajectory | ✅ | ❌ | ❌ MISSING | No customer portal in Android |
| Pending Task Reviews | ✅ | ❌ | ❌ MISSING | |
| System Details | ✅ | ❌ | ❌ MISSING | |
- [ ] Add AMC visit history
- [ ] Add notification management
- [ ] Add payment integration

---

## 10. Attendance Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Check-in with Selfie | ✅ | ✅ | ✅ FULL | Android has camera integration |
| GPS Location | ✅ | ✅ | ✅ FULL | Android has fused location provider |
| Check-out | ✅ | ✅ | ✅ FULL | |
| Work Description | ✅ | ✅ | ✅ FULL | |
- [ ] Add face verification UI
- [ ] Add enrollment management UI

---

## 11. Financial Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Financial Summary | ✅ | ⚠️ | ⚠️ PARTIAL | Android has SubAdminFinancialsScreen |
- [ ] Add monthly P&L chart
- [ ] Add zone breakdown
- [ ] Add AMC contracts list
- [ ] Add partner payouts
- [ ] Add invoice management UI
- [ ] Add invoice file upload

---

## 12. Inventory Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| List Inventory Items | ✅ | ✅ | ✅ FULL | Android has API integration |
- [ ] Add inventory management UI
- [ ] Add inventory executive role check
- [ ] Add dispatch management UI

---

## 13. Partner Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| Partner Profile | ✅ | ❌ | ❌ MISSING | No partner portal in Android |
- [ ] Add partner portal to Android

---

## 14. Apartment Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
| List Apartments | ✅ | ✅ | ✅ FULL | Android has apartment grouping in AMC |
- [ ] Add apartment CRUD UI

---

## 15. Messages/Communication

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
- [ ] Add messaging UI to Android
- [ ] Add FCM notification handling
- [ ] Add in-app notification center

---

## 16. Super Admin Features

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
- [ ] Add super admin dashboard to Android
- [ ] Add user management UI
- [ ] Add system controls
- [ ] Add maintenance mode toggle

---

## 17. Internal User Management

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
- [ ] Add internal user management to Android

---

## 18. Daily Commits

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
- [ ] Add daily commits UI to Android

---

## 19. Growatt Integration

| Feature | Web App | Android App | Parity | Notes |
|---------|---------|-------------|--------|-------|
- [ ] Add Growatt management UI to Android

---

## 20. Android-Specific Features (Not in Web)

| Feature | Android App | Web App | Notes |
|---------|-------------|---------|-------|
| Offline Support | ✅ | ❌ | Android has Room database + outbox queue |
| Face Recognition | ✅ | ❌ | Android has face enrollment & verification |
| Camera Integration | ✅ | ❌ | Android has native camera for attendance/tasks |
| GPS Tracking | ✅ | ❌ | Android has fused location provider |
| Push Notifications (FCM) | ✅ | ⚠️ | Web has in-app notifications, Android has FCM |
| Watermark Helper | ✅ | ❌ | Android has image watermarking |
| Background Sync | ✅ | ❌ | Android has WorkManager for sync |

---

## Priority Matrix

### High Priority (Core Functionality Gaps)

1. **Task Creation** - Android can complete but not create tasks
2. **Customer Portal** - Completely missing in Android
3. **Partner Portal** - Completely missing in Android
4. **Admin Dashboard Charts** - Revenue and installation charts missing
5. **Invoice Management UI** - Backend exists but no Android UI
6. **Inventory Management UI** - Backend exists but no Android UI
7. **Messaging/Communication UI** - Backend exists but no Android UI

### Medium Priority (Enhanced Features)

1. **Excel Import/Export** - Missing for customers and employees
2. **Task Rating & Fix Charges** - Missing customer-facing features
3. **Super Admin Portal** - System management features missing
4. **Notification Center** - In-app notification display
5. **Financial Charts** - P&L and zone breakdown visualizations

### Low Priority (Nice-to-Have)

1. **Profile Photo Upload** - Convenience feature
2. **Change Password** - Can be done via web
3. **Warranty Badges** - Visual indicator
4. **Activity Feed** - Informational
5. **Quick Actions** - Convenience shortcuts

---

## Technical Parity Notes

### Backend API Coverage
- ✅ Android uses most backend endpoints via `ApiService.kt`
- ✅ Mobile-compatible endpoints exist in `employee.routes.ts`
- ⚠️ Some endpoints may need additional Android-specific handlers

### Data Models
- ✅ Android has comprehensive data models in `data/model/`
- ✅ Models align with backend Prisma schema
- ✅ Serialization/deserialization handled with Gson

### Offline Support
- ✅ Android has Room database for local caching
- ✅ Outbox queue for offline operations
- ✅ WorkManager for background sync
- ❌ Web has no offline support

### UI Framework
- ✅ Android uses Jetpack Compose (modern)
- ✅ Web uses React (modern)
- Both use component-based architecture

---

## Summary Statistics

| Category | Web Features | Android Features | Parity % |
|----------|--------------|------------------|----------|
| Authentication | 7 | 4 | 57% |
| Admin Dashboard | 7 | 1 | 14% |
| Customer Management | 10 | 6 | 60% |
| Employee Management | 10 | 3 | 30% |
| Employee Dashboard | 5 | 5 | 100% |
| Sub-Admin Dashboard | 10 | 10 | 100% |
| AMC Management | 8 | 7 | 88% |
| Task Management | 12 | 5 | 42% |
| Customer Portal | 9 | 0 | 0% |
| Attendance | 8 | 8 | 100% |
| Financial Management | 9 | 1 | 11% |
| Inventory Management | 9 | 1 | 11% |
| Partner Management | 5 | 0 | 0% |
| Apartment Management | 4 | 2 | 50% |
| Messages | 3 | 0 | 0% |
| Super Admin | 15 | 0 | 0% |
| Internal Users | 6 | 0 | 0% |
| Daily Commits | 2 | 0 | 0% |
| Growatt | 4 | 0 | 0% |
| **TOTAL** | **133** | **53** | **40%** |

**Overall Parity: 40%**

---

## Recommended Implementation Order

### Phase 1: Core Employee Features (Weeks 1-2)
1. Task creation UI
2. Task rating & fix charges UI
3. Invoice display in task completion
4. Notification center

### Phase 2: Admin Features (Weeks 3-4)
1. Admin dashboard with charts
2. Customer management (delete, Excel import/export)
3. Employee management (CRUD, bulk operations)
4. Inventory management UI

### Phase 3: Customer & Partner Portals (Weeks 5-6)
1. Customer portal implementation
2. Partner portal implementation
3. Payment integration in Android

### Phase 4: Advanced Features (Weeks 7-8)
1. Messaging/communication UI
2. Super admin portal
3. Financial management enhancements
4. Growatt management UI

---

## Conclusion

The Android app has excellent parity for **employee-facing features** (attendance, tasks, sub-admin dashboard, AMC management) but lacks significant functionality in **admin, customer, and partner portals**. The app also has unique advantages like offline support, face recognition, and native camera integration that the web app doesn't have.

**Key Strengths of Android:**
- Excellent employee/sub-admin experience
- Offline-first architecture
- Native device integration (camera, GPS, face recognition)
- Modern Jetpack Compose UI

**Key Gaps in Android:**
- No customer portal
- No partner portal
- Limited admin features
- Missing financial visualizations
- No inventory management UI
- No messaging UI

**Recommendation:** Focus on Phase 1 (Core Employee Features) first to complete the employee experience, then move to Phase 2 (Admin Features) to enable full administrative capabilities from mobile.
