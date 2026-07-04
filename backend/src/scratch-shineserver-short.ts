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
  console.log(`Testing: ${baseUrl}, user: ${usr}, pass: ${pass}`);

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
      console.log(`[SUCCESS] Cookie: ${cookie}`);
      return cookie;
    }
  } catch (err: any) {
    console.error(`Error:`, err.message);
  }
  return null;
}

async function main() {
  const regions = [
    "https://server.growatt.com",
    "https://server-us.growatt.com"
  ];
  
  // Try usr "rjm9984", pass "lm6t7e69"
  for (const r of regions) {
    const ok = await tryLogin(r, "rjm9984", "lm6t7e69");
    if (ok) return;
  }
}

main();
