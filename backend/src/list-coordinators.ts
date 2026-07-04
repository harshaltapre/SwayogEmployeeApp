import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: "SUB_ADMIN" },
        { employeeProfile: { jobRole: { mode: "insensitive", equals: "servicecoordinator" } } }
      ]
    },
    select: { email: true, loginId: true, fullName: true, role: true, employeeProfile: { select: { jobRole: true } } }
  });
  console.log("Coordinators / Sub-Admins:");
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
