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

import { generatePartnerCustomerId } from "../../lib/partner-customer-id.js";
import { hashPassword } from "../../lib/password.js";
import { UserRole } from "@prisma/client";

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
    where: { userId: auth.userId },
    include: {
      user: true,
    },
  });

  if (!partnerProfile) {
    throw new ApiError(404, "Partner profile not found");
  }

  const normalizedPhone = phone.replace(/\s+/g, "").trim();

  try {
    const newLead = await prisma.$transaction(async (tx) => {
      const { customerId } = await generatePartnerCustomerId(partnerProfile.id, new Date(), tx);
      const normalizedEmail = email && email.trim() !== ""
        ? email.trim().toLowerCase()
        : `${customerId.toLowerCase().replace(/[^a-z0-9]/g, "")}@placeholder.lead.swayog`;

      // Check if user already exists
      let user = await tx.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { phoneNumber: normalizedPhone },
          ],
        },
      });

      if (!user) {
        const defaultPwd = `Swayog@${Date.now().toString().slice(-4)}`;
        const passwordHash = await hashPassword(defaultPwd);
        user = await tx.user.create({
          data: {
            loginId: customerId,
            fullName: customerName,
            email: normalizedEmail,
            phoneNumber: normalizedPhone,
            passwordHash,
            portalPassword: defaultPwd,
            role: UserRole.CUSTOMER,
            isActive: true,
          },
        });
      }

      const createdCustomer = await tx.customer.create({
        data: {
          customerCode: customerId,
          fullName: customerName,
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          city: location || "Unknown",
          state: state || null,
          address: address || "Address Pending",
          systemSizeKw: parsedCapacity,
          projectType: projectType || null,
          commissionAmount,
          commissionStatus: "PENDING",
          installationDate: new Date(),
          projectStage: 11,
          partnerId: partnerProfile.id,
          userId: user.id,
          partnerLeadStatus: "PENDING",
        },
        include: {
          partner: {
            include: {
              user: true,
            },
          },
        },
      });

      return createdCustomer;
    });

    res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      lead: newLead,
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
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to submit lead to database");
  }
}
