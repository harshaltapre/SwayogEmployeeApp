import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";

import { clearManagedRedisCache } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/password.js";
import { generateUniqueLoginId } from "../../lib/login-id.js";
import { ApiError } from "../../middleware/error.js";
import { getMaintenanceState, setMaintenanceState } from "../../middleware/maintenance.js";
import type { AuthContext } from "../../middleware/auth.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getSuperAdminDashboard(_req: Request, res: Response): Promise<void> {
  const [totalUsers, usersByRole, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  res.status(200).json({
    data: {
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      usersByRole: usersByRole.reduce((acc: Record<string, number>, row: any) => {
        acc[row.role] = row._count;
        return acc;
      }, {}),
    },
  });
}

// ─── Service Requests / Complaints ───────────────────────────────────────────────────────────────

export async function getServiceRequestsComplaints(req: Request, res: Response): Promise<void> {
  const { status, limit = "50", offset = "0" } = req.query;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: Math.min(parseInt(limit as string) || 50, 100),
      skip: parseInt(offset as string) || 0,
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  res.status(200).json({
    data: {
      complaints: requests.map((req) => ({
        id: req.id,
        ticketId: `TKT-${req.id}`,
        type: req.title,
        description: req.description,
        customerName: req.customer.fullName,
        customerPhone: req.customer.phoneNumber,
        customerCity: req.customer.city,
        customerId: req.customerId,
        priority: "medium",
        status: req.status,
        slaDeadline: new Date(req.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: req.createdAt.toISOString(),
        resolvedAt: null,
      })),
      pagination: {
        total,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    },
  });
}

// ─── List Users ───────────────────────────────────────────────────────────────

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const { role, isActive, search, limit = "50", offset = "0" } = req.query;

  const where: any = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === "true";
  if (search) {
    where.OR = [
      { fullName: { contains: search as string, mode: "insensitive" } },
      { email: { contains: search as string, mode: "insensitive" } },
      { loginId: { contains: search as string, mode: "insensitive" } },
      { phoneNumber: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const take = Math.min(parseInt(limit as string) || 50, 500);
  const skip = parseInt(offset as string) || 0;

  try {
    const [users, total, roleCountsRaw] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          loginId: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          portalPassword: true,
          role: true,
          isActive: true,
          failedLoginAttempts: true,
          lockoutUntil: true,
          createdAt: true,
          updatedAt: true,
          employeeProfile: { select: { jobRole: true, zone: true, monthlySalaryInr: true } },
          partnerProfile: { select: { businessName: true, serviceZone: true } },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ["role"], _count: true }),
    ]);

    const roleCounts = roleCountsRaw.reduce((acc: Record<string, number>, row: any) => {
      acc[row.role] = row._count;
      return acc;
    }, {});

    res.status(200).json({ data: { users, pagination: { total, limit: take, offset: skip }, roleCounts } });
  } catch (error) {
    console.error("[SuperAdmin] getAllUsers error:", error);
    throw new ApiError(500, "Failed to fetch users");
  }
}

// ─── Get Single User ──────────────────────────────────────────────────────────

export async function getUserById(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, loginId: true, email: true, fullName: true, phoneNumber: true,
      portalPassword: true,
      role: true, isActive: true, failedLoginAttempts: true, lockoutUntil: true,
      createdAt: true, updatedAt: true,
      employeeProfile: { select: { jobRole: true, zone: true, monthlySalaryInr: true } },
      partnerProfile: { select: { businessName: true, serviceZone: true } },
    },
  });

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ data: user });
}

// ─── Create User ──────────────────────────────────────────────────────────────

