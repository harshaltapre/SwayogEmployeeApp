import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['EMPLOYEE', 'SUB_ADMIN', 'SUPER_ADMIN', 'ADMIN'] }
    },
    select: {
      id: true,
      loginId: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      designationTitle: true,
      isActive: true,
      employeeProfile: {
        select: { jobRole: true }
      }
    },
    take: 20
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
