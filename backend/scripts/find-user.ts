import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { loginId: true, role: true, email: true }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
main();
