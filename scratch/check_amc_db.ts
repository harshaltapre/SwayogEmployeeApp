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
  const visits = await prisma.amcVisit.findMany({
    take: 20,
    orderBy: { updatedAt: 'desc' },
    include: { customer: true }
  });

  console.log(`Found ${visits.length} recent AMC visits:`);
  for (const v of visits) {
    console.log(JSON.stringify({
      id: v.id,
      status: v.status,
      customerName: v.customer.fullName,
      notes: v.notes,
      visitNotes: v.visitNotes,
      completedByName: v.completedByName,
      beforeImageUrl: v.beforeImageUrl,
      afterImageUrl: v.afterImageUrl,
      completedAt: v.completedAt,
      updatedAt: v.updatedAt
    }, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
