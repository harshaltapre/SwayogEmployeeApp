import fs from "fs";
import path from "path";
import { TaskStatus, UserRole, TaskAssignmentStatus, AmcVisitStatus, InvoicePaymentStatus, InvoiceType } from "@prisma/client";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { prisma } from "../../lib/prisma.js";
import { getMockTasks, saveMockTask } from "../../lib/mockTasksDb.js";
import { recalculateMonthlyPerformance } from "../../services/attendanceService.js";
import type { CompleteTaskInput, CreateTaskInput, CreateBulkTaskInput, ListTasksQueryInput } from "./tasks.schemas.js";
import { createAdminNotification, createCustomerNotification } from "../../services/notificationService.js";

export function processAndSaveBase64Photos(sitePhotos: string[], taskId: number | string): string[] {
  if (!Array.isArray(sitePhotos)) return [];

  const uploadsDir = path.join(process.cwd(), "uploads", "task-images");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return sitePhotos.map((item, index) => {
    if (!item || typeof item !== "string") return "";
    let formattedItem = item.trim();
    if (!formattedItem) return "";

    // If it's already a saved file/web URL, return as-is
    if (formattedItem.startsWith("/uploads/") || formattedItem.startsWith("http://") || formattedItem.startsWith("https://")) {
      return formattedItem;
    }

    // Auto-prefix raw base64 if missing data URI header
    if (!formattedItem.startsWith("data:image/")) {
      if (formattedItem.startsWith("/9j/")) {
        formattedItem = `data:image/jpeg;base64,${formattedItem}`;
      } else if (formattedItem.startsWith("iVBORw")) {
        formattedItem = `data:image/png;base64,${formattedItem}`;
      } else if (formattedItem.startsWith("R0lGOD")) {
        formattedItem = `data:image/gif;base64,${formattedItem}`;
      } else if (formattedItem.startsWith("UklGR")) {
        formattedItem = `data:image/webp;base64,${formattedItem}`;
      } else {
        formattedItem = `data:image/jpeg;base64,${formattedItem}`;
      }
    }

    try {
      const matches = formattedItem.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/s);
      if (!matches || matches.length !== 3) return formattedItem;

      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const base64Data = matches[2].replace(/[\r\n\s]/g, "");
      const buffer = Buffer.from(base64Data, "base64");

      const filename = `site_photo_${taskId}_${Date.now()}_${index}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);

      return `/uploads/task-images/${filename}`;
    } catch (err) {
      console.error(`Error saving base64 photo for task ${taskId}:`, err);
      return formattedItem;
    }
  }).filter((url) => typeof url === "string" && url.trim().length > 0);
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

export function getTaskInclude() {
  return {
    employee: {
      select: { id: true, fullName: true, loginId: true, email: true },
    },
    taskAssignments: {
      include: {
        employee: {
          select: { id: true, fullName: true, loginId: true, email: true },
        },
      },
      orderBy: { assignedAt: "asc" as const },
    },
    taskImages: {
      orderBy: { uploadedAt: "asc" as const },
    },
  };
}

function getAssignedEmployeeIds(task: any): string[] {
  const ids = new Set<string>();
  if (task.employeeUserId) ids.add(String(task.employeeUserId));
  for (const assignment of task.taskAssignments ?? []) {
    if (assignment.employeeUserId) ids.add(String(assignment.employeeUserId));
  }
  return Array.from(ids);
}

function formatCurrency(value?: number | null): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

async function findCustomerForTask(task: { customerPhone?: string | null; customerName?: string | null }) {
  if (!task.customerPhone && !task.customerName) return null;

  return prisma.customer.findFirst({
    where: {
      OR: [
        ...(task.customerPhone ? [{ phoneNumber: task.customerPhone }] : []),
        ...(task.customerName ? [{ fullName: task.customerName }] : []),
      ],
    },
    select: { id: true, userId: true, fullName: true, phoneNumber: true, partnerId: true },
  });
}

async function sendUserMessage(senderId: string, receiverId: string | null | undefined, content: string) {
  if (!receiverId || receiverId === senderId) return;

  try {
    await prisma.message.create({
      data: { senderId, receiverId, content },
    });
  } catch (error) {
    console.warn("Failed to create system message:", error);
  }
}

async function notifyTaskScheduled(
  auth: AuthContext,
  task: any,
  employees: Array<{ id: string; fullName: string | null; loginId?: string | null; phoneNumber?: string | null }>,
) {
  const assigner = await prisma.user.findUnique({ where: { id: auth.userId }, select: { fullName: true } });
  const assignerName = assigner?.fullName || auth.loginId;
  const employeeNames = employees.map((employee) => employee.fullName || employee.loginId || "Employee");
  const employeeSummary = employeeNames.join(", ");
  const dateStr = new Date(task.scheduledTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  await createAdminNotification({
    type: "SERVICE_SCHEDULED",
    message: `${assignerName} scheduled "${task.jobType}" for ${task.customerName} with ${employeeSummary}`,
    employeeId: auth.userId,
  });

  await Promise.all(
    employees.map((employee) =>
      sendUserMessage(
        auth.userId,
        employee.id,
        `New task assigned: "${task.jobType}" at ${task.customerName}'s site on ${dateStr}. Site: ${task.address}.`,
      ),
    ),
  );

  const customer = await findCustomerForTask(task);
  if (!customer) return;

  const employeeDetails = employees.map((emp) => {
    const phoneInfo = emp.phoneNumber ? ` (Phone: ${emp.phoneNumber})` : " (Phone: Not Provided)";
    return `  * ${emp.fullName || emp.loginId || "Employee"}${phoneInfo}`;
  }).join("\n");

  const customerMessage = `An employee is coming to your site for the scheduled task. Details:
- Task: ${task.jobType}
- Description: ${task.description || "No description provided"}
- Scheduled Time: ${dateStr}
- Assigned Employee(s):
${employeeDetails}`;

  await createCustomerNotification({
    customerId: customer.id,
    type: "SERVICE_SCHEDULED",
    message: customerMessage,
    taskId: task.id,
  });
  await sendUserMessage(auth.userId, customer.userId, customerMessage);
}

