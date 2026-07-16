import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("=== LATEST ATTENDANCE RECORDS IN DB ===");
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { date: "desc" },
    take: 15,
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          loginId: true
        }
      }
    }
  });
  console.dir(records, { depth: null });

  console.log("\n=== PERFORMANCE SNAPSHOTS IN DB ===");
  const snapshots = await prisma.performanceSnapshot.findMany({
    orderBy: { year: "desc" },
    take: 10,
  });
  console.dir(snapshots, { depth: null });
}

main().catch(console.error);
