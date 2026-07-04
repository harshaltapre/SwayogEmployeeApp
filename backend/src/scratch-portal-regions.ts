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
      const userId = String(res.data.back?.user?.id || res.data.user?.id || "");
      
      // Verify session
      const verified = await verifySession(baseUrl, cookie);
      if (verified) {
        return { cookie, userId };
      }
    }
  } catch (err: any) {
    //
  }

  // Attempt 2: Web Login using userName/password (with account parameter)
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
      const verified = await verifySession(baseUrl, cookie);
      if (verified) {
        return { cookie, userId: "web_session" };
      }
    }
  } catch (err: any) {
    //
  }

  return null;
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
    console.log(`[VERIFIED SESSION] Response:`, JSON.stringify(resTitle.data).slice(0, 300));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const regions = [
    "https://server.growatt.com",
    "https://server-us.growatt.com"
  ];

  const usernames = [
    "roshannagpure",
    "roshan_nagpure",
    "roshan.nagpure",
    "roshannagpure9",
    "nagpureroshan",
    "nagpure_roshan",
    "roshann"
  ];
  const pass = "e95c3093";

  for (const region of regions) {
    for (const usr of usernames) {
      console.log(`Probing Region: ${region}, User: ${usr}, Pass: ${pass}`);
      const result = await tryLogin(region, usr, pass);
      if (result) {
        console.log(`\n=== WORKING CREDENTIAL FOUND! ===`);
        console.log(`Region: ${region}`);
        console.log(`User: ${usr}`);
        console.log(`Pass: ${pass}`);
        console.log(`=================================`);
        return;
      }
    }
  }
  console.log("All combinations probed. No successful login.");
}

main();
