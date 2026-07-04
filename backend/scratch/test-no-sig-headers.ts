import axios from "axios";

const WAAREE_BASE = "https://digital.waaree.com";

const commonHeaders = {
  "Content-Type": "application/json",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "Origin": "https://digital.waaree.com",
  "Referer": "https://digital.waaree.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

async function testNoSigHeaders(path: string, token: string, plantId: string, label: string) {
  const url = `${WAAREE_BASE}${path}`;
  const timestamp = Date.now();

  try {
    const response = await axios.get(url, {
      params: { plantId, sn: plantId, deviceSn: plantId, pageNum: 1, pageSize: 10 },
      headers: {
        ...commonHeaders,
        "token": token,
        "timestamp": String(timestamp),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    console.log(`[${label}] status: ${response.status}, errno: ${response.data?.errno}, msg: ${response.data?.msg}`);
    console.log(`[${label}] data:`, JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.log(`[${label}] FAIL status: ${err.response.status}, data:`, JSON.stringify(err.response.data));
    } else {
      console.log(`[${label}] ERROR: ${err.message}`);
    }
  }
}

async function run() {
  const plantId = "750a9b0c-881f-413c-8332-6c3b3875e8a5";
  
  console.log("--- Testing No Signature Header with full headers ---");
  await testNoSigHeaders("/generic/v1/station/list", "a9a614e2", "", "Station List with portalPassword");
  console.log("-----------------------------------------");
  await testNoSigHeaders("/generic/v1/station/list", "a7e01208-ab52-4729-a4ff-86fb87092ec3", "", "Station List with expired UUID");
  console.log("-----------------------------------------");
  await testNoSigHeaders("/generic/v1/station/list", "garbage_token_12345", "", "Station List with garbage token");
}

run().catch(console.error);
