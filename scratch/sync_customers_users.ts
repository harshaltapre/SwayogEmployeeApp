import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../backend/src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting customer <-> user synchronization...");

  // 1. Unlinked Customers (have Customer record, but no User record)
  const unlinkedCustomers = await prisma.customer.findMany({
    where: { userId: null },
  });

  console.log(`Found ${unlinkedCustomers.length} customers without User record.`);

  for (const c of unlinkedCustomers) {
    const password = c.portalPassword || "TempPass123!";
    const passwordHash = await hashPassword(password);
    
    // Check if user with same loginId or email already exists
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId: c.customerCode },
          { email: c.email.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      console.log(`Linking existing user ${existingUser.loginId} to customer ${c.customerCode}`);
      await prisma.customer.update({
        where: { id: c.id },
        data: { userId: existingUser.id },
      });
    } else {
      console.log(`Creating user for customer ${c.customerCode} (${c.fullName})`);
      const newUser = await prisma.user.create({
        data: {
          loginId: c.customerCode,
          fullName: c.fullName,
          email: c.email.toLowerCase(),
          phoneNumber: c.phoneNumber || null,
          role: UserRole.CUSTOMER,
          isActive: c.status === "ACTIVE",
          portalPassword: password,
          passwordHash,
        },
      });
      await prisma.customer.update({
        where: { id: c.id },
        data: { userId: newUser.id },
      });
    }
  }

  // 2. Unlinked Users (have role CUSTOMER, but no Customer record)
  const unlinkedUsers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
      customerProfile: null,
    },
  });

  console.log(`Found ${unlinkedUsers.length} CUSTOMER users without Customer record.`);

  for (const u of unlinkedUsers) {
    console.log(`Creating Customer record for user ${u.loginId} (${u.fullName})`);
    await prisma.customer.create({
      data: {
        customerCode: u.loginId,
        fullName: u.fullName,
        email: u.email,
        phoneNumber: u.phoneNumber || "Not Provided",
        city: "Not Provided",
        address: "Not Provided",
        systemSizeKw: 0,
        installationDate: new Date(),
        portalPassword: u.portalPassword || "TempPass123!",
        userId: u.id,
        status: u.isActive ? "ACTIVE" : "INACTIVE",
      },
    });
  }

  // Verification
  const totalCustomers = await prisma.customer.count();
  const totalCustomerUsers = await prisma.user.count({ where: { role: UserRole.CUSTOMER } });
  const remainingUnlinkedCust = await prisma.customer.count({ where: { userId: null } });
  const remainingUnlinkedUser = await prisma.user.count({ where: { role: UserRole.CUSTOMER, customerProfile: null } });

  console.log("=== SYNC COMPLETED ===");
  console.log(`Total Customers in Customer table: ${totalCustomers}`);
  console.log(`Total CUSTOMER in User table: ${totalCustomerUsers}`);
  console.log(`Remaining unlinked Customers: ${remainingUnlinkedCust}`);
  console.log(`Remaining unlinked CUSTOMER Users: ${remainingUnlinkedUser}`);
}

main()
  .catch((e) => {
    console.error("Error during sync:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
