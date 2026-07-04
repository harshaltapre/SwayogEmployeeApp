import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected to database');
    const customers = await prisma.customer.findMany({
      where: {
        inverterBrand: {
          contains: 'waaree',
          mode: 'insensitive'
        }
      }
    });
    console.log('Customers with Waaree inverters:', JSON.stringify(customers, null, 2));
    
    const allInverterBrands = await prisma.customer.findMany({
      where: {
        inverterBrand: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        inverterBrand: true,
        inverterLoginId: true,
        inverterApiKey: true,
        inverterDeviceSn: true
      }
    });
    console.log('All configured customers:', JSON.stringify(allInverterBrands, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
