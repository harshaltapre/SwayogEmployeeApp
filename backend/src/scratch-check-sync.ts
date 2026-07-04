import "./config/env.js";
import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./lib/password.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking User vs Customer / Employee synchronization...");

  // 1. Check all customers
  const customers = await prisma.customer.findMany({
    include: {
      user: true
    }
  });

  console.log(`\n--- Customers Check (Total: ${customers.length}) ---`);
  let unlinkedCustomers = 0;
  let passwordMismatches = 0;

  for (const c of customers) {
    if (!c.userId) {
      console.log(`❌ Customer ${c.fullName} (${c.customerCode}) has NO userId linked!`);
      unlinkedCustomers++;
      continue;
    }
    if (!c.user) {
      console.log(`❌ Customer ${c.fullName} (${c.customerCode}) has userId ${c.userId} but the User record does not exist!`);
      unlinkedCustomers++;
      continue;
    }

    // Verify password hash
    if (c.portalPassword) {
      const match = await verifyPassword(c.portalPassword, c.user.passwordHash);
      if (!match) {
        console.log(`⚠️ Password mismatch for Customer ${c.fullName} (${c.customerCode}):`);
        console.log(`   Customer profile portalPassword: "${c.portalPassword}"`);
        console.log(`   User passwordHash: "${c.user.passwordHash}" (Does not match!)`);
        passwordMismatches++;
      }
    } else {
      console.log(`ℹ️ Customer ${c.fullName} (${c.customerCode}) has no portalPassword in Customer table.`);
    }
  }

  // 2. Check all employees
  const employees = await prisma.employeeProfile.findMany({
    include: {
      user: true
    }
  });

  console.log(`\n--- Employees Check (Total: ${employees.length}) ---`);
  let unlinkedEmployees = 0;
  let empPasswordMismatches = 0;

  for (const e of employees) {
    if (!e.userId) {
      console.log(`❌ EmployeeProfile (ID: ${e.id}) has NO userId!`);
      unlinkedEmployees++;
      continue;
    }
    if (!e.user) {
      console.log(`❌ EmployeeProfile (ID: ${e.id}) has userId ${e.userId} but User does not exist!`);
      unlinkedEmployees++;
      continue;
    }

    // Verify user portalPassword matches hash
    if (e.user.portalPassword) {
      const match = await verifyPassword(e.user.portalPassword, e.user.passwordHash);
      if (!match) {
        console.log(`⚠️ Password mismatch for User ${e.user.fullName} (${e.user.email}):`);
        console.log(`   User portalPassword: "${e.user.portalPassword}"`);
        console.log(`   User passwordHash: "${e.user.passwordHash}" (Does not match!)`);
        empPasswordMismatches++;
      }
    } else {
      console.log(`ℹ️ Employee ${e.user.fullName} (${e.user.email}) has no portalPassword in User table.`);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Unlinked Customers: ${unlinkedCustomers}`);
  console.log(`Customer Password Mismatches: ${passwordMismatches}`);
  console.log(`Unlinked Employees: ${unlinkedEmployees}`);
  console.log(`Employee Password Mismatches: ${empPasswordMismatches}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
