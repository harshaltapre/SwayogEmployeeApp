import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      customerProfile: true,
      employeeProfile: true,
    }
  });
  
  console.log(`Found ${users.length} users in DB:`);
  users.forEach((u) => {
    console.log(`- ID: ${u.id} | Email: ${u.email} | LoginId: ${u.loginId} | Role: ${u.role} | Active: ${u.isActive} | UserPortalPassword: ${u.portalPassword}`);
    if (u.customerProfile) {
      console.log(`   Customer profile PortalPassword: ${u.customerProfile.portalPassword}`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
