# Android App Working Documentation

**Project:** Swayog Employee App  
**Platform:** Android (Kotlin + Jetpack Compose)  
**Last Updated:** July 2025

---

## Development Environment Setup

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17 or later
- Android SDK API Level 34
- Gradle 8.0+
- Git

### Project Structure
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
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── admin/
│   │   │   │   │   ├── common/
│   │   │   │   │   ├── employee/
│   │   │   │   │   ├── inventory/
│   │   │   │   │   ├── notifications/
│   │   │   │   │   └── subadmin/
│   │   │   │   └── core/
│   │   │   │       ├── di/
│   │   │   │       ├── util/
│   │   │   │       └── network/
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   └── build.gradle.kts
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
└── doc/
```

---

## Build Instructions

### Debug Build
```bash
cd android-app
./gradlew assembleDebug
```

### Release Build
```bash
cd android-app
./gradlew assembleRelease
```

### Clean Build
```bash
cd android-app
./gradlew clean assembleDebug
```

### Install Debug APK
```bash
cd android-app
./gradlew installDebug
```

---

## Key Dependencies

### Core Libraries
```kotlin
// Jetpack Compose
implementation("androidx.compose.ui:ui:1.5.0")
implementation("androidx.compose.material3:material3:1.1.0")

// Navigation
implementation("androidx.navigation:navigation-compose:2.7.0")

// Hilt
implementation("com.google.dagger:hilt-android:2.48")
ksp("com.google.dagger:hilt-compiler:2.48")

// Retrofit
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")

