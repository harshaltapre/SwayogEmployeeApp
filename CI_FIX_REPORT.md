# GitHub Actions Release Pipeline Fix Report

## Issue Summary

The GitHub Actions release workflow (run #35068992211) failed with a critical Java home configuration error and insecure production signing fallback.

## Root Causes

### 1. Gradle Java Home Configuration
**Problem**: `android-app/gradle.properties` contained a Windows-specific absolute path:
```properties
org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
```

**Impact**: GitHub Actions Ubuntu runner couldn't use this path, causing immediate build failure:
```
Value 'C:\Program Files\Android\Android Studio\jbr' given for org.gradle.java.home Gradle property is invalid (Java home supplied is invalid)
```

### 2. Production Signing Fallback
**Problem**: Workflow fell back to debug keystore when production signing secrets were missing:
```yaml
echo "::warning::RELEASE_KEYSTORE_BASE64 secret is not set. Signing will fallback to debug keystore."
```

**Impact**: Debug-signed APKs cannot update production installations due to signature mismatch, breaking OTA updates.

## Files Changed

### 1. `android-app/gradle.properties`
**Change**: Removed hardcoded Windows Java home path
```diff
- org.gradle.java.home=C\:\\Program Files\\Android\\Android Studio\\jbr
+ # org.gradle.java.home is not set here to allow CI/CD environments to use their configured Java
+ # Local development can configure Java through Android Studio settings
```

**Rationale**: 
- CI environments use Java installed by `actions/setup-java`
- Local developers can configure Java through Android Studio
- No machine-specific paths should be committed

### 2. `.github/workflows/release-apk.yml`
**Changes**:

#### A. Added Production Signing Validation
```yaml
- name: Validate Production Signing Secrets
  run: |
    if [ -z "${{ secrets.RELEASE_KEYSTORE_BASE64 }}" ]; then
      echo "::error::RELEASE_KEYSTORE_BASE64 secret is required for production releases"
      exit 1
    fi
    # ... validation for all required secrets
```

#### B. Enhanced Keystore Decoding
```yaml
- name: Decode Production Release Keystore
  run: |
    mkdir -p android-app/keystore
    echo "$RELEASE_KEYSTORE_BASE64" | base64 --decode > android-app/keystore/release.jks
    
    if [ ! -f "android-app/keystore/release.jks" ]; then
      echo "::error::Failed to decode keystore file"
      exit 1
    fi
    # ... additional validation
```

#### C. Removed Debug Signing Fallback
```yaml
- name: Build and Sign Release APK
  run: |
    if [ -z "$RELEASE_STORE_FILE" ]; then
      echo "::error::RELEASE_STORE_FILE is not set - cannot build production release"
      exit 1
    fi
    # ... build with explicit signing configuration
```

#### D. Added APK Signing Verification
```yaml
- name: Verify APK Signing Certificate
  run: |
    # Use apksigner to verify the APK signature
    apksigner verify --print-certs "$APK_PATH" || {
      echo "::error::APK signature verification failed"
      exit 1
    }
    # ... certificate fingerprint extraction
```

#### E. Added Duplicate Tag Prevention
```yaml
- name: Create and Push Git Release Tag
  run: |
    # Check if tag already exists to prevent duplicates
    if git rev-parse "$RELEASE_TAG" >/dev/null 2>&1; then
      echo "::error::Git tag $RELEASE_TAG already exists"
      exit 1
    fi
    # ... tag creation
```

### 3. `android-app/app/build.gradle.kts`
**Changes**:

#### A. CI/CD Signing Enforcement
```kotlin
create("release") {
    val storeFilePath = getLocalProperty("RELEASE_STORE_FILE", System.getenv("RELEASE_STORE_FILE") ?: "")
    val isCI = System.getenv("CI") == "true"
    
    if (storeFilePath.isNotBlank()) {
        storeFile = file(storeFilePath)
        this.keyAlias = keyAlias
        storePassword = storePass
        keyPassword = keyPass
    } else if (isCI) {
        throw GradleException("RELEASE_STORE_FILE must be configured for production releases in CI/CD")
    } else {
        // Local development warning only
        println("⚠️  WARNING: RELEASE_STORE_FILE is not configured in local.properties.")
    }
}
```

#### B. Release Build Type Signing Logic
```kotlin
release {
    val storeFilePath = getLocalProperty("RELEASE_STORE_FILE", System.getenv("RELEASE_STORE_FILE") ?: "")
    val isCI = System.getenv("CI") == "true"
    
    if (storeFilePath.isNotBlank()) {
        signingConfig = signingConfigs.getByName("release")
    } else if (isCI) {
        throw GradleException("RELEASE_STORE_FILE must be configured for production releases in CI/CD")
    } else {
        // Local development fallback only
        signingConfig = signingConfigs.getByName("debug")
        println("⚠️  WARNING: Using debug signing for local development only")
    }
}
```

## Required GitHub Secrets

The workflow now **requires** the following secrets for production releases:

### R2 Configuration
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 access key ID  
- `R2_SECRET_ACCESS_KEY` - R2 secret access key
- `R2_BUCKET_NAME` - R2 bucket name (default: swayog-dashboard)
- `R2_ENDPOINT` - R2 S3 endpoint URL
- `R2_PUBLIC_URL` - Public CDN domain for APK distribution

### Production Signing (NOW REQUIRED)
- `RELEASE_KEYSTORE_BASE64` - Base64-encoded keystore file
- `RELEASE_KEY_ALIAS` - Key alias in keystore
- `RELEASE_STORE_PASSWORD` - Keystore password
- `RELEASE_KEY_PASSWORD` - Key password

### Optional
- `API_BASE_URL` - Backend API URL
- `WS_BASE_URL` - WebSocket URL
- `PUBLIC_DISTRIBUTION_URL` - Fallback public URL
- `WEB_DOMAIN` - Web dashboard domain

## Verification Steps Added

### 1. Java Environment
- GitHub Actions `setup-java@v4` installs Java 17
- Gradle uses CI-provided JAVA_HOME
- No hardcoded paths in repository

### 2. Signing Secrets
- Pre-build validation of all required secrets
- Keystore file existence and size validation
- Build fails if any secret is missing

### 3. APK Build
- Explicit production signing configuration
- CI/CD enforcement (no debug fallback)
- Release APK verification (not debug build)

### 4. APK Signature
- `apksigner verify` checks signature validity
- Certificate fingerprint extraction for diagnostics
- Manifest file presence verification

### 5. Release Validation
- latest.json contract validation
- versionCode matching
- SHA-256 checksum verification
- APK URL HTTPS validation

### 6. Tag Management
- Duplicate tag prevention
- Concurrent workflow protection via `concurrency` group
- Atomic tag creation and push

## Versioning Behavior

### Current Baseline
- Version Name: `1.0.0`
- Build: `20`
- Tag: `v1.0.0-build20`

### Next Release
- Version Name: `1.0.0`
- Build: `21` (auto-incremented from highest existing tag)
- Tag: `v1.0.0-build21`

### Future Releases
- Continues: 22, 23, 24, ...
- Never reuses versionCode
- Deterministic build number from Git tags

## R2 Storage Structure

### Canonical Format
```
R2 Bucket
├── latest.json (primary manifest)
├── releases/android/latest.apk (compatibility)
└── releases/android/1.0.0/build-21/app-release.apk (canonical APK)
```

### APK URL Strategy
- If `R2_PUBLIC_URL` is configured: uses stable public CDN URL
- Otherwise: uses web dashboard domain with canonical path
- No 7-day presigned URLs as permanent manifest URLs

## Security Improvements

### Before
- ⚠️ Debug signing fallback in CI
- ⚠️ Missing secrets produced warnings only
- ⚠️ No signature verification
- ⚠️ Potential for duplicate releases

### After
- ✅ CI fails without production signing
- ✅ Missing secrets cause immediate failure
- ✅ APK signature verification
- ✅ Duplicate tag prevention
- ✅ Certificate fingerprint logging

## Local Development Impact

### No Breaking Changes
- Local development can still use debug signing
- Warning message shown when keystore not configured
- Android Studio Java configuration unchanged
- Machine-specific paths removed from repository

### CI/CD Changes
- Production builds now require proper signing
- No silent fallback to debug builds
- Clear error messages for missing configuration

## Testing Recommendations

### Manual Testing
1. **Verify Local Build**: Run `./gradlew assembleRelease` locally with keystore configured
2. **Test CI Failure**: Temporarily remove a signing secret to verify workflow fails
3. **Signature Verification**: Check that `apksigner verify` works on built APK
4. **Tag Prevention**: Try to create duplicate tag to verify protection

### Automated Testing
1. **Test Workflow**: Push to main branch and observe workflow execution
2. **Verify Secrets**: Ensure all required secrets are configured in GitHub
3. **Check R2 Upload**: Verify APK and latest.json are uploaded correctly
4. **Validate Endpoint**: Test `/latest.json` returns correct JSON

## Certificate Compatibility

### Build 20 → Build 21 Upgrade Path
- ✅ Package ID: `com.swayog.employee` (unchanged)
- ⚠️ Signing Certificate: Must be same as Build 20
- ⚠️ **Action Required**: Configure production keystore secrets

### If Build 20 Was Debug-Signed
- ⚠️ OTA updates may fail due to signature mismatch
- ⚠️ Users may need to uninstall and reinstall
- ⚠️ App data will be lost in this case

### Recommendation
1. Verify Build 20 signing certificate using:
   ```bash
   apksigner verify --print-certs app-release.apk
   ```
2. If Build 20 was debug-signed, consider this a breaking change
3. Communicate to users that app data may be lost during upgrade

## Next Steps

### Immediate Actions Required
1. **Configure GitHub Secrets**: Add all required signing secrets
2. **Generate Production Keystore**: If not already available
3. **Base64 Encode Keystore**: For `RELEASE_KEYSTORE_BASE64` secret
4. **Test Workflow**: Trigger workflow to verify fixes

### Post-Deployment Verification
1. **Check Build 21**: Verify it's properly signed
2. **Test Update Flow**: Install Build 20, check for updates
3. **Verify Certificate**: Ensure Build 21 matches Build 20 certificate
4. **Monitor R2**: Confirm files are uploaded correctly

## Conclusion

The GitHub Actions release pipeline has been fixed to:

1. ✅ Use CI-provided Java environment (no hardcoded paths)
2. ✅ Require production signing (no debug fallback in CI)
3. ✅ Verify APK signatures before publishing
4. ✅ Prevent duplicate releases
5. ✅ Validate all release artifacts
6. ✅ Maintain local development compatibility

**Critical**: Production signing secrets must be configured before the next release to ensure OTA update compatibility with existing installations.