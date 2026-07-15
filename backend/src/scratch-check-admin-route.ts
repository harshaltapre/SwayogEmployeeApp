import "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { getMonthlyAttendance } from "./services/attendanceService.js";

async function main() {
  const employeeId = "06029e73-af10-4461-aa69-8d8d971ab6a0"; // Mayur's ID
  const month = 7;
  const year = 2026;

  console.log("Calling getMonthlyAttendance with:", { employeeId, month, year });
  const result = await getMonthlyAttendance(employeeId, month, year);
  console.log("RESULT:", JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
