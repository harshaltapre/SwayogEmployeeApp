# Swayog Energy Dashboard - API Endpoints Documentation

**Generated:** 2026-08-24  
**Backend:** Express.js with Prisma ORM  
**Database:** PostgreSQL/Neon  
**Storage:** Cloudflare R2

---

## Base URL

```
Production: https://api.swayog.com
Development: http://localhost:3000
```

## Authentication

All endpoints (except public ones) require JWT authentication via `Authorization: Bearer <token>` header.

---

## Authentication Endpoints

### POST /auth/login
**Description:** User login with email/phone and password

**Request Body:**
```json
{
  "identifier": "string", // email, phone, or loginId
  "password": "string",
  "role": "string" // optional: SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, CUSTOMER, PARTNER
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "loginId": "string",
    "email": "string",
    "fullName": "string",
    "role": "string",
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Roles Allowed:** PUBLIC

---

### POST /auth/login-with-phone
**Description:** Login with phone number and security code

**Request Body:**
```json
{
  "phoneNumber": "string",
  "securityCode": "string"
}
```

**Response:** Same as /auth/login

**Roles Allowed:** PUBLIC

---

### POST /auth/register
**Description:** Register new user

**Request Body:**
```json
{
  "loginId": "string",
  "email": "string",
  "phoneNumber": "string",
  "fullName": "string",
  "password": "string",
  "role": "string"
}
```

**Response:** Same as /auth/login

**Roles Allowed:** PUBLIC

---

### POST /auth/refresh
**Description:** Refresh access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Roles Allowed:** PUBLIC

---

### POST /auth/logout
**Description:** Logout user (invalidate refresh token)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**Roles Allowed:** AUTHENTICATED

---

### GET /auth/me
**Description:** Get current user profile

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "loginId": "string",
    "email": "string",
    "fullName": "string",
    "role": "string",
    "employeeProfile": { ... },
    "customerProfile": { ... }
  }
}
```

**Roles Allowed:** AUTHENTICATED

---

### POST /auth/change-password
**Description:** Change user password

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Roles Allowed:** AUTHENTICATED

---

## Task Management Endpoints

### GET /tasks
**Description:** List tasks with filters

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `employeeUserId` (string, optional): Filter by assigned employee
- `status` (string, optional): Filter by status (ASSIGNED, IN_PROGRESS, COMPLETED)
- `limit` (number, optional): Maximum results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "jobType": "string",
      "description": "string",
      "customerName": "string",
      "customerPhone": "string",
      "address": "string",
      "latitude": "number",
      "longitude": "number",
      "status": "string",
      "scheduledTime": "ISO8601",
      "employeeUserId": "string",
      "assignedById": "string",
      "completionMessage": "string",
      "completionDocumentUrl": "string",
      "beforeImageUrl": "string",
      "afterImageUrl": "string",
      "sitePhotos": ["string"],
      "taskType": "string",
      "assignedEmployees": [...],
      "completedAt": "ISO8601",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD, CUSTOMER

---

### POST /tasks
**Description:** Create single task

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "jobType": "string",
  "description": "string",
  "customerName": "string",
  "customerPhone": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "scheduledTime": "ISO8601",
  "employeeUserId": "string",
  "taskType": "string",
  "taskRate": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Task object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /tasks/bulk
**Description:** Create bulk tasks for multiple employees

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "jobType": "string",
  "description": "string",
  "customerName": "string",
  "customerPhone": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "scheduledTime": "ISO8601",
  "employeeUserIds": ["string"],
  "taskType": "string",
  "taskRate": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": [{ /* Task object */ }]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /tasks/:id/complete
**Description:** Mark task as completed with documentation

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "completionMessage": "string",
  "completionDocumentUrl": "string",
  "beforeImageUrl": "string",
  "afterImageUrl": "string",
  "beforeLatitude": "number",
  "beforeLongitude": "number",
  "afterLatitude": "number",
  "afterLongitude": "number",
  "sitePhotos": ["string"],
  "images": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Task object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /tasks/:id/photos