async function notifyTaskCompleted(auth: AuthContext, task: any, imageUrl?: string | null) {
  const customer = await findCustomerForTask(task);
  const amount = task.fixCharges ?? task.taskRate ?? 0;
  const message = `The "${task.jobType}" task at your site is completed. Please review the work and pay ${formatCurrency(amount)} if charges are pending.`;

  await createAdminNotification({
    type: "SERVICE_COMPLETED",
    message: `${task.customerName}'s "${task.jobType}" task was completed.`,
    employeeId: auth.userId,
    imageUrl,
  });

  if (!customer) return;

  await createCustomerNotification({
    customerId: customer.id,
    type: "TASK_COMPLETED",
    message,
    taskId: task.id,
    imageUrl,
  });
  await sendUserMessage(auth.userId, customer.userId, message);
}

export function serializeTask(task: any) {
  const assignedEmployees = Array.isArray(task.taskAssignments)
    ? task.taskAssignments.map((assignment: any) => ({
      id: assignment.id,
      userId: assignment.employeeUserId,
      assignedAt:
        typeof assignment.assignedAt === "string" ? assignment.assignedAt : assignment.assignedAt?.toISOString?.() ?? null,
      status: assignment.status,
      name: assignment.employee?.fullName ?? "Employee",
      loginId: assignment.employee?.loginId ?? null,
      email: assignment.employee?.email ?? null,
    }))
    : [];

  if (assignedEmployees.length === 0 && task.employeeUserId) {
    assignedEmployees.push({
      id: `legacy-${task.id}-${task.employeeUserId}`,
      userId: task.employeeUserId,
      assignedAt: typeof task.createdAt === "string" ? task.createdAt : task.createdAt?.toISOString?.() ?? null,
      status: String(task.status ?? "ASSIGNED").toLowerCase(),
      name: task.employee?.fullName ?? "Employee",
      loginId: task.employee?.loginId ?? null,
      email: task.employee?.email ?? null,
    });
  }

  const taskImages = Array.isArray(task.taskImages)
    ? task.taskImages.map((image: any) => ({
      id: image.id,
      employeeUserId: image.employeeUserId,
      type: image.type,
      url: image.url,
      latitude: image.latitude ?? null,
      longitude: image.longitude ?? null,
      watermarkText: image.watermarkText ?? null,
      uploadedAt: typeof image.uploadedAt === "string" ? image.uploadedAt : image.uploadedAt?.toISOString?.() ?? null,
    }))
    : [];

  const beforeImageObj = taskImages.find((img: any) => img.type === "before" || img.type === "Before");
  const afterImageObj = taskImages.find((img: any) => img.type === "after" || img.type === "After");
  const sitePhotosFromColumn = Array.isArray(task.sitePhotos) ? task.sitePhotos : [];
  const sitePhotosFromImages = taskImages
    .filter((img: any) => img.type === "site_photo" || String(img.type).startsWith("site_photo"))
    .map((img: any) => img.url);

  // Merge and filter out any empty strings
  const mergedSitePhotos = Array.from(new Set([...sitePhotosFromColumn, ...sitePhotosFromImages]))
    .filter((url: any) => typeof url === "string" && url.trim().length > 0);

  const resolvedTaskType = task.taskType ?? (
    task.jobType?.toLowerCase()?.includes("site") || mergedSitePhotos.length > 0 ? "SITE_VISIT" : "REGULAR"
  );

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
    scheduledTime: typeof task.scheduledTime === "string" ? task.scheduledTime : task.scheduledTime.toISOString(),
    employeeUserId: task.employeeUserId,
    assignedById: task.assignedById,
    completionMessage: task.completionMessage ?? null,
    completionDocumentUrl: task.completionDocumentUrl ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    taskType: resolvedTaskType,
    assignedEmployees,
    taskImages,
    sitePhotos: mergedSitePhotos,
    images: mergedSitePhotos,
    beforeImageUrl: beforeImageObj?.url ?? task.beforeImageUrl ?? null,
    beforeLatitude: beforeImageObj?.latitude ?? task.beforeLatitude ?? null,
    beforeLongitude: beforeImageObj?.longitude ?? task.beforeLongitude ?? null,
    afterImageUrl: afterImageObj?.url ?? task.afterImageUrl ?? null,
    afterLatitude: afterImageObj?.latitude ?? task.afterLatitude ?? null,
    afterLongitude: afterImageObj?.longitude ?? task.afterLongitude ?? null,
  };
}

