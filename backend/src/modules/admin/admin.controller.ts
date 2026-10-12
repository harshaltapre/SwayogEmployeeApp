import type { Request, Response } from "express";
import { TaskStatus, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";

type DuplicateGroup = { customerCode: string; records: any[] };

const duplicateRelationUpdates = [
  "task",
  "serviceRequest",
  "amcContract",
  "invoice",
  "amcVisit",
  "customerNotification",
  "payment",
  "dispatchRecord",
  "inverterInstallation",
  "generationLog",
] as const;

function customerCompletenessScore(customer: any): number {
  const fields = [
    "fullName", "email", "phoneNumber", "city", "address", "systemSizeKw",
    "installationDate", "panelBrand", "inverterBrand", "inverterName",
    "inverterModel", "inverterUid", "inverterSrNo", "dataLoggerSrNo",
    "amcStatus", "amcExpiryDate", "contractStartDate", "contractEndDate",
    "monitoringStatus", "monitoringLastDataAt",
  ];
  return fields.reduce((score, field) => score + (customer[field] !== null && customer[field] !== undefined && customer[field] !== "" ? 1 : 0), 0);
}

function selectDuplicatePrimary(records: any[]) {
  return [...records].sort((a, b) => {
    const linkedAccount = Number(Boolean(b.userId)) - Number(Boolean(a.userId));
    if (linkedAccount !== 0) return linkedAccount;
    const completeness = customerCompletenessScore(b) - customerCompletenessScore(a);
    if (completeness !== 0) return completeness;
    const activeInverter = Number(Boolean(b.inverterUid || b.inverterSrNo || b.inverterDeviceSn)) - Number(Boolean(a.inverterUid || a.inverterSrNo || a.inverterDeviceSn));
    if (activeInverter !== 0) return activeInverter;
    const historicalData = (b._count?.serviceRequests ?? 0) + (b._count?.inverterInstallations ?? 0) + (b._count?.generationLogs ?? 0)
      - ((a._count?.serviceRequests ?? 0) + (a._count?.inverterInstallations ?? 0) + (a._count?.generationLogs ?? 0));
    if (historicalData !== 0) return historicalData;
    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0];
}

function normalizeDuplicateValue(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

async function findDuplicateGroups(): Promise<{ groups: DuplicateGroup[]; checked: number; duplicateRecords: number }> {
  const customers = await prisma.customer.findMany({
    include: {
      user: { select: { id: true, role: true } },
      inverterCache: true,
      _count: { select: { serviceRequests: true, inverterInstallations: true, generationLogs: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const parent = new Map<number, number>();
  const firstByKey = new Map<string, number>();
  const find = (id: number): number => {
    const current = parent.get(id);
    if (current === undefined || current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };

  for (const customer of customers) {
    parent.set(customer.id, customer.id);
    const keys = [
      customer.customerCode ? `code:${normalizeDuplicateValue(customer.customerCode)}` : "",
      customer.email ? `email:${normalizeDuplicateValue(customer.email)}` : "",
      customer.phoneNumber ? `phone:${normalizeDuplicateValue(customer.phoneNumber)}` : "",
      customer.fullName && customer.city && customer.address
        ? `details:${normalizeDuplicateValue(customer.fullName)}:${normalizeDuplicateValue(customer.city)}:${normalizeDuplicateValue(customer.address)}`
        : "",
    ].filter(Boolean);
    for (const key of keys) {
      const existingId = firstByKey.get(key);
      if (existingId === undefined) firstByKey.set(key, customer.id);
      else union(existingId, customer.id);
    }
  }

  const grouped = new Map<number, any[]>();
  for (const customer of customers) {
    const root = find(customer.id);
    const records = grouped.get(root) ?? [];
    records.push(customer);
    grouped.set(root, records);
  }
  const groups = [...grouped.values()]
    .filter((records) => records.length > 1)
    .map((records) => ({
      customerCode: selectDuplicatePrimary(records)?.customerCode || "MATCHED_CUSTOMER_DETAILS",
      records,
    }));
  return {
    groups,
    checked: await prisma.customer.count(),
    duplicateRecords: groups.reduce((total, group) => total + group.records.length - 1, 0),
  };
}

export async function getDuplicateCustomerSummary(_req: Request, res: Response): Promise<void> {
  const result = await findDuplicateGroups();
  res.status(200).json({
    data: {
      customerIdsChecked: result.checked,
      duplicateCustomerIds: result.groups.length,
      duplicateRecords: result.duplicateRecords,
      recordsPreserved: result.groups.length,
    },
  });
}

export async function removeAllDuplicateCustomers(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const scan = await findDuplicateGroups();
  const failedRecords: Array<{ customerCode: string; recordIds: number[]; reason: string }> = [];
  let removed = 0;
  let preserved = 0;

  for (const group of scan.groups) {
    const primary = selectDuplicatePrimary(group.records);
    const duplicates = group.records.filter((record) => record.id !== primary.id);
    try {
      await prisma.$transaction(async (tx) => {
        for (const duplicate of duplicates) {
          if (duplicate.inverterCache && primary.inverterCache) {
            throw new Error("Both records have inverter cache data.");
          }
          if (duplicate.userId && !primary.userId) {
            await tx.customer.update({ where: { id: primary.id }, data: { userId: duplicate.userId } });
          }
          if (duplicate.inverterCache) {
            await tx.inverterCache.update({ where: { customerId: duplicate.id }, data: { customerId: primary.id } });
          }
          for (const relation of duplicateRelationUpdates) {
            await tx[relation].updateMany({ where: { customerId: duplicate.id }, data: { customerId: primary.id } });
          }
          if (duplicate.userId && primary.userId) {
            if (duplicate.user?.role !== "CUSTOMER") {
              throw new Error("Duplicate record is linked to a non-customer account.");
            }
            await tx.customer.update({ where: { id: duplicate.id }, data: { userId: null } });
            await tx.user.delete({ where: { id: duplicate.userId } });
          }
          await tx.customer.delete({ where: { id: duplicate.id } });
        }
        await tx.auditLog.create({
          data: {
            actorId: auth?.userId,
            action: "BULK_DUPLICATE_CLEANUP",
            entity: "Customer",
            entityId: String(primary.id),
            metadata: {
              customerCode: group.customerCode,
              duplicateIds: duplicates.map((record) => record.id),
              primaryId: primary.id,
              recordsRemoved: duplicates.length,
              recordsPreserved: 1,
              status: "SUCCESS",
            },
          },
        });
      }, { maxWait: 10000, timeout: 30000 });
      removed += duplicates.length;
      preserved++;
    } catch (error) {
      failedRecords.push({
        customerCode: group.customerCode,
        recordIds: group.records.map((record) => record.id),
        reason: error instanceof Error ? error.message : "Unable to safely merge duplicate records.",
      });
    }
  }

  const actor = auth?.userId
    ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { fullName: true } })
    : null;
  await prisma.auditLog.create({
    data: {
      actorId: auth?.userId,
      action: "BULK_DUPLICATE_CLEANUP",
      entity: "Customer",
      metadata: {
        performedBy: actor?.fullName ?? "Administrator",
        duplicateCustomerIdsFound: scan.groups.length,
        duplicateRecordsRemoved: removed,
        recordsPreserved: preserved,
        failedRecords,
        status: failedRecords.length ? "COMPLETED_WITH_WARNINGS" : "SUCCESS",
      },
    },
  });

  res.status(200).json({
    data: {
      customerIdsChecked: scan.checked,
      duplicateCustomerIdsFound: scan.groups.length,
      duplicateRecordsRemoved: removed,
      recordsPreserved: preserved,
      failed: failedRecords.length,
      failedRecords,
      status: failedRecords.length ? "COMPLETED_WITH_WARNINGS" : "SUCCESS",
    },
  });
}

/**
 * Get admin dashboard with task and employee statistics
 */
export async function getAdminDashboard(req: Request, res: Response): Promise<void> {
  try {
    const [
      totalTasks,
      tasksByStatus,
      totalEmployees,
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalInverters,
      onlineInverters,
      totalKwData,
      activeAmc,
      expiredAmc,
      openComplaints,
      pendingServices,
      recentTasks,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.user.count({
        where: {
          role: "EMPLOYEE",
        },
      }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: "ACTIVE" } }),
      prisma.customer.count({ where: { status: "INACTIVE" } }),
      prisma.customer.count({
        where: {
          OR: [{ inverterUid: { not: null } }, { inverterSrNo: { not: null } }, { inverterDeviceSn: { not: null } }],
        },
      }),
      prisma.customer.count({
        where: {
          OR: [
            { monitoringStatus: { equals: "ONLINE", mode: "insensitive" } },
            { monitoringStatus: { equals: "CONNECTED", mode: "insensitive" } },
          ],
        },
      }),
      prisma.customer.aggregate({
        _sum: {
          systemSizeKw: true
        }
      }),
      prisma.customer.count({ where: { amcStatus: "ACTIVE" } }),
      prisma.customer.count({ where: { amcStatus: "EXPIRED" } }),
      // Open complaints = all unresolved (PENDING, SCHEDULED)
      prisma.serviceRequest.count({
        where: {
          status: { in: [ServiceRequestStatus.PENDING, ServiceRequestStatus.SCHEDULED] }
        }
      }),
      // Pending services = only PENDING (not yet assigned/actioned)
      prisma.serviceRequest.count({
        where: {
          status: ServiceRequestStatus.PENDING
        }
      }),
      prisma.task.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          jobType: true,
          status: true,
          scheduledTime: true,
        },
      }),
    ]);

    const totalKw = totalKwData._sum.systemSizeKw || 0;
    const monthlyRevenue = totalKw * 60000;

    res.status(200).json({
      data: {
        summary: {
          totalTasks,
          totalEmployees,
          totalCustomers,
          activeCustomers,
          inactiveCustomers,
          totalInverters,
          onlineInverters,
          offlineInverters: Math.max(0, totalInverters - onlineInverters),
          totalKw,
          totalInstalledCapacityKw: totalKw,
          activeAmc,
          expiredAmc,
          monthlyRevenue,
          openComplaints,
          pendingServices,
        },
        tasksByStatus: tasksByStatus.reduce(
          (acc: Record<string, any>, row: any) => {
            acc[row.status] = row._count;
            return acc;
          },
          {}
        ),
        recentTasks: recentTasks.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("[Admin] getAdminDashboard error:", error);
    throw new ApiError(500, "Failed to fetch dashboard data");
  }
}

/**
 * Get all employees
 */
export async function getAdminEmployees(req: Request, res: Response): Promise<void> {
  const { limit = "50", offset = "0" } = req.query;

  try {
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "EMPLOYEE",
        },
        select: {
          id: true,
          loginId: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
          employeeProfile: {
            select: {
              zone: true,
              jobRole: true,
              monthlySalaryInr: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: Math.min(parseInt(limit as string) || 50, 100),
        skip: parseInt(offset as string) || 0,
      }),
      prisma.user.count({
        where: {
          role: "EMPLOYEE",
        },
      }),
    ]);

    res.status(200).json({
      data: {
        employees,
        pagination: {
          total,
          limit: Math.min(parseInt(limit as string) || 50, 100),
          offset: parseInt(offset as string) || 0,
        },
      },
    });
  } catch (error) {
    console.error("[Admin] getAdminEmployees error:", error);
    throw new ApiError(500, "Failed to fetch employees");
  }
}

/**
 * Get all tasks (with optional filters)
 */
export async function getAdminTasks(req: Request, res: Response): Promise<void> {
  const { status, employeeId, limit = "50", offset = "0" } = req.query;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (employeeId) {
    where.employeeUserId = employeeId;
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: {
        id: true,
        jobType: true,
        description: true,
        customerName: true,
        address: true,
        status: true,
        scheduledTime: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        scheduledTime: "asc",
      },
      take: Math.min(parseInt(limit as string) || 50, 100),
      skip: parseInt(offset as string) || 0,
    }),
    prisma.task.count({ where }),
  ]);

  res.status(200).json({
    data: {
      tasks,
      pagination: {
        total,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    },
  });
}