**Description:** Update task photos (dedicated endpoint for site visits)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sitePhotos": ["string"],
  "images": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Task object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, EMPLOYEE, SUB_ADMIN, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /tasks/:id/rate
**Description:** Rate completed task

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": "number", // 1-5
  "feedback": "string",
  "fixCharges": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Task object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, CUSTOMER

---

### DELETE /tasks/:id
**Description:** Delete task

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

## Employee-Specific Task Endpoints

### GET /employee/tasks
**Description:** Get tasks assigned to authenticated employee

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string, optional): Filter by status
- `limit` (number, optional): Maximum results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [{ /* Task objects */ }],
    "pagination": {
      "total": "number",
      "limit": "number",
      "offset": "number"
    }
  }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### GET /employee/tasks/:taskId
**Description:** Get specific task details

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": { /* Task object */ }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### PATCH /employee/tasks/:taskId/status
**Description:** Update task status

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "string" // ASSIGNED, IN_PROGRESS, COMPLETED
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Task object */ },
  "message": "Task status updated from ASSIGNED to IN_PROGRESS"
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### POST /employee/tasks/:taskId/complete
**Description:** Mark task as completed (employee endpoint)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Same as PATCH /tasks/:id/complete

**Response:** Same as PATCH /tasks/:id/complete

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

**Note:** This is the Android-specific endpoint. Web uses PATCH /tasks/:id/complete

---

### GET /employee/dashboard
**Description:** Get employee dashboard summary

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTasks": "number",
      "completedToday": "number"
    },
    "tasksByStatus": {
      "ASSIGNED": "number",
      "IN_PROGRESS": "number",
      "COMPLETED": "number"
    }
  }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

## Attendance Endpoints

### POST /attendance/check-in
**Description:** Check in with selfie and GPS

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "selfie": "string", // base64 data URL
  "latitude": "number",
  "longitude": "number",
  "matchConfidence": "number",
  "matchDistance": "number",
  "livenessVerified": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "checkInRecord": { /* CheckIn object */ },
    "attendanceRecord": { /* AttendanceRecord object */ }
  }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### POST /attendance/check-out
**Description:** Check out

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "record": { /* AttendanceRecord object */ }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### GET /attendance/today
**Description:** Get today's attendance record

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "record": { /* AttendanceRecord object */ }
}
```

**Roles Allowed:** AUTHENTICATED

---

### GET /attendance/monthly
**Description:** Get monthly attendance

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `month` (number, optional): Month (1-12, default: current)
- `year` (number, optional): Year (default: current)

**Response:**
```json
{
  "month": "number",
  "year": "number",
  "records": [{ /* AttendanceRecord objects */ }],
  "summary": {
    "totalDays": "number",
    "presentDays": "number",
    "absentDays": "number",
    "lateDays": "number"
  }
}
```

**Roles Allowed:** AUTHENTICATED

---

### GET /attendance/performance
**Description:** Get monthly performance snapshot

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `month` (number, optional): Month (1-12, default: current)
- `year` (number, optional): Year (default: current)

**Response:**
```json
{
  "snapshot": {
    "employeeId": "string",
    "month": "number",
    "year": "number",
    "attendancePercent": "number",
    "taskCompletionRate": "number",
    "avgWorkScore": "number",
    "totalHoursLogged": "number",
    "performanceScore": "number",
    "daysPresent": "number",
    "daysAbsent": "number",
    "tasksAssigned": "number",
    "tasksCompleted": "number"
  }
}
```

**Roles Allowed:** AUTHENTICATED

---

### POST /attendance/profile-photo
**Description:** Upload profile photo

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "photo": "string" // base64 data URL
}
```

**Response:**
```json
{
  "success": true
}
```

**Roles Allowed:** AUTHENTICATED

---

### PUT /users/internal/profile-photo
**Description:** Update profile photo (alternative endpoint)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Same as /attendance/profile-photo

**Response:** Same as /attendance/profile-photo

**Roles Allowed:** AUTHENTICATED

---

## Face Recognition Endpoints

