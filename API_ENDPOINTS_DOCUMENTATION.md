# API Endpoint Reference

This document describes the HTTP API provided by the Swayog Dashboard backend.
Unless a section says otherwise, paths below are relative to the `/api/v1`
prefix. For example, `POST /auth/login` is available at
`POST /api/v1/auth/login`.

Protected endpoints require an access token in the
`Authorization: Bearer <access-token>` header. Request bodies are JSON unless
the endpoint documents a file upload. Responses use JSON; authentication
responses are wrapped in a `data` property.

## Authentication Endpoints

Base path: `/api/v1/auth`

### POST /auth/register

Register a customer account. This route is public; `role` may be omitted and,
if supplied, must be `CUSTOMER`.

**Request body:**

```json
{
  "fullName": "Example Customer",
  "email": "customer@example.com",
  "phoneNumber": "1234567890",
  "password": "replace-with-a-secure-password",
  "role": "CUSTOMER"
}
```

`phoneNumber` and `role` are optional. `password` must contain at least eight
characters. A successful response has status `201` and returns the session
under `data`.

### POST /auth/login

Log in with the user's identifier, password, and assigned role.

**Request body:**

```json
{
  "identifier": "user@example.com",
  "password": "replace-with-a-secure-password",
  "role": "EMPLOYEE"
}
```

`identifier` may be the account's supported login identifier. A successful
response returns the access token, refresh token, and user under `data`.

### POST /auth/refresh

Exchange a refresh token for a new session.

**Request body:**

```json
{
  "refreshToken": "string"
}
```

The refreshed session is returned under `data`.

**Roles Allowed:** PUBLIC

---

### POST /auth/logout

Invalidate a refresh token. This route does not require an access token.

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Response:**

```json
{
  "data": {
    "success": true
  }
}
```

**Roles Allowed:** PUBLIC (valid refresh token required)

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
  "data": {
    "success": true
  }
}
```

**Roles Allowed:** AUTHENTICATED

---

## Customer Onboarding Endpoints

Base path: `/api/v1/onboarding`

All routes require an access token. Admin, super-admin, and sub-admin users
manage onboarding records; employees can read requests and submit surveys.
Project Coordinators can create site visits. Conversion approval is limited to
admins and super admins. Marketing Executive employees can create requests.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/stats` | Onboarding dashboard counts (management roles). |
| `GET` | `/requests` | List requests; supports `stage`, `search`, `assignedEmployeeId`, `offset`, and `limit`. |
| `POST` | `/requests` | Create an onboarding request (management roles and Marketing Executive). |
| `GET` | `/requests/:id` | Get a request and its details. |
| `PATCH` | `/requests/:id` | Update request details. |
| `PATCH` | `/requests/:id/stage` | Change the workflow stage. |
| `POST` | `/requests/:id/approve-conversion` | Approve conversion into a customer (admin or super admin). |
| `POST` | `/site-visits` | Schedule a visit (management roles or Project Coordinator). |
| `PATCH` | `/site-visits/:id` | Update visit details. |
| `POST` | `/site-visits/:id/submit-survey` | Submit a survey. |
| `POST` | `/site-visits/:id/review` | Review a submitted survey. |
| `POST` | `/site-visits/:id/images` | Upload a survey image (`multipart/form-data`, field `image`). |
| `GET` | `/site-visits/:id/images` | List survey images. |
| `POST` | `/quotations` | Create a quotation. |
| `PATCH` | `/quotations/:id` | Update a quotation. |

Use the stage values `NEW_REQUEST`, `INITIAL_REVIEW`, `SITE_VISIT_PENDING`,
`SITE_VISIT_SCHEDULED`, `SITE_VISIT_COMPLETED`, `QUOTATION_DRAFT`,
`QUOTATION_REVIEW`, `QUOTATION_SENT`, `CUSTOMER_DECISION_PENDING`,
`ONBOARDING_APPROVAL`, `APPROVED_CONVERTED`, and `REJECTED_CANCELLED`.

