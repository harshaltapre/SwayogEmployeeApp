import axios from "axios";

async function main() {
  try {
    const res = await axios.get("http://localhost:4000/api/v1/subadmin/customers/119/inverter-generation-history?period=daily", {
      headers: {
        // Wait, does it require authentication? Yes, authenticateAccessToken!
        // We need to generate a token or bypass auth.
        // Wait, let's look at the controller logic. It expects token!
      }
    });
    console.log(res.data);
  } catch (err: any) {
    console.error(err.message);
  }
}
main();
