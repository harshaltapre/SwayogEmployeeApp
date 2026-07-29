# Software Requirements Specification (SRS)

**Project:** Swayog Employee App - Android  
**Version:** 2.0  
**Date:** July 2025  
**Prepared By:** Android Development Team

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the Swayog Employee Android application, focusing on the new features and enhancements implemented to achieve parity with the web application.

### 1.2 Scope
The scope includes employee task management features, admin dashboard capabilities, customer management, employee management, and inventory management systems.

### 1.3 Definitions
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete operations
- **MVVM**: Model-View-ViewModel architecture pattern
- **UI**: User Interface
- **JWT**: JSON Web Token for authentication

---

## 2. Overall Description

### 2.1 Product Perspective
The Android app is a mobile client for the Swayog Employee Management System, providing field employees and administrators with mobile access to core business functions.

### 2.2 Product Functions
- Task creation and management
- Task rating and feedback
- Invoice viewing
- Notification management
- Admin dashboard with analytics
- Customer management
- Employee management
- Inventory management

### 2.3 User Characteristics
- **Field Employees**: Use app for task management, notifications, and reporting
- **Administrators**: Use app for dashboard analytics, user management, and system oversight
- **Sub-Admins**: Use app for customer and employee management within their scope

### 2.4 Constraints
- Must work on Android 7.0 (API 24) and above
- Must support offline functionality
- Must sync with backend when connectivity is restored
- Must follow Material Design 3 guidelines
- Must support multiple screen sizes

---

## 3. Functional Requirements

### 3.1 Employee Features

#### 3.1.1 Task Creation
**FR-1.1.1:** The system shall allow employees to create new tasks with the following fields:
- Job type (dropdown selection)
- Description (text input)
- Customer name (text input)
- Customer phone number (text input with validation)
- Address (text input)
- GPS coordinates (automatic or manual)
- Scheduled time (date/time picker)
- Employee assignment (dropdown selection)

**FR-1.1.2:** The system shall validate required fields before task creation.
**FR-1.1.3:** The system shall display success/error messages after task creation.
**FR-1.1.4:** The system shall store created tasks locally for offline access.
**FR-1.1.5:** The system shall sync created tasks with backend when online.

#### 3.1.2 Task Rating
**FR-1.2.1:** The system shall allow employees to rate completed tasks on a scale of 1-5 stars.
**FR-1.2.2:** The system shall provide a comments field for task feedback.
**FR-1.2.3:** The system shall allow fix charges input for billing adjustments.
**FR-1.2.4:** The system shall update task status after rating.
**FR-1.2.5:** The system shall display rating history for completed tasks.

#### 3.1.3 Invoice Display
**FR-1.3.1:** The system shall display invoice details when viewing completed tasks.
**FR-1.3.2:** The system shall show invoice number, amount, and status.
**FR-1.3.3:** The system shall display invoice date and due date.
**FR-1.3.4:** The system shall indicate payment status (Paid/Pending/Overdue).
**FR-1.3.5:** The system shall cache invoice data for offline viewing.

#### 3.1.4 Notification Center
**FR-1.4.1:** The system shall display a list of all notifications.
**FR-1.4.2:** The system shall show unread count badge on notification icon.
**FR-1.4.3:** The system shall allow marking individual notifications as read.
**FR-1.4.4:** The system shall provide "mark all as read" functionality.
**FR-1.4.5:** The system shall support pull-to-refresh for notifications.
**FR-1.4.6:** The system shall filter notifications by type and priority.
**FR-1.4.7:** The system shall display notification timestamp and sender.

### 3.2 Admin Features

#### 3.2.1 Admin Dashboard
**FR-2.1.1:** The system shall display revenue trend chart (monthly).
**FR-2.1.2:** The system shall display installation trend chart (monthly).
**FR-2.1.3:** The system shall show jobs by zone distribution (pie chart).
**FR-2.1.4:** The system shall display key metrics cards:
  - Total revenue
  - Active customers
  - Pending tasks
  - Completed tasks
**FR-2.1.5:** The system shall allow date range filtering for analytics.
**FR-2.1.6:** The system shall provide interactive chart tooltips.
**FR-2.1.7:** The system shall support chart legend toggling.

#### 3.2.2 Customer Management
**FR-2.2.1:** The system shall allow deletion of customer records.
**FR-2.2.2:** The system shall require confirmation before customer deletion.
**FR-2.2.3:** The system shall export customer data to Excel format.
**FR-2.2.4:** The system shall import customer data from Excel files.
**FR-2.2.5:** The system shall validate Excel data format before import.
**FR-2.2.6:** The system shall display import success/error messages.
**FR-2.2.7:** The system shall sync customer changes with backend.

#### 3.2.3 Employee Management
**FR-2.3.1:** The system shall allow creation of new employee records.
**FR-2.3.2:** The system shall allow updating existing employee details.
**FR-2.3.3:** The system shall support employee role assignment.
**FR-2.3.4:** The system shall allow deletion of employee records.
**FR-2.3.5:** The system shall require confirmation before employee deletion.
**FR-2.3.6:** The system shall support bulk employee import from Excel.
**FR-2.3.7:** The system shall validate employee data before creation/update.
**FR-2.3.8:** The system shall display employee list with filtering options.

