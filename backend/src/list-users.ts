import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { email: true, loginId: true, fullName: true, phoneNumber: true }
  });
  console.log("Customers:");
  console.log(JSON.stringify(users, null, 2));

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { email: true, loginId: true, fullName: true, phoneNumber: true }
  });
  console.log("Employees:");
  console.log(JSON.stringify(employees, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
