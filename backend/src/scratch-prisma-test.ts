import { prisma } from "./lib/prisma.js";

async function test() {
  console.log("Testing Prisma connection via lib/prisma.ts...");
  const userCount = await prisma.user.count();
  console.log("User count in DB:", userCount);
  const sampleUser = await prisma.user.findFirst({
    where: { email: "harshaltapre27@gmail.com" }
  });
  console.log("Sample user found:", sampleUser?.email, sampleUser?.role);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect?.());
