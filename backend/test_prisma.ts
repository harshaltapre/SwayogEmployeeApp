import { PrismaClient } from '@prisma/client';
import { listInternalUsers } from './src/modules/users/users.service.js';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await listInternalUsers('SUB_ADMIN', { role: 'EMPLOYEE', limit: 1 });
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
