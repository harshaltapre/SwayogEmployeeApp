const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
  if (!user) return console.log('No employee found');
  
  const token = jwt.sign({ sub: user.id, role: user.role, loginId: 'test' }, process.env.JWT_ACCESS_SECRET || '7kPmNqRsTuVwXyZaBcDeFgHiJkLmNoPq8rStUvWxYz', { expiresIn: '1h' });
  console.log('Token:', token);
  
  // Also get a valid task ID
  const task = await prisma.task.findFirst({ where: { status: 'ASSIGNED' }});
  if (task) console.log('Task ID:', task.id);
}
main().finally(() => prisma.$disconnect());
