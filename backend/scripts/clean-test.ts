import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Delete customer first
    await prisma.customer.deleteMany({
      where: { customerCode: "CUST-TEST" }
    });
    // Delete user
    await prisma.user.deleteMany({
      where: { loginId: "CUST-TEST" }
    });
    console.log("Successfully cleaned up test records.");
  } catch (e: any) {
    console.error("Cleanup Error:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
