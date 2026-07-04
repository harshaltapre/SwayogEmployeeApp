import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(baseUrl: string, path: string, token: string, paramsOrBody: any = {}, method: "GET" | "POST" = "POST") {
  const url = `${baseUrl}${path}`;
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);

  console.log(`\n[TEST] Calling ${method} ${url} ...`);
  try {
    const config: any = {
      headers: {
        "Content-Type": "application/json",
        "token": token,
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

    console.log(`[SUCCESS] Status: ${response.status}, errno: ${response.data?.errno}, msg: ${response.data?.msg}`);
    console.log(`Response body:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] Status: ${err.response.status}`);
      console.log(`Response body:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] Message:`, err.message);
    }
  }
}

async function run() {
  const token = "a7e01208-ab52-4729-a4ff-86fb87092ec3";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  console.log("=== TESTING WITH REAL WAAREE CREDENTIALS ===");
  console.log("Token:", token);
  console.log("PlantId:", plantId);

  console.log("\n--- PART 1: FOXESSCLOUD DOMAIN ---");
  await testEndpoint("https://www.foxesscloud.com", "/op/v0/device/list", token, { currentPage: 1, pageSize: 10 });
  await testEndpoint("https://www.foxesscloud.com", "/generic/v1/plant/flow", token, { plantId }, "GET");

  console.log("\n--- PART 2: DIGITAL.WAAREE DOMAIN ---");
  await testEndpoint("https://digital.waaree.com", "/op/v0/device/list", token, { currentPage: 1, pageSize: 10 });
  await testEndpoint("https://digital.waaree.com", "/generic/v1/plant/flow", token, { plantId }, "GET");
}

run().catch(console.error);
