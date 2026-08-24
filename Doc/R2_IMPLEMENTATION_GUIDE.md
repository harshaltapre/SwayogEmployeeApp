# R2 Integration Implementation Guide
## SWAYOG Energy Web Dashboard - Cloudflare R2 Object Storage

**Date:** August 24, 2026  
**Status:** Implementation Complete - Ready for Deployment

---

## 1. OVERVIEW

This guide explains how to configure and deploy the Cloudflare R2 Object Storage integration for the SWAYOG Energy Web Dashboard. The integration replaces local filesystem storage with persistent cloud storage for task images.

### What Has Been Implemented

✅ **R2 Storage Service Module** (`backend/src/services/r2StorageService.ts`)
- S3-compatible client for Cloudflare R2
- Upload, download, delete operations
- File validation (type, size)
- Presigned URL generation
- Public URL generation
- Configuration status checking

✅ **Database Schema Updates** (`backend/prisma/schema.prisma`)
- Added `objectKey`, `fileName`, `mimeType`, `fileSize` fields to `TaskImage` model
- Backward compatible with existing data
- Index on `objectKey` for performance

✅ **Task Image Upload Routes** (`backend/src/routes/taskImages.ts`)
- Modified to use R2 when configured
- Automatic fallback to local storage if R2 not configured
- Memory storage for R2, disk storage for fallback
- Watermarking support for both modes

✅ **Task Service Updates** (`backend/src/modules/tasks/tasks.service.ts`)
- `processAndSaveBase64Photos()` now async with R2 support
- Site photos uploaded to R2 when configured
- Before/after images for AMC visits uploaded to R2
- Automatic fallback to local storage

✅ **Watermark Library Update** (`backend/src/lib/watermark.ts`)
- Now accepts both file paths and buffers
- Supports in-memory processing for R2 uploads

✅ **Environment Configuration** (`backend/src/config/env.ts`)
- Added R2 environment variables with validation
- Optional configuration (graceful fallback)

✅ **Dependencies** (`backend/package.json`)
- Added `@aws-sdk/client-s3` v3.600.0
- Added `@aws-sdk/s3-request-presigner` v3.600.0

---

## 2. CLOUDFLARE R2 SETUP

### Step 1: Create Cloudflare Account
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up or log in
3. Navigate to **R2** in the left sidebar

### Step 2: Create R2 Bucket
1. Click **Create Bucket**
2. Bucket name: `swayog-dashboard` (or your preferred name)
3. Region: Select nearest region (e.g., `ap-south-1` for India)
4. Click **Create Bucket**

### Step 3: Get Account ID
1. Your Account ID is visible in the Cloudflare dashboard URL
2. Or go to **Workers & Pages** → **Overview** → **Account ID**
3. Copy the Account ID (format: `0470c51de0d554e8fc54bdfb18e27fd4`)

### Step 4: Create API Token
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Custom Token** template
4. Permissions:
   - Account → Cloudflare R2 → Edit
5. Click **Continue to summary** → **Create Token**
6. Copy the **Token ID** (this is your `R2_ACCESS_KEY_ID`)
7. Copy the **Client Secret** (this is your `R2_SECRET_ACCESS_KEY`)

### Step 5: Configure Bucket Access
1. Go to **R2** → **swayog-dashboard** bucket
2. Click **Settings** → **Public Access**
3. **Option A (Recommended):** Enable public access
   - Click **Enable Public Access**
   - This allows direct public URLs for images
   - Set CORS rules if needed
4. **Option B:** Keep private and use presigned URLs
   - Bucket remains private
   - Backend generates presigned URLs for access

### Step 6: Get R2 Endpoint
1. Your R2 endpoint follows this format:
   ```
   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```
2. Example: `https://0470c51de0d554e8fc54bdfb18e27fd4.r2.cloudflarestorage.com`

---

## 3. ENVIRONMENT CONFIGURATION

### Step 1: Update Local .env File
Add the following to your `backend/.env` file:

```bash
# Cloudflare R2 Object Storage
R2_ACCOUNT_ID=0470c51de0d554e8fc54bdfb18e27fd4
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=swayog-dashboard
R2_ENDPOINT=https://0470c51de0d554e8fc54bdfb18e27fd4.r2.cloudflarestorage.com
```

