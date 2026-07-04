import axios from "axios";
import crypto from "crypto";

async function probeDomain(domain: string) {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

  console.log(`\n=== Probing Domain: ${domain} ===`);
  const urls = [
    `${domain}/c/v0/user/login`,
    `${domain}/generic/v1/auth/login`,
    `${domain}/`
  ];

  for (const url of urls) {
    try {
      console.log(`Calling POST/GET ${url}...`);
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "lang": "en"
      };
      let response;
      if (url.endsWith("/")) {
        response = await axios.get(url, { headers, timeout: 5000 });
      } else {
        response = await axios.post(url, { user: username, password: hashedPassword, username, password }, { headers, timeout: 5000 });
      }
      console.log(`-> Status: ${response.status}, data:`, typeof response.data === "object" ? JSON.stringify(response.data).slice(0, 200) : String(response.data).slice(0, 200));
    } catch (err: any) {
      if (err.response) {
        console.log(`-> Fail Status: ${err.response.status}, body:`, typeof err.response.data === "object" ? JSON.stringify(err.response.data).slice(0, 200) : String(err.response.data).slice(0, 200));
      } else {
        console.log(`-> Error: ${err.message}`);
      }
    }
  }
}

async function run() {
  await probeDomain("https://www.waaree-portal.com");
  await probeDomain("https://waaree-portal.com");
  await probeDomain("https://waareecloud.ai");
}

run();
