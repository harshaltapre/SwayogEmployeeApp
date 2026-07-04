import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testFlow(token: string, plantId: string, label: string) {
  const path = "/generic/v1/plant/flow";
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
  const url = `${WAAREE_BASE}${path}`;

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
    console.log(`[SUCCESS] ${label} -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] ${label} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] ${label} -> ${err.message}`);
    }
  }
}

async function run() {
  const key1 = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const key2 = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  console.log("--- Testing swapped token and plantId ---");
  await testFlow(key1, key2, "token = key1, plantId = key2");
  await testFlow(key2, key1, "token = key2, plantId = key1");
}

run().catch(console.error);
