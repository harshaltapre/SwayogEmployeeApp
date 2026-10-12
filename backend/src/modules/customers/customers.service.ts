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
import { generatePartnerCustomerId } from "../../lib/partner-customer-id.js";
import type {
  CreateCustomerInput,
  ListCustomersQueryInput,
  UpdateCustomerInput,
  BulkCustomerImportInput,
} from "./customers.schemas.js";

const COMPLETED_PROJECT_STAGE = 11;

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

function canonicalPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function importValueChanged(existing: unknown, incoming: unknown): boolean {
  return hasValue(incoming) && (!hasValue(existing) || String(existing).trim() !== String(incoming).trim());
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
    inverterName: customer.inverterName,
    inverterModel: customer.inverterModel,
    inverterUid: customer.inverterUid,
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
    partnerLeadStatus: customer.partnerLeadStatus || (customer.partnerId ? "PENDING" : null),
    assignedEpc: customer.assignedEpc ?? null,
    epcAssignmentStatus: (customer as any).epcAssignmentStatus ?? null,
    inverterLoginId: customer.inverterLoginId,
    inverterPassword: customer.inverterPassword,
    dataLoggerSrNo: customer.dataLoggerSrNo ?? null,
    inverterSrNo: customer.inverterSrNo ?? null,
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
    partner: customer.partner ? {
      id: customer.partner.id,
      partnerCode: customer.partner.partnerCode || null,
      businessName: customer.partner.businessName,
      companyName: customer.partner.businessName || customer.partner.user?.fullName || "Partner",
      name: customer.partner.user?.fullName || "Partner Representative",
      email: customer.partner.user?.email || null,
      phone: customer.partner.user?.phoneNumber || null,
      zone: customer.partner.serviceZone || customer.partner.zone || null,
    } : null,
    serviceHistoryCount: customer._count?.serviceRequests ?? 0,
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
    throw new ApiError(403, "Partner profile is not active");
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

  const where: any = {
    ...(partnerScopeId ? { partnerId: partnerScopeId } : {}),
  };

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { customerCode: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phoneNumber: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
      { inverterBrand: { contains: query.search, mode: "insensitive" } },
      { inverterName: { contains: query.search, mode: "insensitive" } },
      { inverterModel: { contains: query.search, mode: "insensitive" } },
      { inverterUid: { contains: query.search, mode: "insensitive" } },
      { inverterSrNo: { contains: query.search, mode: "insensitive" } },
      { dataLoggerSrNo: { contains: query.search, mode: "insensitive" } },
      { apartment: { name: { contains: query.search, mode: "insensitive" } } },
      { partner: { partnerCode: { contains: query.search, mode: "insensitive" } } },
      { partner: { businessName: { contains: query.search, mode: "insensitive" } } },
      { partner: { user: { fullName: { contains: query.search, mode: "insensitive" } } } },
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

  if ((query as any).partnerCode) {
    where.partner = {
      ...(where.partner || {}),
      partnerCode: { contains: (query as any).partnerCode, mode: "insensitive" },
    };
  }

  if ((query as any).partnerName) {
    where.partner = {
      ...(where.partner || {}),
      OR: [
        { user: { fullName: { contains: (query as any).partnerName, mode: "insensitive" } } },
        { businessName: { contains: (query as any).partnerName, mode: "insensitive" } },
      ],
    };
  }

  if ((query as any).registrationMonth) {
    const rawMonth = String((query as any).registrationMonth).trim();
    let year: number | null = null;
    let month: number | null = null;

    if (rawMonth.includes("-")) {
      const parts = rawMonth.split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else if (rawMonth.length === 4) {
      year = 2000 + parseInt(rawMonth.slice(0, 2), 10);
      month = parseInt(rawMonth.slice(2, 4), 10);
    }

    if (year && month && !isNaN(year) && !isNaN(month)) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      where.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }
  }

  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      apartment: true,
      partner: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { serviceRequests: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: query.limit ? Number(query.limit) : undefined,
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
    include: {
      apartment: true,
      partner: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { serviceRequests: true },
      },
    },
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

  const customerCode = partnerId
    ? (await generatePartnerCustomerId(partnerId, new Date(input.installationDate || Date.now()))).customerId
    : await generateCustomerCode();
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
          inverterName: input.inverterName ?? null,
          inverterModel: input.inverterModel ?? null,
          inverterUid: input.inverterUid ?? null,
          inverterLoginId: input.inverterLoginId ?? null,
          inverterPassword: input.inverterPassword ?? null,
          inverterApiKey: input.inverterApiKey ?? null,
          dataLoggerSrNo: input.dataLoggerSrNo ?? null,
          inverterSrNo: input.inverterSrNo ?? null,
          portalPassword: input.portalPassword ?? pwdToUse,
          amcStatus: amcStatusMap[input.amcStatus],
          amcExpiryDate: toOptionalDate(input.amcExpiryDate ?? null),
          contractStartDate: input.contractStartDate ? new Date(input.contractStartDate) : null,
          contractEndDate: input.contractEndDate ? new Date(input.contractEndDate) : null,
          cleaningsPerMonth: input.cleaningsPerMonth !== undefined ? Number(input.cleaningsPerMonth) : 2,
          status: customerStatusMap[input.status],
          partnerId,
          projectStage: COMPLETED_PROJECT_STAGE,
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

export async function bulkImportCustomers(auth: AuthContext, input: BulkCustomerImportInput) {
  const results = {
    successful: 0,
    failed: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    ambiguous: 0,
    conflicts: 0,
    errors: [] as Array<{ row: number; fullName: string; error: string }>,
  };
  const seen = new Map<string, { row: number; signature: string }>();

  for (const row of input.rows) {
    const phone = canonicalPhone(row.phoneNumber);
    const email = normalizeText(row.email);
    const key = row.customerCode
      ? `code:${row.customerCode.toLowerCase()}`
      : phone ? `phone:${phone}` : `email:${email}`;
    const signature = JSON.stringify(row);
    const previous = seen.get(key);
    if (previous) {
      if (previous.signature === signature) {
        results.successful++;
        results.unchanged++;
      } else {
        results.failed++;
        results.conflicts++;
        results.errors.push({
          row: row.rowNumber,
          fullName: row.fullName,
          error: `Conflicts with duplicate import row ${previous.row}`,
        });
      }
      continue;
    }
    seen.set(key, { row: row.rowNumber, signature });

    try {
      const candidates = await prisma.customer.findMany({
        where: {
          OR: [
            ...(row.customerCode ? [{ customerCode: row.customerCode }] : []),
            ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
            ...(phone ? [{ phoneNumber: { contains: phone.slice(-10) } }] : []),
          ],
        },
      });
      const matches = candidates.filter((customer) =>
        (row.customerCode && customer.customerCode.toLowerCase() === row.customerCode.toLowerCase()) ||
        (phone.length > 0 && canonicalPhone(customer.phoneNumber) === phone) ||
        (email.length > 0 && normalizeText(customer.email) === email),
      );

      if (matches.length > 1) {
        results.failed++;
        results.ambiguous++;
        results.errors.push({ row: row.rowNumber, fullName: row.fullName, error: "Multiple existing customers match this row" });
        continue;
      }

      const existing = matches[0];
      if (!existing) {
        await createCustomer(auth, {
          ...row,
          email,
          phoneNumber: normalizePhone(row.phoneNumber),
          portalPassword: undefined,
          projectStage: COMPLETED_PROJECT_STAGE,
        });
        results.successful++;
        results.created++;
        continue;
      }

      const update: UpdateCustomerInput = {};
      const fields: Array<keyof UpdateCustomerInput> = [
        "fullName", "email", "phoneNumber", "city", "address", "systemSizeKw",
        "installationDate", "panelBrand", "inverterBrand", "inverterModel",
        "inverterLoginId", "inverterApiKey", "dataLoggerSrNo", "inverterSrNo",
        "contractStartDate", "cleaningsPerMonth", "amcStatus", "monthlyCleaningRate",
        "paymentTerms", "remarks",
      ];
      for (const field of fields) {
        const incoming = row[field];
        const existingValue = field === "fullName"
          ? existing.fullName
          : field === "phoneNumber" ? existing.phoneNumber : (existing as any)[field];
        if (hasValue(incoming) && (input.mode === "update_existing" || !hasValue(existingValue)) &&
          importValueChanged(existingValue, incoming)) {
          (update as any)[field] = field === "phoneNumber" ? normalizePhone(String(incoming)) : incoming;
        }
      }

      if (Object.keys(update).length === 0) {
        results.successful++;
        results.unchanged++;
      } else {
        await updateCustomer(auth, existing.id, update);
        results.successful++;
        results.updated++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: row.rowNumber,
        fullName: row.fullName,
        error: error instanceof Error ? error.message : "Customer import failed",
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "CUSTOMER_BULK_IMPORT",
      entity: "Customer",
      entityId: "bulk",
      metadata: results,
    },
  });
  return results;
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
      inverterName: input.inverterName,
      inverterModel: input.inverterModel,
      inverterUid: input.inverterUid,
      inverterLoginId: input.inverterLoginId,
      inverterPassword: input.inverterPassword,
      inverterApiKey: input.inverterApiKey,
      dataLoggerSrNo: input.dataLoggerSrNo !== undefined ? input.dataLoggerSrNo : undefined,
      inverterSrNo: input.inverterSrNo !== undefined ? input.inverterSrNo : undefined,
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
      projectStage: COMPLETED_PROJECT_STAGE,
      assignedEpc: (input as any).assignedEpc !== undefined ? (input as any).assignedEpc : undefined,
      // When EPC is reassigned, reset acceptance status back to PENDING (null)
      ...((input as any).assignedEpc !== undefined ? { epcAssignmentStatus: null } : {}),
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

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      ...(partnerScopeId ? { partnerId: partnerScopeId } : {}),
    },
    select: { id: true, userId: true, email: true, customerCode: true },
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  await prisma.$transaction(async (tx: any) => {
    // 1. Delete all related customer child records
    await tx.customerNotification.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.serviceRequest.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.amcVisit.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.amcContract.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.invoice.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.dispatchRecord.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.payment.deleteMany({ where: { customerId: id } }).catch(() => {});
    await tx.task.updateMany({ where: { customerId: id }, data: { customerId: null } }).catch(() => {});

    // 2. Delete the customer record
    await tx.customer.delete({ where: { id } });

    // 3. Delete associated user if any (by customer.userId or customer.customerCode / email where role is CUSTOMER)
    const userConditions: any[] = [];
    if (customer.userId) {
      userConditions.push({ id: customer.userId });
    }
    if (customer.customerCode) {
      userConditions.push({ loginId: customer.customerCode, role: UserRole.CUSTOMER });
    }
    if (customer.email) {
      userConditions.push({ email: { equals: customer.email, mode: "insensitive" }, role: UserRole.CUSTOMER });
    }

    if (userConditions.length > 0) {
      const usersToDelete = await tx.user.findMany({
        where: { OR: userConditions },
        select: { id: true },
      });

      for (const u of usersToDelete) {
        await tx.attendanceRecord.deleteMany({ where: { employeeId: u.id } }).catch(() => {});
        await tx.checkIn.deleteMany({ where: { employeeId: u.id } }).catch(() => {});
        await tx.performanceSnapshot.deleteMany({ where: { employeeId: u.id } }).catch(() => {});
        await tx.workSubmission.deleteMany({ where: { employeeId: u.id } }).catch(() => {});
        await tx.dailyCommit.deleteMany({ where: { employeeId: u.id } }).catch(() => {});
        await tx.refreshToken.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await tx.user.delete({ where: { id: u.id } }).catch(() => {});
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "CUSTOMER_DELETE",
      entity: "Customer",
      entityId: String(id),
    },
  }).catch(() => {});

  return { success: true };
}

export async function updatePartnerLeadStatus(auth: AuthContext, id: number, status: "APPROVED" | "REJECTED") {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw new ApiError(404, "Customer lead not found");
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      partnerLeadStatus: status,
    },
    include: {
      apartment: true,
      partner: {
        include: {
          user: true,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId || "system",
      action: `PARTNER_LEAD_${status}`,
      entity: "Customer",
      entityId: String(id),
      metadata: {
        status,
        partnerId: customer.partnerId,
      },
    },
  });

  return serializeCustomer(updated);
}

// ─── EPC CONTRACTOR: LIST THEIR ASSIGNED PARTNER LEADS ─────────────────────────────
export async function listEpcAssignedLeads(auth: AuthContext, epcCompanyName: string) {
  // Any authenticated user with EPC_CONTRACTOR role can call this
  const leads = await prisma.customer.findMany({
    where: {
      assignedEpc: epcCompanyName,
      partnerLeadStatus: "APPROVED",
    },
    include: {
      apartment: true,
      partner: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return leads.map(serializeCustomer);
}

// ─── EPC CONTRACTOR: ACCEPT OR REJECT ASSIGNMENT ────────────────────────────────────
export async function updateEpcAssignmentStatus(
  auth: AuthContext,
  id: number,
  status: "ACCEPTED" | "REJECTED",
  epcCompanyName: string,
) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw new ApiError(404, "Customer lead not found");
  }

  if (customer.assignedEpc !== epcCompanyName) {
    throw new ApiError(403, "This lead is not assigned to your EPC firm");
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      epcAssignmentStatus: status,
      // When EPC rejects, clear the assignment so Isphere Green Head can reassign
      ...(status === "REJECTED" ? { assignedEpc: null } : {}),
    },
    include: {
      apartment: true,
      partner: { include: { user: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId || "system",
      action: `EPC_ASSIGNMENT_${status}`,
      entity: "Customer",
      entityId: String(id),
      metadata: { status, epcCompanyName },
    },
  });

  return serializeCustomer(updated);
}