export async function listTasks(auth: AuthContext, query: ListTasksQueryInput) {
  const where: any = {};
  let employeeScopeId: string | null = null;

  const isCoordinator = isServiceCoordinator(auth);

  const isHierarchicalRole = auth.role === UserRole.EMPLOYEE ||
    auth.role === UserRole.TEAM_LEAD ||
    auth.role === UserRole.DEPARTMENT_HEAD;

  if (auth.role === UserRole.CUSTOMER) {
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });
    if (customer) {
      where.customerId = customer.id;
    } else {
      where.customerId = -1; // Prevent leakage if profile is missing
    }
  } else if (isHierarchicalRole && !isCoordinator) {
    // Employee/TeamLead/DeptHead always scopes to self (or requested subordinate)
    let targetEmpId: string;
    if (query.employeeUserId) {
      const reporteeIds = await getRecursiveReporteeIds(auth.userId);
      targetEmpId = reporteeIds.includes(String(query.employeeUserId))
        ? String(query.employeeUserId)
        : auth.userId;
    } else {
      targetEmpId = auth.userId;
    }
    employeeScopeId = targetEmpId;
    where.OR = [
      { employeeUserId: targetEmpId },
      { taskAssignments: { some: { employeeUserId: targetEmpId } } },
      { assignedById: auth.userId }
    ];
  } else if (query.employeeUserId) {
    const targetEmpId = String(query.employeeUserId);
    employeeScopeId = targetEmpId;
    where.OR = [
      { employeeUserId: targetEmpId },
      { taskAssignments: { some: { employeeUserId: targetEmpId } } }
    ];
  }

  if (query.status) {
    const statusUpper = String(query.status).toUpperCase();
    if (Object.values(TaskStatus).includes(statusUpper as any)) {
      where.status = statusUpper as TaskStatus;
    } else if (statusUpper === "PENDING") {
      where.status = TaskStatus.ASSIGNED;
    }
  }

  try {
    // Fetch regular tasks
    const tasks: any = await prisma.task.findMany({
      where,
      include: getTaskInclude(),
      orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
      take: query.limit,
    });

    const serializedTasks = tasks.map(serializeTask);

    // Fetch AMC visits if filtering for a specific employee, or scope to customer
    const amcWhere: any = {};
    if (auth.role === UserRole.CUSTOMER) {
      const customer = await prisma.customer.findUnique({
        where: { userId: auth.userId },
        select: { id: true },
      });
      if (customer) {
        amcWhere.customerId = customer.id;
      } else {
        amcWhere.customerId = -1;
      }
    } else if (employeeScopeId) {
      amcWhere.assignedEmployeeId = employeeScopeId;
    } else if (where.employeeUserId) {
      amcWhere.assignedEmployeeId = where.employeeUserId;
    }

    if (query.status) {
      const statusUpper = String(query.status).toUpperCase();
      if (statusUpper === "ASSIGNED" || statusUpper === "PENDING" || statusUpper === "IN_PROGRESS") {
        amcWhere.status = AmcVisitStatus.PENDING;
      } else if (statusUpper === "COMPLETED") {
        amcWhere.status = AmcVisitStatus.COMPLETED;
      } else if (statusUpper === "CANCELLED") {
        amcWhere.status = AmcVisitStatus.CANCELLED;
      } else if (Object.values(AmcVisitStatus).includes(statusUpper as any)) {
        amcWhere.status = statusUpper as AmcVisitStatus;
      }
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

    const serializedAmc = amcVisits.map(visit => {
      const visitSitePhotos = Array.isArray((visit as any).sitePhotos) ? (visit as any).sitePhotos : [];
      return {
        id: `amc_${visit.id}`,
        jobType: "AMC",
        description: visit.visitNotes ?? visit.notes ?? "AMC Cleaning/Maintenance Visit",
        customerName: visit.customer.fullName,
        customerPhone: visit.customer.phoneNumber,
        address: visit.customer.address,
        latitude: null,
        longitude: null,
        status: visit.status.toLowerCase(),
        scheduledTime: visit.scheduledDate.toISOString(),
        employeeUserId: visit.assignedEmployeeId,
        assignedById: "system",
        completionMessage: visit.visitNotes ?? visit.notes ?? null,
        completionDocumentUrl: null,
        beforeImageUrl: (visit as any).beforeImageUrl ?? null,
        afterImageUrl: (visit as any).afterImageUrl ?? null,
        sitePhotos: visitSitePhotos,
        images: visitSitePhotos,
        completedAt: visit.completedAt?.toISOString() ?? null,
        createdAt: visit.createdAt.toISOString(),
        updatedAt: visit.updatedAt.toISOString(),
      };
    });

    return [...serializedTasks, ...serializedAmc].sort((a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

  } catch (error) {
    console.warn("DB offline: Return mocked listTasks data", error);
    let all = getMockTasks();
    if (auth.role === UserRole.CUSTOMER) {
      all = all.filter((t: any) => t.customerName === auth.loginId || t.customerPhone === auth.loginId);
    } else if (auth.role === UserRole.EMPLOYEE) {
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

async function getValidAssignedById(authUserId: string): Promise<string> {
  const actor = await prisma.user.findFirst({
    where: {
      OR: [
        { id: authUserId },
        { loginId: authUserId },
        { email: authUserId },
      ],
    },
    select: { id: true },
  });

  if (actor) {
    return actor.id;
  }

  const adminUser = await prisma.user.findFirst({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN] },
      isActive: true,
    },
    select: { id: true },
  });

  if (adminUser) {
    return adminUser.id;
  }

  const anyUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return anyUser?.id || authUserId;
}

export async function createTask(auth: AuthContext, input: CreateTaskInput) {
  let isAllowed =
    auth.role === UserRole.SUPER_ADMIN ||
    auth.role === UserRole.ADMIN ||
    auth.role === UserRole.SUB_ADMIN ||
    auth.role === UserRole.DEPARTMENT_HEAD ||
    auth.role === UserRole.TEAM_LEAD ||
    auth.role === UserRole.EMPLOYEE ||
    isServiceCoordinator(auth);

  if (!isAllowed) {
    const reporteeIds = await getRecursiveReporteeIds(auth.userId);
    if (reporteeIds.includes(input.employeeUserId)) {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
    throw new ApiError(403, "Only admin, service coordinator, or staff members can assign tasks");
  }

  try {
    let employee = await prisma.user.findFirst({
      where: {
        OR: [
          { id: input.employeeUserId },
          { loginId: input.employeeUserId },
          { employeeCode: input.employeeUserId },
          { email: input.employeeUserId },
          { fullName: { contains: input.employeeUserId, mode: "insensitive" } },
          { employeeProfile: { id: input.employeeUserId } },
        ]
      },
      select: { id: true, role: true, isActive: true },
    });

    if (!employee) {
      employee = await prisma.user.findFirst({
        where: {
          role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN, UserRole.TEAM_LEAD, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
          isActive: true,
        },
        select: { id: true, role: true, isActive: true },
      });
    }

    if (!employee) {
      throw new ApiError(400, "Target employee is invalid or inactive");
    }

    const actualEmployeeUserId = employee.id;
    const actualAssignedById = await getValidAssignedById(auth.userId);

    const task: any = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          employeeUserId: actualEmployeeUserId,
          assignedById: actualAssignedById,
          jobType: input.jobType,
          description: input.description,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          address: input.address,
          latitude: (input.latitude !== undefined && input.latitude !== null) ? parseFloat(String(input.latitude)) : null,
          longitude: (input.longitude !== undefined && input.longitude !== null) ? parseFloat(String(input.longitude)) : null,
          scheduledTime: new Date(input.scheduledTime),
          status: TaskStatus.ASSIGNED,
          taskAssignments: {
            create: {
              employeeUserId: actualEmployeeUserId,
              status: TaskAssignmentStatus.ASSIGNED,
            },
          },
        },
        include: getTaskInclude(),
      });

      await tx.auditLog.create({
        data: {
          actorId: actualAssignedById,
          action: "TASK_ASSIGN",
          entity: "Task",
          entityId: String(createdTask.id),
          metadata: {
            employeeUserId: createdTask.employeeUserId,
          },
        },
      }).catch(() => { });

      return createdTask;
    });

    return serializeTask(task);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== 500) throw error;
    console.error("DB error in createTask:", error);
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
      taskRate: input.taskRate !== undefined ? input.taskRate : null,
    };
    saveMockTask(newTask);
    return newTask;
  }
}

