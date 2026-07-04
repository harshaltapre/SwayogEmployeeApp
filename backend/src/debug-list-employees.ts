import "./config/env.js";
import { PrismaClient } from "@prisma/client";
import { getEmployeesTaskStats } from "./modules/tasks/tasks.service.js";

const prisma = new PrismaClient();

const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SUB_ADMIN: "SUB_ADMIN",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  TEAM_LEAD: "TEAM_LEAD",
  EMPLOYEE: "EMPLOYEE",
  PARTNER: "PARTNER",
  CUSTOMER: "CUSTOMER",
} as const;

function getVisibleRoles(actorRole: string): string[] {
  if (actorRole === ROLE.SUPER_ADMIN) {
    return [
      ROLE.SUPER_ADMIN,
      ROLE.ADMIN,
      ROLE.SUB_ADMIN,
      ROLE.DEPARTMENT_HEAD,
      ROLE.TEAM_LEAD,
      ROLE.EMPLOYEE,
      ROLE.PARTNER,
      ROLE.CUSTOMER,
    ];
  }

  if (actorRole === ROLE.ADMIN) {
    return [ROLE.DEPARTMENT_HEAD, ROLE.TEAM_LEAD, ROLE.EMPLOYEE, ROLE.PARTNER, ROLE.CUSTOMER];
  }

  if (actorRole === ROLE.SUB_ADMIN || actorRole === ROLE.EMPLOYEE) {
    return [ROLE.EMPLOYEE];
  }

  return [];
}

async function main() {
  console.log("Simulating listInternalUsers for actorRole: ADMIN...");
  const visibleRoles = getVisibleRoles("ADMIN");
  console.log("Visible roles:", visibleRoles);

  const where: any = {
    role: "EMPLOYEE"
  };

  const selectFields: any = {
    id: true,
    loginId: true,
    employeeCode: true,
    fullName: true,
    email: true,
    phoneNumber: true,
    role: true,
    designationTitle: true,
    departmentId: true,
    reportingManagerId: true,
    isActive: true,
    createdAt: true,
    employeeProfile: {
      select: {
        zone: true,
        jobRole: true,
        monthlySalaryInr: true,
      },
    },
  };

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: selectFields,
    });
    console.log(`Successfully found ${users.length} users in database.`);
    if (users.length > 0) {
      console.log("Sample user:", JSON.stringify(users[0], null, 2));
      
      const employeeIds = users.map((u: any) => String(u.id));
      console.log("Fetching task stats for employees...");
      const stats = await getEmployeesTaskStats(employeeIds);
      console.log("Successfully fetched stats:", stats);
    }
  } catch (error: any) {
    console.error("Error during query execution:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
