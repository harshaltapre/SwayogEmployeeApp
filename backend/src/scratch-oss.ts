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

  console.log(`Probing Region: ${baseUrl}, User: ${usr}`);

  // Attempt 1: MD5 API login
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
    if (res.data?.back?.success || res.data?.success) {
      const cookie = extractCookies(res);
      console.log(`[MD5 Success] Cookie: ${cookie}`);
      return cookie;
    }
  } catch (err: any) {
    //
  }

  // Attempt 2: Web Login
  try {
    const res = await axios.post(
      `${baseUrl}/login`,
      `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdMd5)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      }
    );
    const cookie = extractCookies(res);
    if (cookie.includes("JSESSIONID")) {
      console.log(`[Web Login Success] Cookie: ${cookie}`);
      return cookie;
    }
  } catch (err: any) {
    //
  }

  return null;
}

async function main() {
  const regions = [
    "https://oss.growatt.com",
    "http://oss.growatt.com"
  ];

  const credentials = [
    { usr: "rjm9984", pass: "lm6t7e69dm9630mniq134341" },
    { usr: "rjm9984", pass: "e95c3093" },
    { usr: "rjm9984lm6t7e69dm9630mniq134341", pass: "e95c3093" }
  ];

  for (const region of regions) {
    for (const cred of credentials) {
      const result = await tryLogin(region, cred.usr, cred.pass);
      if (result) {
        console.log(`=== OSS PORTAL SUCCESS! ===`);
        console.log(`Region: ${region}`);
        console.log(`User: ${cred.usr}`);
        return;
      }
    }
  }
  console.log("All OSS probes finished.");
}

main();