export async function createBulkTasks(auth: AuthContext, input: CreateBulkTaskInput) {
  let isAllowed =
    auth.role === UserRole.SUPER_ADMIN ||
    auth.role === UserRole.ADMIN ||
    auth.role === UserRole.SUB_ADMIN ||
    isServiceCoordinator(auth);

  if (!isAllowed) {
    const reporteeIds = await getRecursiveReporteeIds(auth.userId);
    if (input.employeeUserIds.every((id) => reporteeIds.includes(id))) {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
    throw new ApiError(403, "Only admin, service coordinator, or the reporting manager can assign tasks");
  }

  try {
    const employees = await prisma.user.findMany({
      where: { id: { in: input.employeeUserIds } },
      select: { id: true, role: true, isActive: true, fullName: true, loginId: true, phoneNumber: true },
    });

    const allowedRoles: UserRole[] = [UserRole.EMPLOYEE, UserRole.TEAM_LEAD, UserRole.DEPARTMENT_HEAD];
    const foundIds = new Set(employees.map((employee) => employee.id));
    const missingIds = input.employeeUserIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new ApiError(400, `Selected employee(s) were not found: ${missingIds.join(", ")}`);
    }

    for (const employee of employees) {
      if (!allowedRoles.includes(employee.role) || !employee.isActive) {
        throw new ApiError(400, `Target employee ${employee.fullName} is invalid or inactive`);
      }
    }

    const primaryEmployeeId = input.employeeUserIds[0] ?? null;
    const actualAssignedById = await getValidAssignedById(auth.userId);

    const task: any = await prisma.task.create({
      data: {
        employeeUserId: primaryEmployeeId,
        assignedById: actualAssignedById,
        jobType: input.jobType,
        description: input.description,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        address: input.address,
        latitude: (input.latitude !== undefined && input.latitude !== null) ? parseFloat(String(input.latitude)) : null,
        longitude: (input.longitude !== undefined && input.longitude !== null) ? parseFloat(String(input.longitude)) : null,
        scheduledTime: new Date(input.scheduledTime),
        status: TaskStatus.ASSIGNED,
        taskAssignments: {
          create: input.employeeUserIds.map((employeeUserId) => ({
            employeeUserId,
            status: TaskAssignmentStatus.ASSIGNED,
          })),
        },
      } as any,
      include: getTaskInclude(),
    });

    await prisma.auditLog.create({
      data: {
        actorId: actualAssignedById,
        action: "TASK_ASSIGN_BULK",
        entity: "Task",
        entityId: String(task.id),
        metadata: {
          employeeUserIds: input.employeeUserIds,
          employeeCount: input.employeeUserIds.length,
          taskRate: input.taskRate ?? null,
        },
      },
    }).catch(() => { });

    await notifyTaskScheduled(auth, task, employees);

    return [serializeTask(task)];
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== 500) throw error;
    console.warn("DB offline: Return mocked createBulkTasks success", error);
    const newTask = {
      id: Math.floor(Math.random() * 100000),
      employeeUserId: null,
      assignedById: auth.userId,
      jobType: input.jobType,
      description: input.description,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      status: TaskStatus.ASSIGNED,
      scheduledTime: new Date(input.scheduledTime).toISOString(),
      taskRate: input.taskRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedEmployees: input.employeeUserIds.map((employeeUserId) => ({ userId: employeeUserId })),
      employeeUserIds: input.employeeUserIds,
      employeeCount: input.employeeUserIds.length,
    };
    return [newTask];
  }
}




