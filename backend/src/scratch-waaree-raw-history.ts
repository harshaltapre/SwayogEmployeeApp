import { retrieveWaareePlantData } from "./lib/waaree.js";

async function main() {
  const token = process.env.WAAREE_TOKEN || "test_token_placeholder";
  console.log("=== WAREE RAW HISTORY RETRIEVAL PROBE ===");
  console.log("Using token from env (WAAREE_TOKEN)...");
  
  const result = await retrieveWaareePlantData(token);
  console.log("\n=== FINAL RESULT ===");
  console.log(typeof result === "object" ? JSON.stringify(result, null, 2) : result);
}

main().catch(console.error);
