import axios from "axios";
import crypto from "crypto";

async function probeLogin(url: string, body: any, label: string) {
  console.log(`[PROBE-LOGIN] Trying ${label} at ${url}...`);
  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "lang": "en"
      },
      timeout: 10000
    });
    console.log(`[PROBE-LOGIN] Success: ${label} -> status:`, response.status);
    console.log(`[PROBE-LOGIN] Data:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (err: any) {
    if (err.response) {
      console.log(`[PROBE-LOGIN] Fail: ${label} -> status:`, err.response.status, "data:", JSON.stringify(err.response.data));
    } else {
      console.log(`[PROBE-LOGIN] Error: ${label} ->`, err.message);
    }
  }
  return null;
}

async function run() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const md5Password = crypto.createHash("md5").update(password).digest("hex");
  const baseUrl = "https://digital.waaree.com";

  console.log("Password:", password);
  console.log("MD5 Hashed Password:", md5Password);

  const targets = [
    {
      url: `${baseUrl}/c/v0/user/login`,
      body: { user: username, password: md5Password },
      label: "c/v0/user/login (MD5)"
    },
    {
      url: `${baseUrl}/c/v0/user/login`,
      body: { user: username, password: password },
      label: "c/v0/user/login (Raw)"
    },
    {
      url: `${baseUrl}/generic/v1/auth/login`,
      body: { username, password },
      label: "generic/v1/auth/login (Raw)"
    },
    {
      url: `${baseUrl}/generic/v1/auth/login`,
      body: { username, password: md5Password },
      label: "generic/v1/auth/login (MD5)"
    },
    {
      url: `${baseUrl}/generic/v1/user/login`,
      body: { username, password },
      label: "generic/v1/user/login"
    }
  ];

  for (const t of targets) {
    const res = await probeLogin(t.url, t.body, t.label);
    if (res) {
      console.log(`\n🎉 FOUND A WORKING LOGIN ENDPOINT!`);
      break;
    }
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
