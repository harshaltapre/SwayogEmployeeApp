import {
  CustomerAmcStatus,
  CustomerStatus,
  UserRole,
  type Customer,
} from "@prisma/client";

import crypto from "crypto";
import { hashPassword } from "../../lib/password.js";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { prisma } from "../../lib/prisma.js";
import { generateNextCustomerCode } from "../../lib/login-id.js";
import type {
  CreateCustomerInput,
  ListCustomersQueryInput,
  UpdateCustomerInput,
} from "./customers.schemas.js";

const amcStatusMap: Record<"active" | "expired" | "none", CustomerAmcStatus> = {
  active: CustomerAmcStatus.ACTIVE,
  expired: CustomerAmcStatus.EXPIRED,
  none: CustomerAmcStatus.NONE,
};

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    (error as any).code === "P2002"
  );
}

const customerStatusMap: Record<"active" | "inactive", CustomerStatus> = {
  active: CustomerStatus.ACTIVE,
  inactive: CustomerStatus.INACTIVE,
};

function toOptionalDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function serializeCustomer(customer: any) {
  return {
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
    inverterModel: customer.inverterModel,
    inverterApiKey: customer.inverterApiKey,
    contractStartDate: customer.contractStartDate?.toISOString() ?? null,
    contractEndDate: customer.contractEndDate?.toISOString() ?? null,
    cleaningsPerMonth: customer.cleaningsPerMonth,
    amcStatus: customer.amcStatus.toLowerCase(),
    amcExpiryDate: customer.amcExpiryDate?.toISOString() ?? null,
    status: customer.status.toLowerCase(),
    partnerId: customer.partnerId,
    projectStage: customer.projectStage,
    userId: customer.userId,
    commissionAmount: customer.commissionAmount,
    commissionStatus: customer.commissionStatus,
    commissionProofUrl: customer.commissionProofUrl,
    commissionPaidAt: customer.commissionPaidAt?.toISOString() ?? null,
    inverterLoginId: customer.inverterLoginId,
    inverterPassword: customer.inverterPassword,
    portalPassword: customer.portalPassword,
    latitude: customer.latitude,
    longitude: customer.longitude,
    apartmentId: customer.apartmentId,
    apartment: customer.apartment ? {
      id: customer.apartment.id,
      name: customer.apartment.name,
      address: customer.apartment.address,
      city: customer.apartment.city,
    } : null,
  };
}

async function getPartnerScopeId(auth: AuthContext): Promise<string | null> {
  if (auth.role !== UserRole.PARTNER) {
    return null;
  }

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: auth.userId },
    select: { id: true, isActive: true },
  });

  if (!partnerProfile || !partnerProfile.isActive) {
    throw new ApiError(403, "Partner profile not found or inactive");
  }

  return partnerProfile.id;
}

async function assertPartnerExists(partnerId: string): Promise<void> {
  const exists = await prisma.partnerProfile.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!exists) {
    throw new ApiError(400, "Invalid partner ID");
  }
}

async function generateCustomerCode(): Promise<string> {
  return generateNextCustomerCode();
}

