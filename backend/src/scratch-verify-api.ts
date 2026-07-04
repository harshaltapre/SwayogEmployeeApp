import { PrismaClient } from "@prisma/client";
import { decryptToken } from "./lib/encryption.js";

const prisma = new PrismaClient();

async function main() {
  const gcs = await prisma.growattCustomer.findMany();
  console.log("=== GROWATT CUSTOMERS ===");
  for (const gc of gcs) {
    let decToken = "";
    try {
      decToken = decryptToken(gc.apiToken);
    } catch (e: any) {
      decToken = "Decryption failed: " + e.message;
    }
    console.log({
      id: gc.id,
      customerName: gc.customerName,
      plantId: gc.plantId,
      plantName: gc.plantName,
      apiTokenDecrypted: decToken,
      isActive: gc.isActive
    });
  }

  const gens = await prisma.growattGeneration.findMany();
  console.log("\n=== GROWATT GENERATIONS ===");
  console.log(JSON.stringify(gens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
