import axios from "axios";

async function run() {
  const localTime = Date.now();
  console.log("Local Timestamp (ms):", localTime);
  console.log("Local Time Date:", new Date(localTime).toISOString());
  
  try {
    const start = Date.now();
    const res = await axios.get("https://worldtimeapi.org/api/timezone/Etc/UTC", { timeout: 5000 });
    const delay = Date.now() - start;
    const serverTime = new Date(res.data.utc_datetime).getTime();
    
    console.log("Server Timestamp (ms):", serverTime);
    console.log("Server Time Date:", new Date(serverTime).toISOString());
    console.log("Measured network delay (ms):", delay);
    console.log("Clock drift (local - server) in ms:", localTime - serverTime + (delay / 2));
  } catch (err: any) {
    console.log("Failed to fetch worldtimeapi, trying google.com headers...");
    try {
      const start = Date.now();
      const res = await axios.head("https://www.google.com", { timeout: 5000 });
      const delay = Date.now() - start;
      const serverDateStr = res.headers.date;
      if (serverDateStr) {
        const serverTime = new Date(serverDateStr).getTime();
        console.log("Google Server Time:", serverDateStr);
        console.log("Clock drift (local - server) in ms:", localTime - serverTime + (delay / 2));
      }
    } catch (err2: any) {
      console.error("Failed to check time:", err2.message);
    }
  }
}

run().catch(console.error);
