import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testHeaders(path: string, token: string, headersConfig: Record<string, string>, label: string) {
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
  const url = `${WAAREE_BASE}${path}`;

  const headers: any = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ...headersConfig
  };

  // Replace placeholders with dynamic values
  for (const [k, v] of Object.entries(headers)) {
    if (v === "TOKEN") headers[k] = token;
    if (v === "SIGNATURE") headers[k] = signature;
    if (v === "TIMESTAMP") headers[k] = String(timestamp);
  }

  try {
    const response = await axios.get(url, {
      headers,
      timeout: 10000
    });
    console.log(`[${label}] status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[${label}] status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[${label}] error:`, err.message);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const path = "/generic/v1/plant/list";

  console.log("--- Testing Header Casings and Names on Waaree ---");

  // Test 1: Standard lowercase (matching FoxESS Open API)
  await testHeaders(path, token, {
    "token": "TOKEN",
    "signature": "SIGNATURE",
    "timestamp": "TIMESTAMP"
  }, "Lowercase (token, signature, timestamp)");

  // Test 2: Standard uppercase (Token, Signature, Timestamp)
  await testHeaders(path, token, {
    "Token": "TOKEN",
    "Signature": "SIGNATURE",
    "Timestamp": "TIMESTAMP"
  }, "Uppercase (Token, Signature, Timestamp)");

  // Test 3: Mixed Case (token, Signature, Timestamp)
  await testHeaders(path, token, {
    "token": "TOKEN",
    "Signature": "SIGNATURE",
    "timestamp": "TIMESTAMP"
  }, "Mixed Case 1");

  // Test 4: Authorization Header
  await testHeaders(path, token, {
    "Authorization": "Bearer TOKEN",
    "signature": "SIGNATURE",
    "timestamp": "TIMESTAMP"
  }, "Authorization Bearer");

  // Test 5: Authorization with Signature
  await testHeaders(path, token, {
    "Authorization": "TOKEN",
    "Signature": "SIGNATURE",
    "Timestamp": "TIMESTAMP"
  }, "Authorization raw");
}

run().catch(console.error);
