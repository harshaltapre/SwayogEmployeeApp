import axios from "axios";

async function run() {
  try {
    const loginRes = await axios.post("https://swayog-dashboard.vercel.app/api/v1/auth/login", {
      identifier: "harshaltapre27@gmail.com",
      password: "Harshal.27",
      role: "SUPER_ADMIN"
    });
    const token = loginRes.data.data.accessToken;
    console.log("Logged in successfully!");

    const employeesRes = await axios.get("https://swayog-dashboard.vercel.app/api/v1/users/internal?role=EMPLOYEE", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("API returned employees count:", employeesRes.data.data.length);
    console.log("FIRST EMPLOYEE:", JSON.stringify(employeesRes.data.data[0], null, 2));
  } catch (err: any) {
    console.error("Error occurred:", err.response?.data || err);
  }
}

run();
