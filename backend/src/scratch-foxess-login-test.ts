import axios from "axios";
import crypto from "crypto";

async function run() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const hashedPassword = crypto.createHash("md5").update(password).digest("hex");
  const baseUrl = "https://www.foxesscloud.com";

  console.log(`[FOX-LOGIN] Attempting login to ${baseUrl}/c/v0/user/login...`);
  try {
    const response = await axios.post(`${baseUrl}/c/v0/user/login`, {
      user: username,
      password: hashedPassword
    }, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "lang": "en"
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
