import fs from "fs";
import path from "path";
import crypto from "crypto";
import { uploadToR2, getFromR2, isR2Configured, getBucketName } from "../src/services/r2StorageService.js";
import { AppUpdateManifest } from "../src/modules/app-update/appUpdate.controller.js";

/**
 * Script to deploy a built APK release to Cloudflare R2 and update canonical manifests:
 * - releases/android/{versionName}/build-{versionCode}/app-release.apk
 * - releases/android/latest.apk
 * - latest.json (canonical root manifest)
 * - releases/android/latest.json (backward compatibility)
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

  if (!/^\d+(\.\d+){2,3}(-[0-9A-Za-z.-]+)?$/.test(versionName)) {
    console.error(`Error: Invalid versionName "${versionName}".`);
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

  // Step 2: Parse user-facing release notes
  let releaseNotes: string[] = [
    "Improved attendance tracking",
    "Improved attendance working-time calculation",
    "Improved attendance calendar synchronization",
    "Improved profile synchronization",
    "Performance improvements and bug fixes"
  ];

  if (notesFile && fs.existsSync(notesFile)) {
    const rawNotes = fs.readFileSync(notesFile, "utf-8");
    const rawLines = rawNotes
      .split("\n")
      .map(l => l.trim().replace(/^[-*•]\s*/, ""))
      .filter(Boolean);
    if (rawLines.length > 0) {
      releaseNotes = rawLines;
    }
  }

  // Step 3: Upload APK to canonical hierarchy
  const buildSpecificApkKey = `releases/android/${versionName}/build-${versionCode}/app-release.apk`;
  const latestApkKey = "releases/android/latest.apk";

  console.log(`\n[Deploy] Uploading APK to R2 targets:`);
  console.log(`  1. ${buildSpecificApkKey}`);
  await uploadToR2(apkBuffer, buildSpecificApkKey, "application/vnd.android.package-archive", `swayog-v${versionName}-${versionCode}.apk`);

  const uploadedApk = await getFromR2(buildSpecificApkKey);
  const uploadedSha256 = crypto.createHash("sha256").update(uploadedApk).digest("hex");
  if (uploadedApk.length !== fileSize || uploadedSha256 !== sha256) {
    throw new Error(`Uploaded APK verification failed for ${buildSpecificApkKey}`);
  }

  console.log(`  2. ${latestApkKey}`);
  await uploadToR2(apkBuffer, latestApkKey, "application/vnd.android.package-archive", "app-release.apk");

  // Determine authoritative public APK URL (permanent HTTPS URL, never 7-day presigned)
  const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;
  let publicApkUrl = "";
  if (!publicBaseUrl || publicBaseUrl.includes("your-public-domain.com") || publicBaseUrl.includes(".r2.cloudflarestorage.com")) {
    throw new Error("R2_PUBLIC_URL must be configured as the HTTPS public R2/CDN domain before publishing a release.");
  }
  publicApkUrl = `${publicBaseUrl.replace(/\/$/, "")}/${buildSpecificApkKey}`;
  console.log(`[Deploy] Using public CDN URL for APK: ${publicApkUrl}`);

  // Step 4: Construct release metadata
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
    title: `Swayog Employee App v${versionName} — Build ${versionCode}`,
    releaseNotes,
    releaseTag: releaseTag || `v${versionName}-build${versionCode}`,
    releaseTitle: releaseTitle || `Swayog Employee App v${versionName} — Build ${versionCode}`,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestBuffer = Buffer.from(manifestJson, "utf-8");

  // Step 5: Upload canonical manifest to latest.json and compatibility key
  console.log(`\n[Deploy] Uploading canonical manifest to R2:`);
  console.log(`  - latest.json (Primary)`);
  await uploadToR2(manifestBuffer, "latest.json", "application/json", "latest.json");
  console.log(`  - releases/android/latest.json (Compatibility)`);
  await uploadToR2(manifestBuffer, "releases/android/latest.json", "application/json", "latest.json");

  // Step 6: Verify uploaded manifest directly from R2
  console.log(`\n[Deploy] Verifying uploaded manifest in R2...`);
  const verifyBuffer = await getFromR2("latest.json");
  const verifyManifest = JSON.parse(verifyBuffer.toString("utf-8")) as AppUpdateManifest;
  if (verifyManifest.versionCode !== versionCode || verifyManifest.sha256 !== sha256) {
    throw new Error(`Verification failed: R2 latest.json does not match expected release (versionCode: ${verifyManifest.versionCode}, sha: ${verifyManifest.sha256})`);
  }
  console.log(`✅ Verified: R2 latest.json accurately reflects release v${versionName} (Build ${versionCode})`);

  // Step 7: HTTP accessibility check if public domain is provided
  const checkUrl = publicBaseUrl || "https://swayog-dashboard.vercel.app";
  try {
    const publicManifestUrl = `${checkUrl.replace(/\/$/, "")}/latest.json`;
    console.log(`[Deploy] Testing HTTP fetch from: ${publicManifestUrl}...`);
    const httpRes = await fetch(publicManifestUrl, { method: "HEAD" });
    if (httpRes.ok) {
      console.log(`✅ Public endpoint is live and accessible (HTTP ${httpRes.status})`);
    } else {
      console.warn(`⚠️ Public endpoint returned status HTTP ${httpRes.status} for manifest check.`);
    }
  } catch (e: any) {
    console.warn(`⚠️ External HTTP check skipped or unreachable: ${e.message}`);
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
