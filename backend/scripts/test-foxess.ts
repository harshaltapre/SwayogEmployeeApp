#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config();

import { fetchFoxessData, fetchFoxessHistory } from "../src/lib/foxess.js";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(prefix)) return a.slice(prefix.length);
  }
  return undefined;
}

async function main() {
  const apiKey = parseArg("apiKey") || process.env.FOXESS_API_KEY;
  const deviceSn = parseArg("deviceSn") || process.env.FOXESS_DEVICE_SN;

  if (!apiKey) {
    console.error("Missing FoxESS API key. Provide --apiKey=KEY or set FOXESS_API_KEY in env.");
    process.exit(2);
  }

  try {
    console.log("Attempting to fetch realtime metrics...");
    const metrics = await fetchFoxessData(apiKey, deviceSn);
    console.log("Realtime metrics:", metrics);
  } catch (err: any) {
    console.error("Realtime fetch failed:", err?.message ?? String(err));
  }

  try {
    console.log("Attempting to fetch daily history (sample)...");
    const history = await fetchFoxessHistory(apiKey, deviceSn, "daily");
    console.log(`History points: ${Array.isArray(history) ? history.length : 0}`);
    if (Array.isArray(history)) console.log(history.slice(0, 5));
  } catch (err: any) {
    console.error("History fetch failed:", err?.message ?? String(err));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
