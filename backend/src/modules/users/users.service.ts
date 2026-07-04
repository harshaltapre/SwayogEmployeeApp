import { type User } from "@prisma/client";

import { generateUniqueLoginId, generateNextEmployeeCode } from "../../lib/login-id.js";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { getEmployeesTaskStats } from "../tasks/tasks.service.js";
import type {
  CreateInternalUserInput,
  InternalUserRole,
  ListInternalUsersQueryInput,
  TransferInternalUserTeamInput,
  TransferTeamStrategy,
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

async function assertNoCircularReporting(targetUserId: string, managerId: string): Promise<void> {
  if (targetUserId === managerId) {
    throw new ApiError(400, "An employee cannot report to themselves");
  }

  const visited = new Set<string>();
  let cursorId: string | null = managerId;

  while (cursorId) {
    if (cursorId === targetUserId) {
      throw new ApiError(400, "Circular reporting structure detected");
    }
    if (visited.has(cursorId)) {
      break;
    }
    visited.add(cursorId);

    const cursor = await prisma.user.findUnique({
      where: { id: cursorId },
      select: { reportingManagerId: true },
    });

    if (!cursor?.reportingManagerId) {
      break;
    }
    cursorId = cursor.reportingManagerId;
  }
}

async function countDescendants(managerId: string): Promise<number> {
  let total = 0;
  let frontier = [managerId];

  while (frontier.length > 0) {
    const rows = await prisma.user.findMany({
      where: { reportingManagerId: { in: frontier } },
      select: { id: true },
    });
    if (rows.length === 0) {
      break;
    }
    total += rows.length;
    frontier = rows.map((row) => row.id);
  }

  return total;
}

async function resolveManagerForStrategy(
  strategy: TransferTeamStrategy,
  targetUserId: string,
  currentManagerId: string | null,
  newManagerId?: string,
): Promise<string | null> {
  if (strategy === "UNASSIGN") {
    return null;
  }

  if (strategy === "REASSIGN") {
    if (!newManagerId) {
      throw new ApiError(400, "newManagerId is required for REASSIGN strategy");
    }
    if (newManagerId === targetUserId) {
      throw new ApiError(400, "An employee cannot report to themselves");
    }
    return newManagerId;
  }

  if (!currentManagerId) {
    throw new ApiError(400, "Current manager not found for auto-assign strategy");
  }

  const currentManager = await prisma.user.findUnique({
    where: { id: currentManagerId },
    select: {
      id: true,
      fullName: true,
      reportingManagerId: true,
    },
  });

  if (!currentManager?.reportingManagerId) {
    throw new ApiError(
      400,
      `Cannot auto-assign because manager ${currentManager?.fullName ?? ""} has no parent manager`,
    );
  }

  if (currentManager.reportingManagerId === targetUserId) {
    throw new ApiError(400, "Cannot assign to own subordinate chain");
  }

  return currentManager.reportingManagerId;
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
    department: {
      select: {
        id: true,
        name: true,
      },
    },
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
  };

  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN") {
    selectFields.portalPassword = true;
  }

  const users = (await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: query.offset ?? 0,
    take: query.limit,
    select: selectFields,
  })) as any[];

  // Enrich with stats for employees and partners
  const employeeIds = users
    .filter(u => u.role === ROLE.EMPLOYEE)
    .map(u => u.id);

  const partnerUserIds = users
    .filter(u => u.role === ROLE.PARTNER)
    .map(u => u.id);

  let enrichedUsers = [...users];

  if (employeeIds.length > 0) {
    const stats = await getEmployeesTaskStats(employeeIds);
    const statsMap = stats.reduce((acc, curr) => {
      acc[curr.userId] = curr;
      return acc;
    }, {} as Record<string, any>);

    enrichedUsers = enrichedUsers.map(user => {
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

  if (partnerUserIds.length > 0) {
    const partnersWithStats = await prisma.partnerProfile.findMany({
      where: {
        userId: { in: partnerUserIds }
      },
      select: {
        userId: true,
        customers: {
          select: {
            commissionAmount: true,
            commissionStatus: true,
            systemSizeKw: true
          }
        }
      }
    });

    const partnerStatsMap = partnersWithStats.reduce((acc, curr) => {
      const stats = curr.customers.reduce((acc, c) => {
        const commission = c.commissionAmount ?? (Number(c.systemSizeKw || 0) * 1000);
        if (c.commissionStatus === "COMPLETED") {
          acc.earned += commission;
        } else {
          acc.pending += commission;
        }
        return acc;
      }, { earned: 0, pending: 0 });
      acc[curr.userId] = {
        activeProjects: curr.customers.length,
        totalCommissionEarned: stats.earned,
        pendingPayout: stats.pending
      };
      return acc;
    }, {} as Record<string, any>);

    enrichedUsers = enrichedUsers.map(user => {
      if (user.role === ROLE.PARTNER && partnerStatsMap[user.id]) {
        return {
          ...user,
          activeProjects: partnerStatsMap[user.id].activeProjects,
          totalCommissionEarned: partnerStatsMap[user.id].totalCommissionEarned,
          pendingPayout: partnerStatsMap[user.id].pendingPayout,
        };
      }
      return user;
    });
  }

  return enrichedUsers;
}

export async function getInternalUser(actorRole: InternalUserRole, targetUserId: string) {
  // Verify actor can view this user
  const visibleRoles = getVisibleRoles(actorRole);
  if (visibleRoles.length === 0) {
    throw new ApiError(403, "You are not allowed to view internal users");
  }

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
    department: {
      select: {
        id: true,
        name: true,
      },
    },
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
  };

  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN") {
    selectFields.portalPassword = true;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: selectFields,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if actor can view this user's role
  if (!visibleRoles.includes(user.role as InternalUserRole)) {
    throw new ApiError(403, "You are not allowed to view this user");
  }

  let enrichedUser: any = user;

  // Enrich with stats for employees
  if (user.role === ROLE.EMPLOYEE) {
    const stats = await getEmployeesTaskStats([targetUserId]);
    if (stats.length > 0) {
      enrichedUser = {
        ...enrichedUser,
        activeTasksCount: stats[0].activeTasksCount,
        jobsCompletedThisMonth: stats[0].jobsCompletedThisMonth,
      };
    }
  }

  // Enrich with stats for partners
  if (user.role === ROLE.PARTNER) {
    const partnerWithStats = await prisma.partnerProfile.findFirst({
      where: { userId: targetUserId },
      select: {
        userId: true,
        customers: {
          select: {
            commissionAmount: true,
            commissionStatus: true,
            systemSizeKw: true,
          },
        },
      },
    });

    if (partnerWithStats) {
      const stats = partnerWithStats.customers.reduce(
        (acc, c) => {
          const commission = c.commissionAmount ?? Number(c.systemSizeKw || 0) * 1000;
          if (c.commissionStatus === "COMPLETED") {
            acc.earned += commission;
          } else {
            acc.pending += commission;
          }
          return acc;
        },
        { earned: 0, pending: 0 }
      );

      enrichedUser = {
        ...enrichedUser,
        activeProjects: partnerWithStats.customers.length,
        totalCommissionEarned: stats.earned,
        pendingPayout: stats.pending,
      };
    }
  }

  return enrichedUser;
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
      const nextEmployeeCode = input.employeeCode || (await generateNextEmployeeCode());
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: ROLE.EMPLOYEE as any,
          employeeCode: nextEmployeeCode,
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
            employeeCode: nextEmployeeCode,
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

  let finalEmployeeCode = input.employeeCode;
  const isEmployeeRole = [
    ROLE.SUPER_ADMIN,
    ROLE.ADMIN,
    ROLE.SUB_ADMIN,
    ROLE.DEPARTMENT_HEAD,
    ROLE.TEAM_LEAD,
    ROLE.EMPLOYEE,
  ].includes(input.role as any);

  const isPartnerRole = input.role === ROLE.PARTNER;

  if ((isEmployeeRole || isPartnerRole) && (!finalEmployeeCode || finalEmployeeCode.trim() === "")) {
    finalEmployeeCode = loginId;
  }

  const user = await prisma.user.create({
    data: {
      loginId,
      employeeCode: finalEmployeeCode || null,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber,
      role: input.role as any,
      designationTitle: input.designationTitle,
      departmentId: input.departmentId,
      reportingManagerId: input.reportingManagerId,
      passwordHash: await hashPassword(input.password),
      portalPassword: input.password,
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
              portalPassword: input.password,
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
  if (typeof input.portalPassword === "string" && input.portalPassword !== "") {
    userData.portalPassword = input.portalPassword;
    userData.passwordHash = await hashPassword(input.portalPassword);
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

  if (existing.role === ROLE.CUSTOMER) {
    const customerData: Record<string, unknown> = {};
    if (typeof input.fullName === "string") {
      customerData.fullName = input.fullName;
    }
    if (input.phoneNumber !== undefined) {
      customerData.phoneNumber = input.phoneNumber;
    }
    if (Object.keys(customerData).length > 0) {
      await prisma.customer.updateMany({
        where: { userId: targetUserId },
        data: customerData,
      });
    }
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
    partnerProfile: {
      select: {
        serviceZone: true,
        businessName: true,
      },
    },
  };

  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN") {
    selectFields.portalPassword = true;
  }

  const updated = (await prisma.user.findUnique({
    where: { id: targetUserId },
    select: selectFields,
  })) as any;

  return updated;
}

export async function transferInternalUserTeam(
  actorId: string,
  actorRole: InternalUserRole,
  targetUserId: string,
  input: TransferInternalUserTeamInput,
) {
  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      fullName: true,
      reportingManagerId: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (!canManageRole(actorRole, existing.role)) {
    throw new ApiError(403, "You are not allowed to transfer this user");
  }

  const nextManagerId = await resolveManagerForStrategy(
    input.strategy,
    targetUserId,
    existing.reportingManagerId,
    input.newManagerId,
  );

  if (nextManagerId) {
    const manager = await prisma.user.findUnique({
      where: { id: nextManagerId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!manager || !manager.isActive) {
      throw new ApiError(404, "Selected manager is not available");
    }

    if (!canManageRole(actorRole, manager.role) && actorRole !== ROLE.SUPER_ADMIN) {
      throw new ApiError(403, "You are not allowed to assign this manager");
    }

    await assertNoCircularReporting(targetUserId, manager.id);
  }

  if (existing.reportingManagerId === nextManagerId) {
    throw new ApiError(409, "No hierarchy change detected");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      reportingManagerId: nextManagerId,
    },
  });

  const impactedDescendants = await countDescendants(targetUserId);

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "USER_TRANSFER_TEAM",
      entity: "User",
      entityId: targetUserId,
      metadata: {
        targetUserName: existing.fullName,
        strategy: input.strategy,
        subtreePolicy: input.subtreePolicy ?? "PRESERVE_SUBTREE",
        reason: input.reason ?? null,
        previousManagerId: existing.reportingManagerId,
        nextManagerId,
        impactedDescendants,
      },
    },
  });

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
    partnerProfile: {
      select: {
        serviceZone: true,
        businessName: true,
      },
    },
  };

  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN") {
    selectFields.portalPassword = true;
  }

  const updated = (await prisma.user.findUnique({
    where: { id: targetUserId },
    select: selectFields,
  })) as any;

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
