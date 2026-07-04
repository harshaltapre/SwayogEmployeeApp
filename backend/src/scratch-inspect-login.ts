import axios from "axios";

async function main() {
  const baseUrl = "https://server.growatt.com";
  try {
    const res = await axios.get(`${baseUrl}/login`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    console.log("=== Searching for ajax or submit requests ===");
    // Find script tags or form tags or strings containing /login or .do or url:
    const html = res.data;
    
    // Find all occurrences of URL or endpoints
    const lines = html.split("\n");
    lines.forEach((line: string, i: number) => {
      if (line.includes(".do") || line.includes("url:") || line.includes("ajax") || line.includes("submit") || line.includes("login") || line.includes("pwd")) {
        if (line.length < 200) {
          console.log(`Line ${i + 1}: ${line.trim()}`);
        }
      }
    });
  } catch (err: any) {
    console.error("Failed to inspect login page:", err.message);
  }
}

main();
