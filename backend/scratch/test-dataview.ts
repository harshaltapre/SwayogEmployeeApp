import axios from "axios";

async function main() {
  const url = "https://digital.waaree.com/bus/dataView";
  const apiKey = "a7e01208-ab52-4729-a4ff-86fb87092ec3";
  const plantId = "750a9b0ch881ff413ca8332j6c3b3875e8a5";
  const username = "ShubhamTyres";

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Origin": "https://digital.waaree.com",
    "Referer": "https://digital.waaree.com/",
    "token": apiKey,
    "Authorization": apiKey,
    "Cookie": `token=${apiKey}; token_id=${apiKey};`
  };

  console.log(`Sending GET request to ${url} with token...`);
  try {
    const response = await axios.get(url, {
      params: {
        plantId,
        deviceSn: plantId,
        username,
        apiKey,
      },
      headers,
      timeout: 10000,
    });
    console.log("Status:", response.status);
    console.log("Headers:", JSON.stringify(response.headers, null, 2));
    const html = response.data;
    console.log("HTML length:", typeof html === "string" ? html.length : "Not a string");
    if (typeof html === "string") {
      console.log("Preview:", html.slice(0, 1000));
      // Look for any of the regex fields in the response html
      const matches = {
        todayYield: html.match(/todayYield\s*:\s*([\d.]+)/i),
        dailyGeneration: html.match(/dailyGeneration\s*:\s*([\d.]+)/i),
        today_yield: html.match(/today_yield\s*:\s*([\d.]+)/i),
        today_kwh: html.match(/today\s*:\s*([\d.]+)\s*(?:kWh)/i),
        id_today: html.match(/id="today-yield"[^>]*>([\d.]+)/i),
        class_today: html.match(/class="[^"]*yield-today[^"]*"[^>]*>([\d.]+)/i),
      };
      console.log("Matches:", JSON.stringify(matches, null, 2));
    }
  } catch (error: any) {
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Headers:", JSON.stringify(error.response.headers, null, 2));
      console.log("Error Data:", typeof error.response.data === "object" ? JSON.stringify(error.response.data, null, 2) : error.response.data);
    } else {
      console.log("Error Message:", error.message);
    }
  }
}

main().catch(console.error);
