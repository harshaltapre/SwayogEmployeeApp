import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(domain: string, path: string, token: string, body: any = {}) {
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
  const url = `${domain}${path}`;

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "token": token,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en"
      },
      timeout: 10000
    });
    console.log(`[SUCCESS] ${domain}${path} -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] ${domain}${path} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] ${domain}${path} -> ${err.message}`);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const body = { currentPage: 1, pageSize: 10 };

  console.log("--- Testing Token on FoxESS Cloud ---");
  await testEndpoint("https://www.foxesscloud.com", "/op/v0/device/list", token, body);

  console.log("\n--- Testing Token on Waaree Digital Portal ---");
  await testEndpoint("https://digital.waaree.com", "/op/v0/device/list", token, body);
  await testEndpoint("https://digital.waaree.com", "/generic/v1/plant/list", token);
}

run().catch(console.error);
