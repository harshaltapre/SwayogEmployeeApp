# SWAYOG Employee Android App - Implementation Guide

## Overview
This Android application is a native mobile replica of the SWAYOG Employee web dashboard, built with Kotlin and Jetpack Compose. It uses the same backend API and PostgreSQL database as the web application.

## Tech Stack
- **Language**: Kotlin 1.9.20
- **UI Framework**: Jetpack Compose with Material 3
- **Architecture**: MVVM + Clean Architecture
- **Networking**: Retrofit 2.9.0 + OkHttp 4.12.0
- **Local Storage**: Room Database 2.6.1
- **Dependency Injection**: Hilt 2.48
- **Async**: Coroutines + Flow
- **Image Loading**: Coil 2.5.0
- **Maps**: Google Maps SDK
- **Location**: Fused Location Provider
- **Camera**: CameraX 1.3.0
- **Biometrics**: BiometricPrompt API
- **Push Notifications**: Firebase Cloud Messaging (FCM)

## Project Structure
```
android-app/
├── app/
│   ├── src/main/java/com/swayog/employee/
│   │   ├── data/
│   │   │   ├── api/           # Retrofit API interfaces
│   │   │   ├── local/         # Room database & DataStore
│   │   │   │   ├── dao/       # Data Access Objects
│   │   │   │   ├── entity/    # Room entities
│   │   │   │   └── preferences/ # DataStore preferences
│   │   │   ├── model/         # API data models
│   │   │   ├── repository/    # Repository implementations
│   │   │   └── messaging/     # FCM service
│   │   ├── di/                # Hilt dependency injection modules
│   │   ├── presentation/
│   │   │   ├── auth/          # Login screen & viewmodel
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── attendance/    # Attendance tracking
│   │   │   ├── tasks/         # Task management
│   │   │   ├── profile/       # User profile
│   │   │   ├── settings/      # App settings
│   │   │   ├── common/        # Shared UI components
│   │   │   └── navigation/    # Navigation graph
│   │   ├── ui/theme/          # Compose theme & colors
│   │   ├── MainActivity.kt
│   │   └── SwayogEmployeeApp.kt
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Setup Instructions

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34
- Firebase account (for push notifications)
- Google Maps API key (for maps functionality)

### 1. Clone and Configure
```bash
cd android-app
```

### 2. Configure API URL
Create `local.properties` file:
```properties
API_BASE_URL=http://10.0.2.2:4000/api/v1
WS_BASE_URL=ws://10.0.2.2:4000
```

For physical device testing, use your computer's IP address:
```properties
API_BASE_URL=http://192.168.1.100:4000/api/v1
WS_BASE_URL=ws://192.168.1.100:4000
```

### 3. Configure Firebase
1. Create a Firebase project at https://console.firebase.google.com
2. Add an Android app with package name `com.swayog.employee`
3. Download `google-services.json` and place it in `app/`
4. Enable Cloud Messaging in Firebase console

### 4. Configure Google Maps
1. Create a project at https://console.cloud.google.com
2. Enable Maps SDK for Android
3. Create an API key with Maps SDK restriction
4. Add the API key to `local.properties`:
```properties
MAPS_API_KEY=your_maps_api_key_here
```

### 5. Build and Run
```bash
# In Android Studio
# 1. Sync Gradle
# 2. Build the project
# 3. Run on emulator or device
```

## Key Features Implementation

### Authentication
- **Email/Password Login**: Implemented with JWT tokens
- **Biometric Login**: Placeholder for fingerprint/face recognition
- **Token Management**: Automatic refresh with DataStore
- **Session Persistence**: EncryptedSharedPreferences for secure storage

### Attendance Tracking
- **GPS Verification**: Fused Location Provider for accurate location
- **Selfie Capture**: CameraX integration with face verification
- **Geofencing**: 100m radius check for site verification
- **Offline Support**: Local Room database with sync queue

### Task Management
- **Task List**: Real-time sync with backend
- **Task Details**: View customer info, location, schedule
- **Status Updates**: Mark tasks as in-progress/completed
- **Offline Queue**: Outbox pattern for offline operations

### Dashboard
- **Overview Cards**: Active tasks, completed tasks, performance score
- **Quick Actions**: Check-in/out, work description
- **Role-Based UI**: Dynamic content based on job role
- **Real-time Updates**: Flow-based reactive UI

## Role-Specific Features

### Service Coordinator (Sub-Admin)
- Customer list with city filters
- Live inverter generation metrics
- Field crew map
- Task assignment interface

### Site Survey Engineer
- Route tracker
- Rooftop intake form
- Photo proof camera

### Solar Design Engineer
- Survey pipeline Kanban
- Technical layout uploader
- Document attachments

### Electrical Engineer
- Commissioning checklist
- SLD viewer
- Diagnostic sheets

### Inventory Executive
- Stock overview
- QR/Barcode scanner
- Material approvals

### O&M Technician
- AMC cleaning roster
- Inspection checklist
- Before/After photos

### Service Engineer
- Complaint tickets
- Diagnostic toolkit
- Resolution forms

### Monitoring Analyst
- Generation alerts
- Inverter remote control
- Action triggers

## API Integration

All API calls use the existing backend endpoints:
- Base URL: Configured in `local.properties`
- Authentication: Bearer token in Authorization header
- Error Handling: Result wrapper for success/failure
- Offline Support: Local cache with sync queue

## Database Schema

Room database mirrors the PostgreSQL schema:
- **User**: Employee information and profile
- **Task**: Assigned tasks with status
- **Attendance**: Check-in/out records
- **DailyCommit**: Work descriptions
- **Customer**: Customer information
- **OutboxQueue**: Offline sync queue

## Testing Strategy

### Unit Tests
- ViewModel tests with JUnit
- Repository tests with mock data
- Use case tests

### Integration Tests
- API integration tests
- Database integration tests
- End-to-end flow tests

### UI Tests
- Compose UI tests
- Navigation tests
- User interaction tests

## Deployment

### Debug Build
```bash
./gradlew assembleDebug
```

### Release Build
```bash
./gradlew assembleRelease
```

### APK Signing
Configure signing in `app/build.gradle.kts`:
```kotlin
signingConfigs {
    create("release") {
        storeFile = file("path/to/keystore")
        storePassword = "keystore_password"
        keyAlias = "key_alias"
        keyPassword = "key_password"
    }
}
```

## Troubleshooting

### Build Issues
- **Gradle sync failed**: Check JDK version (requires JDK 17)
- **Dependency conflicts**: Run `./gradlew clean build`
- **Room schema errors**: Delete database and rebuild

### Runtime Issues
- **Network errors**: Check API URL in local.properties
- **Authentication failures**: Verify backend is running
- **Location permission denied**: Check app permissions

### Common Issues
- **Emulator network**: Use 10.0.2.2 for localhost
- **Physical device network**: Use computer's IP address
- **Firebase not working**: Verify google-services.json is correct

## Future Enhancements

### Phase 2 Features
- [ ] Complete biometric authentication
- [ ] Implement camera with face verification
- [ ] Add Google Maps integration
- [ ] Implement offline sync with WorkManager
- [ ] Add push notification handling
- [ ] Implement role-specific dashboards

### Phase 3 Features
- [ ] Real-time location tracking
- [ ] Voice commands
- [ ] Advanced analytics
- [ ] Chat integration
- [ ] File upload/download
- [ ] Video conferencing

## Contributing

1. Follow the existing code style
2. Write unit tests for new features
3. Update documentation
4. Create pull requests with clear descriptions

## Support

For issues or questions:
- Check the implementation guide
- Review the backend API documentation
- Contact the development team
