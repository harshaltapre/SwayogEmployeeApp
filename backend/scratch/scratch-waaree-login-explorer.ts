import axios from "axios";
import crypto from "crypto";

const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

async function testLoginSignature(
  path: string,
  tokenHeader: string,
  sigStrSource: string,
  username: string,
  pass: string,
  label: string
) {
  const url = `${WAAREE_BASE}${path}`;
  const timestamp = Date.now();
  const signature = md5(sigStrSource.replace("{timestamp}", String(timestamp)));

  const headers: any = {
    "Content-Type": "application/json",
    "signature": signature,
    "timestamp": String(timestamp),
    "lang": "en",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  };

  if (tokenHeader !== undefined) {
    headers["token"] = tokenHeader;
  }

  // Test with raw password
  try {
    const response = await axios.post(url, {
      username,
      password: pass
    }, {
      headers,
      timeout: 8000
    });
    console.log(`[RAW-PASS] ${label} -> status: ${response.status}, errno: ${response.data?.errno}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    // ignore or log
  }

  // Test with MD5 password
  try {
    const response = await axios.post(url, {
      username,
      password: md5(pass)
    }, {
      headers,
      timeout: 8000
    });
    console.log(`[MD5-PASS] ${label} -> status: ${response.status}, errno: ${response.data?.errno}, data:`, JSON.stringify(response.data));
  } catch (err: any) {
    // ignore or log
  }
}

async function run() {
  const user = "ShubhamTyres";
  const pass = "Shubham@2025";
  const path = "/generic/v1/auth/login";

  console.log("--- Exploring Waaree Login Signatures ---");

  const tests = [
    {
      tokenHeader: "",
      sigStr: `${path}\r\n\r\n{timestamp}`,
      label: "Empty token in signature & header"
    },
    {
      tokenHeader: undefined,
      sigStr: `${path}\r\n\r\n{timestamp}`,
      label: "No token header, empty token in signature"
    },
    {
      tokenHeader: pass,
      sigStr: `${path}\r\n${pass}\r\n{timestamp}`,
      label: "Password as token in signature & header"
    },
    {
      tokenHeader: md5(pass),
      sigStr: `${path}\r\n${md5(pass)}\r\n{timestamp}`,
      label: "MD5 Password as token in signature & header"
    },
    {
      tokenHeader: "",
      sigStr: `${path}\r\n${pass}\r\n{timestamp}`,
      label: "Password in signature, empty token header"
    },
    {
      tokenHeader: "",
      sigStr: `${path}\r\n${md5(pass)}\r\n{timestamp}`,
      label: "MD5 Password in signature, empty token header"
    },
    {
      tokenHeader: "68d222dc-d84a-4aa4-82ae-793f584a61e7", // old token
      sigStr: `${path}\r\n68d222dc-d84a-4aa4-82ae-793f584a61e7\r\n{timestamp}`,
      label: "Old token in signature & header"
    }
  ];

  for (const t of tests) {
    await testLoginSignature(path, t.tokenHeader as any, t.sigStr, user, pass, t.label);
    console.log("--------------------------------------------------");
  }
}

run().catch(console.error);
