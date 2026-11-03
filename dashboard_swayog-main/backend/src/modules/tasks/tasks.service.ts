import { TaskStatus, UserRole } from "@prisma/client";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { prisma } from "../../lib/prisma.js";
import { getMockTasks, saveMockTask } from "../../lib/mockTasksDb.js";
import type { CompleteTaskInput, CreateTaskInput, ListTasksQueryInput } from "./tasks.schemas.js";

function serializeTask(task: any) {
  return {
    id: task.id,
    jobType: task.jobType,
    description: task.description,
    customerName: task.customerName,
    customerPhone: task.customerPhone,
    address: task.address,
    latitude: task.latitude,
    longitude: task.longitude,
    status: task.status.toLowerCase(),
    scheduledTime: task.scheduledTime.toISOString(),
    employeeUserId: task.employeeUserId,
    assignedById: task.assignedById,
    completionMessage: task.completionMessage ?? null,
    completionDocumentUrl: task.completionDocumentUrl ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function listTasks(auth: AuthContext, query: ListTasksQueryInput) {
  const where: any = {};

  const isCoordinator = auth.role === UserRole.SUB_ADMIN || 
    (auth.role === UserRole.EMPLOYEE && auth.jobRole?.toLowerCase().replace(/[_\s-]+/g, "") === "servicecoordinator");

  if (auth.role === UserRole.EMPLOYEE && !isCoordinator) {
    where.employeeUserId = auth.userId;
  } else if (query.employeeUserId) {
    where.employeeUserId = query.employeeUserId;
  }

  if (query.status) {
    where.status = query.status;
  }

  try {
    // Fetch regular tasks
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
      take: query.limit,
    });

    const serializedTasks = tasks.map(serializeTask);

    // Fetch AMC visits if filtering for a specific employee
    const amcWhere: any = {};
    if (where.employeeUserId) {
      amcWhere.assignedEmployeeId = where.employeeUserId;
    }

    if (query.status) {
      amcWhere.status = query.status.toLowerCase();
    }

    const amcVisits = await prisma.amcVisit.findMany({
      where: amcWhere,
      include: {
        customer: {
          select: {
            fullName: true,
            phoneNumber: true,
            address: true,
          }
        }
      },
      orderBy: { scheduledDate: "asc" },
      take: query.limit,
    });

    const serializedAmc = amcVisits.map(visit => ({
      id: `amc_${visit.id}`,
      jobType: "AMC",
      description: "AMC Cleaning/Maintenance Visit",
      customerName: visit.customer.fullName,
      customerPhone: visit.customer.phoneNumber,
      address: visit.customer.address,
      latitude: null,
      longitude: null,
      status: visit.status.toLowerCase(),
      scheduledTime: visit.scheduledDate.toISOString(),
      employeeUserId: visit.assignedEmployeeId,
      assignedById: "system",
      completionMessage: visit.notes ?? null,
      completionDocumentUrl: null,
      completedAt: visit.completedAt?.toISOString() ?? null,
      createdAt: visit.createdAt.toISOString(),
      updatedAt: visit.updatedAt.toISOString(),
    }));

    return [...serializedTasks, ...serializedAmc].sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

  } catch (error) {
    console.warn("DB offline: Return mocked listTasks data", error);
    let all = getMockTasks();
    if (auth.role === UserRole.EMPLOYEE) {
      all = all.filter((t: any) => t.employeeUserId === auth.userId);
    } else if (query.employeeUserId) {
      all = all.filter((t: any) => t.employeeUserId === query.employeeUserId);
    }
    if (query.status) {
      all = all.filter((t: any) => String(t.status).toLowerCase() === String(query.status).toLowerCase());
    }
    return all.sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }
}

