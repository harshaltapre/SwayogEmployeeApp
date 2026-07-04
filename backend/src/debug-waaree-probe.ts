import axios from "axios";

async function main() {
  const url = "https://digital.waaree.com/generic/v1/plant/flow";
  console.log(`Sending GET request to ${url}...`);
  try {
    const response = await axios.get(url, {
      params: { plantId: "12345" },
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    console.log("Status:", response.status);
    console.log("Headers:", JSON.stringify(response.headers, null, 2));
    console.log("Data:", JSON.stringify(response.data, null, 2));
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

main();
