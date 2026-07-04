import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database migration for user and customer codes...");

  // 1. Migrate Employees
  console.log("\n--- Migrating Employees/Admins ---");
  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: [
          "SUPER_ADMIN",
          "ADMIN",
          "SUB_ADMIN",
          "DEPARTMENT_HEAD",
          "TEAM_LEAD",
          "EMPLOYEE",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${employees.length} employee-like users.`);
  for (let i = 0; i < employees.length; i++) {
    const user = employees[i];
    const sequenceNum = i + 1;
    const newCode = `SWA_EMP_${String(sequenceNum).padStart(3, "0")}`;
    
    console.log(`Migrating user [${user.role}] "${user.fullName}":`);
    console.log(`  Old employeeCode: ${user.employeeCode} -> New: ${newCode}`);
    console.log(`  Old loginId:      ${user.loginId}      -> New: ${newCode}`);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        employeeCode: newCode,
        loginId: newCode,
      },
    });
  }

  // 2. Migrate Partners
  console.log("\n--- Migrating Partners ---");
  const partners = await prisma.user.findMany({
    where: { role: "PARTNER" },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${partners.length} partner users.`);
  for (let i = 0; i < partners.length; i++) {
    const user = partners[i];
    const sequenceNum = i + 1;
    const newCode = `SWA_PAT_${String(sequenceNum).padStart(3, "0")}`;

    console.log(`Migrating partner "${user.fullName}":`);
    console.log(`  Old employeeCode: ${user.employeeCode} -> New: ${newCode}`);
    console.log(`  Old loginId:      ${user.loginId}      -> New: ${newCode}`);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        employeeCode: newCode,
        loginId: newCode,
      },
    });
  }

  // 3. Migrate Customers
  console.log("\n--- Migrating Customers ---");
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${customers.length} customer records.`);
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const sequenceNum = i + 1;
    const newCode = `SWA_CUST_${String(sequenceNum).padStart(6, "0")}`;

    console.log(`Migrating customer "${customer.fullName}":`);
    console.log(`  Old customerCode: ${customer.customerCode} -> New: ${newCode}`);

    // Update Customer record
    await prisma.customer.update({
      where: { id: customer.id },
      data: { customerCode: newCode },
    });

    // Update associated User's loginId if linked
    if (customer.userId) {
      const linkedUser = await prisma.user.findUnique({
        where: { id: customer.userId },
        select: { loginId: true },
      });
      if (linkedUser) {
        console.log(`  Updating linked user loginId: ${linkedUser.loginId} -> ${newCode}`);
        await prisma.user.update({
          where: { id: customer.userId },
          data: { loginId: newCode },
        });
      }
    }
  }

  console.log("\nMigration completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
