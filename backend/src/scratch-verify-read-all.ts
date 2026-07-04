import { prisma } from "./lib/prisma.js";

async function test() {
  try {
    const updated = await prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true }
    });
    console.log("SUCCESS: prisma.adminNotification.updateMany works. Count =", updated.count);
  } catch (err) {
    console.error("FAILURE:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
