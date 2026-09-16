import fs from "fs";
import path from "path";
import crypto from "crypto";
import { uploadToR2, getFromR2, isR2Configured, getBucketName, generatePresignedUrl } from "../src/services/r2StorageService.js";
import { AppUpdateManifest } from "../src/modules/app-update/appUpdate.controller.js";

/**
 * Script to deploy a built APK release to Cloudflare R2 and update update manifests:
 * - releases/android/{versionName}/build-{versionCode}/app-release.apk
 * - releases/android/{versionName}/app-release.apk
 * - releases/android/latest.apk
 * - releases/android/{versionName}/build-{versionCode}/release.json
 * - releases/android/{versionName}/release.json
 * - releases/android/latest.json
 * - app/android/latest.json
 * - latest.json
 *
 * Usage:
 *   npx tsx scripts/deploy-release.ts <path-to-apk> <versionName> <versionCode> [minimumVersionCode] [mandatory] [notesFile] [releaseTag] [releaseTitle]
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/deploy-release.ts <apkPath> <versionName> <versionCode> [minimumVersionCode] [mandatory] [notesFile] [releaseTag] [releaseTitle]");
    process.exit(1);
  }

  const [apkPath, versionName, versionCodeStr, minVersionCodeStr, mandatoryStr, notesFile, releaseTag, releaseTitle] = args;
  const versionCode = parseInt(versionCodeStr, 10);
  if (isNaN(versionCode) || versionCode <= 0) {
    console.error(`Error: Invalid versionCode "${versionCodeStr}". Must be a positive integer.`);
    process.exit(1);
  }

  const minimumVersionCode = minVersionCodeStr ? parseInt(minVersionCodeStr, 10) : 1;
  const mandatory = mandatoryStr === "true";

  if (!fs.existsSync(apkPath)) {
    console.error(`Error: APK file not found at ${apkPath}`);
    process.exit(1);
  }

  if (!isR2Configured()) {
    console.error("Error: Cloudflare R2 is not configured. Check environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, etc.)");
    process.exit(1);
  }

  console.log(`\n========================================================`);
  console.log(`[Deploy] Initiating Release v${versionName} (Build ${versionCode})`);
  console.log(`========================================================`);

  // Step 1: Read APK and calculate SHA-256 and size
  const apkBuffer = fs.readFileSync(apkPath);
  const sha256 = crypto.createHash("sha256").update(apkBuffer).digest("hex");
  const fileSize = apkBuffer.length;

  console.log(`[Deploy] APK Path:    ${apkPath}`);
  console.log(`[Deploy] APK Size:    ${(fileSize / (1024 * 1024)).toFixed(2)} MB (${fileSize} bytes)`);
  console.log(`[Deploy] SHA-256:     ${sha256}`);

  // Step 2: Parse user-facing release notes - output as flat string[] array
  let releaseNotes: string[] = [
    "Improved attendance tracking and calendar sync",
    "Optimized working-hour calculations",
    "Performance improvements and bug fixes"
  ];

  if (notesFile && fs.existsSync(notesFile)) {
    const rawNotes = fs.readFileSync(notesFile, "utf-8");
    const rawLines = rawNotes.split("\n").map(l => l.trim().replace(/^[-*•]\s*/, "")).filter(Boolean);
    if (rawLines.length > 0) {
      releaseNotes = rawLines;
    }
  }

  // Step 3: Upload APK to release hierarchy
  const buildSpecificApkKey = `releases/android/${versionName}/build-${versionCode}/app-release.apk`;
  const versionedApkKey = `releases/android/${versionName}/app-release.apk`;
  const latestApkKey = "releases/android/latest.apk";

  console.log(`\n[Deploy] Uploading APK to R2 targets:`);
  console.log(`  1. ${buildSpecificApkKey}`);
  await uploadToR2(apkBuffer, buildSpecificApkKey, "application/vnd.android.package-archive", `swayog-v${versionName}-${versionCode}.apk`);

  console.log(`  2. ${versionedApkKey}`);
  await uploadToR2(apkBuffer, versionedApkKey, "application/vnd.android.package-archive", `app-${versionName}.apk`);

  console.log(`  3. ${latestApkKey}`);
  await uploadToR2(apkBuffer, latestApkKey, "application/vnd.android.package-archive", "app-release.apk");

  // Determine public APK URL
  const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;
  let publicApkUrl = "";
  
  if (publicBaseUrl && !publicBaseUrl.includes(".r2.cloudflarestorage.com") && !publicBaseUrl.includes("your-public-domain.com")) {
    publicApkUrl = `${publicBaseUrl.replace(/\/$/, "")}/${buildSpecificApkKey}`;
  } else {
    try {
      // Generate presigned URL valid for 30 days (2,592,000 seconds)
      publicApkUrl = await generatePresignedUrl(buildSpecificApkKey, 2592000);
      console.log(`[Deploy] Generated 30-day presigned download URL for APK`);
    } catch {
      // Fallback to permanent backend redirect endpoint
      publicApkUrl = "https://swayog-dashboard.vercel.app/api/v1/app/update/download/latest";
    }
  }

  // Step 4: Construct release metadata conforming to Section 5
  const manifest: AppUpdateManifest = {
    appId: "com.swayog.employee",
    platform: "android",
    versionName,
    versionCode,
    releaseDate: new Date().toISOString().split("T")[0],
    mandatory,
    minimumVersionCode,
    apkUrl: publicApkUrl,
    sha256,
    fileSize,
    title: `Swayog v${versionName}`,
    releaseNotes, // Flat string[] array
    releaseTag: releaseTag || `v${versionName}-build${versionCode}`,
    releaseTitle: releaseTitle || `Swayog Employee App v${versionName} — Build ${versionCode}`,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestBuffer = Buffer.from(manifestJson, "utf-8");

  // Step 5: Upload manifests across all required keys
  const manifestKeys = [
    `releases/android/${versionName}/build-${versionCode}/release.json`,
    `releases/android/${versionName}/release.json`,
    "releases/android/latest.json",
    "app/android/latest.json",
    "latest.json",
  ];

  console.log(`\n[Deploy] Uploading update manifests to R2:`);
  for (const mKey of manifestKeys) {
    console.log(`  - ${mKey}`);
    await uploadToR2(manifestBuffer, mKey, "application/json", path.basename(mKey));
  }

  // Step 6: Verify uploaded manifest directly from R2
  console.log(`\n[Deploy] Verifying uploaded manifest in R2...`);
  const verifyBuffer = await getFromR2("releases/android/latest.json");
  const verifyManifest = JSON.parse(verifyBuffer.toString("utf-8")) as AppUpdateManifest;
  if (verifyManifest.versionCode !== versionCode || verifyManifest.sha256 !== sha256) {
    throw new Error(`Verification failed: R2 latest manifest does not match expected release (versionCode: ${verifyManifest.versionCode}, sha: ${verifyManifest.sha256})`);
  }
  console.log(`✅ Verified: R2 manifest accurately reflects release v${versionName} (Build ${versionCode})`);

  // Step 7: HTTP accessibility verification if a public domain is configured
  if (publicBaseUrl) {
    try {
      const publicManifestUrl = `${publicBaseUrl.replace(/\/$/, "")}/releases/android/latest.json`;
      console.log(`[Deploy] Testing HTTP fetch from public CDN: ${publicManifestUrl}...`);
      const httpRes = await fetch(publicManifestUrl, { method: "HEAD" });
      if (httpRes.ok) {
        console.log(`✅ Public CDN endpoint is live and accessible (HTTP ${httpRes.status})`);
      } else {
        console.warn(`⚠️ Public CDN returned status HTTP ${httpRes.status} for manifest check.`);
      }
    } catch (e: any) {
      console.warn(`⚠️ Could not complete external HTTP check: ${e.message}`);
    }
  }

  console.log("\n========================================================");
  console.log("🚀 RELEASE SUCCESSFULLY DEPLOYED TO CLOUDFLARE R2");
  console.log(`App ID:        ${manifest.appId}`);
  console.log(`Version Name:  ${versionName}`);
  console.log(`Version Code:  ${versionCode}`);
  console.log(`Minimum Code:  ${minimumVersionCode}`);
  console.log(`Mandatory:     ${mandatory}`);
  console.log(`SHA-256:       ${sha256}`);
  console.log(`Bucket:        ${getBucketName()}`);
  console.log(`APK URL:       ${publicApkUrl}`);
  console.log("========================================================\n");
}

main().catch(err => {
  console.error("[Deploy] Fatal release deployment error:", err);
  process.exit(1);
});
