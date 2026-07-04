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

async function tryLogin(usr: string, pass: string) {
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  const baseUrl = "https://server.growatt.com";

  console.log(`\n========================================`);
  console.log(`[Testing Login] Username: ${usr}, Password: ${pass}`);
  console.log(`========================================`);

  let sessionCookie = "";
  let userId = "";

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
      sessionCookie = extractCookies(res);
      userId = String(res.data.back?.user?.id || res.data.user?.id || "");
      console.log(`[Success MD5 Login] Cookie: ${sessionCookie}, UserId: ${userId}`);
      return { sessionCookie, userId };
    } else {
      console.log(`[MD5 Login Failed] Response:`, JSON.stringify(res.data));
    }
  } catch (err: any) {
    console.error(`[MD5 Login Error]`, err.message);
  }

  // Attempt 2: Web Login
  try {
    const res = await axios.post(
      `${baseUrl}/login`,
      `userName=${encodeURIComponent(usr)}&password=${pwdMd5}`,
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
      console.log(`[Success Web Login] Cookie: ${cookie}`);
      return { sessionCookie: cookie, userId: "web_session" };
    } else {
      console.log(`[Web Login Failed] Header set-cookie not containing JSESSIONID`);
    }
  } catch (err: any) {
    console.error(`[Web Login Error]`, err.message);
  }

  return null;
}

async function main() {
  const result = await tryLogin("rjm9984", "e95c3093");

  if (result) {
    const { sessionCookie } = result;
    const baseUrl = "https://server.growatt.com";
    
    console.log(`\n--- Querying getPlantListTitle ---`);
    try {
      const resTitle = await axios.post(
        `${baseUrl}/index/getPlantListTitle`,
        "",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Cookie": sessionCookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 10000,
        }
      );
      console.log(`Plant list title response:`, JSON.stringify(resTitle.data, null, 2));
    } catch (err: any) {
      console.error(`getPlantListTitle failed:`, err.message);
    }

    console.log(`\n--- Querying getPlantData for 10404771 ---`);
    try {
      const resData = await axios.post(
        `${baseUrl}/panel/getPlantData.do`,
        `plantId=10404771`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Cookie": sessionCookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 10000,
        }
      );
      console.log(`getPlantData response:`, JSON.stringify(resData.data, null, 2));
    } catch (err: any) {
      console.error(`getPlantData failed:`, err.message);
    }
  }
}

main();
