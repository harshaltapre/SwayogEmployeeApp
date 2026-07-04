import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createWaareeSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testWaareeEndpoint(path: string, token: string, params: any = {}) {
  const timestamp = Date.now();
  const signature = createWaareeSignature(path, token, timestamp);
  const url = `${WAAREE_BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
    "token": token,
    "signature": signature,
    "timestamp": String(timestamp),
    "lang": "en",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  };

  try {
    const response = await axios.get(url, {
      params,
      headers,
      timeout: 10000
    });
    console.log(`[SUCCESS] ${path} -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] ${path} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] ${path} -> ${err.message}`);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  console.log("--- Testing Waaree Token Validity ---");
  
  // Test 1: Flow query with the configured plantId
  await testWaareeEndpoint("/generic/v1/plant/flow", token, { plantId });

  // Test 2: Flow query with no plantId
  await testWaareeEndpoint("/generic/v1/plant/flow", token);

  // Test 3: List plants
  await testWaareeEndpoint("/generic/v1/plant/list", token);

  // Test 4: List devices
  await testWaareeEndpoint("/generic/v1/device/list", token);

  // Test 5: Try /op/v0/device/list (just in case they have OpenAPI enabled)
  await testWaareeEndpoint("/op/v0/device/list", token);
}

run().catch(console.error);
