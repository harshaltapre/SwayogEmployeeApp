import "../src/config/env.js";
import { login } from "../src/modules/auth/auth.service.js";
import { listInternalUsers } from "../src/modules/users/users.service.js";

async function main() {
  try {
    console.log("Attempting to log in as harshaltapre27@gmail.com...");
    const session = await login({
      identifier: "harshaltapre27@gmail.com",
      password: "Harshal.27",
      role: "SUPER_ADMIN",
    });

    console.log("Login successful! Access token:", session.accessToken);
    console.log("User details:", session.user);

    console.log("Listing employees as SUPER_ADMIN...");
    const employees = await listInternalUsers("SUPER_ADMIN", { limit: 200, role: "EMPLOYEE" });
    console.log(`Successfully listed ${employees.length} employees:`);
    console.log(employees.slice(0, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
