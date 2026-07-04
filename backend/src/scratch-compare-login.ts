import axios from "axios";
import crypto from "crypto";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

async function testLogin(domain: string, user: string, pass: string) {
  const url = `${domain}/c/v0/user/login`;
  console.log(`Testing login on ${url} for ${user}...`);
  try {
    const response = await axios.post(url, {
      user: user,
      password: md5(pass)
    }, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "lang": "en"
      },
      timeout: 10000
    });
    console.log(`  [SUCCESS] status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`  [FAIL] status: ${err.response.status}, headers:`, JSON.stringify(err.response.headers), `data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`  [ERROR] ${err.message}`);
    }
  }
}

async function run() {
  const user = "ShubhamTyres";
  const pass = "Shubham@2025";

  await testLogin("https://www.foxesscloud.com", user, pass);
  console.log("--------------------------------------------------");
  await testLogin("https://digital.waaree.com", user, pass);
}

run().catch(console.error);
