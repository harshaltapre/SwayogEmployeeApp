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

  console.log(`[PROBE] Testing GET ${url}...`);
  try {
    const response = await axios.get(url, {
      params: { 
        plantId: "750a9b0ch881ff413ca8332j6c3b3875e8a5",
        deviceSn: "750a9b0ch881ff413ca8332j6c3b3875e8a5",
        sn: "750a9b0ch881ff413ca8332j6c3b3875e8a5"
      },
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
    console.log(`[PROBE] ${path} -> Success status:`, response.status, "data:", JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[PROBE] ${path} -> Fail status:`, err.response.status, "data:", JSON.stringify(err.response.data));
    } else {
      console.log(`[PROBE] ${path} -> Error:`, err.message);
    }
  }
}

async function run() {
  const token = "a7e01208-ab52-4729-a4ff-86fb87092ec3";
  const potentialPaths = [
    "/generic/v1/plant/history",
    "/generic/v1/device/history",
    "/generic/v1/plant/history/query",
    "/generic/v1/device/history/query",
    "/generic/v1/device/report",
    "/generic/v1/plant/report",
    "/generic/v1/device/report/query",
    "/generic/v1/plant/report/query",
    "/generic/v1/device/history/list",
    "/generic/v1/plant/history/list"
  ];

  console.log("=== PROBING WAAREE HISTORY PATHS ===");
  for (const p of potentialPaths) {
    await testPath(p, token);
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
