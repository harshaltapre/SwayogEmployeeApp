import { env } from "../src/config/env.js";
import { isR2Configured, getR2Status } from "../src/services/r2StorageService.js";

console.log("=== R2 Configuration Test ===\n");

console.log("Checking environment variables from env.ts...");
console.log("R2_ACCOUNT_ID:", env.R2_ACCOUNT_ID ? "SET" : "NOT SET");
console.log("R2_ACCESS_KEY_ID:", env.R2_ACCESS_KEY_ID ? "SET" : "NOT SET");
console.log("R2_SECRET_ACCESS_KEY:", env.R2_SECRET_ACCESS_KEY ? "SET" : "NOT SET");
console.log("R2_BUCKET_NAME:", env.R2_BUCKET_NAME ? "SET" : "NOT SET");
console.log("R2_ENDPOINT:", env.R2_ENDPOINT ? "SET" : "NOT SET");

console.log("\nChecking R2 configuration status...");
const r2Status = getR2Status();

console.log("\nR2 Status:");
console.log(JSON.stringify(r2Status, null, 2));

if (isR2Configured()) {
  console.log("\n✅ R2 is properly configured!");
  console.log("\nNext steps:");
  console.log("1. Run migration script: npx tsx scripts/migrate-local-images-to-r2.ts");
  console.log("2. Start backend server: npm run dev");
  console.log("3. Test image upload via frontend");
} else {
  console.log("\n❌ R2 is NOT configured!");
  console.log("\nPlease set the following environment variables in backend/.env:");
  console.log("  R2_ACCOUNT_ID");
  console.log("  R2_ACCESS_KEY_ID");
  console.log("  R2_SECRET_ACCESS_KEY");
  console.log("  R2_BUCKET_NAME");
  console.log("  R2_ENDPOINT");
  process.exit(1);
}
