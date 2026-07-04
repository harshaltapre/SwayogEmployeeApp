import axios from "axios";

async function testRegion(baseUrl: string, token: string) {
  const url = `${baseUrl}/v1/plant/list?token=${token}`;
  console.log(`\nTesting OpenAPI region: ${baseUrl}`);
  try {
    const res = await axios.get(url, { timeout: 10000 });
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.data, null, 2));
    if (!res.data?.error_code && res.data?.data) {
      console.log(`SUCCESS on region: ${baseUrl}!`);
      return true;
    }
  } catch (err: any) {
    console.error(`Error on region ${baseUrl}:`, err.message);
  }
  return false;
}

async function main() {
  const token = "rjm9984lm6t7e69dm9630mniq134341";
  const regions = [
    "https://openapi.growatt.com",
    "https://openapi-us.growatt.com",
    "https://openapi-au.growatt.com",
    "https://openapi-cn.growatt.com"
  ];

  for (const region of regions) {
    const ok = await testRegion(region, token);
    if (ok) return;
  }
  console.log("All regions tested.");
}

main();
