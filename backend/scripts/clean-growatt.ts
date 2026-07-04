import dotenv from "dotenv";
dotenv.config({ override: true });

import { prisma } from "../src/lib/prisma.js";

async function main() {
  try {
    console.log("Cleaning up growatt_generations and growatt_customers tables...");
    
    // Check if tables exist and delete rows
    try {
      const deletedGen = await prisma.$executeRawUnsafe(`TRUNCATE TABLE "growatt_generations" CASCADE;`);
      console.log("Cleared growatt_generations:", deletedGen);
    } catch (e: any) {
      console.log("Could not truncate growatt_generations:", e.message);
    }

    try {
      const deletedCust = await prisma.$executeRawUnsafe(`TRUNCATE TABLE "growatt_customers" CASCADE;`);
      console.log("Cleared growatt_customers:", deletedCust);
    } catch (e: any) {
      console.log("Could not truncate growatt_customers:", e.message);
    }

    console.log("Cleanup finished.");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    process.exit(0);
  }
}

main();
