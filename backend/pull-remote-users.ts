import { PrismaClient } from '@prisma/client';

// Connect to REMOTE Neon DB to see what users exist there
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_4NYF3wHeqkOm@ep-red-poetry-apyaxvb1-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      loginId: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      passwordHash: true,
      designationTitle: true,
      departmentId: true,
      reportingManagerId: true,
      isActive: true,
      employeeProfile: {
        select: { jobRole: true, zone: true, partnerId: true }
      }
    },
    where: {
      role: { in: ['EMPLOYEE', 'SUB_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'TEAM_LEAD'] }
    },
    take: 50
  });
  console.log(JSON.stringify(users, null, 2));
  console.log(`\nTotal users found: ${users.length}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
