import axios from "axios";

async function testEndpoint(endpoint: string, params: Record<string, string>, headers: Record<string, string> = {}) {
  const baseUrl = "https://server.growatt.com";
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`\n----------------------------------------`);
  console.log(`Testing endpoint: ${endpoint}`);
  console.log(`Params:`, JSON.stringify(params));
  console.log(`Headers:`, JSON.stringify(headers));

  try {
    const res = await axios.post(
      url,
      new URLSearchParams(params).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ...headers
        },
        timeout: 10000
      }
    );
    console.log(`Status: ${res.status}`);
    console.log(`Response length:`, typeof res.data === "string" ? res.data.length : JSON.stringify(res.data).length);
    console.log(`Response (truncated):`, typeof res.data === "string" ? res.data.slice(0, 300) : JSON.stringify(res.data).slice(0, 300));
  } catch (err: any) {
    console.error(`Error:`, err.message);
  }
}

async function main() {
  const token = "rjm9984lm6t7e69dm9630mniq134341";
  
  // Try passing token as 'token', 'apiToken', 'apiKey', 'userId'
  await testEndpoint("/index/getPlantListTitle", { token });
  await testEndpoint("/index/getPlantListTitle", { apiToken: token });
  await testEndpoint("/index/getPlantListTitle", { apiKey: token });
  await testEndpoint("/index/getPlantListTitle", { userId: token });
  
  // Try with GET requests
  try {
    console.log(`\nTesting GET /index/getPlantListTitle?token=${token}`);
    const res = await axios.get(`https://server.growatt.com/index/getPlantListTitle?token=${token}`, { timeout: 10000 });
    console.log(`Status: ${res.status}`);
    console.log(`Response (truncated):`, JSON.stringify(res.data).slice(0, 300));
  } catch (e: any) {
    console.log("GET error:", e.message);
  }

  // Try getDevicesByPlantList with token
  await testEndpoint("/index/getDevicesByPlantList", { plantId: "10404771", currPage: "1", token });
  await testEndpoint("/index/getDevicesByPlantList", { plantId: "10404771", currPage: "1", userId: token });
}

main();
