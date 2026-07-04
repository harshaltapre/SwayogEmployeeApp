import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findUnique({
    where: { id: 119 }
  });
  console.log("Customer 119 record:");
  console.log(JSON.stringify(customer, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
