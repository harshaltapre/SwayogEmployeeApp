import axios from "axios";
import crypto from "crypto";

async function run() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const md5Password = crypto.createHash("md5").update(password).digest("hex");
  const baseUrl = "https://digital.waaree.com";
  const url = `${baseUrl}/c/v0/user/login`;

  console.log(`[PROBE] Posting urlencoded to ${url}...`);
  try {
    const params = new URLSearchParams();
    params.append("user", username);
    params.append("password", md5Password);

    const response = await axios.post(url, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log("Error Status:", err.response.status);
      console.log("Error Data:", typeof err.response.data === "object" ? JSON.stringify(err.response.data, null, 2) : err.response.data);
    } else {
      console.log("Error Message:", err.message);
    }
  }
}

run().catch(console.error);
