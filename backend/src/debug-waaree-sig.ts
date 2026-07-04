import axios from "axios";
import crypto from "crypto";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function main() {
  const path = "/generic/v1/plant/flow";
  const url = `https://digital.waaree.com${path}`;
  const mockToken = "test-api-token-123456789";
  const timestamp = Date.now();
  const signature = createSignature(path, mockToken, timestamp);

  console.log(`Sending signed request to ${url}...`);
  console.log("Headers:");
  console.log(`  token: ${mockToken}`);
  console.log(`  signature: ${signature}`);
  console.log(`  timestamp: ${timestamp}`);

  try {
    const response = await axios.get(url, {
      params: { plantId: "12345" },
      headers: {
        "token": mockToken,
        "signature": signature,
        "timestamp": String(timestamp),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 5000
    });
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Error Message:", error.message);
    }
  }
}

main();
