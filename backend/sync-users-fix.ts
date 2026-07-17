import { PrismaClient } from '@prisma/client';

const remote = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_4NYF3wHeqkOm@ep-red-poetry-apyaxvb1-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

const local = new PrismaClient({
  datasourceUrl: "postgresql://postgres:12345678@127.0.0.1:5432/dashboard_swayog?schema=public"
});

async function main() {
  // Sync the two users that failed due to FK constraint (their managers are now in local DB)
  const failedEmails = ['harshaltapre26@gmail.com', 'mayurgharjare2525@gmail.com'];
  
  for (const email of failedEmails) {
    const user = await remote.user.findUnique({
      where: { email },
      include: { employeeProfile: true, faceEnrollment: true }
    });
    
    if (!user) { console.log(`User ${email} not found`); continue; }

    await local.user.upsert({
      where: { id: user.id },
      update: {
        loginId: user.loginId,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        passwordHash: user.passwordHash,
        role: user.role,
        designationTitle: user.designationTitle,
        reportingManagerId: user.reportingManagerId,
        isActive: user.isActive,
        profileImageUrl: user.profileImageUrl,
      },
      create: {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        passwordHash: user.passwordHash,
        role: user.role,
        designationTitle: user.designationTitle,
        reportingManagerId: user.reportingManagerId,
        isActive: user.isActive,
        profileImageUrl: user.profileImageUrl,
      }
    });

    if (user.employeeProfile) {
      await local.employeeProfile.upsert({
        where: { userId: user.id },
        update: { jobRole: user.employeeProfile.jobRole, zone: user.employeeProfile.zone, isActive: user.employeeProfile.isActive },
        create: { id: user.employeeProfile.id, userId: user.id, jobRole: user.employeeProfile.jobRole, zone: user.employeeProfile.zone, isActive: user.employeeProfile.isActive }
      });
    }

    if (user.faceEnrollment) {
      await local.faceEnrollment.upsert({
        where: { employeeId: user.id },
        update: {
          descriptor1: user.faceEnrollment.descriptor1,
          descriptor2: user.faceEnrollment.descriptor2,
          descriptor3: user.faceEnrollment.descriptor3,
          modelVersion: user.faceEnrollment.modelVersion,
          enrolledAt: user.faceEnrollment.enrolledAt,
          updatedAt: user.faceEnrollment.updatedAt,
        },
        create: {
          id: user.faceEnrollment.id,
          employeeId: user.id,
          descriptor1: user.faceEnrollment.descriptor1,
          descriptor2: user.faceEnrollment.descriptor2,
          descriptor3: user.faceEnrollment.descriptor3,
          modelVersion: user.faceEnrollment.modelVersion,
          enrolledAt: user.faceEnrollment.enrolledAt,
          updatedAt: user.faceEnrollment.updatedAt,
        }
      });
    }

    console.log(`  ✓ Synced: ${user.fullName} (${user.email}) [${user.employeeProfile?.jobRole || user.role}]`);
  }

  // Final verify
  const total = await local.user.count({ where: { role: { in: ['EMPLOYEE', 'SUB_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'TEAM_LEAD'] } } });
  console.log(`\nLocal DB now has ${total} employee/admin users total.`);

  await remote.$disconnect();
  await local.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
