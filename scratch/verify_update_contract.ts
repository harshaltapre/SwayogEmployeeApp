import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const manifestPaths = [
  path.join(rootDir, "public", "latest.json"),
  path.join(rootDir, "web-update", "latest.json")
];

console.log("--------------------------------------------------");
console.log("VERIFYING LATEST.JSON MANIFEST CONTRACTS");
console.log("--------------------------------------------------");

for (const fullPath of manifestPaths) {
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const manifest = JSON.parse(content);

  console.log(`Checking ${path.relative(rootDir, fullPath)}:`);
  if (typeof manifest !== "object" || manifest === null) throw new Error(`${fullPath} is not an object`);
  if (manifest.appId !== "com.swayog.employee") throw new Error(`${fullPath} invalid appId`);
  if (manifest.platform !== "android") throw new Error(`${fullPath} invalid platform`);
  if (!manifest.versionCode || manifest.versionCode < 20) throw new Error(`${fullPath} invalid versionCode: ${manifest.versionCode}`);
  if (!manifest.versionName) throw new Error(`${fullPath} missing versionName`);
  if (!manifest.apkUrl || !manifest.apkUrl.startsWith("https://")) throw new Error(`${fullPath} apkUrl must be HTTPS: ${manifest.apkUrl}`);
  if (!/^[a-fA-F0-9]{64}$/.test(manifest.sha256)) throw new Error(`${fullPath} sha256 invalid: ${manifest.sha256}`);
  if (!Array.isArray(manifest.releaseNotes)) throw new Error(`${fullPath} releaseNotes must be array`);

  console.log(`  ✓ appId:       ${manifest.appId}`);
  console.log(`  ✓ platform:    ${manifest.platform}`);
  console.log(`  ✓ versionCode: ${manifest.versionCode}`);
  console.log(`  ✓ versionName: ${manifest.versionName}`);
  console.log(`  ✓ apkUrl:      ${manifest.apkUrl}`);
  console.log(`  ✓ sha256:      ${manifest.sha256}`);
  console.log(`  ✓ notes count: ${manifest.releaseNotes.length}`);
}

console.log("\n--------------------------------------------------");
console.log("ALL MANIFEST CONTRACT VERIFICATIONS PASSED!");
console.log("--------------------------------------------------");
