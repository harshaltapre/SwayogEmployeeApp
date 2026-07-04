import axios from "axios";

async function testEndpoint(name: string, url: string) {
  try {
    const res = await axios.get(url, { params: { plantId: "TEST-WAAREE-PLANT-001" } });
    console.log(`[PASS] ${name}:`, JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error(`[FAIL] ${name}:`, err.response ? err.response.data : err.message);
  }
}

async function main() {
  console.log("=== TESTING WAAREE EXPRESS API ENDPOINTS ===");
  const base = "http://localhost:4000/api/waaree";
  
  await testEndpoint("GET live-power", `${base}/live-power`);
  await testEndpoint("GET today-yield", `${base}/today-yield`);
  await testEndpoint("GET total-yield", `${base}/total-yield`);
  await testEndpoint("GET power-graph", `${base}/power-graph`);
  await testEndpoint("GET device-status", `${base}/device-status`);
}

main();
