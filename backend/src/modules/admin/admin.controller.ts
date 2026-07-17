import type { Request, Response } from "express";
import { TaskStatus, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";

/**
 * Get admin dashboard with task and employee statistics
 */
export async function getAdminDashboard(req: Request, res: Response): Promise<void> {
  try {
    const [totalTasks, tasksByStatus, totalEmployees, totalCustomers, totalKwData, openComplaints, pendingServices, recentTasks] = await Promise.all([
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
      prisma.customer.aggregate({
        _sum: {
          systemSizeKw: true
        }
      }),
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
          totalKw,
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
