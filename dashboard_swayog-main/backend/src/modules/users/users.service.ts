import { type User } from "@prisma/client";

import { generateUniqueLoginId } from "../../lib/login-id.js";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { getEmployeesTaskStats } from "../tasks/tasks.service.js";
import type {
  CreateInternalUserInput,
  InternalUserRole,
  ListInternalUsersQueryInput,
  UpdateInternalUserInput,
} from "./users.schemas.js";

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

function toPublicUser(user: User) {
  const { passwordHash, updatedAt, ...safe } = user;
  void passwordHash;
  void updatedAt;
  return safe;
}

function canCreateRole(actorRole: InternalUserRole, roleToCreate: InternalUserRole): boolean {
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
    ].includes(roleToCreate);
  }

  if (actorRole === ROLE.ADMIN) {
    return (
      roleToCreate === ROLE.DEPARTMENT_HEAD ||
      roleToCreate === ROLE.TEAM_LEAD ||
      roleToCreate === ROLE.EMPLOYEE ||
      roleToCreate === ROLE.PARTNER ||
      roleToCreate === ROLE.CUSTOMER
    );
  }

  return false;
}

function canManageRole(actorRole: InternalUserRole, roleToManage: InternalUserRole): boolean {
  if (actorRole === ROLE.SUPER_ADMIN) {
    return true;
  }

  if (actorRole === ROLE.ADMIN) {
    return (
      roleToManage === ROLE.DEPARTMENT_HEAD ||
      roleToManage === ROLE.TEAM_LEAD ||
      roleToManage === ROLE.EMPLOYEE ||
      roleToManage === ROLE.PARTNER ||
      roleToManage === ROLE.CUSTOMER
    );
  }

  return false;
}

function getVisibleRoles(actorRole: InternalUserRole): InternalUserRole[] {
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

export async function listInternalUsers(actorRole: InternalUserRole, query: ListInternalUsersQueryInput) {
  const visibleRoles = getVisibleRoles(actorRole);
  if (visibleRoles.length === 0) {
    throw new ApiError(403, "You are not allowed to view internal users");
  }

  if (query.role && !visibleRoles.includes(query.role)) {
    throw new ApiError(403, "You are not allowed to view this role");
  }

  const where: any = {
    role: query.role ?? { in: visibleRoles },
  };

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { loginId: { contains: query.search, mode: "insensitive" } },
      { phoneNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    select: {
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
      partnerProfile: {
        select: {
          id: true,
          serviceZone: true,
          businessName: true,
        },
      },
    },
  });

  // Enrich with task stats for employees
  const employeeIds = users
    .filter(u => u.role === ROLE.EMPLOYEE)
    .map(u => u.id);

  if (employeeIds.length > 0) {
    const stats = await getEmployeesTaskStats(employeeIds);
    const statsMap = stats.reduce((acc, curr) => {
      acc[curr.userId] = curr;
      return acc;
    }, {} as Record<string, any>);

    return users.map(user => {
      if (user.role === ROLE.EMPLOYEE && statsMap[user.id]) {
        return {
          ...user,
          activeTasksCount: statsMap[user.id].activeTasksCount,
          jobsCompletedThisMonth: statsMap[user.id].jobsCompletedThisMonth,
        };
      }
      return user;
    });
  }

  return users;
}

