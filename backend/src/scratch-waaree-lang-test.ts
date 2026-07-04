import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

async function testLangHeader(withLang: boolean) {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const path = "/generic/v1/plant/list";
  const timestamp = Date.now();
  const signature = createSignature(path, token, timestamp);
  const url = `${WAAREE_BASE}${path}`;

  const headers: any = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "token": token,
    "signature": signature,
    "timestamp": String(timestamp),
  };

  if (withLang) {
    headers["lang"] = "en";
  }

  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    console.log(`[lang: ${withLang ? "yes" : "no"}] status: ${response.status}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    if (err.response) {
      console.log(`[lang: ${withLang ? "yes" : "no"}] status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[lang: ${withLang ? "yes" : "no"}] error:`, err.message);
    }
  }
}

async function run() {
  await testLangHeader(false);
  await testLangHeader(true);
}

run().catch(console.error);
