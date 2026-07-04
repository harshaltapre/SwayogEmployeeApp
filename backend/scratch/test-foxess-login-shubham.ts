import axios from "axios";
import crypto from "crypto";

async function main() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

  console.log("=== Testing FoxESS Cloud Login for Waaree User ===");
  console.log("Hashed password:", hashedPassword);

  const url = "https://www.foxesscloud.com/c/v0/user/login";
  try {
    const response = await axios.post(url, {
      user: username,
      password: hashedPassword
    }, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "lang": "en"
      },
      timeout: 10000
    });
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log("Fail status:", err.response.status, "body:", JSON.stringify(err.response.data));
    } else {
      console.log("Error:", err.message);
    }
  }
}

main();