### POST /attendance/face/enroll
**Description:** Enroll face descriptors for authentication

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "descriptor1": [0.1, 0.2, ...], // 128-element float array
  "descriptor2": [0.1, 0.2, ...], // 128-element float array
  "descriptor3": [0.1, 0.2, ...]  // 128-element float array
}
```

**Response:**
```json
{
  "success": true,
  "enrolledAt": "ISO8601"
}
```

**Roles Allowed:** AUTHENTICATED

---

### GET /attendance/face/enrollment
**Description:** Get face enrollment status

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `employeeId` (string, optional): Admin can request any employee's enrollment

**Response:**
```json
{
  "enrollment": {
    "employeeId": "string",
    "descriptor1": [...],
    "descriptor2": [...],
    "descriptor3": [...],
    "enrolledAt": "ISO8601",
    "modelVersion": "string"
  },
  "enrolled": true
}
```

**Roles Allowed:** AUTHENTICATED (Admin can request others)

---

### DELETE /attendance/face/enrollment/:employeeId
**Description:** Delete face enrollment (force re-enrollment)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Face enrollment deleted. Employee must re-enroll."
}
```

**Roles Allowed:** SUPER_ADMIN

---

## Customer Management Endpoints

### GET /customers
**Description:** List customers with filters

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number, optional): Maximum results (default: 100)
- `city` (string, optional): Filter by city
- `amcStatus` (string, optional): Filter by AMC status
- `status` (string, optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "customerCode": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "city": "string",
      "state": "string",
      "address": "string",
      "systemSizeKw": "number",
      "installationDate": "ISO8601",
      "inverterBrand": "string",
      "inverterModel": "string",
      "amcStatus": "string",
      "amcExpiryDate": "ISO8601",
      "status": "string"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### GET /customers/:customerId
**Description:** Get customer details

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": { /* Full Customer object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /customers
**Description:** Create new customer

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customerCode": "string",
  "fullName": "string",
  "email": "string",
  "phoneNumber": "string",
  "city": "string",
  "state": "string",
  "address": "string",
  "systemSizeKw": "number",
  "installationDate": "ISO8601",
  "inverterBrand": "string",
  "inverterModel": "string",
  "amcStatus": "string",
  "amcExpiryDate": "ISO8601"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created Customer object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /customers/:customerId
**Description:** Update customer

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Partial customer object

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Customer object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### DELETE /customers/:customerId
**Description:** Delete customer

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### GET /subadmin/customers/:customerId/summary
**Description:** Get customer summary with inverter data

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": { /* Customer object */ },
    "inverterGeneration": { /* Inverter generation data */ },
    "amcStatus": "string",
    "tasks": [{ /* Recent tasks */ }],
    "invoices": [{ /* Recent invoices */ }]
  }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /subadmin/customers/:customerId
**Description:** Update customer credentials (inverter login details)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "inverterLoginId": "string",
  "inverterPassword": "string",
  "inverterApiKey": "string",
  "inverterDeviceSn": "string",
  "monitoringPlantId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Customer object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /subadmin/customers/bulk-import
