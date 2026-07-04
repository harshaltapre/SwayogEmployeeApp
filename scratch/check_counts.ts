
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  console.log('User counts by role:', JSON.stringify(counts, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
