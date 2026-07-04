import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const customers = await prisma.customer.findMany({
    where: {
      inverterBrand: {
        contains: "Waaree",
        mode: "insensitive"
      }
    }
  });
  console.log(`Found ${customers.length} Waaree customers:`);
  for (const c of customers) {
    console.log({
      id: c.id,
      fullName: c.fullName,
      inverterBrand: c.inverterBrand,
      inverterLoginId: c.inverterLoginId,
      inverterPassword: c.inverterPassword,
      inverterApiKey: c.inverterApiKey,
      inverterDeviceSn: c.inverterDeviceSn,
      portalPassword: c.portalPassword
    });
  }
  await prisma.$disconnect();
}

main().catch(console.error);
