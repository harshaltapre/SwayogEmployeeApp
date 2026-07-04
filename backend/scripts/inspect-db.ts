import dotenv from "dotenv";
dotenv.config({ override: true });

console.log("DATABASE_URL in process.env:", process.env.DATABASE_URL);

import { prisma } from "../src/lib/prisma.js";

async function main() {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        inverterBrand: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        inverterBrand: true,
        inverterLoginId: true,
        inverterApiKey: true,
        inverterDeviceSn: true,
      }
    });

    console.log(`Found ${customers.length} customers with configured inverter brands.`);
    for (const c of customers) {
      console.log(`- ID: ${c.id}, Name: ${c.fullName}, Brand: "${c.inverterBrand}", Login ID/Token: "${c.inverterLoginId}", API Key: "${c.inverterApiKey}", Device SN: "${c.inverterDeviceSn}"`);
    }
  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    process.exit(0);
  }
}

main();
