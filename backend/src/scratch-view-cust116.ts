import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const customer = await prisma.customer.findUnique({
    where: { id: 116 },
  });
  console.log("Customer 116 details:", JSON.stringify(customer, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
