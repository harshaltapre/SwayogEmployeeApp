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

async function verifyLogin(usr: string, pass: string) {
  const baseUrl = "https://oss.growatt.com";
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  
  console.log(`\n========================================`);
  console.log(`Testing OSS Login: usr=${usr}, pass=${pass}`);
  console.log(`========================================`);

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

    // Verify by calling getPlantListTitle
    const resTitle = await axios.post(
      `${baseUrl}/index/getPlantListTitle`,
      "",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": cookie,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      }
    );

    if (typeof resTitle.data === "string" && resTitle.data.includes("dumpLogin")) {
      console.log(`-> Verification FAILED`);
    } else {
      console.log(`-> SUCCESS! Cookie: ${cookie}`);
      console.log(`-> Response:`, JSON.stringify(resTitle.data, null, 2));
      return cookie;
    }
  } catch (err: any) {
    console.error(`Error:`, err.message);
  }
  return null;
}

async function main() {
  // Test case A
  let cookie = await verifyLogin("rjm9984", "e95c3093");
  
  // Test case B
  if (!cookie) {
    cookie = await verifyLogin("rjm9984", "lm6t7e69dm9630mniq134341");
  }
}

main();
