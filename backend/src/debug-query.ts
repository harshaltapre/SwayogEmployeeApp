import "./config/env.js";
import { listInternalUsers } from "./modules/users/users.service.js";

async function main() {
  console.log("Simulating listInternalUsers for actorRole: ADMIN with role: EMPLOYEE...");
  try {
    const result = await listInternalUsers("ADMIN", { role: "EMPLOYEE", limit: 200 });
    console.log("Result type:", typeof result, "IsArray:", Array.isArray(result));
    console.log("Result length:", result?.length);
    if (result && result.length > 0) {
      console.log("First user:", JSON.stringify(result[0], null, 2));
    }
  } catch (error: any) {
    console.error("Error executing listInternalUsers:", error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main().catch(console.error);