### Step 2: Configure Vercel Environment Variables
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_ENDPOINT`
4. Set environment: **Production** (and Preview if desired)
5. Click **Save**

### Step 3: Verify Configuration
The application will automatically detect if R2 is configured:
- If configured: Uses R2 for all image uploads
- If not configured: Falls back to local filesystem (for development/testing)

---

## 4. HOW THE INTEGRATION WORKS

### Upload Flow

```
Employee Uploads Image
    ↓
Multer receives file (memory storage if R2 configured)
    ↓
Sharp adds watermark (employee name, timestamp, GPS)
    ↓
R2 Service uploads to Cloudflare R2
    ↓
Database stores metadata (objectKey, URL, fileSize, etc.)
    ↓
Frontend receives R2 public URL
    ↓
Image displayed from R2 CDN
```

### Object Key Structure

Images are stored with this structure in R2:
```
swayog-dashboard/
  tasks/
    {taskId}/
      before/
        {uuid}.jpg
      after/
        {uuid}.jpg
      site-visit/
        {uuid}.jpg
        {uuid}.jpg
        ...
```

Example object key: `tasks/12345/before/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

### Database Storage

The `TaskImage` table now stores:
- `url`: R2 public URL (or local path for fallback)
- `objectKey`: R2 object key (null for local storage)
- `fileName`: Original filename
- `mimeType`: Image MIME type
- `fileSize`: File size in bytes
- `latitude`, `longitude`: GPS coordinates
- `watermarkText`: Watermark metadata

---

## 5. TESTING

### Local Testing

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test image upload:**
   - Use the frontend to upload task images
   - Check console logs for `[R2] Uploaded file:` messages
   - Verify images appear in Cloudflare R2 dashboard

3. **Test fallback:**
   - Remove R2 environment variables
   - Restart backend
   - Upload images should save to local `uploads/` directory
   - Check console for fallback behavior

### Production Testing

1. **Deploy to Vercel:**
   ```bash
   git push origin main
   ```

2. **Verify R2 status:**
   - Upload a test image
   - Check response includes `storage: "r2"` and `r2Status` object
   - Verify image appears in R2 bucket

3. **Test image retrieval:**
   - View task images in frontend
   - Verify images load from R2 URLs
   - Check browser network tab for R2 requests

---

## 6. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Cloudflare R2 bucket created
- [ ] R2 API tokens generated
- [ ] Local .env configured with R2 variables
- [ ] Vercel environment variables set
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] Dependencies installed (`npm install`)

### Deployment
- [ ] Push code to Git
- [ ] Vercel auto-deploys
- [ ] Verify build succeeds
- [ ] Check Vercel logs for errors

### Post-Deployment
- [ ] Test image upload in production
- [ ] Verify images appear in R2 bucket
- [ ] Test image retrieval in frontend
- [ ] Check for any console errors
- [ ] Monitor R2 usage in Cloudflare dashboard

---

## 7. MIGRATING EXISTING LOCAL IMAGES

### Current Status
- Existing images in local `uploads/` directory are NOT automatically migrated
- New uploads will use R2 (if configured)
- Old images remain accessible via local paths

### Migration Strategy

A migration script will be provided to:
1. Read existing local images from database
2. Upload each image to R2
3. Update database with R2 object keys and URLs
4. Verify all uploads succeeded
5. Optionally delete local files after verification

**Note:** Do not delete local files until migration is verified successful.

### Manual Migration (If Needed)

For immediate migration of critical images:
1. Download images from local server
2. Upload manually to R2 bucket
3. Update database records manually
4. Test image retrieval

---

## 8. TROUBLESHOOTING

### Issue: Images not uploading to R2

**Check:**
1. R2 environment variables are set correctly
2. R2 bucket exists and is accessible
3. API tokens have correct permissions
4. Network connectivity to Cloudflare

**Debug:**
```bash
# Check R2 status in logs
# Response includes r2Status object with configuration details
```

### Issue: Images not displaying in frontend

**Check:**
1. R2 bucket has public access enabled
2. CORS rules allow frontend domain
3. URLs in database are correct R2 URLs
4. Browser console for network errors

**Solution:**
- Enable public access on R2 bucket
- Or implement presigned URL generation
- Configure CORS rules in R2 settings

### Issue: Fallback to local storage

**Cause:** R2 environment variables not set or invalid

