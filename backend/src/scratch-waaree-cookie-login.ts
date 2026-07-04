import axios from "axios";
import crypto from "crypto";

function extractCookies(response: any): string {
  const cookieHeader = response.headers["set-cookie"] as any;
  let cookieString = "";
  if (cookieHeader) {
    if (Array.isArray(cookieHeader)) {
      cookieString = cookieHeader.map((c: string) => c.split(";")[0]).join("; ");
    } else if (typeof cookieHeader === "string") {
      cookieString = cookieHeader.split(";")[0];
    }
  }
  return cookieString;
}

async function run() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const md5Password = crypto.createHash("md5").update(password).digest("hex");
  const baseUrl = "https://digital.waaree.com";

  console.log("=== STEP 1: GET MAIN PORTAL PAGE ===");
  let cookies = "";
  try {
    const resHome = await axios.get(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: 10000
    });
    cookies = extractCookies(resHome);
    console.log("Success! Home Cookies:", cookies);
  } catch (err: any) {
    console.warn("Home GET failed:", err.message);
  }

  console.log("\n=== STEP 2: POST LOGIN WITH COOKIES ===");
  try {
    const response = await axios.post(`${baseUrl}/c/v0/user/login`, {
      user: username,
      password: md5Password
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": cookies,
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
