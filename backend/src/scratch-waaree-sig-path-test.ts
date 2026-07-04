import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testFlowSignaturePath(sigPath: string, actualPath: string, token: string, plantId: string, label: string) {
  const timestamp = Date.now();
  const signature = createSignature(sigPath, token, timestamp);
  const url = `${WAAREE_BASE}${actualPath}`;

  try {
    const response = await axios.get(url, {
      params: { plantId },
      headers: {
        "Content-Type": "application/json",
        "token": token,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    console.log(`[RESULT] ${label} -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[RESULT] ${label} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[RESULT] ${label} -> error: ${err.message}`);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  console.log("--- Testing Signature Path Variants ---");
  
  // 1. Standard base path
  await testFlowSignaturePath(
    "/generic/v1/plant/flow",
    "/generic/v1/plant/flow",
    token,
    plantId,
    "1. Base Path Only"
  );
  console.log("-----------------------------------------");

  // 2. Path with exact query param (same order)
  await testFlowSignaturePath(
    `/generic/v1/plant/flow?plantId=${plantId}`,
    "/generic/v1/plant/flow",
    token,
    plantId,
    "2. Path with Query Parameter"
  );
  console.log("-----------------------------------------");

  // 3. Path with encoded query param
  await testFlowSignaturePath(
    `/generic/v1/plant/flow?plantId=${encodeURIComponent(plantId)}`,
    "/generic/v1/plant/flow",
    token,
    plantId,
    "3. Path with Encoded Query Parameter"
  );
  console.log("-----------------------------------------");

  // 4. GET request without params inside Axios, putting query param directly in actual URL path
  await testFlowSignaturePath(
    `/generic/v1/plant/flow?plantId=${plantId}`,
    `/generic/v1/plant/flow?plantId=${plantId}`,
    token,
    "", // don't send params via axios config
    "4. URL Query Param directly in URL"
  );
}

run().catch(console.error);
