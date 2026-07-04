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

async function main() {
  const baseUrl = "https://oss.growatt.com";
  const usr = "rjm9984";
  const pass = "lm6t7e69dm9630mniq134341";
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  
  console.log(`Sending login POST to ${baseUrl}/login`);
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
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );
    console.log("Status:", res.status);
    console.log("Headers:", JSON.stringify(res.headers, null, 2));
    console.log("Response Body (truncated):", typeof res.data === "string" ? res.data.slice(0, 500) : JSON.stringify(res.data));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
