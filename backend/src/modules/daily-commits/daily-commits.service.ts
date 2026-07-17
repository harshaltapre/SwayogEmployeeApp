import { UserRole } from "@prisma/client";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  ExportMonthlyCsvQueryInput,
  ListMyCommitsQueryInput,
  ListTeamCommitsQueryInput,
  SubmitDailyCommitInput,
} from "./daily-commits.schemas.js";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function endOfTodayUtc(): Date {
  const start = startOfTodayUtc();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function getPeriodRange(query: ListTeamCommitsQueryInput): { from: Date; to: Date } {
  const now = new Date();
  const year = query.year ?? now.getUTCFullYear();
  const month = query.month ?? now.getUTCMonth() + 1;

  if (query.period === "weekly") {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday),
    );
    const to = endOfTodayUtc();
    return { from, to };
  }

  if (query.period === "monthly") {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { from, to };
  }

  return { from: startOfTodayUtc(), to: endOfTodayUtc() };
}

export function serializeDailyCommit(commit: {
  id: string;
  employeeId: string;
  commitDate: Date;
  taskWorkedOn: string;
  workSummary: string;
  hoursSpent: number;
  issuesBlockers: string | null;
  tomorrowPlan: string | null;
  attachmentUrl: string | null;
  submittedAt: Date;
  employee?: { id: string; fullName: string; employeeCode: string | null; loginId: string };
}) {
  return {
    id: commit.id,
    employeeId: commit.employeeId,
    employeeName: commit.employee?.fullName ?? null,
    employeeCode: commit.employee?.employeeCode ?? null,
    commitDate: formatDateOnly(commit.commitDate),
    taskWorkedOn: commit.taskWorkedOn,
    workSummary: commit.workSummary,
    hoursSpent: commit.hoursSpent,
    issuesBlockers: commit.issuesBlockers,
    tomorrowPlan: commit.tomorrowPlan,
    attachmentUrl: commit.attachmentUrl,
    submittedAt: commit.submittedAt.toISOString(),
    status: "submitted" as const,
  };
}

async function assertCanSubmit(auth: AuthContext): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { isActive: true },
  });

  if (!user?.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

}

async function getRecursiveReporteeIds(userId: string): Promise<string[]> {
  const reports = await prisma.user.findMany({
    where: { reportingManagerId: userId, isActive: true },
    select: { id: true },
  });
  const ids = reports.map((r) => r.id);
  if (ids.length === 0) return [];

  const subReportIds = await Promise.all(ids.map((id) => getRecursiveReporteeIds(id)));
  return [...ids, ...subReportIds.flat()];
}

function normalizeJobRole(jobRole?: string | null): string {
  return String(jobRole ?? "").toLowerCase().replace(/[_\s-]+/g, "");
}

function isServiceCoordinator(auth: AuthContext): boolean {
  return auth.role === UserRole.SUB_ADMIN || normalizeJobRole(auth.jobRole) === "servicecoordinator";
}

async function getVisibleEmployeeIds(auth: AuthContext): Promise<string[] | "all"> {
  if (
    auth.role === UserRole.SUPER_ADMIN ||
    auth.role === UserRole.ADMIN ||
    isServiceCoordinator(auth)
  ) {
    return "all";
  }

  if (
    auth.role === UserRole.TEAM_LEAD ||
    auth.role === UserRole.DEPARTMENT_HEAD ||
    auth.role === UserRole.SUB_ADMIN ||
    auth.role === UserRole.EMPLOYEE
  ) {
    return getRecursiveReporteeIds(auth.userId);
  }

  throw new ApiError(403, "You do not have permission to view team daily commits");
}

export async function submitDailyCommit(auth: AuthContext, input: SubmitDailyCommitInput) {
  await assertCanSubmit(auth);

  const commitDate = parseDateOnly(input.commitDate);
  const today = startOfTodayUtc();

  if (commitDate > today) {
    throw new ApiError(400, "Cannot submit a daily commit for a future date");
  }

  const existing = await prisma.dailyCommit.findUnique({
    where: {
      employeeId_commitDate: {
        employeeId: auth.userId,
        commitDate,
      },
    },
  });

  if (existing) {
    const updated = await prisma.dailyCommit.update({
      where: { id: existing.id },
      data: {
        taskWorkedOn: input.taskWorkedOn,
        workSummary: input.workSummary,
        hoursSpent: input.hoursSpent,
        issuesBlockers: input.issuesBlockers ?? null,
        tomorrowPlan: input.tomorrowPlan ?? null,
      },
      include: {
        employee: {
          select: { id: true, fullName: true, employeeCode: true, loginId: true },
        },
      },
    });
    return serializeDailyCommit(updated);
  }

  const commit = await prisma.dailyCommit.create({
    data: {
      employeeId: auth.userId,
      commitDate,
      taskWorkedOn: input.taskWorkedOn,
      workSummary: input.workSummary,
      hoursSpent: input.hoursSpent,
      issuesBlockers: input.issuesBlockers ?? null,
      tomorrowPlan: input.tomorrowPlan ?? null,
    },
    include: {
      employee: {
        select: { id: true, fullName: true, employeeCode: true, loginId: true },
      },
    },
  });

  return serializeDailyCommit(commit);
}

