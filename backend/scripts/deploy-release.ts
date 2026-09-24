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

  const minimumVersionCode = minVersionCodeStr ? parseInt(minVersionCodeStr, 10) : 1;
  const mandatory = mandatoryStr === "true";

  if (!fs.existsSync(apkPath)) {
    console.error(`Error: APK file not found at ${apkPath}`);
    process.exit(1);
  }

  const isCI = process.env.CI === "true";
  const r2Available = isR2Configured();
  if (!r2Available) {
    if (isCI) {
      console.error("::error::Fatal: Cloudflare R2 is not configured in CI environment. Release pipeline cannot continue without authoritative R2 deployment.");
      process.exit(1);
    }
    console.warn("⚠️ Warning: Cloudflare R2 is not configured. Release manifests will be updated locally and prepared for deployment.");
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
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#"))
      .map(l => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (rawLines.length > 0) {
      releaseNotes = rawLines;
    }
  }

  const buildSpecificApkKey = `releases/android/${versionName}/build-${versionCode}/app-release.apk`;
  const latestApkKey = "releases/android/latest.apk";

  // Determine authoritative public APK URL
  const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;
  let publicApkUrl = "";
  
  if (publicBaseUrl && !publicBaseUrl.includes(".r2.cloudflarestorage.com") && !publicBaseUrl.includes("your-public-domain.com")) {
    publicApkUrl = `${publicBaseUrl.replace(/\/$/, "")}/${buildSpecificApkKey}`;
    console.log(`[Deploy] Using public CDN URL for APK: ${publicApkUrl}`);
  } else {
    const webDomain = process.env.WEB_DOMAIN || "https://swayog-dashboard.vercel.app";
    publicApkUrl = `${webDomain.replace(/\/$/, "")}/releases/android/${versionName}/build-${versionCode}/app-release.apk`;
    console.log(`[Deploy] Using web dashboard download URL for APK: ${publicApkUrl}`);
  }

  // Step 3: Construct release metadata
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

  // Step 4: Copy APK locally into static distribution paths if public directory exists
  const staticApkDirs = [
    path.resolve(process.cwd(), `../public/releases/android/${versionName}/build-${versionCode}`),
    path.resolve(process.cwd(), "../public/releases/android")
  ];
  for (const dir of staticApkDirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
  try {
    fs.copyFileSync(apkPath, path.resolve(process.cwd(), `../public/releases/android/${versionName}/build-${versionCode}/app-release.apk`));
    fs.copyFileSync(apkPath, path.resolve(process.cwd(), "../public/releases/android/latest.apk"));
    console.log(`[Deploy] Copied release APK to public static assets`);
  } catch (e: any) {
    // Optional copy
  }

  // Step 5: Save manifest locally for web/repo distribution
  const localManifestPaths = [
    path.resolve(process.cwd(), "latest.json"),
    path.resolve(process.cwd(), "../latest.json"),
    path.resolve(process.cwd(), "../public/latest.json"),
    path.resolve(process.cwd(), "../dist/latest.json"),
    path.resolve(process.cwd(), "../web-update/latest.json")
  ];

  for (const targetPath of localManifestPaths) {
    try {
      const dir = path.dirname(targetPath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(targetPath, manifestJson, "utf-8");
        console.log(`[Deploy] Local manifest written to: ${targetPath}`);
      }
    } catch (e: any) {
      // Ignore write errors for non-existent optional dirs
    }
  }

  // Step 6: If R2 is configured, upload to R2
  if (r2Available) {
    console.log(`\n[Deploy] Uploading APK to R2 targets:`);
    console.log(`  1. ${buildSpecificApkKey}`);
    await uploadToR2(apkBuffer, buildSpecificApkKey, "application/vnd.android.package-archive", `swayog-v${versionName}-${versionCode}.apk`);

    console.log(`  2. ${latestApkKey}`);
    await uploadToR2(apkBuffer, latestApkKey, "application/vnd.android.package-archive", "app-release.apk");

    console.log(`\n[Deploy] Uploading canonical manifest to R2:`);
    console.log(`  - latest.json (Primary)`);
    await uploadToR2(manifestBuffer, "latest.json", "application/json", "latest.json");
    console.log(`  - releases/android/latest.json (Compatibility)`);
    await uploadToR2(manifestBuffer, "releases/android/latest.json", "application/json", "latest.json");

    // Verify uploaded manifest directly from R2
    console.log(`\n[Deploy] Verifying uploaded manifest in R2...`);
    const verifyBuffer = await getFromR2("latest.json");
    const verifyManifest = JSON.parse(verifyBuffer.toString("utf-8")) as AppUpdateManifest;
    if (verifyManifest.versionCode !== versionCode || verifyManifest.sha256 !== sha256) {
      throw new Error(`Verification failed: R2 latest.json does not match expected release (versionCode: ${verifyManifest.versionCode}, sha: ${verifyManifest.sha256})`);
    }
    console.log(`✅ Verified: R2 latest.json accurately reflects release v${versionName} (Build ${versionCode})`);

    const verifyCompatBuffer = await getFromR2("releases/android/latest.json");
    const verifyCompatManifest = JSON.parse(verifyCompatBuffer.toString("utf-8")) as AppUpdateManifest;
    if (verifyCompatManifest.versionCode !== versionCode || verifyCompatManifest.sha256 !== sha256) {
      throw new Error(`Verification failed: R2 releases/android/latest.json does not match expected release (versionCode: ${verifyCompatManifest.versionCode}, sha: ${verifyCompatManifest.sha256})`);
    }
    console.log(`✅ Verified: R2 releases/android/latest.json accurately reflects release v${versionName} (Build ${versionCode})`);
  }

  console.log("\n========================================================");
  console.log("🚀 RELEASE SUCCESSFULLY PROCESSED");
  console.log(`App ID:        ${manifest.appId}`);
  console.log(`Version Name:  ${versionName}`);
  console.log(`Version Code:  ${versionCode}`);
  console.log(`Minimum Code:  ${minimumVersionCode}`);
  console.log(`Mandatory:     ${mandatory}`);
  console.log(`SHA-256:       ${sha256}`);
  console.log(`R2 Upload:     ${r2Available ? "Uploaded to " + getBucketName() : "Local Manifest Updated (R2 not configured locally)"}`);
  console.log(`APK URL:       ${publicApkUrl}`);
  console.log("========================================================\n");
}

main().catch(err => {
  console.error("[Deploy] Fatal release deployment error:", err);
  process.exit(1);
});
