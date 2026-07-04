import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findUnique({
    where: { userId: "0c9cd373-99a1-4c70-80a2-d31673f0d98e" }
  });
  console.log("Customer via userId:");
  console.log(customer);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
