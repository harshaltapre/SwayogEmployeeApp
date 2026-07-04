import axios from "axios";

async function testApi() {
  const baseUrl = "http://localhost:4000/api/v1";

  console.log("1. Logging in as Admin...");
  const loginRes = await axios.post(`${baseUrl}/auth/login`, {
    identifier: "harshaltapre27@gmail.com",
    password: "Harshal.27",
    role: "SUPER_ADMIN",
  });

  const token = loginRes.data?.data?.accessToken;
  console.log("Logged in! Token obtained.");

  const headers = { Authorization: `Bearer ${token}` };

  console.log("\n2. Querying all customers (no params)...");
  const allRes = await axios.get(`${baseUrl}/customers`, { headers });
  console.log(`All: Found ${allRes.data?.data?.length} customers.`);

  console.log("\n3. Querying with search 'Gokul'...");
  const searchRes = await axios.get(`${baseUrl}/customers`, {
    headers,
    params: { search: "Gokul" },
  });
  console.log(`Search 'Gokul': Found ${searchRes.data?.data?.length} customers.`);
  if (searchRes.data?.data?.length > 0) {
    console.log("Match:", searchRes.data.data[0].name);
  }

  console.log("\n4. Querying with amcStatus 'active'...");
  const activeRes = await axios.get(`${baseUrl}/customers`, {
    headers,
    params: { amcStatus: "active" },
  });
  console.log(`Active AMC: Found ${activeRes.data?.data?.length} customers.`);

  console.log("\n5. Querying with amcStatus 'none'...");
  const noneRes = await axios.get(`${baseUrl}/customers`, {
    headers,
    params: { amcStatus: "none" },
  });
  console.log(`None AMC: Found ${noneRes.data?.data?.length} customers.`);
}

testApi().catch((err) => {
  console.error("API test failed:", err.response?.data || err.message);
});
