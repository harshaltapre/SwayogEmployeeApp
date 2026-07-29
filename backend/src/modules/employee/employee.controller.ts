import type { Request, Response } from "express";
import { TaskStatus, AmcVisitStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";

/**
 * Get employee dashboard with task and AMC visit summary
 */
export async function getEmployeeDashboard(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalTasks, amcTotalCount, tasksByStatus, amcByStatus, completedTodayTasks, completedTodayAmc] = await Promise.all([
    prisma.task.count({
      where: { employeeUserId: auth.userId },
    }),
    prisma.amcVisit.count({
      where: { assignedEmployeeId: auth.userId },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { employeeUserId: auth.userId },
      _count: true,
    }),
    prisma.amcVisit.groupBy({
      by: ["status"],
      where: { assignedEmployeeId: auth.userId },
      _count: true,
    }),
    prisma.task.count({
      where: {
        employeeUserId: auth.userId,
        status: TaskStatus.COMPLETED,
        completedAt: { gte: todayStart },
      },
    }),
    prisma.amcVisit.count({
      where: {
        assignedEmployeeId: auth.userId,
        status: AmcVisitStatus.COMPLETED,
        completedAt: { gte: todayStart },
      },
    }),
  ]);

  const combinedStatusMap: Record<string, number> = {};
  for (const row of tasksByStatus) {
    const key = String(row.status).toLowerCase();
    combinedStatusMap[key] = (combinedStatusMap[key] || 0) + row._count;
  }
  for (const row of amcByStatus) {
    const key = String(row.status).toLowerCase();
    combinedStatusMap[key] = (combinedStatusMap[key] || 0) + row._count;
  }

  res.status(200).json({
    data: {
      summary: {
        totalTasks: totalTasks + amcTotalCount,
        completedToday: completedTodayTasks + completedTodayAmc,
      },
      tasksByStatus: combinedStatusMap,
    },
  });
}

/**
 * Get all tasks (including assigned AMC visits) assigned to this employee
 */
export async function getMyTasks(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { status, limit = "50", offset = "0" } = req.query;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const taskWhere: any = {
    employeeUserId: auth.userId,
  };
  const amcWhere: any = {
    assignedEmployeeId: auth.userId,
  };

  if (status) {
    const statusStr = String(status).toLowerCase();
    if (statusStr === "completed") {
      taskWhere.status = TaskStatus.COMPLETED;
      amcWhere.status = AmcVisitStatus.COMPLETED;
    } else {
      taskWhere.status = { not: TaskStatus.COMPLETED };
      amcWhere.status = { not: AmcVisitStatus.COMPLETED };
    }
  }

  const [regularTasks, amcVisits] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
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
      orderBy: {
        scheduledTime: "asc",
      },
    }),
    prisma.amcVisit.findMany({
      where: amcWhere,
      include: {
        customer: {
          select: {
            fullName: true,
            phoneNumber: true,
            address: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    }),
  ]);

  const serializedRegular = regularTasks.map((t) => ({
    id: t.id,
    jobType: t.jobType,
    description: t.description,
    customerName: t.customerName,
    customerPhone: t.customerPhone,
    address: t.address,
    status: String(t.status).toLowerCase(),
    scheduledTime: typeof t.scheduledTime === "string" ? t.scheduledTime : t.scheduledTime.toISOString(),
    createdAt: typeof t.createdAt === "string" ? t.createdAt : t.createdAt.toISOString(),
  }));

  const serializedAmc = amcVisits.map((visit) => ({
    id: `amc_${visit.id}`,
    jobType: "AMC",
    description: visit.visitNotes || `AMC Visit #${visit.cleaningNumber || 1} Cleaning`,
    customerName: visit.customer?.fullName || "AMC Customer",
    customerPhone: visit.customer?.phoneNumber || "",
    address: visit.customer?.address || "",
    status: String(visit.status).toLowerCase(),
    scheduledTime: typeof visit.scheduledDate === "string" ? visit.scheduledDate : visit.scheduledDate.toISOString(),
    createdAt: typeof visit.createdAt === "string" ? visit.createdAt : visit.createdAt.toISOString(),
  }));

  const combined = [...serializedRegular, ...serializedAmc].sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );

  const parsedLimit = Math.min(parseInt(limit as string) || 50, 100);
  const parsedOffset = parseInt(offset as string) || 0;
  const paginated = combined.slice(parsedOffset, parsedOffset + parsedLimit);

  res.status(200).json({
    data: {
      tasks: paginated,
      pagination: {
        total: combined.length,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    },
  });
}

/**
 * Get specific task details (handles both regular Task and AMC Visit)
 */
