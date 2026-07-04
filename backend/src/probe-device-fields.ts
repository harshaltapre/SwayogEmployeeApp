import "./config/env.js";
import axios from "axios";
import { getGrowattSession, getPortalPlants } from "./lib/growatt.js";

async function probe() {
  console.log("=== PROBING DEVICE FIELDS ===");
  const username = "R Nagpure";
  const password = "Swapnila@09";

  const webSession = await getGrowattSession(username, password);
  const plants = await getPortalPlants(webSession);
  if (!plants || plants.length === 0) {
    console.error("No plants found!");
    return;
  }
  const plantId = String(plants[0].id || plants[0].plantId || "");

  try {
    const resDevs = await axios.post(
      `https://server.growatt.com/panel/getDevicesByPlantList`,
      `plantId=${plantId}&currPage=1`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": webSession.secret,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    const devs = resDevs.data?.back?.data || resDevs.data?.obj?.datas || resDevs.data?.data || [];
    console.log("Device List count:", devs.length);
    if (devs.length > 0) {
      console.log("Full Device Object:", JSON.stringify(devs[0], null, 2));
    }
  } catch (e: any) {
    console.error("Failed to list devices:", e.message);
  }
}

probe().catch(console.error);
