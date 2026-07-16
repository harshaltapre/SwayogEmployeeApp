import { prisma } from "./src/lib/prisma.js";

async function run() {
  const enrollments = await prisma.faceEnrollment.findMany({
    select: {
      id: true,
      employeeId: true,
      employee: {
        select: {
          fullName: true,
          email: true,
          role: true,
        }
      },
      enrolledAt: true,
    }
  });
  console.log("FACE ENROLLMENTS:", JSON.stringify(enrollments, null, 2));

  const checkins = await prisma.checkIn.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      employeeId: true,
      employee: {
        select: { fullName: true }
      },
      status: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    }
  });
  console.log("RECENT CHECK-INS:", JSON.stringify(checkins, null, 2));

  const attendance = await prisma.attendanceRecord.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    select: {
      id: true,
      employeeId: true,
      employee: {
        select: { fullName: true }
      },
      date: true,
      checkInTime: true,
      checkOutTime: true,
      status: true,
    }
  });
  console.log("RECENT ATTENDANCE RECORDS:", JSON.stringify(attendance, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
