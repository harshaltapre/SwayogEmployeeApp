import { fetchFoxessData } from "./lib/foxess.js";

async function run() {
  const username = "ShubhamTyres";
  const password = "Shubham@2025";
  const deviceSn = "750a9b0ch881ff413ca8332j6c3b3875e8a5";

  console.log("Calling fetchFoxessData from foxess.ts...");
  try {
    const data = await fetchFoxessData(username, deviceSn, password);
    console.log("SUCCESS:", data);
  } catch (err: any) {
    console.error("FAILED:", err.message);
  }
}

run().catch(console.error);
