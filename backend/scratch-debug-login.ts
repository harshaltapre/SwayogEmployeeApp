import { ensurePrismaInitialized } from "./src/lib/prisma.js";

async function test() {
  try {
    console.log("Initializing Prisma via lib/prisma.ts (with Neon adapter logic)...");
    const prisma = await ensurePrismaInitialized();
    
    console.log("Success! Connected.");
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed:", error);
    if (error.stack) console.error(error.stack);
  }
}

test();