---

## Marketing Endpoints

Base path: `/api/v1/marketing`

All endpoints require a valid access token. `ADMIN`, `SUPER_ADMIN`, and
`SUB_ADMIN` users can manage marketing data. Marketing Executive employees can
also manage it. Project Coordinators, Liaisoning employees, and Monitoring
Analysts have read-only access to the lead list.

### GET /leads

List marketing leads. The response is `{ "data": [/* lead records */] }`.

### POST /leads

Create a marketing lead.

**Request Body:**

```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "source": "Website | Campaign | Referral | Partner | Other"
}
```

`email` and `address` are optional. The response is `201 Created` with the created record in `data`.

### POST /leads/bulk

Bulk-import marketing leads. The request body and import limits are validated
by the API.

### PATCH /leads/:id

Update lead fields. All fields are optional.

```json
{
  "status": "New | Contacted | Qualified | Converted | Disqualified",
  "assignedTo": "string or null",
  "followUpAt": "string or null",
  "address": "string or null"
}
```

### DELETE /leads/:id

Soft-delete a lead. Supply a deletion remark of at least three characters:

```json
{
  "remark": "Duplicate record"
}
```

### GET /deleted-leads

List deleted marketing leads.

### POST /deleted-leads/:id/restore

Restore a deleted lead.

### GET /campaigns

List marketing campaigns.

### POST /campaigns

Create a campaign with `name`, `channel`, and `budget`; optional `startDate` is a string.

### PATCH /campaigns/:id

Update campaign status (`Planned`, `Active`, or `Completed`).

### GET /follow-ups

List marketing follow-ups.

### POST /follow-ups

Create a follow-up with `leadId`, `date`, and `note`.

### PATCH /follow-ups/:id

Update follow-up completion with `{ "done": true }` or `{ "done": false }`.

### POST /workspace/import

Bulk-import existing workspace records (used to migrate browser-stored data).
The JSON body may include `leads`, `campaigns`, and `followUps` arrays. Limits
are 2,000 leads, 1,000 campaigns, and 2,000 follow-ups per request. Lead
entries support the same lead fields plus an `id`; campaigns and follow-ups
also require their record IDs. The response reports imported counts for each
array.

Excel parsing, row validation, template download, and lead export are frontend features. Uploading an Excel file directly to this API is not supported.

---

## Android App Update Endpoints

