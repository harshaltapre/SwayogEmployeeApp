/**
 * Finance access control.
 *
 * Finance employees are regular EMPLOYEE / DEPARTMENT_HEAD users in the FINANCE
 * department whose designation (EmployeeProfile.jobRole or User.designationTitle)
 * maps to one of three finance levels. Finance authority is resolved from the
 * database on every request (not trusted from the JWT) so that a designation
 * change or deactivation takes effect immediately.
 *
 *   executive -> prepares transactions (invoices, receipts), views operational data
 *   manager   -> + approves within FINANCE_MANAGER_APPROVAL_LIMIT_INR, company P&L
 *   head      -> + approves above the manager limit
 *   admin     -> ADMIN / SUPER_ADMIN oversight (unlimited)
 *
 * Maker-checker rule: nobody may approve a transaction they created or that pays
 * themselves, regardless of level.
 */
import { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";

export type FinanceLevel = "executive" | "manager" | "head" | "admin";

export const FINANCE_PERMISSIONS = [
  "finance.dashboard.view",
  "finance.invoice.view_all",
  "finance.invoice.create",
  "finance.invoice.update",
  "finance.invoice.delete",
  "finance.commission.view_all",
  "finance.commission.approve",
  "finance.reports.company",
] as const;

export type FinancePermission = (typeof FINANCE_PERMISSIONS)[number];

const EXECUTIVE_PERMISSIONS: FinancePermission[] = [
  "finance.dashboard.view",
  "finance.invoice.view_all",
  "finance.invoice.create",
  "finance.invoice.update",
  "finance.commission.view_all",
];

const MANAGER_PERMISSIONS: FinancePermission[] = [
  ...EXECUTIVE_PERMISSIONS,
  "finance.invoice.delete",
  "finance.commission.approve",
  "finance.reports.company",
];

export const LEVEL_PERMISSIONS: Record<FinanceLevel, readonly FinancePermission[]> = {
  executive: EXECUTIVE_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  head: MANAGER_PERMISSIONS,
  admin: FINANCE_PERMISSIONS,
};

const DEFAULT_MANAGER_APPROVAL_LIMIT_INR = 100_000;

export function getManagerApprovalLimit(): number {
  const raw = Number(process.env.FINANCE_MANAGER_APPROVAL_LIMIT_INR);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MANAGER_APPROVAL_LIMIT_INR;
}

function compact(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

const EXECUTIVE_TITLES = new Set([
  "financeexecutive",
  "accountant",
  "accountsexecutive",
  "senioraccountant",
  "accountsreceivableexecutive",
  "accountspayableexecutive",
  "payrollexecutive",
]);
const MANAGER_TITLES = new Set(["financemanager", "accountsmanager"]);
const HEAD_TITLES = new Set(["financehead", "headoffinance", "financedepartmenthead", "cfo"]);

/** Maps a designation / jobRole string to a finance level (null if not a finance designation). */
export function financeLevelFromTitle(title: string | null | undefined): Exclude<FinanceLevel, "admin"> | null {
  const key = compact(title);
  if (!key) return null;
  if (HEAD_TITLES.has(key)) return "head";
  if (MANAGER_TITLES.has(key)) return "manager";
  if (EXECUTIVE_TITLES.has(key)) return "executive";
  return null;
}

export type FinanceIdentity = {
  role: UserRole;
  isActive: boolean;
  jobRole?: string | null;
  designationTitle?: string | null;
  departmentCode?: string | null;
};

/** Pure resolution logic (unit-testable). */
export function resolveFinanceLevel(identity: FinanceIdentity): FinanceLevel | null {
  if (!identity.isActive) return null;
  if (identity.role === UserRole.SUPER_ADMIN || identity.role === UserRole.ADMIN) return "admin";
  if (identity.role !== UserRole.EMPLOYEE && identity.role !== UserRole.DEPARTMENT_HEAD && identity.role !== UserRole.TEAM_LEAD) {
    return null;
  }

  // A finance designation assigned to a user in another department is treated as a misconfiguration.
  if (identity.departmentCode && identity.departmentCode !== "FINANCE") return null;

  const fromTitle = financeLevelFromTitle(identity.jobRole) ?? financeLevelFromTitle(identity.designationTitle);
  if (identity.role === UserRole.DEPARTMENT_HEAD && identity.departmentCode === "FINANCE") return "head";
  return fromTitle;
}

export function hasFinancePermission(level: FinanceLevel | null, permission: FinancePermission): boolean {
  return !!level && LEVEL_PERMISSIONS[level].includes(permission);
}

export type ApprovalCheck = {
  level: FinanceLevel | null;
  approverId: string;
  amount: number;
  createdById?: string | null;
  beneficiaryUserId?: string | null;
  managerLimit?: number;
};

/** Maker-checker + authorization-limit rule for approving any money movement. */
export function checkApprovalAuthority(check: ApprovalCheck): { allowed: true } | { allowed: false; reason: string } {
  const { level, approverId, amount } = check;
  if (!level || level === "executive") {
    return { allowed: false, reason: "Only a Finance Manager, Finance Head or Admin can approve this transaction." };
  }
  if (check.createdById && check.createdById === approverId) {
    return { allowed: false, reason: "You cannot approve a transaction you created. A second approver is required." };
  }
  if (check.beneficiaryUserId && check.beneficiaryUserId === approverId) {
    return { allowed: false, reason: "You cannot approve a payment made to yourself." };
  }
  const limit = check.managerLimit ?? getManagerApprovalLimit();
  if (level === "manager" && amount > limit) {
    return {
      allowed: false,
      reason: `Amount exceeds the Finance Manager approval limit of ₹${limit.toLocaleString("en-IN")}. Finance Head or Admin approval is required.`,
    };
  }
  return { allowed: true };
}

export type FinanceContext = {
  userId: string;
  role: UserRole;
  level: FinanceLevel | null;
  permissions: readonly FinancePermission[];
  isServiceCoordinator: boolean;
  partnerProfileId: string | null;
  customerId: number | null;
};

declare module "express-serve-static-core" {
  interface Request {
    finance?: FinanceContext;
  }
}

function isServiceCoordinatorIdentity(role: UserRole, jobRole?: string | null): boolean {
  if (role === UserRole.SUB_ADMIN) return true;
  const key = compact(jobRole);
  return key === "subadmin" || key === "servicecoordinator";
}

export async function loadFinanceContext(userId: string): Promise<FinanceContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      designationTitle: true,
      department: { select: { code: true } },
      employeeProfile: { select: { jobRole: true, isActive: true } },
      partnerProfile: { select: { id: true } },
      customerProfile: { select: { id: true } },
    },
  });
  if (!user) return null;

  const isActive = user.isActive && (user.employeeProfile ? user.employeeProfile.isActive : true);
  const jobRole = user.employeeProfile?.jobRole ?? null;
  const level = resolveFinanceLevel({
    role: user.role,
    isActive,
    jobRole,
    designationTitle: user.designationTitle,
    departmentCode: user.department?.code ?? null,
  });

  return {
    userId: user.id,
    role: user.role,
    level,
    permissions: level ? LEVEL_PERMISSIONS[level] : [],
    isServiceCoordinator: isActive && isServiceCoordinatorIdentity(user.role, jobRole),
    partnerProfileId: user.partnerProfile?.id ?? null,
    customerId: user.customerProfile?.id ?? null,
  };
}

/** Loads req.finance. Must run after authenticateAccessToken. */
export const attachFinanceContext: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.auth) return next(new ApiError(401, "Authentication required"));
    const ctx = await loadFinanceContext(req.auth.userId);
    if (!ctx) return next(new ApiError(401, "User not found"));
    req.finance = ctx;
    next();
  } catch (error) {
    next(error);
  }
};

/** Requires the caller to hold at least one of the listed finance permissions. */
export function requireFinancePermission(...permissions: FinancePermission[]): RequestHandler {
  return (req, _res, next) => {
    const ctx = req.finance;
    if (!ctx) return next(new ApiError(500, "Finance context not loaded"));
    if (permissions.some((p) => hasFinancePermission(ctx.level, p))) return next();
    next(new ApiError(403, "You do not have the finance permission required for this action."));
  };
}

export async function writeFinanceAudit(
  actorId: string | undefined,
  action: string,
  entity: string,
  entityId: string | null,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { actorId: actorId ?? null, action, entity, entityId, metadata: metadata as any },
    });
  } catch (err) {
    // Never fail a completed financial request due to a non-critical audit log write error
    console.warn(`[FinanceAudit] Failed to record audit log (${action} on ${entity}):`, err);
  }
}
