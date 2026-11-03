import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncEmployeeProfiles() {
  console.log("Starting Employee Profile Synchronization...");

  try {
    // 1. Find all users with role 'EMPLOYEE'
    const employees = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
      },
      include: {
        employeeProfile: true,
      },
    });

    console.log(`Found ${employees.length} users with role 'EMPLOYEE'.`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      if (!emp.employeeProfile) {
        console.log(`Creating missing profile for ${emp.fullName} (${emp.email})...`);
        
        await prisma.employeeProfile.create({
          data: {
            userId: emp.id,
            zone: "Unassigned",
            jobRole: "field_technician",
            isActive: true,
          },
        });
        
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`Synchronization complete.`);
    console.log(`Profiles Created: ${createdCount}`);
    console.log(`Profiles already existed: ${skippedCount}`);

  } catch (error) {
    console.error("Error during synchronization:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncEmployeeProfiles();
