import type { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";

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

  if (status) {
    where.status = status;
  }

  const [tasks, total] = await Promise.all([
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
 * Employee can only view their own tasks
 */
export async function getTaskDetails(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { taskId } = req.params;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
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

  // Verify the task belongs to this employee
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

  // Verify the task belongs to this employee
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

  // Audit log
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
  }).catch(() => {
    // Silently fail
  });

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
  const { completionMessage, completionDocumentUrl } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId) },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Verify the task belongs to this employee
  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to complete this task");
  }

  const completedTask = await prisma.task.update({
    where: { id: parseInt(taskId) },
    data: {
      status: TaskStatus.COMPLETED,
      completionMessage,
      completionDocumentUrl,
      completedAt: new Date(),
    },
  });

  // Audit log
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
  }).catch(() => {
    // Silently fail
  });

  res.status(200).json({
    data: completedTask,
    message: "Task marked as completed",
  });
}
