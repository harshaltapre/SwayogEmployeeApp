/**
 * deploy-release.ts — Self-contained release deployment script.
 *
 * IMPORTANT: This script intentionally does NOT import from src/config/env.ts or
 * any module that chains to it (e.g. r2StorageService). env.ts runs Zod validation
 * at module load time and requires DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
 * — none of which are needed to upload an APK to Cloudflare R2.
 *
 * This script reads R2 credentials directly from process.env and uses
 * @aws-sdk/client-s3 without going through the application config layer.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import child_process from "child_process";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// Minimal self-contained R2 client — does NOT import from src/config/env.ts
// ---------------------------------------------------------------------------

function getR2Client(): S3Client | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || "swayog-dashboard";
}

function isR2Configured(): boolean {
  return !!getR2Client();
}

async function uploadToR2(
  client: S3Client,
  buffer: Buffer,
  objectKey: string,
  contentType: string,
  fileName: string
): Promise<void> {
  await client.send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
    Body: buffer,
    ContentType: contentType,
    Metadata: { originalFileName: fileName, uploadedAt: new Date().toISOString() },
  }));
  console.log(`[Deploy] Uploaded: ${objectKey} (${buffer.length} bytes)`);
}

async function getFromR2(client: S3Client, objectKey: string): Promise<Buffer> {
  const res = await client.send(new GetObjectCommand({ Bucket: getBucketName(), Key: objectKey }));
  if (!res.Body) throw new Error(`No body for key: ${objectKey}`);
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as any) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ---------------------------------------------------------------------------
// AppUpdateManifest — inlined to avoid importing appUpdate.controller
// ---------------------------------------------------------------------------

interface AppUpdateManifest {
  appId: string;
  platform: string;
  versionCode: number;
  versionName: string;
  minimumVersionCode?: number;
  mandatory: boolean;
  releaseDate?: string;
  title?: string;
  releaseNotes: string[];
  apkUrl: string;
  sha256: string;
  certificateSha256?: string;
  fileSize?: number;
  releaseTag?: string;
  releaseTitle?: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  // Safe R2 configuration diagnostics (no secret values printed)
  console.log("====================================");
  console.log("STAGE: R2 Configuration");
  console.log("====================================");
  console.log(`R2_ENDPOINT:          ${process.env.R2_ENDPOINT          ? "PRESENT" : "MISSING"}`);
  console.log(`R2_ACCESS_KEY_ID:     ${process.env.R2_ACCESS_KEY_ID     ? "PRESENT" : "MISSING"}`);
  console.log(`R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY ? "PRESENT" : "MISSING"}`);
  console.log(`R2_BUCKET_NAME:       ${process.env.R2_BUCKET_NAME       ? "PRESENT" : "MISSING (default: swayog-dashboard)"}`);
  console.log(`R2 configured:        ${r2Available}`);

  if (!r2Available) {
    if (isCI) {
      console.error("::error::Fatal: Cloudflare R2 is not configured in CI environment. Release pipeline cannot continue without authoritative R2 deployment.");
      process.exit(1);
    }
    console.warn("⚠️ Warning: Cloudflare R2 is not configured. Release manifests will be updated locally and prepared for deployment.");
  }

  const r2Client = r2Available ? getR2Client()! : null;

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

  // Step 3: Extract and verify signing certificate directly from the built APK
  let actualApkCertSha256: string | undefined = undefined;
  try {
    const apksignerCmd = process.env.APKSIGNER || "apksigner";
    const certOutput = child_process.execSync(`${apksignerCmd} verify --print-certs "${apkPath}"`, { stdio: ["pipe", "pipe", "ignore"] }).toString();
    // Match both "V2 Signer: certificate SHA-256 digest:" and "Signer #1 certificate SHA-256 digest:"
    const match = certOutput.match(/certificate SHA-256 digest:\s*([a-fA-F0-9:]+)/i);
    if (match && match[1]) {
      actualApkCertSha256 = match[1].replace(/[:\s]/g, "").toLowerCase().trim();
      console.log(`[Deploy] Extracted APK signing certificate SHA-256: ${actualApkCertSha256}`);
    } else {
      console.warn("[Deploy] Could not extract certificate SHA-256 from apksigner output.");
    }
  } catch (e: any) {
    console.warn("[Deploy] apksigner execution unavailable; using environment variables for cert verification.");
  }

  const expectedProdCert = (process.env.PRODUCTION_CERT_SHA256 || process.env.CERTIFICATE_SHA256 || "")
    .replace(/[:\s]/g, "")
    .toLowerCase()
    .trim() || undefined;

  if (actualApkCertSha256 && expectedProdCert && actualApkCertSha256 !== expectedProdCert) {
    throw new Error(`[Deploy] CRITICAL SECURITY MISMATCH: APK certificate (${actualApkCertSha256}) does not match expected production certificate (${expectedProdCert})! Deployment aborted.`);
  }

  const certSha256 = actualApkCertSha256 || expectedProdCert;
  console.log(`[Deploy] Final authoritative certificate SHA-256: ${certSha256 || "N/A"}`);

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
    certificateSha256: certSha256,
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

  // Step 6: Upload to Cloudflare R2 (required in CI)
  if (r2Available && r2Client) {
    console.log(`\n[Deploy] Uploading APK to R2:`);
    console.log(`  1. ${buildSpecificApkKey}`);
    await uploadToR2(r2Client, apkBuffer, buildSpecificApkKey, "application/vnd.android.package-archive", `swayog-v${versionName}-${versionCode}.apk`);

    console.log(`  2. ${latestApkKey}`);
    await uploadToR2(r2Client, apkBuffer, latestApkKey, "application/vnd.android.package-archive", "app-release.apk");

    console.log(`\n[Deploy] Uploading canonical manifest to R2:`);
    console.log(`  - latest.json (Primary)`);
    await uploadToR2(r2Client, manifestBuffer, "latest.json", "application/json", "latest.json");
    console.log(`  - releases/android/latest.json (Compatibility)`);
    await uploadToR2(r2Client, manifestBuffer, "releases/android/latest.json", "application/json", "latest.json");

    // Verify uploaded manifest directly from R2
    console.log(`\n[Deploy] Verifying uploaded manifest in R2...`);
    const verifyBuffer = await getFromR2(r2Client, "latest.json");
    const verifyManifest = JSON.parse(verifyBuffer.toString("utf-8")) as AppUpdateManifest;
    if (verifyManifest.versionCode !== versionCode || verifyManifest.sha256 !== sha256) {
      throw new Error(`Verification failed: R2 latest.json mismatch (versionCode: ${verifyManifest.versionCode}, sha256: ${verifyManifest.sha256})`);
    }
    console.log(`✅ Verified: R2 latest.json reflects release v${versionName} (Build ${versionCode})`);

    const verifyCompatBuffer = await getFromR2(r2Client, "releases/android/latest.json");
    const verifyCompatManifest = JSON.parse(verifyCompatBuffer.toString("utf-8")) as AppUpdateManifest;
    if (verifyCompatManifest.versionCode !== versionCode || verifyCompatManifest.sha256 !== sha256) {
      throw new Error(`Verification failed: R2 releases/android/latest.json mismatch (versionCode: ${verifyCompatManifest.versionCode}, sha256: ${verifyCompatManifest.sha256})`);
    }
    console.log(`✅ Verified: R2 releases/android/latest.json reflects release v${versionName} (Build ${versionCode})`);
  }

  console.log("\n========================================================");
  console.log("🚀 RELEASE SUCCESSFULLY PROCESSED");
  console.log(`App ID:        ${manifest.appId}`);
  console.log(`Version Name:  ${versionName}`);
  console.log(`Version Code:  ${versionCode}`);
  console.log(`Minimum Code:  ${minimumVersionCode}`);
  console.log(`Mandatory:     ${mandatory}`);
  console.log(`SHA-256:       ${sha256}`);
  console.log(`Certificate:   ${certSha256 || "N/A"}`);
  console.log(`R2 Upload:     ${r2Available ? "Uploaded to " + getBucketName() : "Local only (R2 not configured)"}`);
  console.log(`APK URL:       ${publicApkUrl}`);
  console.log("========================================================\n");
}

main().catch(err => {
  console.error("[Deploy] Fatal release deployment error:", err);
  process.exit(1);
});
