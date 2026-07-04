import axios from "axios";
import crypto from "crypto";

function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function testSolarmanToken(appId: string, appSecret: string, email: string, pass: string) {
  const url = `https://globalapi.solarmanpv.com/account/v1.0/token?appId=${encodeURIComponent(appId)}&language=en`;
  try {
    const response = await axios.post(url, {
      appSecret,
      email,
      password: sha256(pass)
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });
    console.log(`[SUCCESS] appSecret="${appSecret}" email="${email}" pass="${pass}" -> status: ${response.status}, code: ${response.data?.code}, msg: ${response.data?.msg}`);
    if (response.data?.success) {
      console.log(`  ACCESS TOKEN: ${response.data?.access_token}`);
      return true;
    }
  } catch (err: any) {
    if (err.response) {
      console.log(`[FAIL] appSecret="${appSecret}" email="${email}" pass="${pass}" -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[ERROR] appSecret="${appSecret}" email="${email}" pass="${pass}" -> ${err.message}`);
    }
  }
  return false;
}

async function run() {
  const appId = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const secrets = ["Shubham@2025", "a9a614e2"];
  const emails = ["shubhamtyres@gmail.com", "ShubhamTyres"];
  const passwords = ["Shubham@2025", "a9a614e2"];

  console.log("--- Testing All Solarman Combinations ---");
  for (const appSecret of secrets) {
    for (const email of emails) {
      for (const pass of passwords) {
        await testSolarmanToken(appId, appSecret, email, pass);
        console.log("-".repeat(50));
      }
    }
  }
}

run().catch(console.error);
