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

async function tryLogin(baseUrl: string, usr: string, pass: string) {
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  console.log(`Testing ShineServer region: ${baseUrl} for user ${usr}`);

  try {
    const res = await axios.post(
      `${baseUrl}/newTwoLoginAPI.do`,
      `userName=${encodeURIComponent(usr)}&password=${pwdMd5}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
        timeout: 10000,
      }
    );
    console.log(`Response:`, JSON.stringify(res.data));
    if (res.data?.back?.success || res.data?.success) {
      const cookie = extractCookies(res);
      const userId = String(res.data.back?.user?.id || res.data.user?.id || "");
      console.log(`[SUCCESS] Cookie: ${cookie}, UserId: ${userId}`);
      return { cookie, userId };
    }
  } catch (err: any) {
    console.error(`Error:`, err.message);
  }
  return null;
}

async function main() {
  const domains = [
    "https://server.growatt.com",
    "https://server-us.growatt.com",
    "https://server-au.growatt.com"
  ];

  const usr = "atant solar";
  const pass = "Solar1234";

  for (const domain of domains) {
    const ok = await tryLogin(domain, usr, pass);
    if (ok) {
      console.log(`*** FOUND WORKING SHINESERVER REGION: ${domain} ***`);
      return;
    }
  }
  console.log("Probing finished.");
}

main();
