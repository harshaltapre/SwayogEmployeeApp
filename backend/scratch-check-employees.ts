import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
    },
    include: {
      employeeProfile: true,
    },
  });

  console.log(`Found ${employees.length} employees:`);
  employees.forEach((emp) => {
    console.log({
      id: emp.id,
      loginId: emp.loginId,
      email: emp.email,
      role: emp.role,
      profileJobRole: emp.employeeProfile?.jobRole,
      profileZone: emp.employeeProfile?.zone,
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