export async function createUser(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { fullName, email, phoneNumber, password, role, jobRole, zone, monthlySalaryInr, businessName, reportingManagerId } = req.body;

  if (!fullName || !email || !password || !role) {
    throw new ApiError(400, "fullName, email, password, and role are required");
  }

  if (!Object.values(UserRole).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, ...(phoneNumber ? [{ phoneNumber }] : [])] },
    select: { id: true },
  });
  if (existing) throw new ApiError(409, "An account with this email or phone already exists");

  const loginId = await generateUniqueLoginId(role);
  const user = await prisma.user.create({
    data: {
      loginId,
      employeeCode: (role === UserRole.PARTNER || [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.SUB_ADMIN,
        UserRole.DEPARTMENT_HEAD,
        UserRole.TEAM_LEAD,
        UserRole.EMPLOYEE,
      ].includes(role)) ? loginId : null,
      fullName,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || null,
      passwordHash: await hashPassword(password),
      portalPassword: password,
      role,
      reportingManagerId: reportingManagerId || null,
      employeeProfile: role === UserRole.EMPLOYEE ? {
        create: { jobRole: jobRole || "field_technician", zone: zone || "Unassigned", monthlySalaryInr: monthlySalaryInr || null },
      } : undefined,
      partnerProfile: role === UserRole.PARTNER ? {
        create: { businessName: businessName || fullName, serviceZone: zone || "Unassigned" },
      } : undefined,
      customerProfile: role === UserRole.CUSTOMER ? {
        create: {
          customerCode: loginId,
          fullName,
          email: email.toLowerCase(),
          phoneNumber: phoneNumber || "Not Provided",
          city: zone || "Not Provided",
          address: "Not Provided",
          systemSizeKw: 0,
          installationDate: new Date(),
          portalPassword: password,
        },
      } : undefined,
    },
    select: { 
      id: true, 
      loginId: true, 
      email: true, 
      fullName: true, 
      role: true, 
      isActive: true, 
      createdAt: true,
      employeeProfile: { select: { jobRole: true, zone: true, monthlySalaryInr: true } }
    },
  });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "SUPERADMIN_USER_CREATE", entity: "User", entityId: user.id, metadata: { role, email } },
  }).catch(() => {});

  res.status(201).json({ data: user });
}

// ─── Update User ──────────────────────────────────────────────────────────────

export async function updateUser(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;
  const { fullName, phoneNumber, role, isActive, jobRole, zone, monthlySalaryInr, reportingManagerId, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
  if (!existing) throw new ApiError(404, "User not found");

  if (role && !Object.values(UserRole).includes(role)) throw new ApiError(400, "Invalid role");

  const userData: Record<string, unknown> = {};
  if (typeof fullName === "string") userData.fullName = fullName;
  if (phoneNumber !== undefined) userData.phoneNumber = phoneNumber;
  if (typeof isActive === "boolean") userData.isActive = isActive;
  if (role) userData.role = role;
  if (reportingManagerId !== undefined) userData.reportingManagerId = reportingManagerId;

  if (email && typeof email === "string" && email.trim()) {
    const targetEmail = email.trim().toLowerCase();
    if (targetEmail !== existing.email.toLowerCase()) {
      const emailConflict = await prisma.user.findFirst({
        where: { email: targetEmail, id: { not: userId } },
        select: { id: true }
      });
      if (emailConflict) {
        throw new ApiError(409, "An account with this email already exists");
      }
      userData.email = targetEmail;
    }
  }

  if (password && typeof password === "string" && password.trim()) {
    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }
    userData.passwordHash = await hashPassword(password);
    userData.portalPassword = password;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: userData,
    select: { 
      id: true, 
      loginId: true, 
      email: true, 
      fullName: true, 
      phoneNumber: true, 
      role: true, 
      isActive: true, 
      updatedAt: true,
      employeeProfile: { select: { jobRole: true, zone: true, monthlySalaryInr: true } }
    },
  });

  // If password changed, revoke all sessions
  if (password && typeof password === "string" && password.trim()) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Update employee profile if applicable
  const currentRole = role || existing.role;
  if (currentRole === UserRole.EMPLOYEE) {
    const empData: Record<string, unknown> = {};
    if (jobRole) empData.jobRole = jobRole;
    if (zone) empData.zone = zone;
    if (monthlySalaryInr !== undefined) empData.monthlySalaryInr = monthlySalaryInr;
    
    await prisma.employeeProfile.upsert({
      where: { userId },
      create: { 
        userId, 
        jobRole: (jobRole as string) || "field_technician", 
        zone: (zone as string) || "Unassigned",
        monthlySalaryInr: monthlySalaryInr !== undefined ? monthlySalaryInr : null
      },
      update: empData,
    });
  }

  // Update customer profile if applicable
  if (currentRole === UserRole.CUSTOMER) {
    const existingCust = await prisma.customer.findUnique({ where: { userId } });
    if (!existingCust) {
      await prisma.customer.create({
        data: {
          userId,
          customerCode: updated.loginId,
          fullName: updated.fullName,
          email: updated.email.toLowerCase(),
          phoneNumber: updated.phoneNumber || "Not Provided",
          city: zone || "Not Provided",
          address: "Not Provided",
          systemSizeKw: 0,
          installationDate: new Date(),
          portalPassword: password || null,
        },
      });
    } else {
      const customerUpdates: Record<string, any> = {};
      if (userData.email) customerUpdates.email = userData.email;
      if (password && typeof password === "string" && password.trim()) {
        customerUpdates.portalPassword = password;
      }
      if (typeof fullName === "string") customerUpdates.fullName = fullName;
      if (phoneNumber !== undefined) customerUpdates.phoneNumber = phoneNumber || "Not Provided";

      if (Object.keys(customerUpdates).length > 0) {
        await prisma.customer.updateMany({
          where: { userId },
          data: customerUpdates,
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "SUPERADMIN_USER_UPDATE", entity: "User", entityId: userId, metadata: req.body },
  }).catch(() => {});

  res.status(200).json({ data: updated });
}

// ─── Delete User ──────────────────────────────────────────────────────────────

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;

  if (userId === auth.userId) throw new ApiError(400, "You cannot delete your own account");

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, loginId: true } });
  if (!existing) throw new ApiError(404, "User not found");

  await prisma.user.delete({ where: { id: userId } });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "SUPERADMIN_USER_DELETE", entity: "User", entityId: userId, metadata: { email: existing.email, loginId: existing.loginId } },
  }).catch(() => {});

  res.status(200).json({ data: { success: true, message: `User ${existing.email} deleted` } });
}

