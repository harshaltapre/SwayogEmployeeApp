import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testPath(path: string, token: string) {
  const url = `https://digital.waaree.com${path}`;
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);

  console.log(`[OP-TEST] Testing POST ${url}...`);
  try {
    const response = await axios.post(url, {
      currentPage: 1,
      pageSize: 10
    }, {
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
    console.log(`[OP-TEST] ${path} -> Success status:`, response.status, "data:", JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[OP-TEST] ${path} -> Fail status:`, err.response.status, "data:", JSON.stringify(err.response.data));
    } else {
      console.log(`[OP-TEST] ${path} -> Error:`, err.message);
    }
  }
}

async function run() {
  const token = "a7e01208-ab52-4729-a4ff-86fb87092ec3";
  
  console.log("=== TESTING WAAREE OP ENDPOINTS ===");
  await testPath("/op/v0/device/list", token);
  await testPath("/op/v1/device/list", token);
  await testPath("/op/v0/device/history/query", token);
}

run().catch(console.error);
