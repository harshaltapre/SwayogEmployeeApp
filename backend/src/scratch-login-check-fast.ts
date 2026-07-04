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

async function verifySession(baseUrl: string, cookie: string): Promise<boolean> {
  try {
    const resTitle = await axios.post(
      `${baseUrl}/index/getPlantListTitle`,
      "",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": cookie,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 5000,
      }
    );
    if (typeof resTitle.data === "string" && resTitle.data.includes("dumpLogin")) {
      return false;
    }
    console.log(`[VERIFIED SUCCESS] Response:`, JSON.stringify(resTitle.data).slice(0, 300));
    return true;
  } catch (e: any) {
    return false;
  }
}

async function tryMobileLogin(usr: string, pass: string) {
  const baseUrl = "https://server.growatt.com";
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  try {
    const res = await axios.post(
      `${baseUrl}/newTwoLoginAPI.do`,
      `userName=${encodeURIComponent(usr)}&password=${pwdMd5}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
        timeout: 8000,
      }
    );
    if (res.data?.back?.success || res.data?.success) {
      const cookie = extractCookies(res);
      console.log(`[Success Mobile MD5] usr=${usr}, pass=${pass}`);
      const verified = await verifySession(baseUrl, cookie);
      if (verified) return cookie;
    }
  } catch (e: any) {
    //
  }

  try {
    const res = await axios.post(
      `${baseUrl}/newTwoLoginAPI.do`,
      `userName=${encodeURIComponent(usr)}&password=${encodeURIComponent(pass)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
        timeout: 8000,
      }
    );
    if (res.data?.back?.success || res.data?.success) {
      const cookie = extractCookies(res);
      console.log(`[Success Mobile Raw] usr=${usr}, pass=${pass}`);
      const verified = await verifySession(baseUrl, cookie);
      if (verified) return cookie;
    }
  } catch (e: any) {
    //
  }
  return null;
}

async function tryWebLogin(usr: string, pass: string) {
  const baseUrl = "https://server.growatt.com";
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  const pwdBase64 = Buffer.from(pass).toString("base64");

  for (const [label, pwdVal] of [
    ["MD5", pwdMd5],
    ["Base64", pwdBase64],
    ["Raw", pass]
  ]) {
    try {
      const res = await axios.post(
        `${baseUrl}/login`,
        `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdVal)}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 8000,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        }
      );
      const cookie = extractCookies(res);
      if (cookie.includes("JSESSIONID")) {
        const verified = await verifySession(baseUrl, cookie);
        if (verified) {
          console.log(`[Success Web ${label}] usr=${usr}, pass=${pass}`);
          return cookie;
        }
      }
    } catch (e: any) {
      //
    }
  }
  return null;
}

async function main() {
  const passwords = [
    "rjm9984lm6t7e69dm9630mniq1343417",
    "lm6t7e69dm9630mniq1343417",
    "lm6t7e69dm9630mniq134341",
    "rjm9984lm6t7e69dm9630mniq134341"
  ];

  for (const pass of passwords) {
    console.log(`Testing pass: ${pass}`);
    let c = await tryMobileLogin("rjm9984", pass);
    if (c) return;
    c = await tryWebLogin("rjm9984", pass);
    if (c) return;
  }
  console.log("No working login found.");
}

main().catch(console.error);