export async function createInternalUser(actorId: string, actorRole: InternalUserRole, input: CreateInternalUserInput) {
  if (!canCreateRole(actorRole, input.role)) {
    throw new ApiError(403, "You are not allowed to create this role");
  }

  const existingConditions: Array<{ email?: string; phoneNumber?: string }> = [
    { email: input.email.toLowerCase() },
  ];
  if (input.phoneNumber) {
    existingConditions.push({ phoneNumber: input.phoneNumber });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: existingConditions,
    },
    include: {
      employeeProfile: true,
      customerProfile: true,
    },
  });

  if (existing) {
    // If the user is trying to add an employee and the user exists as a customer
    if (input.role === ROLE.EMPLOYEE && existing.role === ROLE.CUSTOMER) {
      if (existing.employeeProfile) {
        throw new ApiError(409, "User already has an employee profile");
      }

      // Upgrade customer to employee
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: ROLE.EMPLOYEE as any,
          employeeProfile: {
            create: {
              zone: input.zone ?? "Unassigned",
              jobRole: input.jobRole ?? "field_technician",
              monthlySalaryInr: input.monthlySalaryInr,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId,
          action: "USER_UPGRADE_TO_EMPLOYEE",
          entity: "User",
          entityId: user.id,
          metadata: {
            fromRole: ROLE.CUSTOMER,
            toRole: ROLE.EMPLOYEE,
          },
        },
      });

      return toPublicUser(user);
    }

    throw new ApiError(
      409,
      `This email or phone is already registered with an account (Role: ${existing.role}). Please use a different email or contact support.`
    );
  }

  const loginId = await generateUniqueLoginId(input.role as any);

  const user = await prisma.user.create({
    data: {
      loginId,
      employeeCode: input.employeeCode,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber,
      role: input.role as any,
      designationTitle: input.designationTitle,
      departmentId: input.departmentId,
      reportingManagerId: input.reportingManagerId,
      passwordHash: await hashPassword(input.password),
      partnerProfile:
        input.role === ROLE.PARTNER
          ? {
              create: {
                businessName: input.businessName ?? input.fullName,
                serviceZone: input.zone ?? "Unassigned",
              },
            }
          : undefined,
      employeeProfile:
        input.role === ROLE.EMPLOYEE
          ? {
              create: {
                zone: input.zone ?? "Unassigned",
                jobRole: input.jobRole ?? "field_technician",
                monthlySalaryInr: input.monthlySalaryInr,
              },
            }
          : undefined,
      customerProfile:
        input.role === ROLE.CUSTOMER
          ? {
              create: {
                customerCode: loginId,
                fullName: input.fullName,
                email: input.email.toLowerCase(),
                phoneNumber: input.phoneNumber ?? "Not Provided",
                city: input.zone ?? "Not Provided",
                address: "Not Provided",
                systemSizeKw: 0,
                installationDate: new Date(),
              },
            }
          : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "USER_CREATE_INTERNAL",
      entity: "User",
      entityId: user.id,
      metadata: {
        role: user.role,
        loginId: user.loginId,
      },
    },
  });

  return toPublicUser(user);
}

export async function updateInternalUser(
  actorId: string,
  actorRole: InternalUserRole,
  targetUserId: string,
  input: UpdateInternalUserInput,
) {
  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      employeeProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (!canManageRole(actorRole, existing.role)) {
    throw new ApiError(403, "You are not allowed to update this user");
  }

  const userData: Record<string, unknown> = {};
  if (typeof input.fullName === "string") {
    userData.fullName = input.fullName;
  }
  if (input.phoneNumber !== undefined) {
    userData.phoneNumber = input.phoneNumber;
  }
  if (typeof input.isActive === "boolean") {
    userData.isActive = input.isActive;
  }

  if (input.departmentId !== undefined) {
    userData.departmentId = input.departmentId;
  }
  if (input.reportingManagerId !== undefined) {
    userData.reportingManagerId = input.reportingManagerId;
  }
  if (input.designationTitle !== undefined) {
    userData.designationTitle = input.designationTitle;
  }
  if (input.employeeCode !== undefined) {
    userData.employeeCode = input.employeeCode;
  }

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: userData,
    });
  }

  if (existing.role === ROLE.EMPLOYEE) {
    const employeeData: Record<string, unknown> = {};
    if (typeof input.jobRole === "string") {
      employeeData.jobRole = input.jobRole;
    }
    if (typeof input.zone === "string") {
      employeeData.zone = input.zone;
    }
    if (input.monthlySalaryInr !== undefined) {
      employeeData.monthlySalaryInr = input.monthlySalaryInr;
    }

    await prisma.employeeProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        zone: typeof employeeData.zone === "string" ? (employeeData.zone as string) : "Unassigned",
        jobRole:
          typeof employeeData.jobRole === "string" ? (employeeData.jobRole as string) : "field_technician",
        monthlySalaryInr:
          typeof employeeData.monthlySalaryInr === "number"
            ? (employeeData.monthlySalaryInr as number)
            : null,
      },
      update: employeeData,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "USER_UPDATE_INTERNAL",
      entity: "User",
      entityId: targetUserId,
      metadata: input,
    },
  });

  const updated = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
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
      partnerProfile: {
        select: {
          serviceZone: true,
          businessName: true,
        },
      },
    },
  });

  return updated;
}

export async function deleteInternalUser(actorId: string, actorRole: InternalUserRole, targetUserId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      loginId: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (!canManageRole(actorRole, existing.role)) {
    throw new ApiError(403, "You are not allowed to remove this user");
  }

  await prisma.user.delete({
    where: { id: targetUserId },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "USER_DELETE_INTERNAL",
      entity: "User",
      entityId: targetUserId,
      metadata: {
        loginId: existing.loginId,
        role: existing.role,
      },
    },
  });

  return { success: true };
}
