import "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { hashPassword } from "./lib/password.js";
import { generateUniqueLoginId } from "./lib/login-id.js";

async function main() {
  const email = "subadmin@swayog.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Subadmin already exists");
    return;
  }
  const passwordHash = await hashPassword("Password@123");
  const loginId = await generateUniqueLoginId("SUB_ADMIN" as any);
  const user = await prisma.user.create({
    data: {
      email,
      fullName: "Achal Wankar",
      role: "SUB_ADMIN" as any,
      loginId,
      passwordHash,
      isActive: true,
    }
  });
  console.log("Created subadmin user:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
