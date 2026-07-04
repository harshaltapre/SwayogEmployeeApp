import { prisma } from "../src/lib/prisma.js";

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: "harshaltapre27@gmail.com" },
    select: {
      id: true,
      email: true,
      role: true,
      loginId: true,
      isActive: true,
      fullName: true,
    },
  });
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkUser().catch(console.error);
