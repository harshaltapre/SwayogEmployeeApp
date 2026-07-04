import { prisma } from "./src/lib/prisma.js";

async function main() {
  const phone = '7020822602';
  console.log('Searching for phone:', phone);
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: phone },
        { loginId: phone },
        { phoneNumber: phone },
      ]
    }
  });
  console.log('User found:', user);
  
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      loginId: true,
      phoneNumber: true
    }
  });
  console.log('All Users in DB:', allUsers);
}

main().catch(console.error);
