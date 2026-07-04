import axios from "axios";

async function main() {
  const token = "rjm9984lm6t7e69dm9630mniq134341";
  const url = `https://openapi.growatt.com/v1/plant/list?token=${token}`;
  
  console.log(`[Growatt Request Log]`);
  console.log(`URL: ${url}`);
  console.log(`Headers:`, {
    Accept: "application/json, text/plain, */*",
    "User-Agent": "axios/1.6.8"
  });

  try {
    const res = await axios.get(url, { timeout: 15000 });
    console.log(`\n[Growatt Response Log]`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
    console.log(`Raw Body:`, typeof res.data === "string" ? res.data : JSON.stringify(res.data));
    console.log(`Parsed JSON:`, JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error(`\n[Growatt Request Failed]`);
    console.error(`Message: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers:`, JSON.stringify(error.response.headers, null, 2));
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();
