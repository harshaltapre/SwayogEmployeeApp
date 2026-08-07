import type { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import { processAndSaveBase64Photos, serializeTask, getTaskInclude } from "../tasks/tasks.service.js";

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
      _count: { status: true },
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
      tasksByStatus: tasksByStatus.reduce((acc: Record<string, any>, curr: any) => ({ ...acc, [curr.status]: curr._count.status }), {}),
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
      include: getTaskInclude(),
      orderBy: {
        scheduledTime: "asc",
      },
      take: Math.min(parseInt(limit as string) || 50, 100),
      skip: parseInt(offset as string) || 0,
    }),
    prisma.task.count({ where }),
  ]);

  const serializedTasks = tasks.map(serializeTask);

  res.status(200).json({
    data: {
      tasks: serializedTasks,
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
    include: getTaskInclude(),
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Verify the task belongs to this employee
  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to view this task");
  }

  res.status(200).json({ data: serializeTask(task) });
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
  const { 
    completionMessage, 
    completionDocumentUrl, 
    sitePhotos, 
    images, 
    beforeImageUrl, 
    afterImageUrl,
    beforeLatitude,
    beforeLongitude,
    afterLatitude,
    afterLongitude
  } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const numericTaskId = parseInt(taskId, 10);
  const task: any = await prisma.task.findUnique({
    where: { id: numericTaskId },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Verify the task belongs to this employee
  if (task.employeeUserId !== auth.userId) {
    throw new ApiError(403, "You do not have permission to complete this task");
  }

  // Process photos
  const existingSitePhotos = Array.isArray(task.sitePhotos) ? task.sitePhotos : [];
  const inputPhotos = (Array.isArray(sitePhotos) && sitePhotos.length > 0)
    ? sitePhotos
    : (Array.isArray(images) && images.length > 0 ? images : []);
  const savedInputPhotos = processAndSaveBase64Photos(inputPhotos, numericTaskId);
  const finalSitePhotos = savedInputPhotos.length > 0
    ? Array.from(new Set([...existingSitePhotos, ...savedInputPhotos]))
    : existingSitePhotos;

  let savedBeforeUrl = task.beforeImageUrl;
  if (beforeImageUrl) {
    const saved = processAndSaveBase64Photos([beforeImageUrl], numericTaskId);
    savedBeforeUrl = saved[0] || beforeImageUrl;
  }

  let savedAfterUrl = task.afterImageUrl;
  if (afterImageUrl) {
    const saved = processAndSaveBase64Photos([afterImageUrl], numericTaskId);
    savedAfterUrl = saved[0] || afterImageUrl;
  }

  const completedTask = await prisma.task.update({
    where: { id: numericTaskId },
    data: {
      status: TaskStatus.COMPLETED,
      completionMessage,
      completionDocumentUrl: completionDocumentUrl ?? null,
      beforeImageUrl: savedBeforeUrl,
      afterImageUrl: savedAfterUrl,
      beforeLatitude: (beforeLatitude !== undefined && beforeLatitude !== null) ? parseFloat(String(beforeLatitude)) : undefined,
      beforeLongitude: (beforeLongitude !== undefined && beforeLongitude !== null) ? parseFloat(String(beforeLongitude)) : undefined,
      afterLatitude: (afterLatitude !== undefined && afterLatitude !== null) ? parseFloat(String(afterLatitude)) : undefined,
      afterLongitude: (afterLongitude !== undefined && afterLongitude !== null) ? parseFloat(String(afterLongitude)) : undefined,
      sitePhotos: finalSitePhotos,
      completedAt: new Date(),
    },
  });

  // Sync taskImage records
  const imageRecords: any[] = [];
  if (savedBeforeUrl) {
    imageRecords.push({
      taskId: numericTaskId,
      employeeUserId: auth.userId,
      type: "before",
      url: savedBeforeUrl,
      latitude: (beforeLatitude !== undefined && beforeLatitude !== null) ? parseFloat(String(beforeLatitude)) : null,
      longitude: (beforeLongitude !== undefined && beforeLongitude !== null) ? parseFloat(String(beforeLongitude)) : null,
    });
  }
  if (savedAfterUrl) {
    imageRecords.push({
      taskId: numericTaskId,
      employeeUserId: auth.userId,
      type: "after",
      url: savedAfterUrl,
      latitude: (afterLatitude !== undefined && afterLatitude !== null) ? parseFloat(String(afterLatitude)) : null,
      longitude: (afterLongitude !== undefined && afterLongitude !== null) ? parseFloat(String(afterLongitude)) : null,
    });
  }
  if (savedInputPhotos.length > 0) {
    savedInputPhotos.forEach((photoUrl: string, idx: number) => {
      if (photoUrl) {
        imageRecords.push({
          taskId: numericTaskId,
          employeeUserId: auth.userId,
          type: `site_photo_${idx + 1}`,
          url: photoUrl,
          latitude: null,
          longitude: null,
        });
      }
    });
  }

  if (imageRecords.length > 0) {
    await prisma.taskImage.deleteMany({
      where: { taskId: numericTaskId },
    });
    await prisma.taskImage.createMany({ data: imageRecords });
  }

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
        photosCount: finalSitePhotos.length,
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
