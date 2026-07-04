import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check FoxESS/UTL customers
  const foxessCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { inverterBrand: { contains: "utl", mode: "insensitive" } },
        { inverterBrand: { contains: "foxess", mode: "insensitive" } },
      ]
    },
    select: {
      id: true,
      fullName: true,
      inverterBrand: true,
      inverterLoginId: true,
      inverterPassword: true,
      inverterApiKey: true,
      inverterDeviceSn: true,
    },
  });

  console.log(`Found ${foxessCustomers.length} FoxESS/UTL customers:`);
  for (const c of foxessCustomers) {
    console.log(`\n  [${c.id}] ${c.fullName}`);
    console.log(`    brand: "${c.inverterBrand}"`);
    console.log(`    loginId: "${c.inverterLoginId}"`);
    console.log(`    password: "${c.inverterPassword}"`);
    console.log(`    apiKey: "${c.inverterApiKey}"`);
    console.log(`    deviceSn: "${c.inverterDeviceSn}"`);
  }

  // Also check failing Growatt customers
  console.log("\n--- Failing Growatt Customers ---");
  const growattFailing = await prisma.customer.findMany({
    where: { id: { in: [53, 80, 82] } },
    select: {
      id: true,
      fullName: true,
      inverterBrand: true,
      inverterLoginId: true,
      inverterPassword: true,
      inverterApiKey: true,
      inverterDeviceSn: true,
    },
  });

  for (const c of growattFailing) {
    console.log(`\n  [${c.id}] ${c.fullName}`);
    console.log(`    brand: "${c.inverterBrand}"`);
    console.log(`    loginId: "${c.inverterLoginId}"`);
    console.log(`    password: "${c.inverterPassword}"`);
    console.log(`    apiKey: "${c.inverterApiKey}"`);
    console.log(`    deviceSn: "${c.inverterDeviceSn}"`);
  }

  // Also check failing ShineMonitor customers
  console.log("\n--- Failing ShineMonitor Customers ---");
  const shineMonitorFailing = await prisma.customer.findMany({
    where: { id: { in: [58, 52, 51, 78, 94] } },
    select: {
      id: true,
      fullName: true,
      inverterBrand: true,
      inverterLoginId: true,
      inverterPassword: true,
    },
  });

  for (const c of shineMonitorFailing) {
    console.log(`\n  [${c.id}] ${c.fullName}`);
    console.log(`    brand: "${c.inverterBrand}"`);
    console.log(`    loginId: "${c.inverterLoginId}"`);
    console.log(`    password: "${c.inverterPassword}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
