import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      loginId: true,
      email: true,
      phoneNumber: true,
      employeeCode: true,
      role: true,
      fullName: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      customerCode: true,
      fullName: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total users in DB: ${users.length}`);
  console.log("=== Employee / Admin Users ===");
  users.filter(u => u.role !== "CUSTOMER" && u.role !== "PARTNER").forEach(u => {
    console.log(`- [${u.role}] Name: ${u.fullName}, Login: ${u.loginId}, Email: ${u.email}, Code: ${u.employeeCode}`);
  });

  console.log("=== Partner Users ===");
  users.filter(u => u.role === "PARTNER").forEach(u => {
    console.log(`- Name: ${u.fullName}, Login: ${u.loginId}, Code: ${u.employeeCode}`);
  });

  console.log("=== Customer Records ===");
  console.log(`Total customers: ${customers.length}`);
  customers.slice(0, 10).forEach(c => {
    console.log(`- Name: ${c.fullName}, Code: ${c.customerCode}`);
  });
  if (customers.length > 10) console.log("... and more");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

