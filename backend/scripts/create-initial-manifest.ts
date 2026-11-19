import { uploadToR2, isR2Configured, getBucketName } from "../src/services/r2StorageService.js";

/**
 * Create initial latest.json manifest for current app version
 * This represents the current state (v1.0.0, build 1) as the baseline
 */
async function createInitialManifest() {
  console.log("==========================================");
  console.log("Creating Initial latest.json Manifest");
  console.log("==========================================");
  
  if (!isR2Configured()) {
    console.error("❌ R2 is not configured. Check environment variables.");
    process.exit(1);
  }
  
  // Baseline production release: Build 20
  const currentManifest = {
    appId: "com.swayog.employee",
    platform: "android",
    versionName: "1.0.0",
    versionCode: 20,
    releaseTag: "v1.0.0-build20",
    releaseTitle: "Swayog Employee App v1.0.0 — Build 20",
    mandatory: false,
    minimumVersionCode: 1,
    releaseDate: "2026-09-15",
    apkUrl: "https://swayog-dashboard.vercel.app/api/v1/app/update/download/latest",
    sha256: "dd5422cce433152653308bb0ba04ba6159a35ebf4c4b9f90eeb32670289ba3c4",
    fileSize: 0,
    title: "Swayog Employee App v1.0.0 — Build 20",
    releaseNotes: [
      "Improved attendance tracking",
      "Improved attendance working-time calculation",
      "Improved attendance calendar synchronization",
      "Improved employee/admin attendance synchronization",
      "Improved GPS attendance verification",
      "Improved profile synchronization",
      "Improved app update system",
      "Bug fixes and performance improvements"
    ]
  };
  
  const manifestJson = JSON.stringify(currentManifest, null, 2);
  const manifestBuffer = Buffer.from(manifestJson, "utf-8");
  
  console.log("\nManifest content:");
  console.log(manifestJson);
  
  // Upload to all required locations
  const manifestKeys = [
    "releases/android/latest.json",
    "app/android/latest.json", 
    "latest.json"
  ];
  
  console.log("\nUploading manifest to R2 locations:");
  for (const key of manifestKeys) {
    console.log(`  - ${key}`);
    try {
      await uploadToR2(manifestBuffer, key, "application/json", "latest.json");
      console.log(`  ✅ Uploaded: ${key}`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${key} - ${error.message}`);
    }
  }
  
  console.log("\n==========================================");
  console.log("✅ Initial latest.json created successfully");
  console.log("==========================================");
  console.log("\nNext steps:");
  console.log("1. Test public access to the manifest");
  console.log("2. Build and upload a real APK to update the manifest");
  console.log("3. Configure Android app to use the public URL");
  console.log("==========================================");
}

createInitialManifest().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});