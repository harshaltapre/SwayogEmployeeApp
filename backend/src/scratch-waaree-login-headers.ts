import axios from "axios";
import crypto from "crypto";

const md5 = (str: string) => crypto.createHash("md5").update(str).digest("hex");

async function testLogin(label: string, headers: Record<string, string>) {
  const url = "https://digital.waaree.com/c/v0/user/login";
  const body = {
    user: "ShubhamTyres",
    password: md5("Shubham@2025")
  };

  try {
    const response = await axios.post(url, body, { headers, timeout: 8000 });
    console.log(`[SUCCESS] ${label} -> status: ${response.status}, data:`, JSON.stringify(response.data));
    return true;
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] ${label} -> status: ${err.response.status}, body:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] ${label} -> ${err.message}`);
    }
    return false;
  }
}

async function run() {
  console.log("--- Testing Waaree Login with Different Headers ---");

  // 1. Android okhttp User-Agent
  await testLogin("Android okhttp UA", {
    "Content-Type": "application/json",
    "User-Agent": "okhttp/4.9.0",
    "lang": "en"
  });

  // 2. iOS User-Agent
  await testLogin("iOS App UA", {
    "Content-Type": "application/json",
    "User-Agent": "WaareeCloud/1.0 (iPhone; iOS 16.0; Scale/3.00)",
    "lang": "en"
  });

  // 3. No User-Agent at all
  await testLogin("No UA", {
    "Content-Type": "application/json",
    "lang": "en"
  });

  // 4. Custom App Header (often apps send a client type or app version)
  await testLogin("App Client Headers", {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A205F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36",
    "clientType": "android",
    "appVersion": "1.0.0",
    "lang": "en"
  });

  // 5. Minimal headers
  await testLogin("Minimal headers", {
    "Content-Type": "application/json"
  });
}

run().catch(console.error);
