import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("Adding webDescriptor columns to FaceEnrollment table...");
  await prisma.$executeRawUnsafe('ALTER TABLE "FaceEnrollment" ADD COLUMN IF NOT EXISTS "webDescriptor1" JSONB');
  await prisma.$executeRawUnsafe('ALTER TABLE "FaceEnrollment" ADD COLUMN IF NOT EXISTS "webDescriptor2" JSONB');
  await prisma.$executeRawUnsafe('ALTER TABLE "FaceEnrollment" ADD COLUMN IF NOT EXISTS "webDescriptor3" JSONB');
  await prisma.$executeRawUnsafe('ALTER TABLE "FaceEnrollment" ADD COLUMN IF NOT EXISTS "webModelVersion" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "FaceEnrollment" ADD COLUMN IF NOT EXISTS "webEnrolledAt" TIMESTAMP(3)');

  // Backfill existing WEB enrollments so webDescriptor1..3 are populated
  const updatedCount = await prisma.$executeRawUnsafe(`
    UPDATE "FaceEnrollment"
    SET "webDescriptor1" = "descriptor1",
        "webDescriptor2" = "descriptor2",
        "webDescriptor3" = "descriptor3",
        "webModelVersion" = "modelVersion",
        "webEnrolledAt" = "enrolledAt"
    WHERE "modelVersion" = 'face-api-ssd-mobilenetv1-v1'
      AND "webDescriptor1" IS NULL
  `);

  console.log(`Backfilled ${updatedCount} existing WEB enrollments into webDescriptor1..3.`);

  console.log("Migration and backfill completed successfully.");
}

main()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