/**
 * Get specific task details
 */
export async function getTaskDetails(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;

  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId) },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      taskImages: {
        orderBy: { uploadedAt: "asc" },
      },
    },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const beforeImage = task.taskImages.find(img => img.type === "before" || img.type === "Before");
  const afterImage = task.taskImages.find(img => img.type === "after" || img.type === "After");

  const responseData = {
    ...task,
    beforeImageUrl: beforeImage?.url ?? null,
    beforeLatitude: beforeImage?.latitude ?? null,
    beforeLongitude: beforeImage?.longitude ?? null,
    afterImageUrl: afterImage?.url ?? null,
    afterLatitude: afterImage?.latitude ?? null,
    afterLongitude: afterImage?.longitude ?? null,
  };

  res.status(200).json({ data: responseData });
}

/**
 * Assign task to employee
 */
export async function assignTaskToEmployee(req: Request, res: Response): Promise<void> {
  const { employeeId, jobType, description, customerName, customerPhone, address, scheduledTime } = req.body;
  const auth = req.auth as AuthContext | undefined;

  // Validate employee exists and is active
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
  });

  if (!employee || employee.role !== "EMPLOYEE" || !employee.isActive) {
    throw new ApiError(400, "Invalid employee ID or employee is not active");
  }

  const newTask = await prisma.task.create({
    data: {
      jobType,
      description,
      customerName,
      customerPhone,
      address,
      scheduledTime: new Date(scheduledTime),
      employeeUserId: employeeId,
      assignedById: auth?.userId || "",
      status: "ASSIGNED",
    },
    include: {
      employee: true,
      assignedBy: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: auth?.userId,
      action: "TASK_ASSIGNED",
      entity: "Task",
      entityId: newTask.id.toString(),
      metadata: {
        employeeId,
        jobType,
      },
    },
  }).catch(() => {
    // Silently fail
  });

  res.status(201).json({
    data: newTask,
    message: "Task assigned successfully",
  });
}