export async function completeTask(auth: AuthContext, taskId: string, input: CompleteTaskInput) {
  try {
    // Handle AMC visits
    const cleanAmcId = taskId.replace(/^TASK-amc_|^amc_visit_|^amc_/, "");
    if (taskId.includes("amc_") || taskId.includes("AMC")) {
      const visit = await prisma.amcVisit.findUnique({ where: { id: cleanAmcId } }).catch(() => null);
      if (!visit) {
        throw new ApiError(404, "AMC Visit not found — please refresh and try again");
      }
      if (auth.role === UserRole.EMPLOYEE && visit.assignedEmployeeId !== auth.userId) {
        throw new ApiError(403, "You cannot complete visits assigned to other employees");
      }

      let completedByName = "Employee";
      const emp = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { fullName: true }
      });
      if (emp?.fullName) {
        completedByName = emp.fullName;
      }

      const existingSitePhotos = Array.isArray((visit as any).sitePhotos) ? (visit as any).sitePhotos : [];
      const inputPhotos = (Array.isArray(input.sitePhotos) && input.sitePhotos.length > 0)
        ? input.sitePhotos
        : (Array.isArray((input as any).images) && (input as any).images.length > 0
          ? (input as any).images
          : []);
      const savedInputPhotos = processAndSaveBase64Photos(inputPhotos, cleanAmcId);
      const finalSitePhotos = savedInputPhotos.length > 0
        ? Array.from(new Set([...existingSitePhotos, ...savedInputPhotos]))
        : existingSitePhotos;

      let savedBeforeUrl = (visit as any).beforeImageUrl || null;
      if (input.beforeImageUrl) {
        const saved = processAndSaveBase64Photos([input.beforeImageUrl], cleanAmcId);
        savedBeforeUrl = saved[0] || input.beforeImageUrl;
      }

      let savedAfterUrl = (visit as any).afterImageUrl || null;
      if (input.afterImageUrl) {
        const saved = processAndSaveBase64Photos([input.afterImageUrl], cleanAmcId);
        savedAfterUrl = saved[0] || input.afterImageUrl;
      }

      // Mandatory Photo Validation for AMC Visits
      const hasAmcPhotos = finalSitePhotos.length > 0 || (savedBeforeUrl && savedAfterUrl);
      if (!hasAmcPhotos) {
        throw new ApiError(400, "Please upload all required photos before submitting this task.");
      }

      const updated = await prisma.amcVisit.update({
        where: { id: cleanAmcId },
        data: {
          status: AmcVisitStatus.COMPLETED,
          notes: input.message || null,
          visitNotes: input.message || null,
          completedAt: new Date(),
          completedByEmployeeId: auth.userId,
          completedByName: completedByName,
          beforeImageUrl: savedBeforeUrl,
          afterImageUrl: savedAfterUrl,
          sitePhotos: finalSitePhotos,
        },
      });

      return {
        id: taskId,
        jobType: "AMC",
        status: "completed",
        completedAt: updated.completedAt?.toISOString(),
        beforeImageUrl: (updated as any).beforeImageUrl ?? null,
        afterImageUrl: (updated as any).afterImageUrl ?? null,
        sitePhotos: (updated as any).sitePhotos ?? [],
        images: (updated as any).sitePhotos ?? [],
        completionMessage: updated.visitNotes ?? updated.notes ?? null,
      };
    }

    // Handle regular tasks
    const numericId = parseInt(taskId, 10);
    const id = !isNaN(numericId) ? numericId : -1;
    let task: any = id > 0 ? await prisma.task.findUnique({ where: { id } }).catch(() => null) : null;

    if (!task) {
      // Fallback: check if task exists in mock database or first available task for employee
      const tasks = getMockTasks();
      const mockTask = tasks.find((t: any) => String(t.id) === String(taskId) || String(t.id) === String(id));
      if (mockTask) {
        task = mockTask;
      } else {
        throw new ApiError(404, "Task not found — please refresh and try again");
      }
    }


    if (auth.role === UserRole.EMPLOYEE && task.employeeUserId !== auth.userId) {
      throw new ApiError(403, "You cannot complete tasks assigned to other employees");
    }

    // Process site photos (base64 -> disk file URLs)
    const existingSitePhotos = Array.isArray(task.sitePhotos) ? task.sitePhotos : [];
    const inputPhotos = (Array.isArray(input.sitePhotos) && input.sitePhotos.length > 0)
      ? input.sitePhotos
      : (Array.isArray((input as any).images) && (input as any).images.length > 0
        ? (input as any).images
        : []);
    const savedInputPhotos = processAndSaveBase64Photos(inputPhotos, id);
    const finalSitePhotos = savedInputPhotos.length > 0
      ? Array.from(new Set([...existingSitePhotos, ...savedInputPhotos]))
      : existingSitePhotos;

    // Process before/after images if passed as base64
    let savedBeforeUrl = task.beforeImageUrl;
    if (input.beforeImageUrl) {
      const saved = processAndSaveBase64Photos([input.beforeImageUrl], id);
      savedBeforeUrl = saved[0] || input.beforeImageUrl;
    }

    let savedAfterUrl = task.afterImageUrl;
    if (input.afterImageUrl) {
      const saved = processAndSaveBase64Photos([input.afterImageUrl], id);
      savedAfterUrl = saved[0] || input.afterImageUrl;
    }

    // Mandatory Photo Validation for regular tasks requiring photos
    const isSiteVisit = task.jobType === "Site Visit" || task.jobType?.toLowerCase().includes("site") || task.jobType?.toLowerCase().includes("visit");
    const requiresPhotos = isSiteVisit || ["Cleaning", "Maintenance", "Service", "Survey", "Installation"].includes(task.jobType);

    if (requiresPhotos) {
      if (isSiteVisit && finalSitePhotos.length < 1 && (!savedBeforeUrl || !savedAfterUrl)) {
        throw new ApiError(400, "Please upload all required photos before submitting this task.");
      }
      if (!isSiteVisit && (!savedBeforeUrl || !savedAfterUrl) && finalSitePhotos.length < 1) {
        throw new ApiError(400, "Please upload all required photos before submitting this task.");
      }
    }

    let updated: any;
    if (id > 0) {
      try {
        updated = await prisma.task.update({
          where: { id },
          data: {
            status: TaskStatus.COMPLETED,
            completionMessage: input.message,
            completionDocumentUrl: input.documentUrl ?? null,
            beforeImageUrl: savedBeforeUrl,
            afterImageUrl: savedAfterUrl,
            beforeLatitude: (input.beforeLatitude !== undefined && input.beforeLatitude !== null) ? parseFloat(String(input.beforeLatitude)) : undefined,
            beforeLongitude: (input.beforeLongitude !== undefined && input.beforeLongitude !== null) ? parseFloat(String(input.beforeLongitude)) : undefined,
            afterLatitude: (input.afterLatitude !== undefined && input.afterLatitude !== null) ? parseFloat(String(input.afterLatitude)) : undefined,
            afterLongitude: (input.afterLongitude !== undefined && input.afterLongitude !== null) ? parseFloat(String(input.afterLongitude)) : undefined,
            sitePhotos: finalSitePhotos,
            completedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn(`Could not update task ${id} in Prisma database, using in-memory task:`, err);
        updated = {
          ...task,
          status: "COMPLETED",
          completionMessage: input.message,
          beforeImageUrl: savedBeforeUrl,
          afterImageUrl: savedAfterUrl,
          sitePhotos: finalSitePhotos,
          completedAt: new Date(),
        };
      }
    } else {
      updated = {
        ...task,
        status: "COMPLETED",
        completionMessage: input.message,
        beforeImageUrl: savedBeforeUrl,
        afterImageUrl: savedAfterUrl,
        sitePhotos: finalSitePhotos,
        completedAt: new Date(),
      };
    }

    await prisma.taskAssignment.updateMany({
      where: { taskId: id },
      data: { status: TaskAssignmentStatus.COMPLETED },
    });

    // Build taskImage records with clean disk file URLs (NOT raw base64)
    const imageRecords: any[] = [];
    if (savedBeforeUrl) {
      imageRecords.push({
        taskId: id,
        employeeUserId: auth.userId,
        type: "before",
        url: savedBeforeUrl,
        latitude: (input.beforeLatitude !== undefined && input.beforeLatitude !== null) ? parseFloat(String(input.beforeLatitude)) : null,
        longitude: (input.beforeLongitude !== undefined && input.beforeLongitude !== null) ? parseFloat(String(input.beforeLongitude)) : null,
      });
    }
    if (savedAfterUrl) {
      imageRecords.push({
        taskId: id,
        employeeUserId: auth.userId,
        type: "after",
        url: savedAfterUrl,
        latitude: (input.afterLatitude !== undefined && input.afterLatitude !== null) ? parseFloat(String(input.afterLatitude)) : null,
        longitude: (input.afterLongitude !== undefined && input.afterLongitude !== null) ? parseFloat(String(input.afterLongitude)) : null,
      });
    }

    if (savedInputPhotos.length > 0) {
      savedInputPhotos.forEach((photoUrl: string, idx: number) => {
        if (photoUrl) {
          imageRecords.push({
            taskId: id,
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
        where: { taskId: id },
      });
      await prisma.taskImage.createMany({ data: imageRecords });
    }
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

    const fullTask = await prisma.task.findUnique({
      where: { id },
      include: getTaskInclude(),
    });
    return serializeTask(fullTask || updated);
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
    t.beforeImageUrl = input.beforeImageUrl ?? null;
    t.afterImageUrl = input.afterImageUrl ?? null;
    t.beforeLatitude = input.beforeLatitude ?? null;
    t.beforeLongitude = input.beforeLongitude ?? null;
    t.afterLatitude = input.afterLatitude ?? null;
    t.afterLongitude = input.afterLongitude ?? null;
    t.sitePhotos = input.sitePhotos || (input as any).images || undefined;
    t.images = t.sitePhotos;
    saveMockTask(t);
    return serializeTask(t);
  }
}

export async function rateTask(auth: AuthContext, taskId: string, input: any) {
  let isAllowed = auth.role === UserRole.SUPER_ADMIN ||
    auth.role === UserRole.ADMIN ||
    auth.role === UserRole.SUB_ADMIN ||
    auth.role === UserRole.CUSTOMER;

  if (!isAllowed) {
    throw new ApiError(403, "Only admin, coordinator, or customer can review this task");
  }

  try {
    const id = parseInt(taskId, 10);
    const task: any = await prisma.task.findUnique({ where: { id }, include: getTaskInclude() }) as any;
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    let customer: any = null;
    if (auth.role === UserRole.CUSTOMER) {
      customer = await prisma.customer.findUnique({
        where: { userId: auth.userId },
      });

      const matchesTask =
        customer &&
        (customer.phoneNumber === task.customerPhone ||
          customer.fullName.toLowerCase() === String(task.customerName).toLowerCase());

      if (!matchesTask) {
        throw new ApiError(403, "You cannot review tasks for another customer");
      }
    }

    const updated: any = await prisma.task.update({
      where: { id },
      data: {
        customerRating: input.customerRating,
        customerFeedback: input.customerFeedback ?? null,
        fixCharges: input.fixCharges !== undefined ? parseFloat(String(input.fixCharges)) : null,
      },
      include: getTaskInclude(),
    });

    // Record payment/invoice in the database finance section
    try {
      if (!customer) {
        customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { phoneNumber: updated.customerPhone },
              { fullName: updated.customerName },
            ],
          },
        });
      }

      if (customer && updated.fixCharges && updated.fixCharges > 0) {
        const amt = updated.fixCharges;
        const desc = `Payment of ₹${amt} received for Task ID: ${updated.id} (${updated.jobType}). Issue: ${updated.description}. Customer: ${updated.customerName} (${updated.customerPhone}). Completed on: ${updated.completedAt ? updated.completedAt.toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}.`;

        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            customerId: customer.id,
            invoiceType: InvoiceType.SERVICE,
            description: { contains: `Task ID: ${updated.id}` },
          },
          select: { id: true },
        });

        if (existingInvoice) {
          await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              amount: amt,
              amountPaid: amt,
              paymentStatus: InvoicePaymentStatus.PAID,
              paymentDate: new Date(),
              description: desc,
              paymentMethod: "customer_confirmed",
            },
          });
        } else {
          await prisma.invoice.create({
            data: {
              customerId: customer.id,
              invoiceType: InvoiceType.SERVICE,
              amount: amt,
              amountPaid: amt,
              paymentStatus: InvoicePaymentStatus.PAID,
              paymentDate: new Date(),
              invoiceDate: new Date(),
              description: desc,
              paymentMethod: "customer_confirmed",
              partnerId: customer.partnerId,
            },
          });
        }
      }

      if (customer) {
        await createCustomerNotification({
          customerId: customer.id,
          type: "TASK_REVIEW_RECORDED",
          message: `Your review for "${updated.jobType}" was recorded with ${updated.customerRating}/5 rating and ${formatCurrency(updated.fixCharges ?? 0)} charges.`,
          taskId: updated.id,
        });
      }
    } catch (e) {
      console.warn("Failed to create invoice/payment record for task review:", e);
    }

    return serializeTask(updated);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== 500) throw error;
    console.warn("DB offline: Return mocked rateTask success", error);
    const tasks = getMockTasks();
    const idx = tasks.findIndex((t: any) => String(t.id) === String(taskId));
    if (idx === -1) throw new ApiError(404, "Task not found");
    const t = tasks[idx];
    t.customerRating = input.customerRating;
    t.customerFeedback = input.customerFeedback ?? null;
    t.fixCharges = input.fixCharges !== undefined ? parseFloat(String(input.fixCharges)) : null;
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

  if (userIds.length === 0) {
    return [];
  }

  // 1. Fetch tasks matching userIds
  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        {
          OR: [
            { employeeUserId: { in: userIds } },
            { taskAssignments: { some: { employeeUserId: { in: userIds } } } }
          ]
        },
        {
          OR: [
            { status: { not: "COMPLETED" } },
            {
              status: "COMPLETED",
              completedAt: { gte: startOfMonth }
            }
          ]
        }
      ]
    },
    select: {
      employeeUserId: true,
      status: true,
      completedAt: true,
      taskAssignments: {
        select: {
          employeeUserId: true
        }
      }
    }
  });

  // 2. Fetch AMC visits matching userIds
  const amcVisits = await prisma.amcVisit.findMany({
    where: {
      assignedEmployeeId: { in: userIds },
      OR: [
        { status: { not: AmcVisitStatus.COMPLETED } },
        {
          status: AmcVisitStatus.COMPLETED,
          completedAt: { gte: startOfMonth }
        }
      ]
    },
    select: {
      assignedEmployeeId: true,
      status: true,
      completedAt: true
    }
  });

  // 3. Compute stats in-memory
  const stats = userIds.map((userId) => {
    // Tasks stats
    let activeTasks = 0;
    let completedTasks = 0;

    for (const task of tasks) {
      const isAssigned = task.employeeUserId === userId ||
        task.taskAssignments.some(ta => ta.employeeUserId === userId);

      if (isAssigned) {
        if (task.status !== "COMPLETED") {
          activeTasks++;
        } else if (task.completedAt && task.completedAt >= startOfMonth) {
          completedTasks++;
        }
      }
    }

    // AMC stats
    let activeAmc = 0;
    let completedAmc = 0;

    for (const amc of amcVisits) {
      if (amc.assignedEmployeeId === userId) {
        if (amc.status !== AmcVisitStatus.COMPLETED) {
          activeAmc++;
        } else if (amc.completedAt && amc.completedAt >= startOfMonth) {
          completedAmc++;
        }
      }
    }

    return {
      userId,
      activeTasksCount: activeTasks + activeAmc,
      jobsCompletedThisMonth: completedTasks + completedAmc
    };
  });

  return stats;
}

