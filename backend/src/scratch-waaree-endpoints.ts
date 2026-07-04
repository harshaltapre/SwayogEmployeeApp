import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

async function testEndpoint(path: string, body: any) {
  const url = `${WAAREE_BASE}${path}`;
  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "lang": "en"
      },
      timeout: 8000
    });
    console.log(`[SUCCESS] ${path} -> status: ${response.status}, data:`, JSON.stringify(response.data));
    return true;
  } catch (err: any) {
    if (err.response) {
      if (err.response.status !== 404 && err.response.status !== 406) {
        console.log(`[EXISTS?] ${path} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
      } else {
        // console.log(`[FAIL] ${path} -> status: ${err.response.status}`);
      }
    } else {
      console.log(`[ERROR] ${path} -> ${err.message}`);
    }
    return false;
  }
}

async function run() {
  const username = "ShubhamTyres";
  const pass = "Shubham@2025";
  const hashedPassword = md5(pass);

  const paths = [
    "/generic/v1/auth/login",
    "/generic/v1/auth/token",
    "/generic/v1/auth/refresh", // refresh exists, let's see what it does
    "/generic/v1/user/login",
    "/generic/v1/login",
    "/generic/v1/auth",
    "/generic/v1/token",
    "/generic/v0/auth/login",
    "/op/v0/user/login",
    "/op/v0/auth/login",
    "/c/v0/user/login",
    "/c/v1/user/login",
    "/api/v1/auth/login",
    "/api/auth/login"
  ];

  // Try with MD5 password
  console.log("--- Testing with MD5-hashed password ---");
  for (const path of paths) {
    await testEndpoint(path, { username, password: hashedPassword, user: username, pass: hashedPassword });
    await testEndpoint(path, { user: username, password: hashedPassword });
    await testEndpoint(path, { username, token: hashedPassword }); // for refresh
  }

  // Try with raw password
  console.log("--- Testing with Raw password ---");
  for (const path of paths) {
    await testEndpoint(path, { username, password: pass, user: username, pass: pass });
    await testEndpoint(path, { user: username, password: pass });
  }
}

run().catch(console.error);
