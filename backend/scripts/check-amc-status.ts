import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAmcStatus() {
  const customers = await prisma.customer.findMany({
    select: {
      fullName: true,
      amcStatus: true
    }
  });
  console.log(JSON.stringify(customers, null, 2));
  await prisma.$disconnect();
}

checkAmcStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
