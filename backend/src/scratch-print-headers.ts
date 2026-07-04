import axios from "axios";
import crypto from "crypto";

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const path = "/generic/v1/plant/list";
  const timestamp = Date.now();
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  const signature = crypto.createHash("md5").update(signStr).digest("hex");

  const headers = {
    "Content-Type": "application/json",
    "token": token,
    "signature": signature,
    "timestamp": String(timestamp),
    "lang": "en",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  };

  console.log("Headers to send:", JSON.stringify(headers, null, 2));

  try {
    const res = await axios.get(`https://digital.waaree.com${path}`, { headers });
    console.log("Response data:", JSON.stringify(res.data));
  } catch (err: any) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

run().catch(console.error);
