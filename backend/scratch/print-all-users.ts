import "../src/config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "EMPLOYEE"],
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      loginId: true,
      portalPassword: true,
    },
  });

  console.log(`Internal users found: ${users.length}`);
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