export async function getTaskDetails(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (taskId.startsWith("amc_")) {
    const visitId = taskId.replace("amc_", "");
    const visit = await prisma.amcVisit.findUnique({
      where: { id: visitId },
      include: {
        customer: true,
        assignedEmployee: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!visit) {
      throw new ApiError(404, "AMC Visit not found");
    }

    if (visit.assignedEmployeeId !== auth.userId) {
      throw new ApiError(403, "You do not have permission to view this task");
    }

    const responseData = {
      id: taskId,
      jobType: "AMC",
      description: visit.visitNotes || `AMC Cleaning #${visit.cleaningNumber || 1}`,
      customerName: visit.customer?.fullName || "AMC Customer",
      customerPhone: visit.customer?.phoneNumber || "",
      address: visit.customer?.address || "",
      status: String(visit.status).toLowerCase(),
      scheduledTime: visit.scheduledDate.toISOString(),
      createdAt: visit.createdAt.toISOString(),
      assignedBy: { id: "system", fullName: "Service Coordinator", email: "" },
      beforeImageUrl: visit.beforeImageUrl ?? null,
      afterImageUrl: visit.afterImageUrl ?? null,
    };

    res.status(200).json({ data: responseData });
    return;
  }

  const parsedId = parseInt(taskId, 10);
  if (isNaN(parsedId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const task = await prisma.task.findUnique({
    where: { id: parsedId },
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

  const beforeImage = task.taskImages.find((img) => img.type === "before" || img.type === "Before");
  const afterImage = task.taskImages.find((img) => img.type === "after" || img.type === "After");

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
 * Update task status (handles both regular Task and AMC Visit)
 */
export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;
  const { status } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (taskId.startsWith("amc_")) {
    const visitId = taskId.replace("amc_", "");
    const visit = await prisma.amcVisit.findUnique({ where: { id: visitId } });
    if (!visit) {
      throw new ApiError(404, "AMC Visit not found");
    }
    if (visit.assignedEmployeeId !== auth.userId) {
      throw new ApiError(403, "You do not have permission to update this task");
    }

    const newAmcStatus = String(status).toUpperCase() === "COMPLETED" ? AmcVisitStatus.COMPLETED : AmcVisitStatus.PENDING;
    const updated = await prisma.amcVisit.update({
      where: { id: visitId },
      data: {
        status: newAmcStatus,
        completedAt: newAmcStatus === AmcVisitStatus.COMPLETED ? new Date() : null,
        completedByEmployeeId: newAmcStatus === AmcVisitStatus.COMPLETED ? auth.userId : null,
      },
    });

    res.status(200).json({
      data: {
        id: taskId,
        status: String(updated.status).toLowerCase(),
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
      message: `AMC Visit status updated to ${status}`,
    });
    return;
  }

  const parsedId = parseInt(taskId, 10);
  if (isNaN(parsedId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const task = await prisma.task.findUnique({
    where: { id: parsedId },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to update this task");
  }

  const originalStatus = task.status;

  const updatedTask = await prisma.task.update({
    where: { id: parsedId },
    data: {
      status: status as TaskStatus,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : task.completedAt,
    },
  });

  res.status(200).json({
    data: updatedTask,
    message: `Task status updated from ${originalStatus} to ${status}`,
  });
}

/**
 * Mark task as completed with documentation (handles both regular Task and AMC Visit)
 */
export async function markTaskCompleted(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;
  const { completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  if (taskId.startsWith("amc_")) {
    const visitId = taskId.replace("amc_", "");
    const visit = await prisma.amcVisit.findUnique({ where: { id: visitId } });
    if (!visit) {
      throw new ApiError(404, "AMC Visit not found");
    }
    if (visit.assignedEmployeeId !== auth.userId) {
      throw new ApiError(403, "You do not have permission to complete this task");
    }

    const emp = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { fullName: true },
    });

    const updated = await prisma.amcVisit.update({
      where: { id: visitId },
      data: {
        status: AmcVisitStatus.COMPLETED,
        notes: completionMessage || null,
        visitNotes: completionMessage || null,
        completedAt: new Date(),
        completedByEmployeeId: auth.userId,
        completedByName: emp?.fullName || "Employee",
        beforeImageUrl: beforeImageUrl || null,
        afterImageUrl: afterImageUrl || null,
      },
    });

    res.status(200).json({
      data: {
        id: taskId,
        status: "completed",
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
      message: "AMC Visit marked as completed",
    });
    return;
  }

  const parsedId = parseInt(taskId, 10);
  if (isNaN(parsedId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const task = await prisma.task.findUnique({
    where: { id: parsedId },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to complete this task");
  }

  const completedTask = await prisma.task.update({
    where: { id: parsedId },
    data: {
      status: TaskStatus.COMPLETED,
      completionMessage,
      completionDocumentUrl,
      completedAt: new Date(),
    },
  });

  res.status(200).json({
    data: completedTask,
    message: "Task marked as completed",
  });
}

