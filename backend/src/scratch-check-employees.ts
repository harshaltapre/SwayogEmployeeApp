import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      fullName: {
        in: ["Harshal Tapre", "Mayur Gharjare", "Nishank Zade"]
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true
    }
  });
  console.log("EMPLOYEES:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