export async function createTask(auth: AuthContext, input: CreateTaskInput) {
  if (auth.role !== UserRole.SUPER_ADMIN && auth.role !== UserRole.ADMIN && auth.role !== UserRole.SUB_ADMIN) {
    throw new ApiError(403, "Only admin or service coordinator can assign tasks");
  }

  try {
    const employee = await prisma.user.findUnique({
      where: { id: input.employeeUserId },
      select: { id: true, role: true, isActive: true },
    });

    if (!employee || employee.role !== UserRole.EMPLOYEE || !employee.isActive) {
      throw new ApiError(400, "Target employee is invalid or inactive");
    }

    const task = await prisma.task.create({
      data: {
        employeeUserId: input.employeeUserId,
        assignedById: auth.userId,
        jobType: input.jobType,
        description: input.description,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        address: input.address,
        latitude: (input.latitude !== undefined && input.latitude !== null) ? parseFloat(String(input.latitude)) : null,
        longitude: (input.longitude !== undefined && input.longitude !== null) ? parseFloat(String(input.longitude)) : null,
        scheduledTime: new Date(input.scheduledTime),
        status: TaskStatus.ASSIGNED,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.userId,
        action: "TASK_ASSIGN",
        entity: "Task",
        entityId: String(task.id),
        metadata: {
          employeeUserId: task.employeeUserId,
        },
      },
    });

    return serializeTask(task);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== 500) throw error;
    console.warn("DB offline: Return mocked createTask success");
    const newTask = {
      id: Math.floor(Math.random() * 100000),
      employeeUserId: input.employeeUserId,
      assignedById: auth.userId,
      jobType: input.jobType,
      description: input.description,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      address: input.address,
      status: "assigned",
      scheduledTime: new Date(input.scheduledTime).toISOString(),
      completionMessage: null,
      completionDocumentUrl: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveMockTask(newTask);
    return newTask;
  }
}

export async function completeTask(auth: AuthContext, taskId: string, input: CompleteTaskInput) {
  try {
    // Handle AMC visits
    if (taskId.startsWith("amc_")) {
      const visitId = taskId.replace("amc_", "");
      const visit = await prisma.amcVisit.findUnique({ where: { id: visitId } });
      
      if (!visit) throw new ApiError(404, "AMC Visit not found");
      if (auth.role === UserRole.EMPLOYEE && visit.assignedEmployeeId !== auth.userId) {
        throw new ApiError(403, "You cannot complete visits assigned to other employees");
      }

      const updated = await prisma.amcVisit.update({
        where: { id: visitId },
        data: {
          status: "completed",
          notes: input.message,
          completedAt: new Date(),
        },
      });

      return {
        id: taskId,
        status: "completed",
        completedAt: updated.completedAt?.toISOString(),
      };
    }

    // Handle regular tasks
    const id = parseInt(taskId, 10);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (auth.role === UserRole.EMPLOYEE && task.employeeUserId !== auth.userId) {
      throw new ApiError(403, "You cannot complete tasks assigned to other employees");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completionMessage: input.message,
        completionDocumentUrl: input.documentUrl ?? null,
        completedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.userId,
        action: "TASK_COMPLETE",
        entity: "Task",
        entityId: String(updated.id),
        metadata: {
          status: updated.status,
        },
      },
    });

    return serializeTask(updated);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== 500) throw error;
    console.warn("DB offline: Return mocked completeTask success", error);
    const tasks = getMockTasks();
    const idx = tasks.findIndex((t: any) => String(t.id) === String(taskId));
    if (idx === -1) throw new ApiError(404, "Task not found");
    
    const t = tasks[idx];
    if (auth.role === "EMPLOYEE" && t.employeeUserId !== auth.userId) {
      throw new ApiError(403, "You cannot complete tasks assigned to other employees");
    }
    
    t.status = "completed";
    t.completionMessage = input.message;
    t.completionDocumentUrl = input.documentUrl ?? null;
    t.completedAt = new Date().toISOString();
    t.updatedAt = new Date().toISOString();
    
    saveMockTask(t);
    return t;
  }
}

/**
 * Get task statistics for multiple employees
 * Includes regular tasks and AMC visits
 */
export async function getEmployeesTaskStats(userIds: string[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await Promise.all(userIds.map(async (userId) => {
    const [activeTasks, activeAmc, completedTasks, completedAmc] = await Promise.all([
      // Active regular tasks
      prisma.task.count({
        where: {
          employeeUserId: userId,
          status: { not: "COMPLETED" }
        }
      }),
      // Active AMC visits
      prisma.amcVisit.count({
        where: {
          assignedEmployeeId: userId,
          status: { not: "completed" }
        }
      }),
      // Completed regular tasks this month
      prisma.task.count({
        where: {
          employeeUserId: userId,
          status: "COMPLETED",
          completedAt: { gte: startOfMonth }
        }
      }),
      // Completed AMC visits this month
      prisma.amcVisit.count({
        where: {
          assignedEmployeeId: userId,
          status: "completed",
          completedAt: { gte: startOfMonth }
        }
      })
    ]);

    return {
      userId,
      activeTasksCount: activeTasks + activeAmc,
      jobsCompletedThisMonth: completedTasks + completedAmc
    };
  }));

  return stats;
}
