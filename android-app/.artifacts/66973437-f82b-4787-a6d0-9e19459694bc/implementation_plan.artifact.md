# Implementation Plan - Fix Connection Timeout on Physical Device

The app is currently failing to connect to the backend because it is using the emulator's loopback address (`10.0.2.2`). Since you are running the app on a physical device (OPPO CPH2579), it needs to use your computer's actual local IP address to communicate with the server.

## Proposed Changes

### Configuration

#### [MODIFY] [local.properties](file:///E:/SwayogEmployeeApp/android-app/local.properties)
- Add `API_BASE_URL` pointing to `http://192.168.1.10:4000/api/v1/`.
- Add `WS_BASE_URL` pointing to `ws://192.168.1.10:4000`.

## Verification Plan

### Manual Verification
1. Re-build and run the app on your phone.
2. Verify that the Dashboard loads data without `SocketTimeoutException`.
3. Ensure your phone and computer are on the same Wi-Fi network.
4. Ensure the backend server is running on your computer and the firewall allows connections on port 4000.
