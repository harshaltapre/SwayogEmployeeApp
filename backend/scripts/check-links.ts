import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    include: { user: true }
  });
  console.log(JSON.stringify(customers, null, 2));
  await prisma.$disconnect();
}
main();
