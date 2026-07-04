import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      inverterBrand: {
        contains: "growatt",
        mode: "insensitive"
      }
    }
  });

  console.log(`Found ${customers.length} Growatt customers:`);
  for (const c of customers) {
    console.log(`Customer ID: ${c.id}, Name: ${c.fullName}`);
    console.log(`  inverterBrand: "${c.inverterBrand}"`);
    console.log(`  inverterLoginId: "${c.inverterLoginId}"`);
    console.log(`  inverterPassword: "${c.inverterPassword}"`);
    console.log(`  inverterApiKey: "${c.inverterApiKey}"`);
    console.log(`  inverterDeviceSn: "${c.inverterDeviceSn}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
