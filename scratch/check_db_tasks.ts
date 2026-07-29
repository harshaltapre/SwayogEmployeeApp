import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const envPath = path.resolve('d:/intrnship/SwayogEmployeeApp/backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[match[1]] = value.trim();
    }
  });
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const tasks = await prisma.task.findMany({
    take: 50,
    orderBy: { id: 'desc' }
  });

  console.log(`Total tasks found: ${tasks.length}`);
  for (const t of tasks) {
    console.log(`Task #${t.id} | Status: ${t.status} | Customer: ${t.customerName} | Before: ${t.beforeImageUrl} | After: ${t.afterImageUrl} | Msg: ${t.completionMessage}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
