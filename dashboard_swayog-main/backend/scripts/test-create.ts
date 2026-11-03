import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        loginId: "CUST-TEST",
        email: "test@example.com",
        phoneNumber: "+1234567890",
        fullName: "Test Customer",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
        isActive: true,
      }
    });

    const customer = await (prisma as any).customer.create({
      data: {
        customerCode: "CUST-TEST",
        userId: user.id,
        fullName: "Test Customer",
        email: "test@example.com",
        phoneNumber: "+1234567890",
        city: "Test City",
        address: "Test Address",
        systemSizeKw: 5,
        installationDate: new Date(),
        amcStatus: "NONE",
        status: "ACTIVE",
        projectStage: 0
      }
    });
    console.log("Success:", customer);
  } catch (e: any) {
    console.error("Prisma Error:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
