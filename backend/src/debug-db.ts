import "./config/env.js";
import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./lib/password.js";

const prisma = new PrismaClient();

import { hashPassword } from "./lib/password.js";

async function main() {
  console.log("Connecting to database...");
  const user = await prisma.user.findUnique({
    where: { email: "harshaltapre27@gmail.com" }
  });
  if (!user) {
    console.log("User not found!");
    return;
  }
  const newPassword = "Harshal.27";
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      portalPassword: newPassword
    }
  });
  console.log("Successfully reset Super Admin password to:", newPassword);
}

main().catch(console.error).finally(() => prisma.$disconnect());
