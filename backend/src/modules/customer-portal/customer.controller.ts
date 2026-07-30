import type { Request, Response } from "express";

import { prisma } from "../../lib/prisma.js";
import { ServiceRequestStatus, AmcVisitStatus } from "@prisma/client";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import { createAdminNotification } from "../../services/notificationService.js";
import { getCustomerNotifications, markNotificationAsRead, getUnreadNotificationCount } from "../../services/customerNotificationService.js";

/**
 * Get customer profile information
 * Customer can only view their own profile
 */
export async function getCustomerProfile(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
    select: {
      id: true,
      customerCode: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      city: true,
      address: true,
      systemSizeKw: true,
      installationDate: true,
      warrantyExpiry: true,
      panelBrand: true,
      inverterBrand: true,
      amcStatus: true,
      amcExpiryDate: true,
      status: true,
      projectStage: true,
      cleaningsPerMonth: true,
      clientType: true,
      consumerNumber: true,
      monthlyCleaningRate: true,
    },
  });

  if (customer) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const completedVisits = await prisma.amcVisit.count({
      where: {
        customerId: customer.id,
        status: AmcVisitStatus.COMPLETED,
        scheduledDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const limit = customer.cleaningsPerMonth || 2;
    const pendingVisits = Math.max(0, limit - completedVisits);

    res.status(200).json({
      data: {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phoneNumber,
        city: customer.city,
        address: customer.address,
        systemSizeKw: customer.systemSizeKw,
        installationDate: customer.installationDate.toISOString(),
        warrantyExpiry: customer.warrantyExpiry?.toISOString() ?? null,
        panelBrand: customer.panelBrand,
        inverterBrand: customer.inverterBrand,
        amcStatus: customer.amcStatus.toLowerCase(),
        amcExpiryDate: customer.amcExpiryDate?.toISOString() ?? null,
        status: customer.status.toLowerCase(),
        projectStage: customer.projectStage,
        cleaningsPerMonth: customer.cleaningsPerMonth,
        completedVisits,
        pendingVisits,
        clientType: customer.clientType,
        consumerNumber: customer.consumerNumber,
        monthlyCleaningRate: customer.monthlyCleaningRate,
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      loginId: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "Customer profile not found");
  }

  res.status(200).json({ data: user });
}

/**
 * Get customer statistics
 * Shows their service history and account metrics
 */
export async function getCustomerStats(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (!customer) {
    throw new ApiError(404, "Customer profile not found");
  }

  const [totalRequests, completedServices, pendingRequests] = await Promise.all([
    prisma.serviceRequest.count({ where: { customerId: customer.id } }),
    prisma.serviceRequest.count({ where: { customerId: customer.id, status: ServiceRequestStatus.COMPLETED } }),
    prisma.serviceRequest.count({ where: { customerId: customer.id, status: { in: [ServiceRequestStatus.PENDING, ServiceRequestStatus.SCHEDULED] } } }),
  ]);

  res.status(200).json({
    data: {
      summary: {
        totalRequests,
        completedServices,
        pendingRequests,
      },
      accountStatus: customer.status,
      memberSince: customer.createdAt.toISOString(),
    },
  });
}

/**
 * Submit a new service request
 * Customer can create requests for services
 */
export async function submitServiceRequest(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  console.log("Submit Service Request Body:", JSON.stringify(req.body, null, 2));
  const { serviceType, description, address, latitude, longitude, preferredDate } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  // Validate input
  if (!serviceType || !description || !address) {
    throw new ApiError(400, "Service type, description, and address are required");
  }

  // Get the customer record
  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (!customer) {
    throw new ApiError(404, "Customer profile not found");
  }

  // Create service request
  try {
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: customer.id,
        title: serviceType,
        description,
        address,
        latitude: (latitude !== undefined && latitude !== null && !isNaN(parseFloat(latitude))) ? parseFloat(latitude) : null,
        longitude: (longitude !== undefined && longitude !== null && !isNaN(parseFloat(longitude))) ? parseFloat(longitude) : null,
        status: ServiceRequestStatus.PENDING,
        scheduledDate: preferredDate ? new Date(preferredDate).toISOString().split("T")[0] : null,
        scheduledTime: null,
      },
    });

    await createAdminNotification({
      type: "SERVICE_REQUEST",
      message: `Customer ${customer.fullName} submitted service request: "${serviceRequest.title}"`,
      employeeId: auth.userId,
    });

    res.status(201).json({
      data: {
        id: serviceRequest.id,
        customerId: serviceRequest.customerId,
        title: serviceRequest.title,
        description: serviceRequest.description,
        status: serviceRequest.status.toLowerCase(),
        scheduledDate: serviceRequest.scheduledDate,
        createdAt: serviceRequest.createdAt.toISOString(),
      },
      message: "Service request submitted successfully",
    });
  } catch (err: any) {
    console.error("Error creating service request:", err);
    throw new ApiError(500, `Failed to create service request: ${err.message}`);
  }
}