/**
 * Get all service requests (complaints) for admin
 * Service requests submitted by customers appear as complaints for admins/superadmins
 */
export async function getAdminComplaints(req: Request, res: Response): Promise<void> {
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
        priority: "medium", // Default priority
        status: req.status,
        slaDeadline: new Date(req.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours SLA
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

/**
 * Update task status
 */
export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const { status } = req.body;
  const auth = req.auth as AuthContext | undefined;

  // Validate status
  if (!Object.values(TaskStatus).includes(status)) {
    throw new ApiError(400, "Invalid task status");
  }

  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId) },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const originalStatus = task.status;

  const updatedTask = await prisma.task.update({
    where: { id: parseInt(taskId) },
    data: {
      status,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : task.completedAt,
    },
    include: {
      employee: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: auth?.userId,
      action: "TASK_STATUS_UPDATED",
      entity: "Task",
      entityId: taskId,
      metadata: {
        oldStatus: originalStatus,
        newStatus: status,
      },
    },
  }).catch(() => {
    // Silently fail
  });

  res.status(200).json({
    data: updatedTask,
    message: `Task status updated from ${originalStatus} to ${status}`,
  });
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildLastMonths(count: number): Array<{ year: number; month: number; key: string; label: string }> {
  const buckets: Array<{ year: number; month: number; key: string; label: string }> = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    buckets.push({
      year: d.getFullYear(),
      month,
      key: `${d.getFullYear()}-${month}`,
      label: MONTH_LABELS[month] ?? "—",
    });
  }
  return buckets;
}

