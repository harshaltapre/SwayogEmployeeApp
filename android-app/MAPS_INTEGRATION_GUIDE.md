# Google Maps Integration Guide

## What's Been Configured

✅ **API Key Added**: Your Google Maps API key has been added to:
- `local.properties.example` (for reference)
- `app/build.gradle.kts` (as BuildConfig field)
- `AndroidManifest.xml` (as meta-data)

✅ **Dependencies Included**: Maps SDK is already in `build.gradle.kts`:
```kotlin
implementation("com.google.android.gms:play-services-maps:18.2.0")
implementation("com.google.android.gms:play-services-location:21.0.1")
implementation("com.google.maps.android:maps-compose:4.3.0")
```

## What Else Is Needed

### 1. Enable Required APIs in Google Cloud Console
Go to https://console.cloud.google.com and enable these APIs for your project:

**Required APIs:**
- ✅ Maps SDK for Android (already enabled if you have the key)
- ✅ Places API (for location search/geocoding)
- ✅ Directions API (for route calculation)
- ✅ Geocoding API (for address to coordinates conversion)
- ✅ Geolocation API (for current location)

**How to enable:**
1. Go to Google Cloud Console
2. Select your project
3. Navigate to "APIs & Services" → "Library"
4. Search for each API above and click "Enable"

### 2. Configure API Key Restrictions
For security, restrict your API key:

**In Google Cloud Console:**
1. Go to "APIs & Services" → "Credentials"
2. Click on your API key
3. Under "Application restrictions", select "Android apps"
4. Add your app's package name and SHA-1 fingerprint:
   - Package name: `com.swayog.employee`
   - SHA-1: Get this from Android Studio: Tools → Firebase → Authentication

**Under "API restrictions":**
- Select "Restrict key" and check only the APIs you need:
  - Maps SDK for Android
  - Places API
  - Directions API
  - Geocoding API
  - Geolocation API

### 3. Add Maps Implementation Code
Create these files in your project:

#### LocationService.kt
```kotlin
package com.swayog.employee.data.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)
    
    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): android.location.Location? {
        if (!hasLocationPermission()) return null
        
        return try {
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                CancellationTokenSource().token
            ).await()
        } catch (e: Exception) {
            null
        }
    }
    
    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
}
```

#### MapScreen.kt (Example)
```kotlin
package com.swayog.employee.presentation.map

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@Composable
fun MapScreen(
    customerLocation: LatLng? = null,
    currentLocation: LatLng? = null
) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            customerLocation ?: LatLng(18.5204, 73.8567), // Default to Pune
            15f
        )
    }
    
    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState
    ) {
        customerLocation?.let {
            Marker(
                state = MarkerState(position = it),
                title = "Customer Location"
            )
        }
        
        currentLocation?.let {
            Marker(
                state = MarkerState(position = it),
                title = "Your Location"
            )
        }
    }
}
```

### 4. Add Location Permission Handling
Create a permission handler component:

#### PermissionHandler.kt
```kotlin
package com.swayog.employee.presentation.common.components

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.accompanist.permissions.shouldShowRationale

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationPermissionHandler(
    onPermissionGranted: () -> Unit,
    onPermissionDenied: () -> Unit
) {
    val context = LocalContext.current
    val locationPermissions = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )
    
    LaunchedEffect(locationPermissions.allPermissionsGranted) {
        if (locationPermissions.allPermissionsGranted) {
            onPermissionGranted()
        } else {
            locationPermissions.launchMultiplePermissionRequest()
        }
    }
    
    LaunchedEffect(locationPermissions.shouldShowRationale) {
        if (!locationPermissions.allPermissionsGranted && 
            !locationPermissions.shouldShowRationale) {
            onPermissionDenied()
        }
    }
}
```

### 5. Update AndroidManifest with SHA-1 (Optional)
For production builds, add your app's SHA-1 fingerprint to Google Cloud Console:

**Get SHA-1 fingerprint:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Add to Google Cloud Console:**
1. Go to "APIs & Services" → "Credentials"
2. Edit your API key
3. Under "Application restrictions" → "Android apps"
4. Add: `com.swayog.employee` + your SHA-1 fingerprint

## Testing Maps Integration

### 1. Test on Emulator
```bash
# In Android Studio
# 1. Run app on emulator
# 2. Grant location permissions when prompted
# 3. Navigate to a screen with map
# 4. Verify map loads correctly
```

### 2. Test on Physical Device
```bash
# 1. Enable USB debugging
# 2. Connect device
# 3. Run app
# 4. Grant location permissions
# 5. Verify GPS accuracy
```

### 3. Verify API Key is Working
Check if you see errors in Logcat:
- If you see "API key not authorized", check API restrictions
- If you see "Quota exceeded", check your billing status
- If you see "Invalid API key", verify the key is correct

## Common Issues and Solutions

### Issue: Map doesn't load, shows gray screen
**Solution:**
- Check if API key is correct in AndroidManifest.xml
- Verify Maps SDK for Android is enabled in Google Cloud Console
- Check if device has internet connection

### Issue: "API key not authorized" error
**Solution:**
- Add package name and SHA-1 fingerprint to API key restrictions
- Or temporarily remove restrictions for testing

### Issue: Location permission denied
**Solution:**
- Check if permissions are declared in AndroidManifest.xml
- Verify runtime permission request is implemented
- Check device location settings are enabled

### Issue: Billing required warning
**Solution:**
- Enable billing in Google Cloud Console (free tier available)
- Maps SDK requires billing account (but has free quota)

## Usage Examples

### Show Customer Location on Map
```kotlin
@Composable
fun CustomerLocationScreen(customerId: Int) {
    val customerLocation = remember { LatLng(18.5204, 73.8567) }
    
    MapScreen(
        customerLocation = customerLocation,
        currentLocation = null
    )
}
```

### Show Route Between Two Points
```kotlin
// Requires Directions API
suspend fun getRoute(
    origin: LatLng,
    destination: LatLng,
    apiKey: String
): List<LatLng> {
    // Use Directions API to get route
    // Implement using Retrofit or HTTP client
    return emptyList() // Placeholder
}
```

### Geocode Address to Coordinates
```kotlin
// Requires Geocoding API
suspend fun geocodeAddress(
    address: String,
    apiKey: String
): LatLng? {
    // Use Geocoding API to convert address to coordinates
    return null // Placeholder
}
```

## Next Steps

1. ✅ API key configured
2. ⏳ Enable required APIs in Google Cloud Console
3. ⏳ Add API key restrictions for security
4. ⏳ Implement LocationService
5. ⏳ Create MapScreen component
6. ⏳ Add permission handling
7. ⏳ Test on emulator and device
8. ⏳ Add to navigation graph
9. ⏳ Integrate with task/customer screens

## Cost Considerations

Google Maps API has a free tier:
- **Maps SDK for Android**: $200 free credit/month
- **Directions API**: $200 free credit/month
- **Geocoding API**: $200 free credit/month

For employee app usage (estimated 100 users, 1000 requests/day):
- Well within free tier limits
- No additional cost expected

## Support

For issues:
- Check Google Maps Platform documentation
- Review API key restrictions
- Verify billing is enabled
- Check device location settings
