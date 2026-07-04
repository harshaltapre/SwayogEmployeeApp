import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const ids = [
    "ac0f67d9-baf5-4ee7-8151-306031595d53", // Harshal Tapre (EMPLOYEE)
    "06029e73-af10-4461-aa69-8d8d971ab6a0", // Mayur Gharjare (EMPLOYEE)
    "c0c02ac6-321f-4a4d-9932-5b9d9713fa22", // Nishank Zade (EMPLOYEE)
  ];
  
  const logs = await prisma.auditLog.findMany({
    where: {
      entityId: { in: ids }
    },
    orderBy: { createdAt: "desc" }
  });
  console.log("LOGS FOR EMPLOYEES:", JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