/**
 * Get all service requests submitted by this customer
 * Customer can only view their own requests
 */
export async function getMyServiceRequests(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { status, limit = "50", offset = "0" } = req.query;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  // Get the customer record
  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (!customer) {
    throw new ApiError(404, "Customer profile not found");
  }

  const take = Math.min(parseInt(limit as string) || 50, 100);
  const skip = parseInt(offset as string) || 0;

  const where: any = { customerId: customer.id };
  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  // Fetch tasks assigned for this customer to get assigned employee details
  const assignedTasks = await prisma.task.findMany({
    where: { customerId: customer.id },
    select: {
      id: true,
      status: true,
      scheduledTime: true,
      employee: {
        select: {
          fullName: true,
          phoneNumber: true,
        },
      },
      taskAssignments: {
        select: {
          employee: {
            select: {
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Pick the most relevant employee: primary employee or first task assignment
  const latestTask = assignedTasks[0];
  const assignedEmployee = latestTask?.employee
    ?? latestTask?.taskAssignments?.[0]?.employee
    ?? null;

  res.status(200).json({
    data: {
      requests: requests.map(r => ({
        id: r.id,
        customerId: r.customerId,
        title: r.title,
        description: r.description,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        status: r.status.toLowerCase(),
        scheduledDate: r.scheduledDate,
        createdAt: r.createdAt.toISOString(),
        assignedEmployee: assignedEmployee
          ? { name: assignedEmployee.fullName, phone: assignedEmployee.phoneNumber ?? null }
          : null,
      })),
      pagination: {
        total,
        limit: take,
        offset: skip,
      },
    },
  });
}

/**
 * Get specific request details
 * Customer can only view their own requests
 */
export async function getRequestDetails(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { requestId } = req.params;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const id = parseInt(requestId);
  if (isNaN(id)) {
    throw new ApiError(400, "Invalid request ID");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (!customer) {
    throw new ApiError(404, "Customer profile not found");
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!request || request.customerId !== customer.id) {
    throw new ApiError(404, "Request not found");
  }

  res.status(200).json({
    data: {
      id: request.id,
      customerId: request.customerId,
      title: request.title,
      description: request.description,
      address: request.address,
      latitude: request.latitude,
      longitude: request.longitude,
      status: request.status.toLowerCase(),
      scheduledDate: request.scheduledDate,
      scheduledTime: request.scheduledTime,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    },
  });
}

/**
 * Get customer installation / project tracker details
 */
export async function getCustomerInstallationData(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
    select: {
      id: true,
      customerCode: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      city: true,
      address: true,
      systemSizeKw: true,
      installationDate: true,
      warrantyExpiry: true,
      panelBrand: true,
      inverterBrand: true,
      amcStatus: true,
      amcExpiryDate: true,
      status: true,
      projectStage: true,
      cleaningsPerMonth: true,
    },
  });

  if (!customer) {
    throw new ApiError(404, "Customer system not found");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const completedVisits = await prisma.amcVisit.count({
    where: {
      customerId: customer.id,
      status: AmcVisitStatus.COMPLETED,
      scheduledDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const limit = customer.cleaningsPerMonth || 2;
  const pendingVisits = Math.max(0, limit - completedVisits);

  res.status(200).json({
    data: {
      id: customer.id,
      customerCode: customer.customerCode,
      name: customer.fullName,
      email: customer.email,
      phone: customer.phoneNumber,
      city: customer.city,
      address: customer.address,
      systemSizeKw: customer.systemSizeKw,
      installationDate: customer.installationDate.toISOString(),
      warrantyExpiry: customer.warrantyExpiry?.toISOString() ?? null,
      panelBrand: customer.panelBrand,
      inverterBrand: customer.inverterBrand,
      amcStatus: customer.amcStatus.toLowerCase(),
      amcExpiryDate: customer.amcExpiryDate?.toISOString() ?? null,
      status: customer.status.toLowerCase(),
      projectStage: customer.projectStage,
      completedVisits,
      pendingVisits,
    },
  });
}

/**
 * Get dispatch records for the logged-in customer
 */
export async function getMyDispatches(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (!customer) {
    throw new ApiError(404, "Customer profile not found");
  }

  const dispatches = await prisma.dispatchRecord.findMany({
    where: { customerId: customer.id },
    include: {
      item: {
        select: {
          name: true,
          pricePerUnit: true,
        },
      },
    },
    orderBy: { dispatchedAt: "desc" },
  });

  res.status(200).json({
    data: dispatches.map(record => ({
      id: record.id,
      customerId: record.customerId,
      itemId: record.itemId,
      itemName: record.item?.name ?? "Unknown Item",
      quantity: record.quantity,
      pricePerUnit: record.item?.pricePerUnit ?? 0,
      dispatchedAt: record.dispatchedAt.toISOString(),
      notes: record.notes ?? "",
    })),
  });
}

/**
 * Get AMC visits for the logged-in customer
 */
export async function getMyAmcVisits(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (!customer) {
    throw new ApiError(404, "Customer profile not found");
  }

  const visits = await prisma.amcVisit.findMany({
    where: { customerId: customer.id },
    include: {
      assignedEmployee: {
        select: {
          fullName: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  res.status(200).json({
    data: visits.map(visit => ({
      id: visit.id,
      scheduledDate: visit.scheduledDate.toISOString(),
      status: visit.status.toLowerCase(),
      visitNotes: visit.visitNotes,
      cleaningNumber: visit.cleaningNumber,
      timeSlot: visit.timeSlot,
      completedByName: visit.completedByName ?? null,
      assignedEmployee: visit.assignedEmployee
        ? { name: visit.assignedEmployee.fullName, phone: visit.assignedEmployee.phoneNumber ?? null }
        : null,
    })),
  });
}

/**
 * List customer notifications
 */
export async function listCustomerNotifications(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId) throw new ApiError(401, "Authentication required");

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
    select: { id: true }
  });
  if (!customer) throw new ApiError(404, "Customer not found");

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const notifications = await getCustomerNotifications(customer.id, limit);

  res.status(200).json({ data: notifications });
}

/**
 * Get customer unread notifications count
 */
export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId) throw new ApiError(401, "Authentication required");

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
    select: { id: true }
  });
  if (!customer) throw new ApiError(404, "Customer not found");

  const count = await getUnreadNotificationCount(customer.id);
  res.status(200).json({ data: { count } });
}

/**
 * Mark a customer notification as read
 */
export async function markRead(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId) throw new ApiError(401, "Authentication required");

  const { notificationId } = req.params;
  
  // Make sure notification belongs to this customer
  const notification = await prisma.customerNotification.findUnique({
    where: { id: notificationId },
    select: { customer: { select: { userId: true } } }
  });

  if (!notification || notification.customer.userId !== auth.userId) {
    throw new ApiError(404, "Notification not found or access denied");
  }

  await markNotificationAsRead(notificationId);
  res.status(200).json({ data: { success: true } });
}

