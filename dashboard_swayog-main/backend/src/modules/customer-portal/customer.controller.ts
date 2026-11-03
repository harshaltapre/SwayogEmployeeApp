import type { Request, Response } from "express";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import { fetchInverterDataFromProvider, type InverterProvider } from "./inverter.providers.js";

/**
 * Get customer profile information
 * Customer can only view their own profile
 */
export async function getCustomerProfile(req: Request, res: Response): Promise<void> {
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

  res.status(200).json({
    data: {
      summary: {
        totalRequests: 0,
        completedServices: 0,
        pendingRequests: 0,
      },
      accountStatus: "ACTIVE",
      memberSince: new Date().toISOString(),
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
        status: "pending",
        scheduledDate: preferredDate ? new Date(preferredDate).toISOString().split("T")[0] : null,
        scheduledTime: null,
      },
    });

    res.status(201).json({
      data: {
        id: serviceRequest.id,
        customerId: serviceRequest.customerId,
        title: serviceRequest.title,
        description: serviceRequest.description,
        status: serviceRequest.status,
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
        status: r.status,
        scheduledDate: r.scheduledDate,
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
 * Get specific request details
 * Customer can only view their own requests
 */
export async function getRequestDetails(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { requestId } = req.params;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  throw new ApiError(404, "Request not found");
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
    },
  });

  if (!customer) {
    throw new ApiError(404, "Customer system not found");
  }

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
    },
  });
}

/**
 * Fetch live inverter data from selected provider based on user-entered credentials
 */
export async function getInverterLiveData(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const providerRaw = String(req.body?.provider ?? "").trim().toLowerCase();
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "").trim();
  const plantIdRaw = String(req.body?.plantId ?? "").trim();
  const provider = providerRaw === "pbblink" ? "ppblink" : providerRaw;

  if (provider !== "wari" && provider !== "ppblink") {
    throw new ApiError(400, "Provider must be either 'wari' or 'pbblink'");
  }

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const inverterData = await fetchInverterDataFromProvider({
    provider: provider as InverterProvider,
    username,
    password,
    plantId: plantIdRaw.length > 0 ? plantIdRaw : undefined,
  });

  res.status(200).json({ data: inverterData });
}
