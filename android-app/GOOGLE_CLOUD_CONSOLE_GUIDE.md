# Step-by-Step Guide: Enable Required APIs in Google Cloud Console

## Prerequisites
- Google account with access to Google Cloud Console
- Your Google Maps API key: `AIzaSyBGleNkZ2eFC5L6QpbZx7KnGjZonwiklwc`
- Project already created (or create new one)

---

## Step 1: Access Google Cloud Console

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Sign in with your Google account

2. **Select or Create Project**
   - If you have an existing project, select it from the dropdown at the top
   - If you need to create a new project:
     - Click the project dropdown → "New Project"
     - Enter project name: `SwayogEmployeeApp`
     - Click "Create"
     - Wait for project creation (30-60 seconds)
     - Select the newly created project

---

## Step 2: Enable Maps SDK for Android

1. **Navigate to API Library**
   - In the left sidebar, click "APIs & Services"
   - Click "Library"

2. **Search for Maps SDK**
   - In the search bar, type: `Maps SDK for Android`
   - Click on "Maps SDK for Android" from the results

3. **Enable the API**
   - Click the blue "Enable" button
   - Wait for the API to be enabled (10-30 seconds)
   - You'll see a checkmark and "API enabled" message

---

## Step 3: Enable Places API

1. **Search for Places API**
   - In the API Library search bar, type: `Places API`
   - Click on "Places API" from the results

2. **Enable the API**
   - Click the blue "Enable" button
   - Wait for the API to be enabled (10-30 seconds)
   - You'll see a checkmark and "API enabled" message

---

## Step 4: Enable Directions API

1. **Search for Directions API**
   - In the API Library search bar, type: `Directions API`
   - Click on "Directions API" from the results

2. **Enable the API**
   - Click the blue "Enable" button
   - Wait for the API to be enabled (10-30 seconds)
   - You'll see a checkmark and "API enabled" message

---

## Step 5: Enable Geocoding API

1. **Search for Geocoding API**
   - In the API Library search bar, type: `Geocoding API`
   - Click on "Geocoding API" from the results

2. **Enable the API**
   - Click the blue "Enable" button
   - Wait for the API to be enabled (10-30 seconds)
   - You'll see a checkmark and "API enabled" message

---

## Step 6: Enable Geolocation API

1. **Search for Geolocation API**
   - In the API Library search bar, type: `Geolocation API`
   - Click on "Geolocation API" from the results

2. **Enable the API**
   - Click the blue "Enable" button
   - Wait for the API to be enabled (10-30 seconds)
   - You'll see a checkmark and "API enabled" message

---

## Step 7: Verify All APIs Are Enabled

1. **Check Enabled APIs**
   - In the left sidebar, click "APIs & Services"
   - Click "Enabled APIs & services"
   - You should see all 5 APIs listed:
     - ✅ Maps SDK for Android
     - ✅ Places API
     - ✅ Directions API
     - ✅ Geocoding API
     - ✅ Geolocation API

---

## Step 8: Configure API Key Restrictions (IMPORTANT for Security)

1. **Navigate to Credentials**
   - In the left sidebar, click "APIs & Services"
   - Click "Credentials"

2. **Edit Your API Key**
   - Find your API key (starts with `AIzaSyBGleNkZ2eFC5L6QpbZx7KnGjZonwiklwc`)
   - Click the pencil icon (edit) next to it

3. **Set Application Restrictions**
   - Under "Application restrictions", select "Android apps"
   - Click "Add an item"
   - Enter:
     - **Package name**: `com.swayog.employee`
     - **SHA-1 fingerprint**: Get this from Android Studio (see below)
   - Click "Save"

4. **Get SHA-1 Fingerprint from Android Studio**
   - Open Android Studio
   - Go to: Tools → Firebase → Authentication
   - Or run this command in terminal:
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - Copy the SHA-1 fingerprint (looks like: `AA:BB:CC:DD...`)

5. **Set API Restrictions**
   - Under "API restrictions", select "Restrict key"
   - Check only these APIs:
     - ✅ Maps SDK for Android
     - ✅ Places API
     - ✅ Directions API
     - ✅ Geocoding API
     - ✅ Geolocation API
   - Click "Save"

6. **Confirm Changes**
   - Review the restrictions
   - Click "Save" again to confirm

---

## Step 9: Enable Billing (Required for Maps API)

1. **Navigate to Billing**
   - In the left sidebar, click "Billing"
   - If you don't have a billing account:
     - Click "Link a billing account"
     - Follow the prompts to add payment method
     - **Note**: Google Maps requires billing, but you get $200 free credit/month

2. **Verify Billing is Active**
   - Ensure your project is linked to the billing account
   - Check that billing status is "Active"

---

## Step 10: Test API Key

1. **Quick Test in Android Studio**
   - Open your Android project
   - Run the app on emulator or device
   - Navigate to a screen with a map
   - Check if the map loads correctly

2. **Check for Errors in Logcat**
   - Open Android Studio Logcat
   - Filter by: "Maps" or "Google"
   - Look for errors like:
     - "API key not authorized" → Check restrictions
     - "API key invalid" → Verify key is correct
     - "Quota exceeded" → Check billing status

---

## Troubleshooting

### Issue: "API key not authorized"
**Solution:**
- Verify package name is correct: `com.swayog.employee`
- Check SHA-1 fingerprint matches
- Ensure API restrictions include Maps SDK for Android

### Issue: "Quota exceeded"
**Solution:**
- Check billing is enabled
- Verify you're within free tier ($200/month)
- Check usage in Google Cloud Console

### Issue: Map shows gray screen
**Solution:**
- Verify API key is correct in AndroidManifest.xml
- Check if Maps SDK for Android is enabled
- Ensure device has internet connection

### Issue: "Billing account required"
**Solution:**
- Enable billing in Google Cloud Console
- Add payment method (credit card)
- You won't be charged unless you exceed free tier

---

## Verification Checklist

After completing all steps, verify:

- [ ] All 5 APIs are enabled in "Enabled APIs & services"
- [ ] API key has Android app restrictions (package name + SHA-1)
- [ ] API key has API restrictions (only the 5 required APIs)
- [ ] Billing account is linked and active
- [ ] Map loads correctly in Android app
- [ ] No errors in Logcat related to Maps API

---

## Quick Reference

**Required APIs:**
1. Maps SDK for Android
2. Places API
3. Directions API
4. Geocoding API
5. Geolocation API

**API Key:** `AIzaSyBGleNkZ2eFC5L6QpbZx7KnGjZonwiklwc`

**Package Name:** `com.swayog.employee`

**Console URL:** https://console.cloud.google.com

**Free Tier:** $200/month credit (sufficient for 100 users, ~1000 requests/day)

---

## Next Steps After Configuration

Once APIs are enabled and configured:

1. **Implement LocationService** in your Android app
2. **Create MapScreen component** for displaying locations
3. **Add permission handling** for location access
4. **Test on emulator and physical device**
5. **Integrate with Task/Attendance screens**

See `MAPS_INTEGRATION_GUIDE.md` for implementation code examples.
