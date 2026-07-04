import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const startOfToday = new Date("2026-06-23T00:00:00.000Z");
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: startOfToday }
    },
    orderBy: { createdAt: "desc" }
  });
  console.log("TODAY'S AUDIT LOGS:", JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
