import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(path: string, token: string) {
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
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
    console.log(`[SUCCESS] token="${token}" -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] token="${token}" -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] token="${token}" -> ${err.message}`);
    }
  }
}

async function run() {
  const token = "a9a614e2"; // portalPassword
  await testEndpoint("/generic/v1/plant/list", token);
}

run().catch(console.error);
