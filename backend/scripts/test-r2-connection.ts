import { uploadToR2, getFromR2, isR2Configured, getBucketName } from "../src/services/r2StorageService.js";

/**
 * Quick test script to verify R2 connection and create initial latest.json
 */
async function testR2Connection() {
  console.log("==========================================");
  console.log("R2 Connection Test");
  console.log("==========================================");
  
  if (!isR2Configured()) {
    console.error("❌ R2 is not configured. Check environment variables.");
    process.exit(1);
  }
  
  console.log("✅ R2 is configured");
  console.log(`Bucket: ${getBucketName()}`);
  
  // Test by uploading a simple test file
  const testContent = Buffer.from(JSON.stringify({
    test: true,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  try {
    console.log("\nTesting upload...");
    const result = await uploadToR2(
      testContent,
      "test-connection.json",
      "application/json",
      "test-connection.json"
    );
    console.log("✅ Upload successful:", result.objectKey);
    
    console.log("\nTesting download...");
    const downloaded = await getFromR2("test-connection.json");
    console.log("✅ Download successful:", downloaded.length, "bytes");
    
    console.log("\n==========================================");
    console.log("✅ R2 connection test PASSED");
    console.log("==========================================");
    
  } catch (error: any) {
    console.error("❌ R2 connection test FAILED:", error.message);
    process.exit(1);
  }
}

testR2Connection().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});