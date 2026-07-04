import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

function createOpenApiSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testWaareeLogin(username: string, pass: string) {
  console.log(`[WAAREE-PROBE] Testing login for "${username}"...`);
  const hashedPassword = md5(pass);

  const loginAttempts = [
    {
      url: `${WAAREE_BASE}/c/v0/user/login`,
      body: { user: username, password: hashedPassword },
      label: "MD5 hashed login (user/password)"
    },
    {
      url: `${WAAREE_BASE}/c/v0/user/login`,
      body: { user: username, password: pass },
      label: "Raw password login (user/password)"
    },
    {
      url: `${WAAREE_BASE}/c/v0/user/login`,
      body: { userName: username, userPassword: hashedPassword },
      label: "Alt field names (MD5)"
    }
  ];

  for (const attempt of loginAttempts) {
    try {
      console.log(`  Trying: ${attempt.label}`);
      const response = await axios.post(attempt.url, attempt.body, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "lang": "en"
        },
        timeout: 10000
      });
      console.log(`  Response: status=${response.status}`, JSON.stringify(response.data));
    } catch (err: any) {
      if (err.response) {
        console.log(`  Fail: status=${err.response.status}`, JSON.stringify(err.response.data));
      } else {
        console.log(`  Error:`, err.message);
      }
    }
  }
}

async function testWaareeApiKey(apiKey: string, deviceSn: string) {
  console.log(`[WAAREE-PROBE] Testing OpenAPI API key "${apiKey}"...`);
  const path = "/op/v0/device/list";
  const timestamp = Date.now();
  const signature = createOpenApiSignature(path, apiKey, timestamp);

  try {
    const response = await axios.post(`${WAAREE_BASE}${path}`, {
      currentPage: 1,
      pageSize: 10
    }, {
      headers: {
        "Content-Type": "application/json",
        "token": apiKey,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en"
      },
      timeout: 10000
    });
    console.log(`  OpenAPI Response: status=${response.status}`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`  Fail: status=${err.response.status}`, JSON.stringify(err.response.data));
    } else {
      console.log(`  Error:`, err.message);
    }
  }
}

async function run() {
  const loginId = "ShubhamTyres";
  const email = "shubhamtyres@gmail.com";
  const pass = "Shubham@2025";
  const apiKey = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const deviceSn = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  await testWaareeLogin(loginId, pass);
  console.log("-----------------------------------------");
  await testWaareeLogin(email, pass);
  console.log("-----------------------------------------");
  await testWaareeApiKey(apiKey, deviceSn);
}

run().catch(console.error);