**Description:** Bulk import customers from Excel

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "data": [
    {
      "customerCode": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "city": "string",
      "address": "string",
      "systemSizeKw": "number",
      "installationDate": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Imported X customers successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### GET /subadmin/customers/export
**Description:** Export customers to Excel

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="customers_export.xlsx"
<Excel file>
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

## Employee Management Endpoints

### GET /users/internal
**Description:** List internal users (employees, admins)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` (string, optional): Filter by role
- `limit` (number, optional): Maximum results (default: 300)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "loginId": "string",
      "email": "string",
      "fullName": "string",
      "role": "string",
      "employeeProfile": {
        "jobRole": "string",
        "zone": "string"
      }
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### GET /subadmin/employees
**Description:** List employees

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "loginId": "string",
      "email": "string",
      "fullName": "string",
      "role": "string",
      "employeeProfile": { /* EmployeeProfile object */ }
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### POST /subadmin/employees
**Description:** Create employee

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "loginId": "string",
  "email": "string",
  "phoneNumber": "string",
  "fullName": "string",
  "password": "string",
  "role": "string",
  "jobRole": "string",
  "zone": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created Employee object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### PATCH /subadmin/employees/:employeeId
**Description:** Update employee

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Partial employee object

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Employee object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### DELETE /subadmin/employees/:employeeId
**Description:** Delete employee

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### POST /subadmin/employees/bulk-import
**Description:** Bulk import employees from Excel

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "data": [
    {
      "loginId": "string",
      "email": "string",
      "phoneNumber": "string",
      "fullName": "string",
      "jobRole": "string",
      "zone": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Imported X employees successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

## AMC Management Endpoints

### GET /subadmin/amc/customers
**Description:** Get customers with AMC details

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "customerCode": "string",
      "fullName": "string",
      "amcStatus": "string",
      "amcExpiryDate": "ISO8601",
      "cleaningWindow1": "string",
      "cleaningWindow2": "string",
      "cleaningWindow3": "string",
      "cleaningsPerMonth": "number"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /subadmin/customers/:customerId/amc-settings
**Description:** Update AMC settings for a customer

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amcStatus": "string",
  "amcExpiryDate": "ISO8601",
  "cleaningWindow1": "string",
  "cleaningWindow2": "string",
  "cleaningWindow3": "string",
  "cleaningsPerMonth": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated Customer object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /subadmin/apartments/:apartmentId/amc-settings
**Description:** Bulk update AMC settings for all customers in an apartment

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Same as individual AMC settings

**Response:**
```json
{
  "success": true,
  "message": "Updated X customers successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### GET /subadmin/amc-visits
**Description:** List AMC visits

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `customerId` (number, optional): Filter by customer
- `status` (string, optional): Filter by status
- `from` (string, optional): Start date (ISO8601)
- `to` (string, optional): End date (ISO8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "customerId": "number",
      "scheduledDate": "ISO8601",
      "status": "string",
      "assignedEmployeeId": "string",
      "completedAt": "ISO8601",
      "notes": "string",
      "beforeImageUrl": "string",
      "afterImageUrl": "string",
      "customer": { /* Customer object */ }
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /subadmin/amc-visits
**Description:** Create AMC visit

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customerId": "number",
  "scheduledDate": "ISO8601",
  "assignedEmployeeId": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created AmcVisit object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /subadmin/amc-visits/:visitId
**Description:** Update AMC visit

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "scheduledDate": "ISO8601",
  "assignedEmployeeId": "string",
  "status": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated AmcVisit object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /subadmin/amc-visits/:visitId/complete
**Description:** Mark AMC visit as completed

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "string",
  "visitNotes": "string",
  "beforeImageUrl": "string",
  "afterImageUrl": "string",
  "sitePhotos": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated AmcVisit object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

## Inverter Data Endpoints

### GET /subadmin/customers/:customerId/inverter-generation
**Description:** Get real-time inverter generation data

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "number",
    "inverterBrand": "string",
    "totalGeneration": "number",
    "dailyGeneration": "number",
    "peakPower": "number",
    "currentPower": "number",
    "status": "string", // "online" or "offline"
    "isSimulated": "boolean",
    "lastUpdated": "ISO8601"
  }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, CUSTOMER

---

### GET /subadmin/customers/:customerId/inverter-generation-history
**Description:** Get historical inverter generation data

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (string, optional): "daily", "monthly", "yearly", "realtime" (default: "daily")
- `date` (string, optional): Specific date for daily history

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "string",
    "history": [
      {
        "date": "string",
        "label": "string",
        "generation": "number"
      }
    ]
  }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, CUSTOMER

---

## Service Request Endpoints

### GET /subadmin/service-requests
**Description:** List service requests (complaints)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string, optional): Filter by status
- `customerId` (number, optional): Filter by customer
- `limit` (number, optional): Maximum results (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "number",
        "customerId": "number",
        "customerName": "string",
        "title": "string",
        "description": "string",
        "status": "string",
        "scheduledDate": "ISO8601",
        "scheduledTime": "string",
        "address": "string",
        "latitude": "number",
        "longitude": "number",
        "createdAt": "ISO8601"
      }
    ],
    "pagination": {
      "total": "number",
      "limit": "number",
      "offset": "number"
    }
  }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### PATCH /subadmin/service-requests/:requestId