**Solution:**
- Verify all 5 R2 environment variables are set
- Check for typos in variable names
- Restart backend after adding variables

### Issue: TypeScript errors

**Check:**
1. Dependencies installed: `npm install`
2. Prisma client generated: `npx prisma generate`
3. TypeScript compilation: `npm run typecheck`

---

## 9. SECURITY CONSIDERATIONS

### ✅ Implemented
- R2 credentials stored in environment variables only
- Never exposed to frontend
- File type validation (jpeg, jpg, png, gif, webp)
- File size validation (max 10MB)
- Authentication required for uploads
- Authorization checks for task access

### ⚠️ Important
- Never commit `.env` file to Git
- Rotate R2 API tokens periodically
- Monitor R2 usage for unusual activity
- Set appropriate CORS rules on bucket
- Consider implementing rate limiting for uploads

---

## 10. COST ESTIMATES

### Cloudflare R2 Pricing (as of 2026)

- **Storage:** $0.015/GB/month
- **Class A Operations (Upload):** $4.50 per million requests
- **Class B Operations (Download):** $0.36 per million requests
- **Egress:** Free (no data transfer fees)

### Example Usage
- 1,000 tasks × 5 images × 2MB = 10GB storage
- Monthly cost: ~$0.15 for storage
- Upload cost: ~$0.02 per 5,000 uploads
- **Total estimated cost:** <$1/month for typical usage

---

## 11. FILES MODIFIED

### New Files
- `backend/src/services/r2StorageService.ts` - R2 service module
- `Doc/R2_INTEGRATION_ARCHITECTURE_REPORT.md` - Architecture analysis
- `Doc/R2_IMPLEMENTATION_GUIDE.md` - This guide

### Modified Files
- `backend/package.json` - Added AWS SDK dependencies
- `backend/src/config/env.ts` - Added R2 environment variables
- `backend/prisma/schema.prisma` - Added R2 fields to TaskImage
- `backend/src/routes/taskImages.ts` - R2 upload integration
- `backend/src/modules/tasks/tasks.service.ts` - R2 for base64 photos
- `backend/src/lib/watermark.ts` - Buffer support for R2
- `backend/.env.example` - Added R2 variable examples

### Database Changes
- Added columns to `TaskImage` table:
  - `objectKey` (String, nullable)
  - `fileName` (String, nullable)
  - `mimeType` (String, nullable)
  - `fileSize` (Int, nullable)
  - Updated `type` comment to include "site-visit"
  - Added index on `objectKey`

---

## 12. ROLLBACK PLAN

If issues arise, rollback is safe:

### Immediate Rollback
1. Remove R2 environment variables
2. Restart backend
3. System automatically falls back to local storage
4. No data loss

### Database Rollback
- Schema changes are additive (new nullable fields)
- Existing data unaffected
- Can remove fields later if needed

### Code Rollback
- Git revert to previous commit
- No breaking changes to existing functionality
- Local storage still works as before

---

## 13. NEXT STEPS

### Immediate
1. Configure Cloudflare R2 bucket
2. Set environment variables locally
3. Test image upload functionality
4. Deploy to Vercel with R2 variables

### Future Enhancements
- Implement migration script for existing local images
- Add image compression before upload
- Implement CDN caching headers
- Add image deletion functionality
- Implement presigned URLs for private buckets
- Add R2 usage monitoring and alerts

---

## 14. SUPPORT

### Cloudflare Documentation
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

### Internal Documentation
- Architecture Report: `Doc/R2_INTEGRATION_ARCHITECTURE_REPORT.md`
- R2 Service Module: `backend/src/services/r2StorageService.ts`

---

## 15. SUMMARY

The R2 integration is **complete and ready for deployment**. The system:

✅ Uses Cloudflare R2 for persistent image storage  
✅ Maintains backward compatibility with local storage  
✅ Preserves existing authentication and authorization  
✅ Does not modify inverter integrations  
✅ Includes comprehensive error handling and fallback  
✅ Provides detailed logging for debugging  
✅ Is secure with credential isolation  
✅ Is cost-effective with Cloudflare's pricing  

**Status:** Ready for production deployment after R2 bucket configuration.

---

**Implementation Date:** August 24, 2026  
**Implemented By:** Cascade AI Assistant  
**Version:** 1.0
