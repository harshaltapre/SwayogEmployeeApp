import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.serviceRequest.findMany({
    include: {
      customer: true,
    }
  });
  console.log("SERVICE REQUESTS:");
  console.log(JSON.stringify(requests, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