export async function listCustomers(auth: AuthContext, query: ListCustomersQueryInput) {
  const partnerScopeId = await getPartnerScopeId(auth);

  const where: any = {};

  if (partnerScopeId) {
    where.partnerId = partnerScopeId;
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phoneNumber: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
      { apartment: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  if (query.amcStatus) {
    where.amcStatus = amcStatusMap[query.amcStatus];
  }

  if (query.status) {
    where.status = customerStatusMap[query.status];
  }

  if (query.partnerId) {
    where.partnerId = query.partnerId;
  }

  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  const customers = await prisma.customer.findMany({
    where,
    include: { apartment: true },
    orderBy: { createdAt: "desc" },
    take: query.limit ?? 100,
  });

  return customers.map(serializeCustomer);
}

export async function getCustomerById(auth: AuthContext, id: number) {
  const partnerScopeId = await getPartnerScopeId(auth);

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      ...(partnerScopeId ? { partnerId: partnerScopeId } : {}),
    },
    include: { apartment: true },
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  return serializeCustomer(customer);
}

export async function createCustomer(auth: AuthContext, input: CreateCustomerInput) {
  const partnerScopeId = await getPartnerScopeId(auth);

  let partnerId = input.partnerId ?? null;
  if (partnerScopeId) {
    partnerId = partnerScopeId;
  } else if (partnerId) {
    await assertPartnerExists(partnerId);
  }

  const normalizedEmail = normalizeText(input.email);
  const normalizedPhone = normalizePhone(input.phoneNumber);
  const normalizedName = normalizeText(input.fullName);
  const normalizedCity = normalizeText(input.city);
  const normalizedAddress = normalizeText(input.address);

  // Check BOTH Customer and User tables to prevent 500 errors on unique constraints
  const [existingCustomerEmail, existingUserEmail] = await Promise.all([
    prisma.customer.findFirst({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.user.findFirst({ where: { email: normalizedEmail }, select: { id: true } }),
  ]);

  if (existingCustomerEmail || existingUserEmail) {
    throw new ApiError(409, "Email already exists in the system (associated with a customer or user)");
  }

  const [existingCustomerPhone, existingUserPhone] = await Promise.all([
    prisma.customer.findFirst({ where: { phoneNumber: normalizedPhone }, select: { id: true } }),
    prisma.user.findFirst({ where: { phoneNumber: normalizedPhone }, select: { id: true } }),
  ]);

  if (existingCustomerPhone || existingUserPhone) {
    throw new ApiError(409, "Phone number already exists in the system");
  }

  const exactDuplicate = await prisma.customer.findFirst({
    where: {
      fullName: { equals: normalizedName, mode: "insensitive" },
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      city: { equals: normalizedCity, mode: "insensitive" },
      address: { equals: normalizedAddress, mode: "insensitive" },
      systemSizeKw: input.systemSizeKw,
      installationDate: new Date(input.installationDate),
      panelBrand: input.panelBrand ?? null,
      inverterBrand: input.inverterBrand ?? null,
      amcStatus: amcStatusMap[input.amcStatus],
      amcExpiryDate: toOptionalDate(input.amcExpiryDate ?? null),
      status: customerStatusMap[input.status],
      partnerId,
    },
    select: { id: true },
  });

  if (exactDuplicate) {
    throw new ApiError(409, "Same customer details already exist");
  }

  const customerCode = await generateCustomerCode();
  const pwdToUse = input.portalPassword || crypto.randomBytes(4).toString('hex');
  const passwordHash = await hashPassword(pwdToUse);

  const existingUserLogin = await prisma.user.findFirst({
    where: { loginId: customerCode },
    select: { id: true },
  });
  
  if (existingUserLogin) {
    throw new ApiError(409, "Generated Customer Code collision. Please try again.");
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Create associated User record
      const user = await tx.user.create({
        data: {
          loginId: customerCode,
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          fullName: input.fullName,
          passwordHash,
          role: UserRole.CUSTOMER,
          isActive: true,
        }
      });

      // Create Customer profile
      const customer = await tx.customer.create({
        data: {
          customerCode,
          userId: user.id,
          fullName: input.fullName,
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          city: input.city,
          address: input.address,
          systemSizeKw: input.systemSizeKw,
          installationDate: new Date(input.installationDate),
          warrantyExpiry: toOptionalDate(input.warrantyExpiry ?? null),
          panelBrand: input.panelBrand,
          inverterBrand: input.inverterBrand,
          inverterModel: input.inverterModel ?? null,
          inverterLoginId: input.inverterLoginId ?? null,
          inverterPassword: input.inverterPassword ?? null,
          inverterApiKey: input.inverterApiKey ?? null,
          portalPassword: input.portalPassword ?? pwdToUse,
          amcStatus: amcStatusMap[input.amcStatus],
          amcExpiryDate: toOptionalDate(input.amcExpiryDate ?? null),
          contractStartDate: input.contractStartDate ? new Date(input.contractStartDate) : null,
          contractEndDate: input.contractEndDate ? new Date(input.contractEndDate) : null,
          cleaningsPerMonth: input.cleaningsPerMonth !== undefined ? Number(input.cleaningsPerMonth) : 2,
          status: customerStatusMap[input.status],
          partnerId,
          projectStage: input.projectStage ?? 0,
          commissionAmount: input.commissionAmount ?? null,
          monthlyCleaningRate: input.monthlyCleaningRate ?? null,
          paymentTerms: input.paymentTerms ?? null,
          remarks: input.remarks ?? null,
          apartmentId: input.apartmentId ?? null,
        },
        include: {
          apartment: true,
        },
      });

      // Log the creation
      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          action: "CUSTOMER_CREATE",
          entity: "Customer",
          entityId: String(customer.id),
          metadata: {
            partnerId,
            customerCode: customer.customerCode,
          },
        },
      });

      return customer;
    });

    return {
      ...serializeCustomer(result),
      generatedPassword: result.portalPassword ?? pwdToUse,
      loginId: customerCode
    };
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new ApiError(409, "A unique constraint violation occurred in the database.");
    }
    throw error;
  }
}

