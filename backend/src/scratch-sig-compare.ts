import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignatureA(path: string, token: string, timestamp: number): string {
  // Version A: actual CR and LF control characters (ASCII 13 and ASCII 10)
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

function createSignatureB(path: string, token: string, timestamp: number): string {
  // Version B: literal characters '\r\n' (backslash, r, backslash, n)
  const signStr = `${path}\\r\\n${token}\\r\\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(path: string, token: string, version: 'A' | 'B') {
  const timestamp = Date.now();
  const signature = version === 'A' 
    ? createSignatureA(path, token, timestamp) 
    : createSignatureB(path, token, timestamp);
    
  const url = `${WAAREE_BASE}${path}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "token": token,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en"
      },
      timeout: 10000
    });
    console.log(`[VERSION ${version}] status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[VERSION ${version}] status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[VERSION ${version}] error:`, err.message);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const path = "/generic/v1/plant/list";

  console.log(`Testing signature versions for token: ${token}...`);
  await testEndpoint(path, token, 'A');
  await testEndpoint(path, token, 'B');
}

run().catch(console.error);
