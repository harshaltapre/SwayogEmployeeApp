const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.attendanceRule.findUnique({ where: { id: 'default' } });
  console.log('AttendanceRules:', JSON.stringify(rules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
