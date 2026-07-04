import axios from "axios";
import crypto from "crypto";

async function run() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const md5Password = crypto.createHash("md5").update(password).digest("hex");
  const baseUrl = "https://digital.waaree.com";
  const url = `${baseUrl}/c/v0/user/login`;

  console.log(`[PROBE] Posting to ${url}...`);
  try {
    const response = await axios.post(url, {
      user: username,
      password: md5Password
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
