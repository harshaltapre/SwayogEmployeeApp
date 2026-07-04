import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testPlantId(token: string, plantId: string, label: string) {
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
    console.log(`[RESULT] ${label} -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[RESULT] ${label} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[RESULT] ${label} -> error: ${err.message}`);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  
  const variants = [
    { id: "750a9b0ch881ff413ca8332j6c3b3875e8a5", desc: "Original (with h, f, a, j)" },
    { id: "750a9b0c-881f-413c-8332-6c3b3875e8a5", desc: "Cleaned UUID (with hyphens)" },
    { id: "750a9b0c881f413c83326c3b3875e8a5", desc: "Cleaned hex (no hyphens)" }
  ];

  console.log("--- Testing Plant ID Variants ---");
  for (const v of variants) {
    await testPlantId(token, v.id, v.desc);
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
