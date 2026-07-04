import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testFlow(method: "GET" | "POST", apiKey: string, plantId: string) {
  const path = "/generic/v1/plant/flow";
  const url = `https://digital.waaree.com${path}`;
  const timestamp = Date.now();
  const signature = createSignature(path, apiKey, timestamp);

  console.log(`[FLOW-PROBE] Testing ${method} on ${url}...`);
  try {
    const config: any = {
      headers: {
        "Content-Type": "application/json",
        "token": apiKey,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 10000
    };

    let response;
    if (method === "GET") {
      response = await axios.get(url, { ...config, params: { plantId } });
    } else {
      response = await axios.post(url, { plantId }, config);
    }

    console.log(`[FLOW-PROBE] Success -> Status:`, response.status);
    console.log(`[FLOW-PROBE] Data:`, JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FLOW-PROBE] Fail -> Status:`, err.response.status);
      console.log(`[FLOW-PROBE] Data:`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.log(`[FLOW-PROBE] Error ->`, err.message);
    }
  }
}

async function run() {
  const apiKey = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  await testFlow("GET", apiKey, plantId);
  console.log("-----------------------------------------");
  await testFlow("POST", apiKey, plantId);
}

run().catch(console.error);
