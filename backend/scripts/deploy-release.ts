import fs from "fs";
import path from "path";
import crypto from "crypto";
import { uploadToR2, isR2Configured, getBucketName } from "../src/services/r2StorageService.js";
import { AppUpdateManifest } from "../src/modules/app-update/appUpdate.controller.js";

/**
 * Script to deploy a built APK release to Cloudflare R2 and update releases/android/latest.json
 *
 * Usage:
 *   npx tsx scripts/deploy-release.ts <path-to-apk> <versionName> <versionCode> [minimumVersionCode] [mandatory: true/false] [releaseNotesFile]
 *
 * Example:
 *   npx tsx scripts/deploy-release.ts ../android-app/app/build/outputs/apk/release/app-release.apk 2.5.0 25 23 false
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/deploy-release.ts <apkPath> <versionName> <versionCode> [minimumVersionCode] [mandatory] [notesFile]");
    process.exit(1);
  }

  const [apkPath, versionName, versionCodeStr, minVersionCodeStr, mandatoryStr, notesFile] = args;
  const versionCode = parseInt(versionCodeStr, 10);
  const minimumVersionCode = minVersionCodeStr ? parseInt(minVersionCodeStr, 10) : versionCode;
  const mandatory = mandatoryStr === "true";

  if (!fs.existsSync(apkPath)) {
    console.error(`Error: APK file not found at ${apkPath}`);
    process.exit(1);
  }

  if (!isR2Configured()) {
    console.error("Error: Cloudflare R2 is not configured. Check your environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, etc.)");
    process.exit(1);
  }

  console.log(`[Deploy] Processing release v${versionName} (build ${versionCode})...`);

  // Read APK and calculate SHA-256
  const apkBuffer = fs.readFileSync(apkPath);
  const sha256 = crypto.createHash("sha256").update(apkBuffer).digest("hex");
  const fileSize = apkBuffer.length;

  console.log(`[Deploy] APK Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`[Deploy] SHA-256: ${sha256}`);

  // Parse release notes if provided
  let releaseNotes: string[] = [
    `Swayog Employee App v${versionName}`,
    "Performance improvements and bug fixes",
  ];
  if (notesFile && fs.existsSync(notesFile)) {
    const rawNotes = fs.readFileSync(notesFile, "utf-8");
    releaseNotes = rawNotes.split("\n").map(line => line.trim().replace(/^[-*•]\s*/, "")).filter(Boolean);
  }

  // Upload APK to permanent versioned path: releases/android/{versionName}/app-release.apk
  const versionedApkKey = `releases/android/${versionName}/app-release.apk`;
  console.log(`[Deploy] Uploading APK to R2: ${versionedApkKey}...`);
  await uploadToR2(apkBuffer, versionedApkKey, "application/vnd.android.package-archive", `app-${versionName}.apk`);

  // Also upload/overwrite latest APK alias: releases/android/latest.apk
  const latestApkKey = "releases/android/latest.apk";
  console.log(`[Deploy] Updating latest APK alias: ${latestApkKey}...`);
  await uploadToR2(apkBuffer, latestApkKey, "application/vnd.android.package-archive", "app-release.apk");

  // Construct manifest
  const manifest: AppUpdateManifest = {
    versionCode,
    versionName,
    minimumVersionCode,
    mandatory,
    releaseDate: new Date().toISOString().split("T")[0],
    title: `Swayog v${versionName}`,
    releaseNotes,
    apkUrl: versionedApkKey,
    sha256,
    fileSize,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestBuffer = Buffer.from(manifestJson, "utf-8");

  // Save versioned release.json: releases/android/{versionName}/release.json
  const versionedManifestKey = `releases/android/${versionName}/release.json`;
  console.log(`[Deploy] Uploading versioned manifest: ${versionedManifestKey}...`);
  await uploadToR2(manifestBuffer, versionedManifestKey, "application/json", "release.json");

  // Save latest manifest: releases/android/latest.json
  const latestManifestKey = "releases/android/latest.json";
  console.log(`[Deploy] Updating latest manifest: ${latestManifestKey}...`);
  await uploadToR2(manifestBuffer, latestManifestKey, "application/json", "latest.json");

  console.log("\n========================================================");
  console.log("🚀 RELEASE SUCCESSFULLY DEPLOYED TO R2");
  console.log(`Version:       ${versionName} (${versionCode})`);
  console.log(`Minimum Code:  ${minimumVersionCode}`);
  console.log(`Mandatory:     ${mandatory}`);
  console.log(`SHA-256:       ${sha256}`);
  console.log(`Bucket:        ${getBucketName()}`);
  console.log(`Manifest:      ${latestManifestKey}`);
  console.log("========================================================\n");
}

main().catch(err => {
  console.error("[Deploy] Fatal release error:", err);
  process.exit(1);
});
