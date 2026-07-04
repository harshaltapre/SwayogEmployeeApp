import axios from "axios";
import crypto from "crypto";

function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function testSolarmanToken(baseUrl: string, appId: string, appSecret: string, email: string, pass: string) {
  const url = `${baseUrl}/account/v1.0/token?appId=${encodeURIComponent(appId)}&language=en`;
  try {
    const response = await axios.post(url, {
      appSecret,
      email,
      password: sha256(pass)
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });
    console.log(`[${baseUrl}] -> status: ${response.status}, code: ${response.data?.code}, msg: ${response.data?.msg}`);
    if (response.data?.success) {
      console.log(`  ACCESS TOKEN: ${response.data?.access_token}`);
      return true;
    }
  } catch (err: any) {
    if (err.response) {
      console.log(`[${baseUrl}] -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[${baseUrl}] -> ${err.message}`);
    }
  }
  return false;
}

async function run() {
  const appId = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const appSecret = "a9a614e2";
  const email = "shubhamtyres@gmail.com";
  const pass = "Shubham@2025";

  await testSolarmanToken("https://api.solarmanpv.com", appId, appSecret, email, pass);
  await testSolarmanToken("https://globalapi.solarmanpv.com", appId, appSecret, email, pass);
}

run().catch(console.error);