// Room
implementation("androidx.room :room-runtime:2.6.0")
implementation("androidx.room:room-ktx:2.6.0")
ksp("androidx.room:room-compiler:2.6.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

// Charts
implementation("com.github.PhilJay:MPAndroidChart:3.1.0")
```

---

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/task-creation-ui
   ```

2. **Implement Data Layer**
   - Add API endpoints in `ApiService.kt`
   - Create data models in `model/` package
   - Implement repository methods in `repository/` package
   - Add database entities if needed

3. **Implement ViewModel**
   - Create ViewModel in appropriate `presentation/` package
   - Add StateFlow for reactive state management
   - Implement business logic with coroutines
   - Handle error states and loading states

4. **Implement UI**
   - Create Composable screens
   - Add user interactions
   - Implement form validation
   - Add loading and error states

5. **Testing**
   - Write unit tests for ViewModels
   - Write integration tests for repositories
   - Test UI components
   - Manual testing on device/emulator

6. **Code Review**
   - Submit pull request
   - Address review comments
   - Update documentation

7. **Merge**
   - Merge to develop branch
   - Create release if needed

---

## Code Style Guidelines

### Kotlin Style
- Follow Kotlin coding conventions
- Use meaningful variable names
- Keep functions under 50 lines
- Use extension functions for utilities
- Prefer immutable data classes

### Compose Style
- Use composable functions for UI components
- Keep composables focused and reusable
- Use state hoisting for shared state
- Implement proper recomposition optimization
- Use Material3 design components

### Repository Pattern
- Abstract data sources behind repository interface
- Handle both local and remote data
- Implement offline-first approach
- Use Result type for error handling
- Cache frequently accessed data

---

## Common Tasks

### Adding New API Endpoint

1. **Add to ApiService.kt**
   ```kotlin
   @POST("endpoint")
   suspend fun methodName(@Body request: RequestType): Response<ApiResponse<ResponseType>>
   ```

2. **Create Request/Response Models**
   ```kotlin
   data class RequestType(val field: String)
   data class ResponseType(val data: String)
   ```

3. **Add Repository Method**
   ```kotlin
   suspend fun methodName(request: RequestType): Result<ResponseType> {
       return try {
           val response = apiService.methodName(request)
           if (response.isSuccessful) {
               Result.success(response.body()!!.data!!)
           } else {
               Result.failure(Exception("Error: ${response.code()}"))
           }
       } catch (e: Exception) {
           Result.failure(e)
       }
   }
   ```

4. **Add ViewModel Function**
   ```kotlin
   fun methodName(request: RequestType, onSuccess: () -> Unit, onError: (String) -> Unit) {
       viewModelScope.launch {
           repository.methodName(request)
               .onSuccess { onSuccess() }
               .onFailure { onError(it.message ?: "Error") }
       }
   }
   ```

### Adding New Screen

1. **Create ViewModel**
   ```kotlin
   @HiltViewModel
   class ScreenViewModel @Inject constructor(
       private val repository: SomeRepository
   ) : ViewModel() {
       private val _uiState = MutableStateFlow(UiState())
       val uiState: StateFlow<UiState> = _uiState.asStateFlow()
   }
   ```

2. **Create Composable Screen**
   ```kotlin
   @Composable
   fun Screen(
       viewModel: ScreenViewModel = hiltViewModel()
   ) {
       val uiState by viewModel.uiState.collectAsState()
       // UI implementation
   }
   ```

3. **Add Navigation**
   ```kotlin
   composable("screen_route") {
       Screen(onNavigateBack = { navController.popBackStack() })
   }
   ```

### Adding Database Entity

1. **Create Entity**
   ```kotlin
   @Entity(tableName = "table_name")
   data class Entity(
       @PrimaryKey val id: String,
       val field: String
   )
   ```

2. **Create DAO**
   ```kotlin
   @Dao
   interface EntityDao {
       @Query("SELECT * FROM table_name")
       fun getAll(): Flow<List<Entity>>
       
       @Insert(onConflict = OnConflictStrategy.REPLACE)
       suspend fun insert(entity: Entity)
   }
   ```

3. **Update Database Version**
   ```kotlin
   @Database(
       entities = [Entity::class],
       version = 2,
       exportSchema = false
   )
   abstract class AppDatabase : RoomDatabase()
   ```

---

## Debugging Tips

### Common Issues

**Build Errors:**
- Clean project: `./gradlew clean`
- Invalidate caches: File → Invalidate Caches
- Check dependencies: `./gradlew dependencies`

**Runtime Errors:**
- Check Logcat for stack traces
- Verify API endpoints are correct
- Check network connectivity
- Verify authentication tokens

**UI Issues:**
- Check recomposition with Layout Inspector
- Verify state management
- Check for missing imports
- Test on different screen sizes

### Debugging Tools

**Android Studio Debugger:**
- Set breakpoints in code
- Step through execution
- Inspect variables
- Evaluate expressions

**Logcat:**
- Filter by package name
- Use log levels appropriately
- Add custom log tags
- Export logs for analysis

**Layout Inspector:**
- Inspect composable hierarchy
- Check layout parameters
- View recomposition counts
- Debug state changes

---

## Testing Guidelines

### Unit Testing

**ViewModel Testing:**
```kotlin
@Test
fun testViewModelFunction() = runTest {
    val viewModel = TestViewModel(repository)
    viewModel.function()
    assertEquals(expected, viewModel.state.value)
}
```

**Repository Testing:**
```kotlin
@Test
fun testRepositoryMethod() = runTest {
    val result = repository.method(request)
    assertTrue(result.isSuccess)
}
```

### Integration Testing

**API Testing:**
```kotlin
@Test
fun testApiEndpoint() = runTest {
    val response = apiService.method(request)
    assertTrue(response.isSuccessful)
}
```

**Database Testing:**
```kotlin
@Test
fun testDatabaseOperation() = runTest {
    dao.insert(entity)
    val result = dao.getById(entity.id)
    assertEquals(entity, result)
}
```

---

## Performance Optimization

### Network Optimization
- Enable HTTP caching
- Use request batching
- Implement retry logic
- Compress request/response data

### Database Optimization
- Add indexes for frequent queries
- Use transactions for bulk operations
- Implement lazy loading
- Cache frequently accessed data

### UI Optimization
- Use LazyColumn for lists
- Implement proper state hoisting
- Avoid unnecessary recompositions
- Use remember for expensive calculations

---

## Deployment Checklist

### Pre-Release
- [ ] Update version numbers
- [ ] Run full test suite
- [ ] Check for memory leaks
- [ ] Verify API compatibility
- [ ] Test on multiple devices
- [ ] Update documentation
- [ ] Create release notes

### Release Build
- [ ] Sign APK with release key
- [ ] ProGuard/R8 optimization
- [ ] Remove debug code
- [ ] Verify permissions
- [ ] Test release build
- [ ] Upload to distribution

---

## Troubleshooting

### Build Issues
**Gradle Sync Failed:**
- Check internet connection
- Verify Gradle wrapper version
- Clear Gradle cache: `./gradlew clean build --refresh-dependencies`

**Compilation Errors:**
- Check Kotlin version compatibility
- Verify all dependencies are resolved
- Check for conflicting libraries
- Update Android Studio

### Runtime Issues
**App Crashes on Startup:**
- Check AndroidManifest.xml
- Verify application class
- Check for missing dependencies
- Review initialization code

**Network Errors:**
- Verify API base URL
- Check authentication tokens
- Test network connectivity
- Review API response format

### UI Issues
**Blank Screen:**
- Check navigation setup
- Verify composable parameters
- Check for missing imports
- Review state management

**Layout Issues:**
- Test on different screen sizes
- Check constraint usage
- Verify modifier usage
- Review theme configuration

---

## Useful Commands

### Gradle Commands
```bash
# Clean build
./gradlew clean

# Build debug
./gradlew assembleDebug

# Build release
./gradlew assembleRelease

# Run tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Generate dependency report
./gradlew dependencies

# Check for dependency updates
./gradlew dependencyUpdates
```

### Git Commands
```bash
# Create feature branch
git checkout -b feature/name

# Commit changes
git add .
git commit -m "Description"

# Push to remote
git push origin feature/name

# Merge to develop
git checkout develop
git merge feature/name
```

---

## Contact Information

**Development Team:**
- Lead Developer: dev-lead@swayog.com
- Android Developer: android-dev@swayog.com
- QA Team: qa@swayog.com

**Support:**
- Documentation: docs@swayog.com
- Issues: issues@swayog.com

---

**Document Version:** 1.0  
**Last Updated:** July 29, 2025  
**Maintained By:** Android Development Team