**Description:** Update service request

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "string", // PENDING, SCHEDULED, COMPLETED, CANCELLED
  "scheduledDate": "ISO8601",
  "scheduledTime": "string",
  "assignedEmployeeId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated ServiceRequest object */ },
  "message": "Service request updated successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

## Inventory Management Endpoints

### GET /inventory
**Description:** List inventory items

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "sku": "string",
      "name": "string",
      "category": "string",
      "inStock": "number",
      "minThreshold": "number",
      "supplier": "string",
      "pricePerUnit": "number",
      "entryDate": "ISO8601"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /inventory
**Description:** Create inventory item

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sku": "string",
  "name": "string",
  "category": "string",
  "inStock": "number",
  "minThreshold": "number",
  "supplier": "string",
  "pricePerUnit": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created InventoryItem object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### PATCH /inventory/:id
**Description:** Update inventory item

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Partial inventory object

**Response:**
```json
{
  "success": true,
  "data": { /* Updated InventoryItem object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### DELETE /inventory/:id
**Description:** Delete inventory item

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory item deleted successfully"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

### GET /inventory/dispatches/all
**Description:** List all dispatch records

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "customerId": "number",
      "itemId": "number",
      "quantity": "number",
      "dispatchedAt": "ISO8601",
      "notes": "string",
      "customer": { /* Customer object */ },
      "item": { /* InventoryItem object */ }
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /inventory/dispatches
**Description:** Create dispatch record

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customerId": "number",
  "itemId": "number",
  "quantity": "number",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created DispatchRecord object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

## Financial Management Endpoints

### GET /invoices
**Description:** List invoices

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `customerId` (number, optional): Filter by customer
- `invoiceType` (string, optional): Filter by type
- `paymentStatus` (string, optional): Filter by payment status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "invoiceNumber": "string",
      "customerId": "number",
      "invoiceType": "string",
      "amount": "number",
      "paymentStatus": "string",
      "amountPaid": "number",
      "invoiceDate": "ISO8601",
      "paymentDate": "ISO8601",
      "zone": "string",
      "state": "string",
      "partnerId": "string"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, TEAM_LEAD, DEPARTMENT_HEAD

---

### POST /invoices
**Description:** Create invoice

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customerId": "number",
  "invoiceType": "string",
  "amount": "number",
  "description": "string",
  "zone": "string",
  "state": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created Invoice object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, SUB_ADMIN

---

## Notification Endpoints

### GET /employee/notifications
**Description:** Get employee notifications

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "type": "string",
      "message": "string",
      "imageUrl": "string",
      "read": "boolean",
      "createdAt": "ISO8601"
    }
  ]
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### GET /employee/notifications/unread-count
**Description:** Get unread notification count

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": "number"
  }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### POST /employee/notifications/:notificationId/read
**Description:** Mark notification as read

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### GET /attendance/admin/notifications
**Description:** Get admin notifications

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "string",
      "message": "string",
      "imageUrl": "string",
      "read": "boolean",
      "createdAt": "ISO8601"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, TEAM_LEAD, SUB_ADMIN

---

### POST /attendance/admin/notifications/read-all
**Description:** Mark all admin notifications as read

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": "number"
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, TEAM_LEAD, SUB_ADMIN

---

## Daily Commit Endpoints

### GET /daily-commits/mine
**Description:** Get my daily commits

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "employeeId": "string",
      "commitDate": "ISO8601",
      "taskWorkedOn": "string",
      "workSummary": "string",
      "hoursSpent": "number",
      "issuesBlockers": "string",
      "tomorrowPlan": "string",
      "attachmentUrl": "string",
      "submittedAt": "ISO8601"
    }
  ]
}
```

**Roles Allowed:** AUTHENTICATED

---

### POST /daily-commits
**Description:** Create daily commit

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "taskWorkedOn": "string",
  "workSummary": "string",
  "hoursSpent": "number",
  "issuesBlockers": "string",
  "tomorrowPlan": "string",
  "attachmentUrl": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created DailyCommit object */ }
}
```

**Roles Allowed:** AUTHENTICATED

---

## Work Submission Endpoints

### POST /employee/submissions
**Description:** Submit work

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "hoursSpent": "number",
  "taskId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Work submission successfully recorded."
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### POST /attendance/work-submissions
**Description:** Submit work with proof

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "proofUrl": "string",
  "proofNotes": "string",
  "hoursSpent": "number",
  "taskId": "number"
}
```