/**
 * Monthly revenue from invoices (last 12 months)
 */
export async function getAdminRevenueChart(_req: Request, res: Response): Promise<void> {
  const months = buildLastMonths(12);
  const start = new Date(months[0].year, months[0].month, 1);

  const invoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: start } },
    select: { invoiceDate: true, amount: true },
  });

  const totals = new Map(months.map((m) => [m.key, 0]));
  for (const inv of invoices) {
    const d = inv.invoiceDate;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + (inv.amount ?? 0));
    }
  }

  const chart = months.map((m) => ({
    month: m.label,
    year: String(m.year),
    revenue: totals.get(m.key) ?? 0,
  }));

  res.status(200).json({ data: chart });
}

/**
 * Monthly customer installations (last 12 months)
 */
export async function getAdminInstallationChart(_req: Request, res: Response): Promise<void> {
  const months = buildLastMonths(12);
  const start = new Date(months[0].year, months[0].month, 1);

  const customers = await prisma.customer.findMany({
    where: { installationDate: { gte: start } },
    select: { installationDate: true },
  });

  const counts = new Map(months.map((m) => [m.key, 0]));
  for (const c of customers) {
    const d = c.installationDate;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const chart = months.map((m) => ({
    month: m.label,
    count: counts.get(m.key) ?? 0,
  }));

  res.status(200).json({ data: chart });
}

import path from "path";

/**
 * Download blank Customer Excel Template
 */
export async function exportCustomerTemplate(req: Request, res: Response): Promise<void> {
  const filePath = path.join(process.cwd(), "../public/Customer_Directory_template.xlsx");
  res.download(
    filePath,
    "Swayog_Customer_Import_Template.xlsx"
  );
}
