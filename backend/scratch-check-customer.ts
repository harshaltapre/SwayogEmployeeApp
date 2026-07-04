import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findFirst({
    where: { customerCode: "CUST-1268333" }
  });
  if (!customer) {
    const user = await prisma.user.findFirst({
      where: { loginId: "CUST-1268333" },
      include: { customerProfile: true }
    });
    console.log("User's customerProfile via findFirst:", user?.customerProfile);
    return;
  }
  console.log("Customer record:");
  console.log(JSON.stringify(customer, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