export async function listMyDailyCommits(auth: AuthContext, query: ListMyCommitsQueryInput) {
  const where: { employeeId: string; commitDate?: { gte?: Date; lte?: Date } } = {
    employeeId: auth.userId,
  };

  if (query.from || query.to) {
    where.commitDate = {};
    if (query.from) where.commitDate.gte = parseDateOnly(query.from);
    if (query.to) where.commitDate.lte = parseDateOnly(query.to);
  }

  const commits = await prisma.dailyCommit.findMany({
    where,
    orderBy: { commitDate: "desc" },
    take: query.limit,
    include: {
      employee: {
        select: { id: true, fullName: true, employeeCode: true, loginId: true },
      },
    },
  });

  return commits.map(serializeDailyCommit);
}

export async function getMyCommitForDate(auth: AuthContext, dateStr: string) {
  const commit = await prisma.dailyCommit.findUnique({
    where: {
      employeeId_commitDate: {
        employeeId: auth.userId,
        commitDate: parseDateOnly(dateStr),
      },
    },
    include: {
      employee: {
        select: { id: true, fullName: true, employeeCode: true, loginId: true },
      },
    },
  });

  return commit ? serializeDailyCommit(commit) : null;
}

async function getManagerAssignmentDate(employeeId: string, managerId: string, employeeCreatedAt: Date): Promise<Date> {
  const logs = await prisma.auditLog.findMany({
    where: {
      entity: "User",
      entityId: employeeId,
      action: {
        in: [
          "SUPERADMIN_USER_UPDATE",
          "USER_TRANSFER_TEAM",
          "USER_UPDATE_INTERNAL"
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const log of logs) {
    const meta = log.metadata as any;
    if (!meta) continue;

    if (log.action === "SUPERADMIN_USER_UPDATE" && meta.reportingManagerId === managerId) {
      return log.createdAt;
    }
    if (log.action === "USER_TRANSFER_TEAM" && meta.nextManagerId === managerId) {
      return log.createdAt;
    }
    if (log.action === "USER_UPDATE_INTERNAL" && meta.reportingManagerId === managerId) {
      return log.createdAt;
    }
  }

  return employeeCreatedAt;
}

export async function listTeamDailyCommits(auth: AuthContext, query: ListTeamCommitsQueryInput) {
  const visible = await getVisibleEmployeeIds(auth);
  const { from, to } = getPeriodRange(query);

  let employeeIds: string[];
  if (visible === "all") {
    if (query.employeeId) {
      employeeIds = [query.employeeId];
    } else {
      const employees = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN, UserRole.TEAM_LEAD, UserRole.DEPARTMENT_HEAD] },
        },
        select: { id: true },
      });
      employeeIds = employees.map((e) => e.id);
    }
  } else {
    if (visible.length === 0) {
      return { commits: [], pending: [] };
    }
    if (query.employeeId) {
      if (!visible.includes(query.employeeId)) {
        throw new ApiError(403, "You can only view commits for your direct reportees");
      }
      employeeIds = [query.employeeId];
    } else {
      employeeIds = visible;
    }
  }

  const commits = await prisma.dailyCommit.findMany({
    where: {
      employeeId: { in: employeeIds },
      commitDate: { gte: from, lte: to },
    },
    orderBy: [{ commitDate: "desc" }, { submittedAt: "desc" }],
    include: {
      employee: {
        select: { id: true, fullName: true, employeeCode: true, loginId: true },
      },
    },
  });

  const serialized = commits.map(serializeDailyCommit);

  const submittedByEmployeeDate = new Set(
    commits.map((c) => `${c.employeeId}:${formatDateOnly(c.commitDate)}`),
  );

  const employees = await prisma.user.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, fullName: true, employeeCode: true, createdAt: true, reportingManagerId: true },
  });

  // Bulk query all relevant audit logs for the reportees to determine team assignment dates
  const allLogs = await prisma.auditLog.findMany({
    where: {
      entity: "User",
      entityId: { in: employeeIds },
      action: {
        in: [
          "SUPERADMIN_USER_UPDATE",
          "USER_TRANSFER_TEAM",
          "USER_UPDATE_INTERNAL"
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const employeesWithAssignDate = employees.map((emp) => {
    let assignDate = emp.createdAt;
    if (emp.reportingManagerId) {
      const empLogs = allLogs.filter((log) => log.entityId === emp.id);
      for (const log of empLogs) {
        const meta = log.metadata as any;
        if (!meta) continue;

        if (log.action === "SUPERADMIN_USER_UPDATE" && meta.reportingManagerId === emp.reportingManagerId) {
          assignDate = log.createdAt;
          break;
        }
        if (log.action === "USER_TRANSFER_TEAM" && meta.nextManagerId === emp.reportingManagerId) {
          assignDate = log.createdAt;
          break;
        }
        if (log.action === "USER_UPDATE_INTERNAL" && meta.reportingManagerId === emp.reportingManagerId) {
          assignDate = log.createdAt;
          break;
        }
      }
    }
    return {
      ...emp,
      assignDate,
    };
  });

  const pending: Array<{
    employeeId: string;
    employeeName: string;
    employeeCode: string | null;
    commitDate: string;
    status: "pending";
  }> = [];

  const today = startOfTodayUtc();
  const limitTo = to > today ? today : to;

  const cursor = new Date(from);
  while (cursor <= limitTo) {
    const dateKey = formatDateOnly(cursor);
    for (const emp of employeesWithAssignDate) {
      const assignDateKey = formatDateOnly(emp.assignDate);
      if (dateKey < assignDateKey) {
        continue;
      }
      const key = `${emp.id}:${dateKey}`;
      if (!submittedByEmployeeDate.has(key)) {
        pending.push({
          employeeId: emp.id,
          employeeName: emp.fullName,
          employeeCode: emp.employeeCode,
          commitDate: dateKey,
          status: "pending",
        });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return { commits: serialized, pending };
}

export async function attachFileToCommit(auth: AuthContext, commitId: string, attachmentUrl: string) {
  const commit = await prisma.dailyCommit.findUnique({ where: { id: commitId } });
  if (!commit) {
    throw new ApiError(404, "Daily commit not found");
  }
  if (commit.employeeId !== auth.userId) {
    throw new ApiError(403, "You can only attach files to your own commits");
  }

  const updated = await prisma.dailyCommit.update({
    where: { id: commitId },
    data: { attachmentUrl },
    include: {
      employee: {
        select: { id: true, fullName: true, employeeCode: true, loginId: true },
      },
    },
  });

  return serializeDailyCommit(updated);
}

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportMonthlyTeamCommitsCsv(
  auth: AuthContext,
  query: ExportMonthlyCsvQueryInput,
): Promise<string> {
  const result = await listTeamDailyCommits(auth, {
    period: "monthly",
    employeeId: query.employeeId,
    month: query.month,
    year: query.year,
    pendingOnly: false,
  });

  const headers = [
    "commit_id",
    "employee_id",
    "employee_name",
    "employee_code",
    "commit_date",
    "task_worked_on",
    "work_summary",
    "hours_spent",
    "issues_blockers",
    "tomorrow_plan",
    "attachment_url",
    "submitted_at",
  ];

  const rows = result.commits.map((commit) => [
    commit.id,
    commit.employeeId,
    commit.employeeName,
    commit.employeeCode,
    commit.commitDate,
    commit.taskWorkedOn,
    commit.workSummary,
    commit.hoursSpent,
    commit.issuesBlockers,
    commit.tomorrowPlan,
    commit.attachmentUrl,
    commit.submittedAt,
  ]);

  return "\ufeff" + [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell as any)).join(","))
    .join("\r\n");
}

export async function passDailyCommitUpward(auth: AuthContext, commitId: string, note?: string) {
  const commit = await prisma.dailyCommit.findUnique({
    where: { id: commitId },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          reportingManagerId: true,
        },
      },
    },
  });

  if (!commit) {
    throw new ApiError(404, "Daily commit not found");
  }

  const actorCanPassForCommit =
    auth.userId === commit.employeeId || auth.role === UserRole.ADMIN || auth.role === UserRole.SUPER_ADMIN;

  if (!actorCanPassForCommit) {
    throw new ApiError(403, "You can only pass your own commit");
  }

  const duplicate = await prisma.auditLog.findFirst({
    where: {
      action: "DAILY_COMMIT_PASS",
      entity: "DailyCommit",
      entityId: commit.id,
      actorId: auth.userId,
    },
    select: { id: true },
  });

  if (duplicate) {
    return {
      commitId: commit.id,
      status: "already_passed",
      recipients: [] as string[],
    };
  }

  const adminUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    },
    select: { id: true },
  });

  const recipientIds = new Set<string>();
  if (commit.employee.reportingManagerId) {
    recipientIds.add(commit.employee.reportingManagerId);
  }
  for (const admin of adminUsers) {
    recipientIds.add(admin.id);
  }
  recipientIds.delete(commit.employeeId);

  const message = `Daily pass received from ${commit.employee.fullName} for ${formatDateOnly(
    commit.commitDate,
  )}${note ? ` - ${note}` : ""}`;

  if (recipientIds.size > 0) {
    await prisma.adminNotification.createMany({
      data: Array.from(recipientIds).map((recipientId) => ({
        type: "DAILY_PASS",
        message,
        employeeId: recipientId,
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "DAILY_COMMIT_PASS",
      entity: "DailyCommit",
      entityId: commit.id,
      metadata: {
        commitDate: formatDateOnly(commit.commitDate),
        employeeId: commit.employeeId,
        recipients: Array.from(recipientIds),
        note: note ?? null,
      },
    },
  });

  return {
    commitId: commit.id,
    status: "passed",
    recipients: Array.from(recipientIds),
  };
}
