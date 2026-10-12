const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Local time:', now.toString());
  console.log('UTC time:', now.toISOString());
  console.log('Local year/month/day:', now.getFullYear(), now.getMonth(), now.getDate());

  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const todayStartUtc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const tomorrowStartUtc = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
  const localStartOfDay = new Date(year, month, day, 0, 0, 0, 0);
  const localEndOfDay = new Date(year, month, day, 23, 59, 59, 999);

  console.log('\ntodayStartUtc:', todayStartUtc.toISOString());
  console.log('tomorrowStartUtc:', tomorrowStartUtc.toISOString());
  console.log('localStartOfDay:', localStartOfDay.toISOString());
  console.log('localEndOfDay:', localEndOfDay.toISOString());

  // Check attendance records for today
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: {
      OR: [
        { date: todayStartUtc },
        { date: { gte: todayStartUtc, lt: tomorrowStartUtc } },
        { checkInTime: { gte: localStartOfDay, lte: localEndOfDay } },
      ],
    },
    include: { employee: { select: { fullName: true, loginId: true } } },
    orderBy: { checkInTime: 'desc' },
    take: 10,
  });

  console.log('\nToday records found:', todayRecords.length);
  todayRecords.forEach(r => {
    console.log('  -', r.employee?.fullName, '| date:', r.date?.toISOString(), '| checkIn:', r.checkInTime?.toISOString(), '| status:', r.status, '| source:', r.source);
  });

  // Check total employees
  const totalEmp = await prisma.user.count({
    where: { role: { in: ['EMPLOYEE', 'SUB_ADMIN', 'TEAM_LEAD', 'DEPARTMENT_HEAD'] }, isActive: true }
  });
  console.log('\nTotal active employees:', totalEmp);

  // Check recent CheckIn records
  const recentCheckins = await prisma.checkIn.findMany({
    where: { createdAt: { gte: localStartOfDay, lte: localEndOfDay } },
    include: { employee: { select: { fullName: true } } },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('\nRecent check-ins today:', recentCheckins.length);
  recentCheckins.forEach(c => {
    console.log('  -', c.employee?.fullName, '| at:', c.createdAt?.toISOString());
  });

  // Also check last 5 attendance records regardless of date
  const lastRecs = await prisma.attendanceRecord.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { employee: { select: { fullName: true } } }
  });
  console.log('\nLast 5 attendance records (any date):');
  lastRecs.forEach(r => {
    console.log('  -', r.employee?.fullName, '| date:', r.date?.toISOString(), '| checkIn:', r.checkInTime?.toISOString(), '| status:', r.status);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
