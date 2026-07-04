import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { fullName: { contains: "Yogesh", mode: "insensitive" } },
    select: { id: true, email: true, loginId: true, fullName: true, role: true }
  });
  console.log("Found Yogesh users:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
