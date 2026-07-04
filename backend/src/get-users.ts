import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      loginId: true,
    }
  });
  console.log("ADMIN USERS:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
