import { uploadToR2, generatePresignedUrl, deleteFromR2, generateObjectKey } from "./services/r2StorageService.js";

async function testPresignedUrl() {
  console.log("=== TESTING CLOUDFLARE R2 PRESIGNED GET URL PIPELINE ===");

  const sampleBuffer = Buffer.from("PRESIGNED_URL_TEST_IMAGE_DATA_12345", "utf-8");
  const testKey = generateObjectKey({ taskId: "TEST_99", type: "before" }, "test_proof.jpg");

  console.log("1. Uploading test image to R2...");
  const uploadResult = await uploadToR2(sampleBuffer, testKey, "image/jpeg", "test_proof.jpg");
  console.log("Uploaded object key:", uploadResult.objectKey);
  console.log("Raw unsigned URL (fails in browser without auth):", uploadResult.url);

  console.log("\n2. Testing fetch on raw unsigned URL (expecting 400 InvalidArgument):");
  try {
    const rawRes = await fetch(uploadResult.url);
    console.log(`Raw URL status: ${rawRes.status} ${rawRes.statusText}`);
    const rawText = await rawRes.text();
    console.log("Raw URL response body:", rawText.slice(0, 150));
  } catch (err: any) {
    console.log("Raw URL fetch error:", err.message);
  }

  console.log("\n3. Generating Presigned GET URL (expires in 24 hours)...");
  const presignedUrl = await generatePresignedUrl(testKey, 86400);
  console.log("Presigned GET URL:", presignedUrl);

  console.log("\n4. Testing fetch on Presigned GET URL (expecting 200 OK):");
  const presignedRes = await fetch(presignedUrl);
  console.log(`Presigned URL status: ${presignedRes.status} ${presignedRes.statusText}`);
  const presignedBuffer = await presignedRes.arrayBuffer();
  console.log(`Presigned URL fetched ${presignedBuffer.byteLength} bytes`);
  console.log(`Presigned URL content: "${Buffer.from(presignedBuffer).toString("utf-8")}"`);

  if (presignedRes.status === 200 && Buffer.from(presignedBuffer).toString("utf-8") === "PRESIGNED_URL_TEST_IMAGE_DATA_12345") {
    console.log("\n🎉 PRESIGNED GET URL VERIFICATION 100% SUCCEEDED! 🎉");
  } else {
    throw new Error("Presigned URL verification failed!");
  }

  console.log("\n5. Cleaning up test object from R2...");
  await deleteFromR2(testKey);
  console.log("Cleaned up successfully.");
}

testPresignedUrl().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
