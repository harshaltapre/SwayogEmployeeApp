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
