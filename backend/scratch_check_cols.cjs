// Check actual columns of FaceEnrollment table and AttendanceRecord in DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Raw query to get column names
  const faceEnrollmentCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'FaceEnrollment'
    ORDER BY ordinal_position;
  `);
  console.log('FaceEnrollment columns:');
  faceEnrollmentCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable=${c.is_nullable}`));

  const attendanceCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'AttendanceRecord'
    ORDER BY ordinal_position;
  `);
  console.log('\nAttendanceRecord columns:');
  attendanceCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable=${c.is_nullable}`));

  // Sample a face enrollment to see data shape
  const enrollments = await prisma.$queryRawUnsafe(`
    SELECT id, "employeeId", "modelVersion", "enrollmentSource", "syncVersion", "isDeleted",
           "webDescriptor1" IS NOT NULL AS "hasWebDesc1",
           "descriptor1" IS NOT NULL AS "hasDesc1"
    FROM "FaceEnrollment"
    LIMIT 5;
  `);
  console.log('\nFaceEnrollment sample rows:');
  enrollments.forEach(e => console.log(JSON.stringify(e)));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