The primary update endpoints are public and are mounted under
`/api/v1/app/update`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/app/update/latest.json` | Return the current Android release manifest as JSON. |
| `GET` | `/api/v1/app/update/download/latest` | Redirect to the latest APK download. |
| `GET` | `/api/v1/app/update/releases/android/:versionName/build-:versionCode/app-release.apk` | Redirect to a specific version's APK download. |

The manifest includes the app ID, platform, version code and name, mandatory
update flag, release notes, APK URL, and SHA-256 checksum. If no authoritative
manifest is available, the manifest route returns `503`. The download routes
return a redirect when R2 is configured; otherwise they return an error.

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

### GET /attendance/admin/team-attendance

**Description:** Get monthly attendance percentages for employees and sub-admins

**Request Headers:**

```
Authorization: ******
```

**Query Parameters:**

- `month` (number, optional): Month (1-12, default: current)
- `year` (number, optional): Year (default: current)

**Response:**

```json
{
  "snapshots": [
    {
      "employeeId": "string",
      "attendancePercent": "number"
    }
  ]
}
```

**Roles Allowed:** SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, TEAM_LEAD, SUB_ADMIN

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

All finance endpoints require a bearer access token. The finance API resolves the caller's current finance role and permissions from the database for each request; UI visibility is not an authorization boundary.

Base paths below are relative to `/api/v1`.

### Finance access levels

- `SUPER_ADMIN` and `ADMIN` have finance oversight.
- Finance employees are recognized by a finance designation (`Finance Executive`, `Accountant`, `Finance Manager`, `Finance Head`, and supported equivalent titles) and, when assigned, the `FINANCE` department. Finance executives can view operational finance data, create/update invoices, and view commissions. Finance managers and heads can also delete invoices, approve commission payouts, and view company P&L.
- A manager's commission approval limit is `FINANCE_MANAGER_APPROVAL_LIMIT_INR` (default ₹100,000). Higher amounts require a finance head or admin.
- Approvers cannot approve transactions they created or payments to themselves.
- Service Coordinators can view AMC records and list/create/update AMC invoices only. Customers see their own invoices, and partners see invoices and payouts scoped to their own customers.

The finance access endpoint reports the caller's resolved level and capabilities:

### GET /financials/me

Returns `level`, `permissions`, `isServiceCoordinator`, `managerApprovalLimit`, and `canApproveAboveManagerLimit` for the authenticated caller.

### Finance dashboard and reporting

All reporting endpoints accept optional `from` and `to` date query parameters (ISO date or datetime). `to` dates supplied as `YYYY-MM-DD` include the full day.

| Method and path | Description | Access |
| --- | --- | --- |
| `GET /financials/summary` | Invoice-based invoiced revenue, collected amount, outstanding balance, collection rate, and separately identified estimated pipeline value. | Finance dashboard permission |
| `GET /financials/zones` | Revenue and customer counts by zone, with comparison-period growth. | Finance dashboard permission |
| `GET /financials/pnl` | Monthly revenue, commissions, finalized salary costs, other expenses, profit, margin, and trend. | Finance manager, head, or admin |
| `GET /financials/customer-ledger` | Customer invoicing, collections, receivables, and unbilled contract amounts. | Finance dashboard permission |
| `GET /financials/vendor-payables` | Supplier purchases, partner commission payables, payroll totals, and expenses. | Finance dashboard permission |
| `GET /financials/amc` | Active AMC contracts. | Finance dashboard permission or Service Coordinator |
| `GET /financials/payouts` | Partner commission payout status; partners receive only their own data. | Finance commission-view permission or partner |

### Expenses and commissions

| Method and path | Description | Access |
| --- | --- | --- |
| `GET /financials/expenses` | List expenses; supports optional `from` and `to`. | Finance dashboard permission |
| `POST /financials/expenses` | Record an expense using `category`, positive `amount`, and optional `expenseDate`, `zone`, and `notes`. | Finance invoice-create permission |
| `POST /financials/commissions/:customerId/confirm` | Confirm a partner commission payment. Submit the payment proof as multipart form field `proof`. | Finance manager/head/admin, subject to approval limits and maker-checker rules |

### Invoice management

Invoices use the `/invoices` base path. List filters are optional `customerId`, `invoiceType` (`installation`, `amc`, `repair`, `service`, or `other`), `from`, and `to`. Results are row-scoped: finance staff can see all invoices, Service Coordinators only AMC invoices, customers their own invoices, and partners invoices for their customers.

### GET /invoices

Returns invoices with customer name/code, payment status, date, and outstanding amount.

---

### POST /invoices

Creates an invoice. Submit `customerId`, positive `amount`, and optional `invoiceType`, `invoiceNumber`, `description`, `date`, `status`, and `paymentMethod`. Accepts a `proof` upload as multipart form data (JPG, PNG, or PDF; maximum 5 MB). Finance staff with invoice-create permission can create invoices; Service Coordinators are limited to AMC invoices.

### PATCH /invoices/:id

Updates invoice fields `description`, `amount`, `status`, `amountPaid`, `dueDate`, and/or `invoiceNumber`. Finance staff with invoice-update permission can update invoices; Service Coordinators may update AMC invoices only.

### DELETE /invoices/:id

Deletes an invoice. Requires finance invoice-delete permission (finance manager/head or admin).

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
