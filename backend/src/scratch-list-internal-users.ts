import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        not: "CUSTOMER"
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  console.log("INTERNAL USERS:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
