import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

async function testSignature(path: string, token: string, signature: string, timestamp: number, label: string) {
  const url = `${WAAREE_BASE}${path}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "token": token,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 5000
    });
    console.log(`[SUCCESS] ${label} -> status: ${response.status}, data:`, JSON.stringify(response.data));
    return true;
  } catch (err: any) {
    if (err.response) {
      if (err.response.data?.errno !== 40256) {
        console.log(`[NOT-40256] ${label} -> status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
      }
    } else {
      console.log(`[ERROR] ${label} -> ${err.message}`);
    }
    return false;
  }
}

async function run() {
  const token = "68d222dc-d84a-4aa4-82ae-793f584a61e7";
  const secret = "a9a614e2"; // portalPassword
  const path = "/generic/v1/plant/list";
  const timestamp = Date.now();

  console.log("--- Exploring Signature Formulas ---");

  const formulas = [
    // 1. Classic FoxESS (no secret)
    {
      sig: md5(`${path}\r\n${token}\r\n${timestamp}`),
      label: "Classic FoxESS: path + \\r\\n + token + \\r\\n + timestamp"
    },
    // 2. Classic FoxESS with literal \\r\\n
    {
      sig: md5(`${path}\\r\\n${token}\\r\\n${timestamp}`),
      label: "Classic FoxESS (literal): path + '\\\\r\\\\n' + token + '\\\\r\\\\n' + timestamp"
    },
    // 3. Hashing with secret at the end
    {
      sig: md5(`${path}\r\n${token}\r\n${timestamp}\r\n${secret}`),
      label: "path + \\r\\n + token + \\r\\n + timestamp + \\r\\n + secret"
    },
    // 4. Hashing with secret at the beginning
    {
      sig: md5(`${secret}\r\n${path}\r\n${token}\r\n${timestamp}`),
      label: "secret + \\r\\n + path + \\r\\n + token + \\r\\n + timestamp"
    },
    // 5. standard md5(token + timestamp + secret)
    {
      sig: md5(`${token}${timestamp}${secret}`),
      label: "token + timestamp + secret"
    },
    // 6. Solis style (signature = md5(path + md5(secret) + timestamp))
    {
      sig: md5(`${path}${md5(secret)}${timestamp}`),
      label: "Solis style: path + md5(secret) + timestamp"
    },
    // 7. No newlines (classic FoxESS but without newlines)
    {
      sig: md5(`${path}${token}${timestamp}`),
      label: "path + token + timestamp (no newlines)"
    },
    // 8. No newlines with secret
    {
      sig: md5(`${path}${token}${timestamp}${secret}`),
      label: "path + token + timestamp + secret (no newlines)"
    },
    // 9. Using secret instead of token in signature
    {
      sig: md5(`${path}\r\n${secret}\r\n${timestamp}`),
      label: "path + \\r\\n + secret + \\r\\n + timestamp"
    }
  ];

  for (const f of formulas) {
    await testSignature(path, token, f.sig, timestamp, f.label);
  }
}

run().catch(console.error);
