import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testEndpoint(domain: string, path: string, token: string) {
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
  const url = `${domain}${path}`;

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
        "lang": "en"
      },
      timeout: 10000
    });
    console.log(`[SUCCESS] ${domain} -> status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] ${domain} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] ${domain} -> ${err.message}`);
    }
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  
  await testEndpoint("https://open.foxesscloud.com", "/op/v0/device/list", token);
  await testEndpoint("https://www.foxesscloud.com", "/op/v0/device/list", token);
}

run().catch(console.error);
