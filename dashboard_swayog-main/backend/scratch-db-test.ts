
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('SUCCESS: Connected to database');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
  } catch (error) {
    console.error('FAILURE: Could not connect');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
