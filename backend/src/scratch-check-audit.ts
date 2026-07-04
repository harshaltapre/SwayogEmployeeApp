import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });
  console.log("AUDIT LOGS:", JSON.stringify(auditLogs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
