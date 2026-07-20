import type { Request, Response } from "express";
import { TaskStatus, AmcVisitStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import fs from "fs";
import path from "path";

function saveBase64Image(base64Str: string | undefined, prefix: string): string | undefined {
  if (!base64Str || !base64Str.startsWith("data:image")) return base64Str; // Return as-is if it's already a URL or empty
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Str;

    const buffer = Buffer.from(matches[2], "base64");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${prefix}-${uniqueSuffix}.jpg`;
    const dir = path.join(process.cwd(), "uploads", "task-images");
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, buffer);
    return `/uploads/task-images/${filename}`;
  } catch (error) {
    console.error("Failed to save base64 image", error);
    return undefined;
  }
}

/**
 * Get employee dashboard with task summary
 */
export async function getEmployeeDashboard(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const [totalTasks, tasksByStatus, completedToday] = await Promise.all([
    prisma.task.count({
      where: { employeeUserId: auth.userId },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { employeeUserId: auth.userId },
      _count: true,
    }),
    prisma.task.count({
      where: {
        employeeUserId: auth.userId,
        status: TaskStatus.COMPLETED,
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  res.status(200).json({
    data: {
      summary: {
        totalTasks,
        completedToday,
      },
      tasksByStatus: tasksByStatus.reduce(
        (acc: Record<string, any>, row: any) => {
          acc[row.status] = row._count;
          return acc;
        },
        {}
      ),
    },
  });
}

/**
 * Get all tasks assigned to this employee
 */
export async function getMyTasks(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { status, limit = "50", offset = "0" } = req.query;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const where: any = {
    employeeUserId: auth.userId,
  };
  
  const amcWhere: any = {
    assignedEmployeeId: auth.userId,
  };

  if (status) {
    where.status = status;
    if (status === TaskStatus.COMPLETED) {
      amcWhere.status = AmcVisitStatus.COMPLETED;
    } else {
      amcWhere.status = { not: AmcVisitStatus.COMPLETED };
    }
  }

  const [tasks, amcVisits] = await Promise.all([
    prisma.task.findMany({
      where,
      select: {
        id: true,
        jobType: true,
        description: true,
        customerName: true,
        customerPhone: true,
        address: true,
        status: true,
        scheduledTime: true,
        createdAt: true,
      },
    }),
    prisma.amcVisit.findMany({
      where: amcWhere,
      include: { customer: true },
    }),
  ]);

  const mappedAmc = amcVisits.map(v => ({
    id: "TASK-amc_" + v.id,
    jobType: "AMC Visit",
    description: "AMC Cleaning Visit #" + (v.cleaningNumber || 1),
    customerName: v.customer?.fullName || v.customer?.companyName || "Unknown",
    customerPhone: v.customer?.phoneNumber || "",
    address: v.customer?.address || [v.customer?.city, v.customer?.state].filter(Boolean).join(", "),
    status: v.status === AmcVisitStatus.COMPLETED ? TaskStatus.COMPLETED : TaskStatus.ASSIGNED,
    scheduledTime: v.scheduledDate,
    createdAt: v.createdAt,
    completionMessage: v.visitNotes,
    completionDocumentUrl: v.afterImageUrl || v.beforeImageUrl,
    beforeImageUrl: v.beforeImageUrl,
    afterImageUrl: v.afterImageUrl,
  }));

  const combined = [...tasks, ...mappedAmc].sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  
  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;
  const paginated = combined.slice(offsetNum, offsetNum + limitNum);

  res.status(200).json({
    data: {
      tasks: paginated,
      pagination: {
        total: combined.length,
        limit: limitNum,
        offset: offsetNum,
      },
    },
  });
}

/**
 * Get specific task details
 * Employee can only view their own tasks
 */
export async function getTaskDetails(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (taskId.startsWith("TASK-amc_")) {
    const visitId = taskId.replace("TASK-amc_", "");
    const visit = await prisma.amcVisit.findUnique({
      where: { id: visitId },
      include: { customer: true }
    });
    if (!visit) throw new ApiError(404, "Visit not found");
    if (visit.assignedEmployeeId !== auth.userId) throw new ApiError(403, "Forbidden");

    res.status(200).json({
      data: {
        id: taskId,
        jobType: "AMC Visit",
        description: "AMC Cleaning Visit #" + (visit.cleaningNumber || 1),
        customerName: visit.customer?.fullName || visit.customer?.companyName || "Unknown",
        customerPhone: visit.customer?.phoneNumber || "",
        address: visit.customer?.address || [visit.customer?.city, visit.customer?.state].filter(Boolean).join(", "),
        status: visit.status === AmcVisitStatus.COMPLETED ? TaskStatus.COMPLETED : TaskStatus.ASSIGNED,
        scheduledTime: visit.scheduledDate,
        createdAt: visit.createdAt,
        completionMessage: visit.visitNotes,
        completionDocumentUrl: visit.afterImageUrl || visit.beforeImageUrl,
        beforeImageUrl: visit.beforeImageUrl,
        afterImageUrl: visit.afterImageUrl,
      }
    });
    return;
  }

  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId) },
    include: {
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

  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to view this task");
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
 * Update task status
 * Employee can only update their own tasks
 */
export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;
  const { status } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (!Object.values(TaskStatus).includes(status)) {
    throw new ApiError(400, "Invalid task status");
  }

  if (taskId.startsWith("TASK-amc_")) {
    const visitId = taskId.replace("TASK-amc_", "");
    const visit = await prisma.amcVisit.findUnique({ where: { id: visitId } });
    if (!visit) throw new ApiError(404, "Visit not found");
    if (visit.assignedEmployeeId !== auth.userId) throw new ApiError(403, "Forbidden");

    const newStatus = status === TaskStatus.COMPLETED ? AmcVisitStatus.COMPLETED : AmcVisitStatus.PENDING;
    const updatedVisit = await prisma.amcVisit.update({
      where: { id: visitId },
      data: {
        status: newStatus,
        completedAt: newStatus === AmcVisitStatus.COMPLETED ? new Date() : null,
      }
    });
    res.status(200).json({ data: updatedVisit, message: "AMC Visit status updated" });
    return;
  }

  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId) },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to update this task");
  }

  const originalStatus = task.status;

  const updatedTask = await prisma.task.update({
    where: { id: parseInt(taskId) },
    data: {
      status,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : task.completedAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "EMPLOYEE_TASK_STATUS_UPDATED",
      entity: "Task",
      entityId: taskId,
      metadata: {
        oldStatus: originalStatus,
        newStatus: status,
      },
    },
  }).catch(() => {});

  res.status(200).json({
    data: updatedTask,
    message: `Task status updated from ${originalStatus} to ${status}`,
  });
}

/**
 * Mark task as completed with documentation
 * Employee can only complete their own tasks
 */
export async function markTaskCompleted(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;
  const { completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (taskId.startsWith("TASK-amc_")) {
    const visitId = taskId.replace("TASK-amc_", "");
    const visit = await prisma.amcVisit.findUnique({ where: { id: visitId } });
    if (!visit) throw new ApiError(404, "Visit not found");
    if (visit.assignedEmployeeId !== auth.userId) throw new ApiError(403, "Forbidden");

    const savedBeforeUrl = saveBase64Image(beforeImageUrl, "amc-before") || beforeImageUrl || completionDocumentUrl;
    const savedAfterUrl = saveBase64Image(afterImageUrl, "amc-after") || afterImageUrl || completionDocumentUrl;

    const completedVisit = await prisma.amcVisit.update({
      where: { id: visitId },
      include: { customer: true },
      data: {
        status: AmcVisitStatus.COMPLETED,
        completedAt: new Date(),
        completedByEmployeeId: auth.userId,
        visitNotes: completionMessage,
        beforeImageUrl: savedBeforeUrl,
        afterImageUrl: savedAfterUrl,
      }
    });
    
    res.status(200).json({ 
      data: {
        id: taskId,
        jobType: "AMC Visit",
        description: "AMC Cleaning Visit #" + (completedVisit.cleaningNumber || 1),
        customerName: completedVisit.customer?.fullName || completedVisit.customer?.companyName || "Unknown",
        customerPhone: completedVisit.customer?.phoneNumber || "",
        address: completedVisit.customer?.address || [completedVisit.customer?.city, completedVisit.customer?.state].filter(Boolean).join(", "),
        status: TaskStatus.COMPLETED,
        scheduledTime: completedVisit.scheduledDate,
        createdAt: completedVisit.createdAt,
        completionMessage: completedVisit.visitNotes,
        completionDocumentUrl: completedVisit.afterImageUrl || completedVisit.beforeImageUrl,
        beforeImageUrl: completedVisit.beforeImageUrl,
        afterImageUrl: completedVisit.afterImageUrl,
      },
      message: "AMC Visit marked as completed" 
    });
    return;
  }

  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId) },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to complete this task");
  }

  const savedBeforeUrl = saveBase64Image(beforeImageUrl, "task-before") || beforeImageUrl;
  const savedAfterUrl = saveBase64Image(afterImageUrl, "task-after") || afterImageUrl;

  const completedTask = await prisma.task.update({
    where: { id: parseInt(taskId) },
    data: {
      status: TaskStatus.COMPLETED,
      completionMessage,
      completionDocumentUrl: savedAfterUrl || completionDocumentUrl,
      completedAt: new Date(),
    },
  });

  // Create TaskImage records for the saved images
  if (savedBeforeUrl) {
    await prisma.imageRecord.create({
      data: {
        taskId: parseInt(taskId),
        uploadedBy: auth.userId,
        type: "before",
        url: savedBeforeUrl,
      }
    });
  }

  if (savedAfterUrl) {
    await prisma.imageRecord.create({
      data: {
        taskId: parseInt(taskId),
        uploadedBy: auth.userId,
        type: "after",
        url: savedAfterUrl,
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "TASK_COMPLETED",
      entity: "Task",
      entityId: taskId,
      metadata: {
        completionMessage,
        hasDocumentation: !!completionDocumentUrl,
      },
    },
  }).catch(() => {});

  res.status(200).json({
    data: completedTask,
    message: "Task marked as completed",
  });
}
