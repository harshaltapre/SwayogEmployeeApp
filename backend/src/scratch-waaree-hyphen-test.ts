import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testFlow(apiKey: string, plantId: string) {
  const path = "/generic/v1/plant/flow";
  const url = `https://digital.waaree.com${path}`;
  const timestamp = Date.now();
  const signature = createSignature(path, apiKey, timestamp);

  console.log(`[HYPHEN-TEST] Testing GET on ${url} with plantId: ${plantId}`);
  try {
    const response = await axios.get(url, {
      params: { plantId },
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

    console.log(`[HYPHEN-TEST] Success -> Status:`, response.status);
    console.log(`[HYPHEN-TEST] Data:`, JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log(`[HYPHEN-TEST] Fail -> Status:`, err.response.status);
      console.log(`[HYPHEN-TEST] Data:`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.log(`[HYPHEN-TEST] Error ->`, err.message);
    }
  }
}

async function run() {
  const apiKey = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const plantIdWithHyphens = "750a9b0c-h881-ff41-3ca8-332j6c3b3875e8a5";

  await testFlow(apiKey, plantIdWithHyphens);
}

run().catch(console.error);
