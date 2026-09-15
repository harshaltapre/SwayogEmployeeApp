# Cloudflare R2 Public Access Configuration Guide

## Overview

This guide explains how to configure Cloudflare R2 for public APK distribution while keeping your source code repository private. This architecture ensures that employees can download and update the app without accessing your private GitHub repository.

## Architecture

```
PRIVATE GITHUB REPOSITORY
        ↓
   GITHUB ACTIONS
        ↓
 BUILD + SIGN APK
        ↓
 UPLOAD TO R2
        ↓
 PUBLIC R2/CDN
        ↓
latest.json + APK
        ↓
 MOBILE APP UPDATE
```

## Prerequisites

- Cloudflare account with R2 enabled
- R2 bucket created (e.g., `swayog-dashboard`)
- Custom domain (optional but recommended) for public access
- GitHub repository with release workflow configured

## Step 1: Configure R2 Bucket

### 1.1 Create R2 Bucket

1. Go to Cloudflare Dashboard → R2 → Create Bucket
2. Name: `swayog-dashboard` (or your preferred name)
3. Location: Choose nearest region to your users
4. Click "Create bucket"

### 1.2 Set Up Public Access

You have two options for public access:

#### Option A: Custom Domain (Recommended)

1. Go to your R2 bucket → Settings → Public Access
2. Click "Set up a custom domain"
3. Enter your domain: `releases.yourdomain.com` or `cdn.yourdomain.com`
4. Follow Cloudflare's DNS configuration instructions
5. Wait for SSL certificate provisioning

#### Option B: R2 Public URL (Quick Setup)

1. Go to your R2 bucket → Settings → Public Access
2. Enable "Allow public access"
3. Note the public URL format: `https://<bucket-name>.<account-id>.r2.cloudflarestorage.com`

## Step 2: Configure R2 Credentials

### 2.1 Get R2 API Credentials

1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Choose permissions:
   - Account → R2 → Edit
   - Account → R2 → Read
4. Create token and save:
   - Access Key ID
   - Secret Access Key
   - Account ID

### 2.2 Add to GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

Add the following secrets:

```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id  
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=swayog-dashboard
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://releases.yourdomain.com
```

If using Option B (R2 Public URL):
```
R2_PUBLIC_URL=https://swayog-dashboard.your-account-id.r2.cloudflarestorage.com
```

## Step 3: Configure Backend Environment

### 3.1 Backend Environment Variables

Add to your backend `.env` file:

```env
# Cloudflare R2 Object Storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=swayog-dashboard
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://releases.yourdomain.com
```

### 3.2 Vercel Environment Variables

Add to Vercel project settings:

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
R2_PUBLIC_URL
```

## Step 4: Configure Android App

### 4.1 Local Development

Add to `android-app/local.properties`:

```properties
PUBLIC_DISTRIBUTION_URL=https://releases.yourdomain.com
```

### 4.2 Production Build

The GitHub Actions workflow will automatically use the `R2_PUBLIC_URL` secret to configure the public distribution URL.

## Step 5: Test Public Access

### 5.1 Manual Upload Test

```bash
# Test R2 connection
cd backend
npx tsx scripts/test-r2-config.ts
```

### 5.2 Public URL Test

```bash
# Test public access to your bucket
curl -I https://releases.yourdomain.com/
```

### 5.3 Deploy Test Release

1. Create a test tag:
   ```bash
   git tag v1.0.0-test
   git push origin v1.0.0-test
   ```

2. GitHub Actions will automatically:
   - Build the APK
   - Sign with production key
   - Upload to R2
   - Generate latest.json
   - Update public endpoints

3. Test the public endpoints:
   ```bash
   curl https://releases.yourdomain.com/releases/android/latest.json
   ```

## Step 6: Update Manifest Structure

The system will automatically create the following structure in R2:

```
releases/
└── android/
    ├── 1.0.0/
    │   ├── build-21/
    │   │   └── app-release.apk
    │   └── app-release.apk
    ├── latest.apk
    └── latest.json
app/
└── android/
    └── latest.json
