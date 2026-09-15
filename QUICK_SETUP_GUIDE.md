# Quick Setup Guide for R2 Public Distribution

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Cloudflare account with R2 enabled
- [ ] GitHub repository access
- [ ] Java JDK installed (for keystore generation)
- [ ] Git configured on your machine

## Step 1: Cloudflare R2 Setup

### 1.1 Create R2 Bucket
1. Go to https://dash.cloudflare.com/
2. Navigate to R2 → Create bucket
3. Name: `swayog-dashboard`
4. Location: Choose nearest region
5. Click "Create bucket"

### 1.2 Enable Public Access
**Option A: Custom Domain (Recommended)**
1. Go to R2 bucket → Settings → Public Access
2. Click "Set up a custom domain"
3. Enter: `releases.yourdomain.com`
4. Follow DNS configuration steps
5. Wait for SSL certificate (15-30 min)

**Option B: R2 Public URL (Quick)**
1. Go to R2 bucket → Settings → Public Access
2. Enable "Allow public access"
3. Note the public URL format

### 1.3 Get API Credentials
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Permissions: Account → R2 → Edit & Read
4. Save: Access Key ID, Secret Access Key, Account ID

## Step 2: Generate Signing Keystore

### Run the provided script:
```bash
cd android-app
chmod +x generate-keystore.sh
./generate-keystore.sh
```

This will:
- Generate `release-key.jks`
- Provide base64 encoded keystore
- Show all GitHub secrets you need

## Step 3: Add GitHub Secrets

Go to: https://github.com/harshaltapre/SwayogEmployeeApp/settings/secrets/actions

Add these secrets:

### R2 Secrets:
```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=swayog-dashboard
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://releases.yourdomain.com
```

### Signing Secrets (from keystore script):
```
RELEASE_KEYSTORE_BASE64=<base64 from script>
RELEASE_KEY_ALIAS=<alias from script>
RELEASE_STORE_PASSWORD=<password from script>
RELEASE_KEY_PASSWORD=<password from script>
```

## Step 4: Update Local Configuration

The `android-app/local.properties` file has been updated with:
```
PUBLIC_DISTRIBUTION_URL=https://your-r2-public-domain.com
```

Replace `https://your-r2-public-domain.com` with your actual R2 public URL.

## Step 5: Create First Release

### 5.1 Commit any changes
```bash
git add .
git commit -m "Configure R2 public distribution for app updates"
git push
```

### 5.2 Create version tag
```bash
git tag v1.0.0
git push origin v1.0.0
```

This will automatically trigger the GitHub Actions workflow.

## Step 6: Monitor GitHub Actions

1. Go to: https://github.com/harshaltapre/SwayogEmployeeApp/actions
2. Watch the "Build and Deploy Android Release APK" workflow
3. Check each step for success
4. Verify R2 upload succeeded
5. Confirm public endpoint verification passed

## Step 7: Test Public Access

### Test endpoints manually:
```bash
# Replace with your actual public URL
curl https://releases.yourdomain.com/releases/android/latest.json
curl https://releases.yourdomain.com/app/android/latest.json
```

Both should return JSON with version information.

## Step 8: Test Mobile App Update

### 8.1 Build and install current version
```bash
cd android-app
./gradlew assembleDebug
./gradlew installDebug
```

### 8.2 Update local.properties with your public URL
```properties
PUBLIC_DISTRIBUTION_URL=https://releases.yourdomain.com
```

### 8.3 Test update check
1. Open the app on your device
2. Navigate to Settings → App Updates
3. Tap "Check for Updates"
4. Should show the new version available

## Troubleshooting

### Workflow Fails
- Check GitHub Actions logs for specific errors
- Verify all GitHub Secrets are set correctly
- Ensure R2 credentials are valid

### Public URL Not Accessible
- Verify R2 public access is enabled
- Check DNS configuration for custom domain
- Test with direct R2 URL as fallback

### Update Check Fails in App
- Verify `PUBLIC_DISTRIBUTION_URL` in local.properties
- Check network connectivity
- Test public endpoints with curl
- Review Android app logs

### APK Download Fails
- Verify R2 upload succeeded
- Check APK exists in R2 bucket
- Test download URL manually
- Verify public access permissions

## Success Criteria

You'll know it's working when:
- ✅ GitHub Actions workflow completes successfully
- ✅ Public endpoints return valid JSON
- ✅ Mobile app can fetch latest.json
- ✅ Update available notification appears
- ✅ APK downloads and installs successfully

## Support

For issues:
- **R2 Configuration**: Cloudflare Dashboard → R2 → Documentation
- **GitHub Actions**: Repository → Actions → Workflow runs
- **Mobile App**: Android Studio → Logcat

---

**Ready to proceed?** Start with Step 1 (Cloudflare R2 Setup) and work through each step sequentially.