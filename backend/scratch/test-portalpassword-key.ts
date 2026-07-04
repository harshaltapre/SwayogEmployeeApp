import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return md5(signStr);
}

async function testEndpoint(path: string, token: string, plantId: string, label: string) {
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
  const url = `${WAAREE_BASE}${path}`;

  try {
    const response = await axios.get(url, {
      params: { plantId, sn: plantId, deviceSn: plantId },
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
    console.log(`[${label}] status: ${response.status}, errno: ${response.data?.errno}, msg: ${response.data?.msg}`);
    console.log(`[${label}] data:`, JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log(`[${label}] FAIL status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[${label}] ERROR: ${err.message}`);
    }
  }
}

async function run() {
  const token = "a9a614e2";
  const plantIdRaw = "750a9b0ch881ff413ca8332j6c3b3875e8a5";
  const plantIdClean = "750a9b0c-881f-413c-8332-6c3b3875e8a5";

  console.log("--- Testing Waaree Generic v1 endpoints with portalPassword 'a9a614e2' ---");
  
  await testEndpoint("/generic/v1/plant/flow", token, plantIdRaw, "Plant Flow Raw SN");
  console.log("-----------------------------------------");
  await testEndpoint("/generic/v1/plant/flow", token, plantIdClean, "Plant Flow Clean UUID");
  console.log("-----------------------------------------");
  await testEndpoint("/generic/v1/station/list", token, "", "Station List");
  console.log("-----------------------------------------");
  await testEndpoint("/generic/v1/device/list", token, "", "Device List");
}

run().catch(console.error);