#### 3.2.4 Inventory Management
**FR-2.4.1:** The system shall display all inventory items with stock levels.
**FR-2.4.2:** The system shall allow creation of new inventory items.
**FR-2.4.3:** The system shall allow editing existing inventory items.
**FR-2.4.4:** The system shall support deletion of inventory items.
**FR-2.4.5:** The system shall require confirmation before item deletion.
**FR-2.4.6:** The system shall display low stock indicators (stock <= min threshold).
**FR-2.4.7:** The system shall support category-based filtering.
**FR-2.4.8:** The system shall track supplier information.
**FR-2.4.9:** The system shall manage price per unit information.
**FR-2.4.10:** The system shall support search functionality for inventory items.

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
**NFR-4.1.1:** The system shall load dashboard data within 3 seconds.
**NFR-4.1.2:** The system shall complete API calls within 5 seconds.
**NFR-4.1.3:** The system shall render lists with 100+ items within 2 seconds.
**NFR-4.1.4:** The system shall support offline mode with local data access.

### 4.2 Security Requirements
**NFR-4.2.1:** The system shall use JWT tokens for authentication.
**NFR-4.2.2:** The system shall encrypt sensitive data in local storage.
**NFR-4.2.3:** The system shall use HTTPS for all API communications.
**NFR-4.2.4:** The system shall implement role-based access control.
**NFR-4.2.5:** The system shall automatically refresh expired tokens.
**NFR-4.2.6:** The system shall not store passwords in plain text.

### 4.3 Reliability Requirements
**NFR-4.3.1:** The system shall handle network failures gracefully.
**NFR-4.3.2:** The system shall sync data when connectivity is restored.
**NFR-4.3.3:** The system shall not crash on invalid user input.
**NFR-4.3.4:** The system shall provide meaningful error messages.
**NFR-4.3.5:** The system shall maintain data consistency during sync.

### 4.4 Usability Requirements
**NFR-4.4.1:** The system shall follow Material Design 3 guidelines.
**NFR-4.4.2:** The system shall support multiple screen sizes (phones and tablets).
**NFR-4.4.3:** The system shall provide intuitive navigation.
**NFR-4.4.4:** The system shall support dark mode.
**NFR-4.4.5:** The system shall provide loading indicators for long operations.
**NFR-4.4.6:** The system shall support accessibility features.

### 4.5 Maintainability Requirements
**NFR-4.5.1:** The system shall follow MVVM architecture pattern.
**NFR-4.5.2:** The system shall use dependency injection.
**NFR-4.5.3:** The system shall have comprehensive code documentation.
**NFR-4.5.4:** The system shall have unit tests for critical components.
**NFR-4.5.5:** The system shall follow Kotlin coding conventions.

---

## 5. External Interface Requirements

### 5.1 User Interfaces
**UI-5.1.1:** Task creation dialog with form validation.
**UI-5.1.2:** Task rating dialog with star rating and comments.
**UI-5.1.3:** Notification list with unread indicators.
**UI-5.1.4:** Admin dashboard with charts and metrics.
**UI-5.1.5:** Customer management list with actions.
**UI-5.1.6:** Employee management list with CRUD operations.
**UI-5.1.7:** Inventory management list with stock indicators.

### 5.2 Hardware Interfaces
**HI-5.2.1:** GPS for location services.
**HI-5.2.2:** Camera for photo capture.
**HI-5.2.3:** File system for Excel import/export.
**HI-5.2.4:** Network for API communication.

### 5.3 Software Interfaces
**SI-5.3.1:** REST API for backend communication.
**SI-5.3.2:** Room database for local storage.
**SI-5.3.3:** Retrofit for network requests.
**SI-5.3.4:** Gson for JSON serialization.

### 5.4 Communication Interfaces
**CI-5.4.1:** HTTPS for secure API communication.
**CI-5.4.2:** WebSocket for real-time updates (future).
**CI-5.4.3:** Push notifications (future).

---

## 6. System Features

### 6.1 Task Management System
**SF-6.1.1:** Create tasks with comprehensive details.
**SF-6.1.2:** Rate completed tasks with feedback.
**SF-6.1.3:** View task invoices and billing information.
**SF-6.1.4:** Track task status and progress.

### 6.2 Notification System
**SF-6.2.1:** Receive and display system notifications.
**SF-6.2.2:** Manage notification read status.
**SF-6.2.3:** Filter and search notifications.
**SF-6.2.4:** Configure notification preferences.

### 6.3 Analytics Dashboard
**SF-6.3.1:** View revenue trends and analytics.
**SF-6.3.2:** Monitor installation statistics.
**SF-6.3.3:** Track task distribution by zone.
**SF-6.3.4:** Filter analytics by date range.

