import axios from "axios";

const WAAREE_BASE = "https://digital.waaree.com";

async function testNoSig(path: string, token: string, plantId: string, label: string) {
  const url = `${WAAREE_BASE}${path}`;
  const timestamp = Date.now();

  try {
    const response = await axios.get(url, {
      params: { plantId, sn: plantId, deviceSn: plantId },
      headers: {
        "Content-Type": "application/json",
        "token": token,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
  
  console.log("--- Testing No Signature Header ---");
  await testNoSig("/generic/v1/plant/flow", "a9a614e2", plantId, "Plant Flow with portalPassword");
  console.log("-----------------------------------------");
  await testNoSig("/generic/v1/plant/flow", "a7e01208-ab52-4729-a4ff-86fb87092ec3", plantId, "Plant Flow with expired UUID");
  console.log("-----------------------------------------");
  await testNoSig("/generic/v1/station/list", "a9a614e2", "", "Station List with portalPassword");
  console.log("-----------------------------------------");
  await testNoSig("/generic/v1/station/list", "a7e01208-ab52-4729-a4ff-86fb87092ec3", "", "Station List with expired UUID");
}

run().catch(console.error);