export async function updateCustomer(auth: AuthContext, id: number, input: UpdateCustomerInput) {
  const partnerScopeId = await getPartnerScopeId(auth);

  const existing = await prisma.customer.findFirst({
    where: {
      id,
      ...(partnerScopeId ? { partnerId: partnerScopeId } : {}),
    },
  });

  if (!existing) {
    throw new ApiError(404, "Customer not found");
  }

  let partnerId = existing.partnerId;
  if (partnerScopeId) {
    if (input.partnerId && input.partnerId !== partnerScopeId) {
      throw new ApiError(403, "Partner cannot assign customer outside own scope");
    }
    partnerId = partnerScopeId;
  } else if (input.partnerId !== undefined) {
    partnerId = input.partnerId;
    if (partnerId) {
      await assertPartnerExists(partnerId);
    }
  }

  const nextEmail = input.email ? normalizeText(input.email) : existing.email;
  const nextPhone = input.phoneNumber ? normalizePhone(input.phoneNumber) : existing.phoneNumber;

  const conflictingCustomer = await prisma.customer.findFirst({
    where: {
      id: { not: id },
      OR: [
        { email: nextEmail },
        { phoneNumber: nextPhone },
      ],
    },
    select: { id: true, email: true, phoneNumber: true },
  });

  if (conflictingCustomer) {
    if (conflictingCustomer.email === nextEmail) {
      throw new ApiError(409, "Customer email already exists");
    }
    if (conflictingCustomer.phoneNumber === nextPhone) {
      throw new ApiError(409, "Customer phone number already exists");
    }
  }

  // Update portal password on the linked User account if provided
  if (input.portalPassword && input.portalPassword !== "") {
    if (existing.userId) {
      const passwordHash = await hashPassword(input.portalPassword);
      await prisma.user.update({
        where: { id: existing.userId },
        data: { 
          passwordHash,
          portalPassword: input.portalPassword
        },
      });
    }
  }

  // Update other details on the linked User account if provided
  if (existing.userId) {
    const userUpdateData: any = {};
    if (input.fullName !== undefined) userUpdateData.fullName = input.fullName;
    if (input.email !== undefined) userUpdateData.email = nextEmail;
    if (input.phoneNumber !== undefined) userUpdateData.phoneNumber = nextPhone;
    
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: userUpdateData,
      });
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      fullName: input.fullName,
      email: input.email ? nextEmail : undefined,
      phoneNumber: input.phoneNumber ? nextPhone : undefined,
      city: input.city,
      address: input.address,
      systemSizeKw: input.systemSizeKw,
      installationDate: input.installationDate ? new Date(input.installationDate) : undefined,
      warrantyExpiry:
        input.warrantyExpiry !== undefined
          ? toOptionalDate(input.warrantyExpiry)
          : undefined,
      panelBrand: input.panelBrand,
      inverterBrand: input.inverterBrand,
      inverterModel: input.inverterModel,
      inverterLoginId: input.inverterLoginId,
      inverterPassword: input.inverterPassword,
      inverterApiKey: input.inverterApiKey,
      portalPassword: input.portalPassword ?? undefined,
      amcStatus: input.amcStatus ? amcStatusMap[input.amcStatus] : undefined,
      amcExpiryDate:
        input.amcExpiryDate !== undefined
          ? toOptionalDate(input.amcExpiryDate)
          : undefined,
      contractStartDate: input.contractStartDate !== undefined ? toOptionalDate(input.contractStartDate) : undefined,
      contractEndDate: input.contractEndDate !== undefined ? toOptionalDate(input.contractEndDate) : undefined,
      cleaningsPerMonth: input.cleaningsPerMonth !== undefined ? Number(input.cleaningsPerMonth) : undefined,
      status: input.status ? customerStatusMap[input.status] : undefined,
      partnerId,
      projectStage: input.projectStage !== undefined ? input.projectStage : undefined,
      commissionAmount: input.commissionAmount !== undefined ? input.commissionAmount : undefined,
      monthlyCleaningRate: input.monthlyCleaningRate !== undefined ? input.monthlyCleaningRate : undefined,
      paymentTerms: input.paymentTerms !== undefined ? input.paymentTerms : undefined,
      remarks: input.remarks !== undefined ? input.remarks : undefined,
      apartmentId: input.apartmentId !== undefined ? input.apartmentId : undefined,
    },
    include: {
      apartment: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "CUSTOMER_UPDATE",
      entity: "Customer",
      entityId: String(customer.id),
    },
  });

  return serializeCustomer(customer);
}

export async function deleteCustomer(auth: AuthContext, id: number) {
  const partnerScopeId = await getPartnerScopeId(auth);

  const result = await prisma.customer.deleteMany({
    where: {
      id,
      ...(partnerScopeId ? { partnerId: partnerScopeId } : {}),
    },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Customer not found");
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "CUSTOMER_DELETE",
      entity: "Customer",
      entityId: String(id),
    },
  });

  return { success: true };
}
