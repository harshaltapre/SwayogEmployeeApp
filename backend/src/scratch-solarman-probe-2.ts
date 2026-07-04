import axios from "axios";
import crypto from "crypto";

function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function testSolarmanToken(appId: string, appSecret: string, email: string, pass: string, label: string) {
  const url = `https://globalapi.solarmanpv.com/account/v1.0/token?appId=${encodeURIComponent(appId)}&language=en`;
  console.log(`[SOLARMAN-PROBE] Testing ${label}...`);
  console.log(`  Parameters: appId=${appId}, appSecret=${appSecret}, email=${email}, pass=${pass}`);
  try {
    const response = await axios.post(url, {
      appSecret,
      email,
      password: sha256(pass)
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000
    });
    console.log(`[SOLARMAN-PROBE] Success:`, response.status);
    console.log(`[SOLARMAN-PROBE] Data:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (err: any) {
    if (err.response) {
      console.log(`[SOLARMAN-PROBE] Fail: status:`, err.response.status, "data:", JSON.stringify(err.response.data));
    } else {
      console.log(`[SOLARMAN-PROBE] Error:`, err.message);
    }
  }
  return null;
}

async function run() {
  const appId = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const appSecret = "a9a614e2"; // portalPassword
  const emailVal = "shubhamtyres@gmail.com";
  const passVal = "Shubham@2025"; // inverterPassword

  await testSolarmanToken(appId, appSecret, emailVal, passVal, "New Configuration (appSecret=a9a614e2)");
}

run().catch(console.error);