**Response:**
```json
{
  "success": true,
  "submission": { /* Created WorkSubmission object */ }
}
```

**Roles Allowed:** EMPLOYEE, SUB_ADMIN

---

### GET /attendance/work-submissions
**Description:** Get work submissions

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `employeeId` (string, optional): Filter by employee

**Response:**
```json
{
  "submissions": [
    {
      "id": "string",
      "employeeId": "string",
      "taskId": "number",
      "title": "string",
      "description": "string",
      "proofUrl": "string",
      "proofNotes": "string",
      "hoursSpent": "number",
      "status": "string",
      "submittedAt": "ISO8601",
      "reviewedAt": "ISO8601",
      "reviewedBy": "string",
      "reviewScore": "number",
      "reviewNotes": "string",
      "employee": { /* User object */ },
      "task": { /* Task object */ }
    }
  ]
}
```

**Roles Allowed:** AUTHENTICATED

---

### PATCH /attendance/admin/work-submissions/:id/review
**Description:** Review work submission

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "string", // PENDING, APPROVED, REJECTED, REVISION
  "reviewScore": "number",
  "reviewNotes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "submission": { /* Updated WorkSubmission object */ }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, TEAM_LEAD, SUB_ADMIN

---

## Admin Dashboard Endpoints

### GET /admin/dashboard
**Description:** Get admin dashboard statistics

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": "number",
    "totalEmployees": "number",
    "activeTasks": "number",
    "completedTasks": "number",
    "totalRevenue": "number",
    "monthlyRevenue": "number",
    "pendingServiceRequests": "number",
    "amcCustomers": "number"
  }
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN

---

## User Settings Endpoints

### GET /users/me/settings
**Description:** Get user settings

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "string",
    "language": "string",
    "notifications": {
      "email": "boolean",
      "push": "boolean",
      "sms": "boolean"
    }
  }
}
```

**Roles Allowed:** AUTHENTICATED

---

### POST /users/me/settings
**Description:** Update user settings

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** Partial settings object

**Response:**
```json
{
  "success": true,
  "data": { /* Updated UserSettingsDto object */ }
}
```

**Roles Allowed:** AUTHENTICATED

---

## Health Check

### GET /health
**Description:** Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "ISO8601"
}
```

**Roles Allowed:** PUBLIC

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "string",
  "message": "string"
}
```

### Common HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - External service error (e.g., inverter API)
- `503 Service Unavailable` - Service temporarily unavailable

---

## Rate Limiting

API endpoints may be rate-limited. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1692873600
```

---

## Pagination

List endpoints support pagination via `limit` and `offset` query parameters. Default limit is 50, maximum limit varies by endpoint.

---

## Date/Time Format

All date/time fields use ISO8601 format:
```
2024-01-15T10:30:00.000Z
```

---

## File Upload

File uploads use:
- **Base64 encoding** for images (recommended for mobile)
- **Multipart form data** for larger files (web)

Supported image formats:
- JPEG/JPG
- PNG
- GIF
- WEBP

Maximum file size: 10MB

---

## R2 Storage

Images are stored in Cloudflare R2 with the following object key structure:
```
tasks/{taskType}/{customerName}/{taskId}/{type}/{uuid}.{ext}
```

Example:
```
tasks/amc_cleaning/john-doe/123/before/abc123.jpg
tasks/site_visit/jane-smith/456/site-visit/def456.jpg
```

Presigned URLs are generated for temporary access (7-day expiry).

---

## Role Hierarchy

```
SUPER_ADMIN
  └─ ADMIN
      └─ SUB_ADMIN
          ├─ DEPARTMENT_HEAD
          │   └─ TEAM_LEAD
          │       └─ EMPLOYEE
          └─ EMPLOYEE
```

Additional roles:
- **CUSTOMER** - Customer portal access
- **PARTNER** - Partner portal access