export async function deleteTask(auth: AuthContext, id: number | string) {
  const numericId = typeof id === "number" ? id : parseInt(String(id), 10);
  try {
    if (!isNaN(numericId)) {
      await prisma.workSubmission.deleteMany({
        where: { taskId: numericId },
      });

      const deleted = await prisma.task.delete({
        where: { id: numericId },
      });
      return { success: true, message: `Task #${numericId} deleted successfully`, task: deleted };
    } else {
      throw new ApiError(400, "Invalid task ID");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`Error deleting task ${id}:`, error);
    throw new ApiError(404, `Task #${id} not found or could not be deleted`);
  }
}

export async function updateTaskPhotos(auth: AuthContext, id: number | string, sitePhotos: string[]) {
  const numericId = typeof id === "number" ? id : parseInt(String(id), 10);
  try {
    if (isNaN(numericId)) throw new ApiError(400, "Invalid task ID");

    const savedPhotos = processAndSaveBase64Photos(sitePhotos, numericId);

    // Sync taskImage records with clean disk file URLs
    await prisma.taskImage.deleteMany({
      where: { taskId: numericId, type: { startsWith: "site_photo" } },
    });

    if (savedPhotos.length > 0) {
      const imageRecords = savedPhotos.map((photoUrl, idx) => ({
        taskId: numericId,
        employeeUserId: auth.userId,
        type: `site_photo_${idx + 1}`,
        url: photoUrl,
        latitude: null,
        longitude: null,
      }));
      await prisma.taskImage.createMany({ data: imageRecords });
    }

    const updated = await prisma.task.update({
      where: { id: numericId },
      data: {
        sitePhotos: savedPhotos,
      },
      include: getTaskInclude(),
    });
    return serializeTask(updated);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`Error updating photos for task ${id}:`, error);
    throw new ApiError(404, `Task #${id} not found or could not update photos`);
  }
}

