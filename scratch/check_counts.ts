import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const customerCount = await prisma.customer.count();
  const userCustomerCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
  
  // Test listCustomers without limit
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: undefined,
  });

  // Test superadmin getAllUsers roleCounts
  const [roleCountsRaw, totalCustomerCount] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.customer.count(),
  ]);
  const roleCounts = roleCountsRaw.reduce((acc: Record<string, number>, row: any) => {
    acc[row.role] = row._count;
    return acc;
  }, {});
  roleCounts["CUSTOMER"] = Math.max(roleCounts["CUSTOMER"] || 0, totalCustomerCount);

  console.log("-----------------------------------------");
  console.log(`1. Admin Dashboard (totalCustomers):      ${customerCount}`);
  console.log(`2. SuperAdmin OverviewTab (Total Customers): ${customerCount} (list length: ${customers.length})`);
  console.log(`3. SuperAdmin CustomersTab (Total Customers): ${customerCount} (list length: ${customers.length})`);
  console.log(`4. User Management (Customer Role Count): ${roleCounts["CUSTOMER"]} (User table count: ${userCustomerCount})`);
  console.log("-----------------------------------------");
  console.log("Are all counts identical?", customerCount === customers.length && customerCount === roleCounts["CUSTOMER"] && customerCount === userCustomerCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
