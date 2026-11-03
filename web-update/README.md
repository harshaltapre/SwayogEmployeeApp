# Swayog Employee App Update Module

This module provides the server-side implementation for Android app updates. It can be copied into the Swayog web dashboard project to serve as the update server.

## Architecture

```
Android App
    ↓
GET /api/v1/app/update/latest.json
    ↓
Web Dashboard (this module)
    ↓
Cloudflare R2
    ↓
latest.json + APK files
```

## Installation

1. Copy this entire `web-update` folder into your web dashboard project
2. Install dependencies: `npm install`
3. Configure environment variables (see below)
4. Integrate the routes into your Express app

## Environment Variables

Required for R2 integration:

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=swayog-dashboard
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-domain.com
```

Optional:

```bash
PUBLIC_DISTRIBUTION_URL=https://your-public-domain.com
WEB_DOMAIN=https://swayog-dashboard.vercel.app
```

## Integration

Add to your Express app:

```typescript
import { appUpdateRoutes } from './web-update/src/routes';

app.use('/api/v1/app/update', appUpdateRoutes);
```

## Endpoints

### GET /api/v1/app/update/latest.json

Returns the latest Android app update manifest with:

- versionCode, versionName
- APK download URL
- SHA-256 checksum
- Release notes
- Mandatory update flag

### GET /api/v1/app/update/download/latest

Redirects to the latest APK download URL.

### GET /api/v1/app/update/releases/android/:versionName/build-:versionCode/app-release.apk

Redirects to a specific version's APK.

## R2 Storage Structure

The module expects the following R2 structure:

```
R2 Bucket
├── latest.json (canonical manifest)
├── releases/
│   └── android/
│       ├── latest.apk
│       └── {versionName}/
│           └── build-{versionCode}/
│               └── app-release.apk
```

## Deployment Workflow

1. Android code changes are pushed to main branch
2. GitHub Actions builds signed release APK
3. Deploy script uploads APK to R2 and generates latest.json
4. This module serves latest.json to Android apps
5. Android apps check for updates and download from R2

## Dependencies

- @aws-sdk/client-s3 (for R2 S3-compatible API)
- express
- typescript

## Security Notes

- R2 credentials are server-side only
- Never expose R2 credentials to Android apps
- APK URLs should use public CDN or presigned URLs
- manifest.json is public, contains no secrets