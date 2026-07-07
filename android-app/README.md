# SWAYOG Employee Android Application

## Overview
Native Android application for SWAYOG employees that replicates the web dashboard functionality with mobile-optimized UI. Uses the same backend API and PostgreSQL database as the web application.

## Tech Stack
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM + Clean Architecture
- **Networking**: Retrofit + OkHttp
- **Local Storage**: Room Database (SQLite)
- **Dependency Injection**: Hilt
- **Async**: Coroutines + Flow
- **Image Loading**: Coil
- **Maps**: Google Maps SDK
- **Location**: Fused Location Provider
- **Camera**: CameraX
- **Biometrics**: BiometricPrompt API
- **Push Notifications**: Firebase Cloud Messaging (FCM)

## Features by Role

### Global Features (All Employees)
- **Authentication**: Email/Password & Mobile OTP login with biometric support
- **Geofenced Attendance**: GPS-verified check-in/out with selfie capture
- **Daily Commit Log**: End-of-day work reporting
- **Profile & Settings**: Employee profile management

### Role-Specific Features

#### 1. Service Coordinator (Sub-Admin)
- Customer list with city filters
- Live inverter generation metrics (Growatt, UTL/FoxESS, Waaree)
- Field crew map with technician locations
- Task assignment with geodistance sorting
- Calendar & scheduling for AMC visits
- Credential management for inverters

#### 2. Site Survey Engineer
- Route tracker dashboard
- Rooftop intake form (dimensions, roof type, shadow factors)
- Photo proof camera with GPS watermarks

#### 3. Solar Design Engineer
- Survey pipeline Kanban board
- Technical layout uploader
- Document attachments (CAD, SLD)

#### 4. Electrical Engineer
- Commissioning checklist
- SLD vector viewer
- Diagnostic sheets (earthing, megger, net-meter)

#### 5. Inventory Executive
- Stock overview with alerts
- QR/Barcode dispatch terminal
- Material request approvals

#### 6. O&M Technician
- AMC cleaning roster
- Inspection checklist
- Before/After geotag camera

#### 7. Service Engineer
- Complaint tickets list with priority
- Offline diagnostic toolkit
- Resolution form with digital signature

#### 8. Monitoring Analyst
- Generation alert dashboard
- Inverter remote control
- Action triggers for dispatch

#### 9. Intern
- Intern log dashboard
- Shadow entry form
- Mentor review feed

## Project Structure
```
android-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/swayog/employee/
│   │   │   │   ├── data/
│   │   │   │   │   ├── api/
│   │   │   │   │   ├── local/
│   │   │   │   │   ├── model/
│   │   │   │   │   └── repository/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── model/
│   │   │   │   │   ├── usecase/
│   │   │   │   │   └── repository/
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── attendance/
│   │   │   │   │   ├── tasks/
│   │   │   │   │   └── common/
│   │   │   │   └── di/
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## API Integration
- Base URL: Configured in `local.properties` or `BuildConfig`
- Authentication: JWT tokens stored in EncryptedSharedPreferences
- Endpoints: Same as web backend (`/api/v1/*`)

## Offline Support
- Room database for local data persistence
- WorkManager for background sync
- Outbox queue pattern for offline operations
- Automatic sync when network available

## Security
- Biometric authentication for quick login
- EncryptedSharedPreferences for sensitive data
- Certificate pinning for API calls
- ProGuard/R8 obfuscation

## Build Requirements
- Android SDK 34+
- Kotlin 1.9+
- Gradle 8.0+
- JDK 17

## Getting Started
1. Clone the repository
2. Open in Android Studio
3. Configure `local.properties` with API base URL
4. Build and run on emulator or device
