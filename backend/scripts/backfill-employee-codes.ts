import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get all users with any kind of employee-like code (SWA_EMP_XXX, EMP-XXX, etc.)
  const allUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "DEPARTMENT_HEAD", "TEAM_LEAD", "EMPLOYEE"],
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      employeeCode: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${allUsers.length} internal users total.`);
  
  // Reassign all of them sequentially with SWA_EMP_XXX format
  let counter = 1;
  for (const user of allUsers) {
    const newCode = `SWA_EMP_${String(counter).padStart(3, "0")}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeCode: newCode },
    });
    console.log(`${user.fullName} (${user.email}) | Old: ${user.employeeCode || "null"} -> New: ${newCode}`);
    counter++;
  }

  console.log(`\nDone! All ${allUsers.length} employees now have SWA_EMP_XXX codes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