latest.json
```

## Step 7: Mobile App Update Flow

The Android app will:

1. **Primary Check**: Attempt to fetch `https://releases.yourdomain.com/releases/android/latest.json`
2. **Fallback**: If public URL fails, fall back to backend API
3. **Download**: Download APK from the public URL specified in manifest
4. **Verify**: SHA-256 checksum verification
5. **Install**: Android package installer

## Security Considerations

### What Remains Private

- ✅ Source code repository
- ✅ Git history
- ✅ GitHub Actions secrets
- ✅ R2 credentials
- ✅ Database credentials
- ✅ API secrets
- ✅ Signing private key
- ✅ Environment secrets

### What Becomes Public

- ✅ Production APK files
- ✅ Version information
- ✅ Build numbers
- ✅ Release dates
- ✅ User-facing release notes
- ✅ Public update manifest
- ✅ Public APK download URLs

### Security Best Practices

1. **Never commit secrets**: Use GitHub Secrets for all sensitive data
2. **Rotate credentials**: Regularly rotate R2 API keys
3. **Monitor access**: Enable Cloudflare R2 access logs
4. **Rate limiting**: Implement rate limiting on public endpoints
5. **SSL only**: Always use HTTPS for public access
6. **Bucket policies**: Use principle of least privilege for R2 access

## Troubleshooting

### Issue: HTTP 404 on Update Check

**Cause**: Public URL not configured or incorrect

**Solution**:
1. Verify `R2_PUBLIC_URL` is set in GitHub Secrets
2. Check R2 bucket public access is enabled
3. Test public URL manually with curl
4. Check Cloudflare DNS configuration

### Issue: APK Download Fails

**Cause**: APK not uploaded or incorrect permissions

**Solution**:
1. Check GitHub Actions logs for upload errors
2. Verify R2 credentials are correct
3. Check APK exists in R2 bucket
4. Verify public access permissions

### Issue: SHA-256 Verification Fails

**Cause**: Corrupted download or incorrect checksum

**Solution**:
1. Verify latest.json contains correct checksum
2. Re-run GitHub Actions workflow
3. Check R2 upload succeeded
4. Test APK download manually

### Issue: Public URL Not Accessible

**Cause**: DNS or SSL configuration issues

**Solution**:
1. Check DNS records point to correct R2 endpoint
2. Verify SSL certificate is provisioned
3. Check Cloudflare R2 public access settings
4. Test with direct R2 URL as fallback

## Maintenance

### Regular Tasks

1. **Monitor storage usage**: Check R2 bucket size and costs
2. **Review access logs**: Monitor for suspicious activity
3. **Update GitHub Secrets**: Rotate credentials periodically
4. **Clean old releases**: Remove outdated APK versions (optional)
5. **Test update flow**: Regular test of complete update pipeline

### Backup Strategy

- GitHub Actions automatically keeps artifacts for 60 days
- R2 provides object versioning (enable if needed)
- Consider keeping last 3-5 releases for rollback capability

## Cost Optimization

- R2 pricing: Free tier (10GB storage, 10M Class A operations/month)
- Egress costs: $0.009/GB (consider Cloudflare CDN)
- Cache optimization: Use Cloudflare CDN to reduce R2 egress
- Compression: APK files are already compressed

## Success Criteria

Your implementation is successful when:

- ✅ GitHub Actions successfully builds and uploads APK
- ✅ Public URL is accessible without authentication
- ✅ Mobile app can fetch latest.json from public URL
- ✅ APK download works from public URL
- ✅ SHA-256 verification succeeds
- ✅ Android installer launches successfully
- ✅ Source code repository remains private
- ✅ No secrets are exposed in public URLs

## Next Steps

1. Configure R2 bucket with public access
2. Add GitHub Secrets for R2 credentials
3. Set up custom domain (optional but recommended)
4. Test manual upload and public access
5. Deploy first production release
6. Test complete update flow on physical device
7. Monitor logs and user feedback

## Support

For issues with:
- **R2 Configuration**: Cloudflare Dashboard → R2 → Documentation
- **GitHub Actions**: Repository → Actions → Workflow runs
- **Mobile App**: Android Studio → Logcat
- **Backend**: Vercel Dashboard → Logs

---

**Document Version**: 1.0  
**Last Updated**: 2026-09-15  
**Maintained By**: DevOps Team