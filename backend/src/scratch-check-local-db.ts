import { PrismaClient } from "@prisma/client";

async function main() {
  const localUrl = "postgresql://postgres:12345678@127.0.0.1:5432/dashboard_swayog";
  console.log("Testing connection to local database:", localUrl);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: localUrl,
      },
    },
  });

  try {
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Local user count: ${userCount}`);
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Local users sample:");
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  } catch (error: any) {
    console.log("Failed to connect to local database:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
