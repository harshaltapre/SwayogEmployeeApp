import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

async function testWrongSignature() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";
  const path = "/generic/v1/plant/flow";
  const timestamp = Date.now();
  // Generate a garbage/wrong signature
  const signature = "garbage_signature_value_12345";
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

async function run() {
  await testWrongSignature();
}
