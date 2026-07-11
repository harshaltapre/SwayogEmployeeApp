# Android App Setup and Optimization Guide

## Current Status
✅ **Backend Server**: Running on port 4000
✅ **LocalTunnel**: Active at https://swayog-employee-app.loca.lt
✅ **API Health Check**: Working (database connected)
✅ **Android Configuration**: Updated to use localtunnel URL

## Quick Start - Test the Android App

### 1. Rebuild the Android App
```bash
cd android-app

# Clean and rebuild
./gradlew clean
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug
```

### 2. Or Build in Android Studio
1. Open Android Studio
2. Open the project: `android-app`
3. Click "Build" → "Clean Project"
4. Click "Build" → "Rebuild Project"
5. Run on your device/emulator

### 3. Test Login
- **Email**: harshaltapre26@gmail.com
- **Password**: Password@123
- **Backend URL**: https://swayog-employee-app.loca.lt/api/v1/

## Configuration Changes Made

### Updated API Base URLs
**File**: `android-app/app/build.gradle.kts`

**Changes**:
- Default API URL: `https://swayog-employee-app.loca.lt/api/v1/`
- WebSocket URL: `wss://swayog-employee-app.loca.lt`
- Debug build: Uses localtunnel URL
- Release build: Uses production URL (api.swayog.com)

### LocalTunnel Setup
**Command**: `lt --port 4000 --subdomain swayog-employee-app`
**URL**: https://swayog-employee-app.loca.lt

## How It Works

### Development Workflow
1. **Backend Server**: Runs locally on port 4000
2. **LocalTunnel**: Exposes local backend to internet
3. **Android App**: Connects to localtunnel URL
4. **Database**: Syncs with Neon PostgreSQL cloud

### Network Configuration
The Android app uses a dynamic URL system:
- **Primary URL**: BuildConfig.API_BASE_URL (from build.gradle.kts)
- **Fallback URL**: Can be set via app settings (stored in DataStore)
- **LocalTunnel Handling**: Automatically ignores stale localtunnel URLs

## Troubleshooting

### Issue: "Server is currently unavailable (503)"
**Solution**: 
1. Verify backend is running: `curl https://swayog-employee-app.loca.lt/api/v1/health`
2. Check localtunnel is running
3. Ensure Android app has internet permission
4. Rebuild Android app with new configuration

### Issue: Login fails with network error
**Solution**:
1. Check backend logs for errors
2. Verify database connection
3. Test API endpoint directly: `curl -X POST https://swayog-employee-app.loca.lt/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier":"harshaltapre26@gmail.com","password":"Password@123"}'`
4. Check Android app logs in Logcat

### Issue: LocalTunnel stops working
**Solution**:
1. Restart localtunnel: `lt --port 4000 --subdomain swayog-employee-app`
2. Check if port 4000 is available
3. Verify backend server is running

## Performance Optimizations

### 1. Network Layer
- **Connection Timeout**: 30 seconds
- **Read Timeout**: 30 seconds
- **Write Timeout**: 30 seconds
- **Auto Retry**: Automatic retry on connection failure (2-second delay)
- **Logging**: Full request/response logging in debug mode

### 2. Database Sync
- **Connection Pooling**: Enabled via Neon pgbouncer
- **SSL**: Required for all connections
- **Retry Logic**: Automatic retry on connection failures
- **Background Sync**: 30-minute intervals for telemetry data

### 3. Local Storage
- **Room Database**: Local caching of user data
- **DataStore**: Persistent preferences storage
- **WorkManager**: Background sync tasks

## Production Deployment

### For Production Build
1. Update `gradle.properties`:
   ```properties
   API_BASE_URL=https://api.swayog.com/api/v1/
   WS_BASE_URL=wss://api.swayog.com
   MAPS_API_KEY=your_maps_api_key
   ```

2. Build release APK:
   ```bash
   ./gradlew assembleRelease
   ```

3. Sign and upload to Play Store

### Cloud Backend Deployment
See `CLOUD_DEPLOYMENT_GUIDE.md` for full cloud deployment instructions.

## Security Considerations

### Development Mode
- Uses localtunnel (less secure than production)
- Debug logging enabled
- Debug signing config

### Production Mode
- Uses HTTPS with valid certificates
- No debug logging
- ProGuard/R8 obfuscation enabled
- Release signing config required

## Testing Checklist

### Before Testing
- [ ] Backend server running on port 4000
- [ ] LocalTunnel active and accessible
- [ ] Android app rebuilt with new configuration
- [ ] Device has internet connection
- [ ] Database connection verified

### Login Test
- [ ] Enter valid credentials
- [ ] Login succeeds
- [ ] Token stored correctly
- [ ] User data loaded
- [ ] Navigation works

### API Tests
- [ ] Health check endpoint
- [ ] Login endpoint
- [ ] Task fetching
- [ ] Attendance check-in/out
- [ ] Daily commits

## Advanced Configuration

### Custom Server URL
Users can set a custom server URL in the app settings:
1. Open app settings
2. Enter server URL
3. App will use this URL for all API calls
4. Stored in DataStore for persistence

### WebSocket Connection
For real-time updates:
- **WebSocket URL**: wss://swayog-employee-app.loca.lt
- **Connection**: Automatic when app is in foreground
- **Reconnection**: Automatic with exponential backoff

## Monitoring

### Backend Logs
```bash
# View backend server logs
# Check for connection errors, database issues, etc.
```

### Android Logs
```bash
# View Android logs
adb logcat | grep "swayog"
```

### Network Monitoring
- Use Charles Proxy or Wireshark for detailed network analysis
- Check Android Studio Network Profiler
- Monitor API response times

## Next Steps

1. **Rebuild Android App**: Apply the configuration changes
2. **Test Login**: Verify login works with the new setup
3. **Test Features**: Check all app functionality
4. **Monitor Performance**: Check for any issues
5. **Deploy to Production**: When ready for production use

## Support

### Common Issues
- **503 Errors**: Check backend and localtunnel status
- **Login Failures**: Verify credentials and database
- **Network Timeouts**: Check internet connection
- **Build Errors**: Clean and rebuild project

### Getting Help
- Check logs in Android Studio Logcat
- Review backend server logs
- Test API endpoints directly with curl
- Check database connection status

---

**Last Updated**: 2026-07-11
**Version**: 1.0.0
**Status**: Ready for Testing