### 6.4 Customer Management
**SF-6.4.1:** Create and update customer records.
**SF-6.4.2:** Delete customers with confirmation.
**SF-6.4.3:** Import/export customer data.
**SF-6.4.4:** Search and filter customers.

### 6.5 Employee Management
**SF-6.5.1:** Create and manage employee accounts.
**SF-6.5.2:** Assign roles and permissions.
**SF-6.5.3:** Track employee performance.
**SF-6.5.4:** Bulk import employee data.

### 6.6 Inventory Management
**SF-6.6.1:** Track inventory levels and stock.
**SF-6.6.2:** Manage inventory items and categories.
**SF-6.6.3:** Monitor low stock alerts.
**SF-6.6.4:** Track supplier information.

---

## 7. Data Requirements

### 7.1 Data Entities
**DE-7.1.1:** Task (id, type, description, customer, status, etc.)
**DE-7.1.2:** Invoice (id, number, amount, status, dates)
**DE-7.1.3:** Notification (id, title, message, read status, timestamp)
**DE-7.1.4:** Customer (id, name, contact, address, etc.)
**DE-7.1.5:** Employee (id, name, role, department, etc.)
**DE-7.1.6:** InventoryItem (id, sku, name, stock, price, etc.)

### 7.2 Data Storage
**DS-7.2.1:** Local database using Room.
**DS-7.2.2:** Remote API for cloud storage.
**DS-7.2.3:** DataStore for user preferences.
**DS-7.2.4:** File system for Excel files.

### 7.3 Data Synchronization
**DYS-7.3.1:** Automatic sync when online.
**DYS-7.3.2:** Conflict resolution for concurrent updates.
**DYS-7.3.3:** Data validation before sync.
**DYS-7.3.4:** Sync status indicators.

---

## 8. Security Requirements

### 8.1 Authentication
**SR-8.1.1:** JWT-based authentication.
**SR-8.1.2:** Automatic token refresh.
**SR-8.1.3:** Secure token storage.
**SR-8.1.4:** Session timeout handling.

### 8.2 Authorization
**SR-8.2.1:** Role-based access control.
**SR-8.2.2:** Permission checking for sensitive operations.
**SR-8.2.3:** Admin-only features protection.
**SR-8.2.4:** Sub-admin scope limitations.

### 8.3 Data Protection
**SR-8.3.1:** Encryption of sensitive data.
**SR-8.3.2:** Secure API communication.
**SR-8.3.3:** Input validation and sanitization.
**SR-8.3.4:** SQL injection prevention.

---

## 9. Testing Requirements

### 9.1 Unit Testing
**TR-9.1.1:** Test all ViewModel functions.
**TR-9.1.2:** Test repository methods.
**TR-9.1.3:** Test data model serialization.
**TR-9.1.4:** Test utility functions.

### 9.2 Integration Testing
**TR-9.2.1:** Test API integration.
**TR-9.2.2:** Test database operations.
**TR-9.2.3:** Test sync functionality.
**TR-9.2.4:** Test error handling.

### 9.3 UI Testing
**TR-9.3.1:** Test screen navigation.
**TR-9.3.2:** Test form validation.
**TR-9.3.3:** Test user interactions.
**TR-9.3.4:** Test responsive layouts.

### 9.4 Performance Testing
**TR-9.4.1:** Test load times.
**TR-9.4.2:** Test memory usage.
**TR-9.4.3:** Test battery consumption.
**TR-9.4.4:** Test network performance.

---

## 10. Deployment Requirements

### 10.1 Build Requirements
**DR-10.1.1:** Support debug and release builds.
**DR-10.1.2:** Code obfuscation for release builds.
**DR-10.1.3:** APK signing with release keys.
**DR-10.1.4:** Version management.

### 10.2 Distribution
**DR-10.2.1:** Google Play Store distribution.
**DR-10.2.2:** Internal testing distribution.
**DR-10.2.3:** Beta testing program.
**DR-10.2.4:** Update mechanism.

---

## 11. Maintenance Requirements

### 11.1 Code Maintenance
**MR-11.1.1:** Regular code reviews.
**MR-11.1.2:** Dependency updates.
**MR-11.1.3:** Bug fixing process.
**MR-11.1.4:** Feature enhancement process.

### 11.2 Documentation Maintenance
**MR-11.2.1:** Update documentation with changes.
**MR-11.2.2:** Maintain API documentation.
**MR-11.2.3:** Update user guides.
**MR-11.2.4:** Maintain change logs.

---

## 12. Appendix

### 12.1 Glossary
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **MVVM**: Model-View-ViewModel
- **REST**: Representational State Transfer
- **UI**: User Interface

### 12.2 References
- Android Developer Documentation
- Material Design Guidelines
- Kotlin Documentation
- Jetpack Compose Documentation

### 12.3 Change History
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 2025 | Initial SRS | Dev Team |
| 2.0 | Jul 2025 | Added new features | Dev Team |

---

**Document Version:** 2.0  
**Last Updated:** July 29, 2025  
**Approved By:** Project Manager  
**Maintained By:** Android Development Team
