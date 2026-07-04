import "../src/config/env.js";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const password = "Password@123";
  const passwordHash = await hashPassword(password);

  console.log("Updating admin: swayogenergy@gmail.com...");
  await prisma.user.updateMany({
    where: { email: "swayogenergy@gmail.com" },
    data: {
      passwordHash,
      portalPassword: password,
    },
  });

  console.log("Updating subadmin: subadmin@swayog.com...");
  await prisma.user.updateMany({
    where: { email: "subadmin@swayog.com" },
    data: {
      passwordHash,
      portalPassword: password,
    },
  });

  console.log("Updating other users with null portalPassword...");
  const usersToUpdate = await prisma.user.findMany({
    where: {
      portalPassword: null,
    },
    select: { id: true, role: true, email: true },
  });

  console.log(`Found ${usersToUpdate.length} users with null portalPassword.`);

  let updatedCount = 0;
  for (const user of usersToUpdate) {
    // Skip if role is SUPER_ADMIN unless it's harshaltapre27@gmail.com
    if (user.role === "SUPER_ADMIN" && user.email !== "harshaltapre27@gmail.com") {
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        portalPassword: password,
      },
    });

    if (user.role === "CUSTOMER") {
      await prisma.customer.updateMany({
        where: { userId: user.id },
        data: {
          portalPassword: password,
        },
      });
    }

    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} users' passwords.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