// ─── Activate User ────────────────────────────────────────────────────────────

export async function activateUser(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, isActive: true } });
  if (!existing) throw new ApiError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true, failedLoginAttempts: 0, lockoutUntil: null },
    select: { id: true, loginId: true, email: true, fullName: true, role: true, isActive: true },
  });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "USER_ACTIVATED", entity: "User", entityId: userId },
  }).catch(() => {});

  res.status(200).json({ data: updated, message: `User ${existing.email} activated` });
}

// ─── Deactivate User ──────────────────────────────────────────────────────────

export async function deactivateUser(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;

  if (userId === auth.userId) throw new ApiError(400, "You cannot deactivate your own account");

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!existing) throw new ApiError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: { id: true, loginId: true, email: true, fullName: true, role: true, isActive: true },
  });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "USER_DEACTIVATED", entity: "User", entityId: userId },
  }).catch(() => {});

  res.status(200).json({ data: updated, message: `User ${existing.email} deactivated` });
}

// ─── Update User Role ────────────────────────────────────────────────────────

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;
  const { newRole } = req.body;

  if (!Object.values(UserRole).includes(newRole)) throw new ApiError(400, "Invalid role");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const oldRole = user.role;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: { id: true, loginId: true, email: true, fullName: true, role: true },
  });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "USER_ROLE_CHANGED", entity: "User", entityId: userId, metadata: { oldRole, newRole } },
  }).catch(() => {});

  res.status(200).json({ data: updated, message: `Role changed from ${oldRole} to ${newRole}` });
}

// ─── Reset User Password ──────────────────────────────────────────────────────

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  if (!existing) throw new ApiError(404, "User not found");

  await prisma.user.update({
    where: { id: userId },
    data: { 
      passwordHash: await hashPassword(newPassword), 
      portalPassword: newPassword,
      failedLoginAttempts: 0, 
      lockoutUntil: null 
    },
  });

  if (existing.role === UserRole.CUSTOMER) {
    await prisma.customer.updateMany({
      where: { userId },
      data: { portalPassword: newPassword },
    });
  }

  // Revoke all active refresh tokens so user must log in again
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "SUPERADMIN_PASSWORD_RESET", entity: "User", entityId: userId, metadata: { email: existing.email } },
  }).catch(() => {});

  res.status(200).json({ data: { success: true }, message: "Password reset successfully. User must log in again." });
}

// ─── Force Logout User ────────────────────────────────────────────────────────

