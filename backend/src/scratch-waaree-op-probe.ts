import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testPath(path: string, apiKey: string) {
  const baseUrl = "https://digital.waaree.com";
  const url = `${baseUrl}${path}`;
  const timestamp = Date.now();
  const signature = createSignature(path, apiKey, timestamp);

  console.log(`[OP-PROBE] Testing POST ${url}...`);
  try {
    const response = await axios.post(url, {
      currentPage: 1,
      pageSize: 10
    }, {
      headers: {
        "Content-Type": "application/json",
        "token": apiKey,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    console.log(`[OP-PROBE] Success -> Status:`, response.status, "data:", JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[OP-PROBE] Fail -> Status:`, err.response.status, "data:", JSON.stringify(err.response.data));
    } else {
      console.log(`[OP-PROBE] Error ->`, err.message);
    }
  }
}

async function run() {
  const apiKey = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const paths = [
    "/op/v0/device/list",
    "/op/v1/device/list",
    "/api/op/v0/device/list",
    "/api/v0/device/list",
    "/op/device/list"
  ];

  for (const p of paths) {
    await testPath(p, apiKey);
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
