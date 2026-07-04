import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignatureA(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

function createSignatureB(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\\r\\n${token}\\r\\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

function createSignatureWrong(path: string, token: string, timestamp: number): string {
  const signStr = `${path}-wrong-${token}-wrong-${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(path: string, token: string, signature: string, label: string) {
  const timestamp = Date.now();
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
  const token = "dummy-token-123456";
  const path = "/generic/v1/plant/list";
  const timestamp = Date.now();

  console.log(`Testing dummy token signature validation:`);
  await testEndpoint(path, token, createSignatureA(path, token, timestamp), "Signature A (CRLF)");
  await testEndpoint(path, token, createSignatureB(path, token, timestamp), "Signature B (Literal \\r\\n)");
  await testEndpoint(path, token, createSignatureWrong(path, token, timestamp), "Signature Wrong");
}

run().catch(console.error);
