import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      fullName: true,
      inverterBrand: true,
      inverterLoginId: true,
      inverterPassword: true,
      inverterApiKey: true,
      inverterDeviceSn: true,
      status: true
    }
  });
  console.log(`Total customers: ${customers.length}`);
  console.log("Customer list:", JSON.stringify(customers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