export async function forceLogoutUser(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { userId } = req.params;

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!existing) throw new ApiError(404, "User not found");

  const revoked = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { actorId: auth.userId, action: "SUPERADMIN_FORCE_LOGOUT", entity: "User", entityId: userId, metadata: { email: existing.email, sessionsRevoked: revoked.count } },
  }).catch(() => {});

  res.status(200).json({ data: { success: true, sessionsRevoked: revoked.count }, message: `${existing.email} has been force-logged out` });
}

// ─── Login History ────────────────────────────────────────────────────────────

export async function getUserLoginHistory(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) throw new ApiError(404, "User not found");

  const logs = await prisma.auditLog.findMany({
    where: {
      actorId: userId,
      action: { in: ["AUTH_LOGIN", "AUTH_LOGOUT", "AUTH_REFRESH", "AUTH_ACCOUNT_LOCKED", "SUPERADMIN_FORCE_LOGOUT"] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, action: true, createdAt: true, metadata: true },
  });

  res.status(200).json({ data: { logs, total: logs.length } });
}

// ─── Export Users CSV ─────────────────────────────────────────────────────────

export async function exportUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: {
      loginId: true, fullName: true, email: true, phoneNumber: true,
      role: true, isActive: true, createdAt: true,
      employeeProfile: { select: { jobRole: true, zone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "Login ID,Full Name,Email,Phone,Role,Active,Job Role,Zone,Created At\n";
  const rows = users.map((u: any) =>
    [
      u.loginId, u.fullName, u.email, u.phoneNumber || "",
      u.role, u.isActive ? "Yes" : "No",
      u.employeeProfile?.jobRole || "", u.employeeProfile?.zone || "",
      u.createdAt.toISOString(),
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="users-${Date.now()}.csv"`);
  res.status(200).send(csv);
}

// ─── Import Users (bulk JSON) ─────────────────────────────────────────────────

export async function importUsers(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    throw new ApiError(400, "Provide a non-empty `users` array");
  }
  if (users.length > 100) {
    throw new ApiError(400, "Max 100 users per import batch");
  }

  const results: { email: string; status: "created" | "skipped"; loginId?: string; reason?: string }[] = [];

  for (const u of users) {
    try {
      if (!u.fullName || !u.email || !u.password || !u.role) {
        results.push({ email: u.email || "unknown", status: "skipped", reason: "Missing required fields" });
        continue;
      }
      if (!Object.values(UserRole).includes(u.role)) {
        results.push({ email: u.email, status: "skipped", reason: "Invalid role" });
        continue;
      }
      const existing = await prisma.user.findUnique({ where: { email: u.email.toLowerCase() }, select: { id: true } });
      if (existing) {
        results.push({ email: u.email, status: "skipped", reason: "Email already exists" });
        continue;
      }
      const loginId = await generateUniqueLoginId(u.role);
      const created = await prisma.user.create({
        data: {
          loginId,
          employeeCode: (u.role === UserRole.PARTNER || [
            UserRole.SUPER_ADMIN,
            UserRole.ADMIN,
            UserRole.SUB_ADMIN,
            UserRole.DEPARTMENT_HEAD,
            UserRole.TEAM_LEAD,
            UserRole.EMPLOYEE,
          ].includes(u.role)) ? loginId : null,
          fullName: u.fullName,
          email: u.email.toLowerCase(),
          phoneNumber: u.phoneNumber || null,
          passwordHash: await hashPassword(u.password),
          portalPassword: u.password,
          role: u.role,
          partnerProfile:
            u.role === UserRole.PARTNER
              ? {
                  create: {
                    businessName: u.businessName ?? u.fullName,
                    serviceZone: u.zone ?? "Unassigned",
                  },
                }
              : undefined,
          employeeProfile:
            u.role === UserRole.EMPLOYEE
              ? {
                  create: {
                    zone: u.zone ?? "Unassigned",
                    jobRole: u.jobRole ?? "field_technician",
                    monthlySalaryInr: u.monthlySalaryInr ?? 0,
                  },
                }
              : undefined,
          customerProfile:
            u.role === UserRole.CUSTOMER
              ? {
                  create: {
                    customerCode: loginId,
                    fullName: u.fullName,
                    email: u.email.toLowerCase(),
                    phoneNumber: u.phoneNumber ?? "Not Provided",
                    city: u.zone ?? "Not Provided",
                    address: u.address ?? "Not Provided",
                    systemSizeKw: u.systemSizeKw ?? 0,
                    installationDate: new Date(),
                    portalPassword: u.password,
                  },
                }
              : undefined,
        },
        select: { loginId: true },
      });
      results.push({ email: u.email, status: "created", loginId: created.loginId });
    } catch (error: any) {
      results.push({ email: u.email || "unknown", status: "skipped", reason: error.message || "Internal error" });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId, action: "SUPERADMIN_BULK_IMPORT", entity: "User",
      metadata: { total: users.length, created: results.filter(r => r.status === "created").length },
    },
  }).catch(() => {});

  res.status(200).json({ data: { results, summary: { total: users.length, created: results.filter(r => r.status === "created").length, skipped: results.filter(r => r.status === "skipped").length } } });
}

// ─── System Controls ─────────────────────────────────────────────────────────

export async function forceSyncAllData(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;

  const [users, customers, tasks, partners, complaints] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.task.count(),
    prisma.partnerProfile.count(),
    prisma.auditLog.count({ where: { entity: "Complaint" } }),
  ]);

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "SUPERADMIN_FORCE_SYNC",
      entity: "System",
      metadata: {
        users,
        customers,
        tasks,
        partners,
        complaints,
      },
    },
  }).catch(() => {});

  res.status(200).json({
    data: {
      syncedAt: new Date().toISOString(),
      summary: {
        users,
        customers,
        tasks,
        partners,
        complaints,
      },
    },
  });
}

export async function clearSystemCache(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const result = await clearManagedRedisCache();

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "SUPERADMIN_CLEAR_CACHE",
      entity: "System",
      metadata: result,
    },
  }).catch(() => {});

  res.status(200).json({ data: result });
}

export async function deactivateUsersByRole(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;

  const body = (req.body ?? {}) as {
    role?: UserRole;
    roles?: UserRole[];
  };

  const parsedRoles = Array.isArray(body.roles)
    ? body.roles
    : body.role
      ? [body.role]
      : [UserRole.EMPLOYEE];

  if (parsedRoles.length === 0) {
    throw new ApiError(400, "At least one role must be provided");
  }

  for (const role of parsedRoles) {
    if (!Object.values(UserRole).includes(role)) {
      throw new ApiError(400, `Invalid role: ${String(role)}`);
    }
  }

  const result = await prisma.user.updateMany({
    where: {
      role: { in: parsedRoles },
      isActive: true,
      id: { not: auth.userId },
    },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "SUPERADMIN_BULK_DEACTIVATE",
      entity: "User",
      metadata: {
        roles: parsedRoles,
        deactivatedCount: result.count,
      },
    },
  }).catch(() => {});

  res.status(200).json({
    data: {
      roles: parsedRoles,
      deactivatedCount: result.count,
    },
  });
}

export async function purgeAuditLogs(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const rawDays = req.query.olderThanDays ?? (req.body as { olderThanDays?: number } | undefined)?.olderThanDays;
  const olderThanDays = Number(rawDays ?? 90);

  if (!Number.isFinite(olderThanDays) || olderThanDays < 7 || olderThanDays > 3650) {
    throw new ApiError(400, "olderThanDays must be a number between 7 and 3650");
  }

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const deleted = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "SUPERADMIN_PURGE_AUDIT_LOGS",
      entity: "AuditLog",
      metadata: {
        olderThanDays,
        deletedCount: deleted.count,
      },
    },
  }).catch(() => {});

  res.status(200).json({
    data: {
      olderThanDays,
      deletedCount: deleted.count,
      cutoff: cutoff.toISOString(),
    },
  });
}

export async function getSystemMaintenanceMode(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: getMaintenanceState() });
}

export async function setSystemMaintenanceMode(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext;
  const body = (req.body ?? {}) as { enabled?: boolean; message?: string };

  if (typeof body.enabled !== "boolean") {
    throw new ApiError(400, "enabled must be a boolean");
  }

  const nextState = setMaintenanceState({
    enabled: body.enabled,
    message: body.message,
    updatedBy: auth.userId,
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: body.enabled ? "SUPERADMIN_MAINTENANCE_ENABLE" : "SUPERADMIN_MAINTENANCE_DISABLE",
      entity: "System",
      metadata: {
        message: nextState.message,
      },
    },
  }).catch(() => {});

  res.status(200).json({ data: nextState });
}
