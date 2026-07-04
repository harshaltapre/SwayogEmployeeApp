import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  const user = await prisma.user.findUnique({
    where: { email: "harshaltapre26@gmail.com" },
    include: {
      employeeProfile: true,
      customerProfile: true,
    }
  });
  console.log("USER DETAILS:", JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
