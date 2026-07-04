import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(path: string, apiKey: string, method: "GET" | "POST", paramsOrBody: any = {}) {
  const url = `https://digital.waaree.com${path}`;
  const timestamp = Date.now();
  const signature = createSignature(path, apiKey, timestamp);

  console.log(`[PROBE] Testing ${method} ${path}...`);
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
      response = await axios.get(url, { ...config, params: paramsOrBody });
    } else {
      response = await axios.post(url, paramsOrBody, config);
    }

    console.log(`[PROBE] ${path} -> Status:`, response.status, "errno:", response.data?.errno, "msg:", response.data?.msg);
  } catch (err: any) {
    if (err.response) {
      console.log(`[PROBE] ${path} -> Error Status:`, err.response.status, "data:", JSON.stringify(err.response.data));
    } else {
      console.log(`[PROBE] ${path} -> Error Message:`, err.message);
    }
  }
}

async function run() {
  const apiKey = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  const targets = [
    { path: "/generic/v1/plant/list", method: "GET" },
    { path: "/generic/v1/device/list", method: "GET" },
    { path: "/generic/v1/plant/flow", method: "GET", params: { plantId } },
    { path: "/generic/v1/plant/detail", method: "GET", params: { plantId } },
    { path: "/generic/v1/device/real", method: "GET", params: { sn: plantId } }
  ];

  for (const t of targets) {
    await testEndpoint(t.path, apiKey, t.method as any, t.params);
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
