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

async function testPost(usr: string, pass: string, format: "raw" | "md5" | "base64", paramType: "account" | "userName") {
  const baseUrl = "https://server.growatt.com";
  let pwdVal = pass;
  if (format === "md5") {
    pwdVal = crypto.createHash("md5").update(pass).digest("hex");
  } else if (format === "base64") {
    pwdVal = Buffer.from(pass).toString("base64");
  }

  const payload = paramType === "account"
    ? `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdVal)}`
    : `userName=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdVal)}&type=1`;

  const url = paramType === "account" ? `${baseUrl}/login` : `${baseUrl}/login`;

  try {
    const res = await axios.post(
      url,
      payload,
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

    const cookie = extractCookies(res);
    
    // Test if session is authenticated by fetching getPlantListTitle
    if (cookie.includes("JSESSIONID")) {
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
          // Failed
        } else {
          console.log(`-> SUCCESS for usr=${usr}, pass=${pass}, format=${format}, params=${paramType}`);
          console.log(`-> Cookie: ${cookie}`);
          console.log(`-> Response:`, JSON.stringify(resTitle.data));
          return cookie;
        }
      } catch (e: any) {
        // Failed
      }
    }
  } catch (err: any) {
    // Failed
  }
  return null;
}

async function main() {
  const users = ["rjm9984"];
  const passwords = [
    "rjm9984lm6t7e69dm9630mniq134341",
    "rjm9984lm6t7e69dm9630mniq1343417",
    "lm6t7e69dm9630mniq134341",
    "lm6t7e69dm9630mniq1343417"
  ];

  for (const u of users) {
    for (const p of passwords) {
      for (const format of ["raw", "md5", "base64"] as const) {
        for (const pt of ["account", "userName"] as const) {
          const cookie = await testPost(u, p, format, pt);
          if (cookie) return;
        }
      }
    }
  }
  console.log("All combinations tried. No success.");
}

main().catch(console.error);
