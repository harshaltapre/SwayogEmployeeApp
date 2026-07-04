import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function run() {
  const baseUrl = "https://digital.waaree.com";
  const path = "/generic/v1/auth/login";
  const apiKey = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const username = "ShubhamTyres";
  const password = "Shubham@2025";

  const timestamp = Date.now();
  const signature = createSignature(path, apiKey, timestamp);

  console.log("Sending signed login request...");
  try {
    const response = await axios.post(`${baseUrl}${path}`, {
      username,
      password
    }, {
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
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log("Error Status:", err.response.status);
      console.log("Error Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.log("Error Message:", err.message);
    }
  }
}

run().catch(console.error);
