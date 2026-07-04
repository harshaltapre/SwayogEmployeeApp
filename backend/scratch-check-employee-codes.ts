import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "DEPARTMENT_HEAD", "TEAM_LEAD", "EMPLOYEE"],
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      loginId: true,
      employeeCode: true,
      role: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const u of users) {
    console.log(`- Name: ${u.fullName} | Email: ${u.email} | LoginId: ${u.loginId} | EmployeeCode: ${u.employeeCode} | Role: ${u.role}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
