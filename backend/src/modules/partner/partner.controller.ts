import type { Request, Response } from "express";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";

/**
 * Get partner profile information
 */
export async function getPartnerProfile(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
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
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "Partner profile not found");
  }

  res.status(200).json({ data: user });
}

/**
 * Get partner statistics and business metrics
 */
export async function getPartnerStats(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  res.status(200).json({
    data: {
      summary: {
        activeRequests: 0,
        completedRequests: 0,
        totalRevenue: 0,
      },
      monthlyMetrics: {
        requests: 0,
        completion_rate: "0%",
      },
    },
  });
}

/**
 * Get available services
 */
export async function getAvailableServices(
  req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({
    data: {
      services: [
        {
          id: 1,
          name: "Consulting",
          description: "Professional consulting services",
          category: "Professional Services",
        },
        {
          id: 2,
          name: "Installation",
          description: "Installation and setup services",
          category: "Technical Services",
        },
        {
          id: 3,
          name: "Maintenance",
          description: "Regular maintenance and support",
          category: "Support Services",
        },
      ],
    },
  });
}

/**
 * Submit a service request
 */
export async function submitServiceRequest(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { serviceType, description, preferredDate } = req.body;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  // Validate input
  if (!serviceType || !description) {
    throw new ApiError(400, "Service type and description are required");
  }

  res.status(201).json({
    data: {
      id: "req_" + Date.now(),
      serviceType,
      description,
      preferredDate,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    },
    message: "Service request submitted successfully",
  });
}

/**
 * Get all service requests submitted by this partner
 */
export async function getMyRequests(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { status, limit = "50", offset = "0" } = req.query;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }
  res.status(200).json({
    data: {
      requests: [],
      pagination: {
        total: 0,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    },
  });
}

/**
 * Submit a customer lead (Partner)
 */
export async function submitLead(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  
  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const { customerName, phone, location, capacity, address, email, state, projectType } = req.body;
  if (!customerName || !phone) {
    throw new ApiError(400, "Customer name and phone are required");
  }

  // Parse capacity. Default to 1 if unknown format.
  let parsedCapacity = parseFloat(String(capacity).replace(/[^0-9.]/g, ''));
  if (isNaN(parsedCapacity)) {
    parsedCapacity = 1.0;
  }

  const commissionAmount = parsedCapacity * 1000;

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: auth.userId }
  });

  if (!partnerProfile) {
    throw new ApiError(404, "Partner profile not found");
  }

  try {
    const newLead = await prisma.customer.create({
      data: {
        customerCode: `SWY-LEAD-${Date.now()}`,
        fullName: customerName,
        email: email && email.trim() !== "" ? email : `${Date.now()}@placeholder.lead.swayog`,
        phoneNumber: phone,
        city: location || "Unknown",
        state: state || null,
        address: address || "Address Pending",
        systemSizeKw: parsedCapacity,
        projectType: projectType || null,
        commissionAmount,
        commissionStatus: "PENDING",
        installationDate: new Date(),
        projectStage: 0, // 0 usually means Lead
        partnerId: partnerProfile.id,
      }
    });

    res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      lead: newLead
    });
  } catch (error: any) {
    console.error("[submitLead] Error creating customer lead:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('phoneNumber')) {
        throw new ApiError(409, "A customer with this phone number already exists in the system.");
      }
      if (target?.includes('email')) {
        throw new ApiError(409, "A customer with this email already exists in the system.");
      }
      throw new ApiError(409, "A customer with these details already exists.");
    }
    throw new ApiError(500, "Failed to submit lead to database");
  }
}
