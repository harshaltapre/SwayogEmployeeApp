import { listCustomers } from "../src/modules/customers/customers.service.js";
import { UserRole } from "@prisma/client";

async function runTest() {
  const auth = {
    userId: "some-user-id", // mock admin user ID
    role: UserRole.ADMIN,
  };

  console.log("=== Querying with AMC Status: active ===");
  const activeAmc = await listCustomers(auth, { amcStatus: "active" });
  console.log(`Found ${activeAmc.length} active AMC customers.`);

  console.log("=== Querying with AMC Status: none ===");
  const noneAmc = await listCustomers(auth, { amcStatus: "none" });
  console.log(`Found ${noneAmc.length} none AMC customers.`);

  console.log("=== Querying with Search: Gokul ===");
  const searchResults = await listCustomers(auth, { search: "Gokul" });
  console.log(`Found ${searchResults.length} customers for search 'Gokul'.`);
  if (searchResults.length > 0) {
    console.log("First match:", searchResults[0].name);
  }
}

runTest().catch(console.error);
