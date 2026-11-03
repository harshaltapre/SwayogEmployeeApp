import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";

/**
 * Get all service requests (sub-admin view — sees all requests)
 */
export async function getAllServiceRequests(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const { status, limit = "100", offset = "0" } = req.query;

  const take = Math.min(parseInt(limit as string) || 100, 200);
  const skip = parseInt(offset as string) || 0;

  const where: any = {};
  if (status && typeof status === "string") {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            city: true,
          },
        },
      },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  res.status(200).json({
    data: {
      requests: requests.map((r) => ({
        id: r.id,
        customerId: r.customerId,
        customer_id: r.customerId,
        customerName: r.customer.fullName,
        customerEmail: r.customer.email,
        customerPhone: r.customer.phoneNumber,
        customerCity: r.customer.city,
        customerCode: r.customer.customerCode,
        title: r.title,
        description: r.description,
        status: r.status,
        scheduledDate: r.scheduledDate,
        scheduled_date: r.scheduledDate,
        scheduledTime: r.scheduledTime,
        scheduled_time: r.scheduledTime,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        createdAt: r.createdAt.toISOString(),
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
 * Update a service request (schedule or change status)
 */
export async function updateServiceRequest(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { requestId } = req.params;
  const { status, scheduledDate, scheduledTime, assignedEmployeeId } = req.body;
  
  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const id = parseInt(requestId);
  if (isNaN(id)) {
    throw new ApiError(400, "Invalid request ID");
  }

  const existing = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!existing) {
    throw new ApiError(404, "Service request not found");
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(scheduledDate !== undefined && { scheduledDate }),
      ...(scheduledTime !== undefined && { scheduledTime }),
    },
  });

  // If assigned an employee and status is scheduled, create a task
  if (assignedEmployeeId && (status === "scheduled" || updated.status === "scheduled")) {
    try {
      // Basic check to avoid immediate duplicates if the request was already scheduled to the same person
      const alreadyAssigned = existing.status === "scheduled" && 
                             existing.scheduledDate === (scheduledDate || existing.scheduledDate);
      
      // If the employee changed or it's a new scheduling, we proceed
      // In a real production app, we would link Task to ServiceRequest via a foreign key
      await prisma.task.create({
        data: {
          employeeUserId: assignedEmployeeId,
          assignedById: auth.userId,
          jobType: "Complaint",
          description: updated.description || updated.title,
          customerName: existing.customer.fullName,
          customerPhone: existing.customer.phoneNumber,
          address: updated.address || existing.customer.address,
          latitude: updated.latitude,
          longitude: updated.longitude,
          scheduledTime: new Date(`${scheduledDate || updated.scheduledDate || new Date().toISOString().split('T')[0]}T${scheduledTime || updated.scheduledTime || "10:00"}:00`),
          status: "ASSIGNED",
        }
      });
    } catch (err) {
      console.error("Failed to auto-create task", err);
    }
  }

  res.status(200).json({
    data: {
      id: updated.id,
      status: updated.status,
      scheduledDate: updated.scheduledDate,
      scheduledTime: updated.scheduledTime,
      updatedAt: updated.updatedAt.toISOString(),
    },
    message: "Service request updated successfully",
  });
}

/**
 * Get service request stats for sub-admin dashboard
 */
export async function getServiceRequestStats(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const [total, pending, scheduled, completed] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: "pending" } }),
    prisma.serviceRequest.count({ where: { status: "scheduled" } }),
    prisma.serviceRequest.count({ where: { status: "completed" } }),
  ]);

  res.status(200).json({
    data: {
      total,
      pending,
      scheduled,
      completed,
    },
  });
}
