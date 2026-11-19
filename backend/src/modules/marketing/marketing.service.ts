import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import {
  normalizePhoneNumber,
  normalizeEmail,
  normalizeText,
  getAddressFuzzyKey,
} from "./marketing.validation.js";
import type {
  CreateMarketingCampaignInput,
  CreateMarketingFollowUpInput,
  CreateMarketingLeadInput,
  ImportMarketingWorkspaceInput,
  UpdateMarketingLeadInput,
} from "./marketing.schemas.js";

/**
 * Check if a lead/client with given phone, email, or name+address already exists in the system
 * Checks across:
 * 1. MarketingLead
 * 2. Customer
 * 3. OnboardingRequest
 */
export async function checkExistingClientDuplicate(params: {
  phone: string;
  email?: string | null;
  name?: string;
  address?: string;
  excludeId?: string;
}): Promise<{ isDuplicate: boolean; reason?: string; matchedWith?: string }> {
  const { phone, email, name, address, excludeId } = params;

  // 1. Check in MarketingLead by phone
  const existingLeadByPhone = await prisma.marketingLead.findFirst({
    where: {
      phone,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true, phone: true, email: true },
  });

  if (existingLeadByPhone) {
    return {
      isDuplicate: true,
      reason: `Mobile number ${phone} already exists in marketing leads`,
      matchedWith: `${existingLeadByPhone.name} (Marketing Lead)`,
    };
  }

  // 2. Check in Customer table by phone
  const existingCustomerByPhone = await prisma.customer.findFirst({
    where: {
      phoneNumber: { contains: phone },
    },
    select: { id: true, fullName: true, customerCode: true, phoneNumber: true },
  });

  if (existingCustomerByPhone) {
    return {
      isDuplicate: true,
      reason: `Mobile number ${phone} already exists as a registered customer`,
      matchedWith: `${existingCustomerByPhone.fullName} (${existingCustomerByPhone.customerCode})`,
    };
  }

  // 3. Check in OnboardingRequest table by phone
  const existingOnboardingByPhone = await prisma.onboardingRequest.findFirst({
    where: {
      phoneNumber: { contains: phone },
    },
    select: { id: true, customerName: true, requestNumber: true },
  });

  if (existingOnboardingByPhone) {
    return {
      isDuplicate: true,
      reason: `Mobile number ${phone} already exists in website onboarding enquiries`,
      matchedWith: `${existingOnboardingByPhone.customerName} (${existingOnboardingByPhone.requestNumber})`,
    };
  }

  // 4. Check by Email if provided
  if (email && email.trim()) {
    const normEmail = email.trim().toLowerCase();

    const existingLeadByEmail = await prisma.marketingLead.findFirst({
      where: {
        email: { equals: normEmail, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (existingLeadByEmail) {
      return {
        isDuplicate: true,
        reason: `Email address ${email} already registered with existing lead`,
        matchedWith: `${existingLeadByEmail.name} (Marketing Lead)`,
      };
    }

    const existingCustomerByEmail = await prisma.customer.findFirst({
      where: {
        email: { equals: normEmail, mode: "insensitive" },
      },
      select: { id: true, fullName: true, customerCode: true },
    });

    if (existingCustomerByEmail) {
      return {
        isDuplicate: true,
        reason: `Email address ${email} belongs to customer`,
        matchedWith: `${existingCustomerByEmail.fullName} (${existingCustomerByEmail.customerCode})`,
      };
    }
  }

  // 5. Secondary check: Name and Address match
  if (name && address && name.trim().length >= 3 && address.trim().length >= 4) {
    const normName = normalizeText(name);
    const normAddr = normalizeText(address);

    const existingLeadByNameAddr = await prisma.marketingLead.findFirst({
      where: {
        name: { equals: normName, mode: "insensitive" },
        address: { equals: normAddr, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true, phone: true },
    });

    if (existingLeadByNameAddr) {
      return {
        isDuplicate: true,
        reason: `Client with identical name ("${name}") and address already exists`,
        matchedWith: `${existingLeadByNameAddr.name} (${existingLeadByNameAddr.phone})`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Automatically sync all converted marketing leads to OnboardingRequest (for Project Coordinator)
 * and Customer + LiaisoningApplication (for Liaisoning)
 */
export async function syncConvertedMarketingLeads() {
  try {
    const convertedLeads = await prisma.marketingLead.findMany({
      where: {
        status: { equals: "Converted", mode: "insensitive" },
      },
    });

    if (!convertedLeads || convertedLeads.length === 0) return;

    const phones = Array.from(
      new Set(convertedLeads.map((l) => l.phone).filter((p): p is string => Boolean(p))),
    );
    const emails = Array.from(
      new Set(
        convertedLeads
          .map((l) => l.email?.trim().toLowerCase())
          .filter((e): e is string => Boolean(e)),
      ),
    );

    const [existingRequests, existingCustomers] = await Promise.all([
      prisma.onboardingRequest.findMany({
        where: {
          OR: [
            ...(phones.length ? [{ phoneNumber: { in: phones } }] : []),
            ...(emails.length ? [{ email: { in: emails, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, phoneNumber: true, email: true },
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            ...(phones.length ? [{ phoneNumber: { in: phones } }] : []),
            ...(emails.length ? [{ email: { in: emails, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, phoneNumber: true, email: true },
      }),
    ]);

    const reqPhones = new Set(existingRequests.map((r) => r.phoneNumber).filter(Boolean));
    const reqEmails = new Set(existingRequests.map((r) => r.email?.trim().toLowerCase()).filter(Boolean));
    const custByPhone = new Map(existingCustomers.map((c) => [c.phoneNumber, c]));
    const custByEmail = new Map(
      existingCustomers
        .filter((c) => c.email)
        .map((c) => [c.email!.trim().toLowerCase(), c]),
    );

    const leadsNeedingRequest = convertedLeads.filter((lead) => {
      const hasPhone = lead.phone && reqPhones.has(lead.phone);
      const hasEmail = lead.email && reqEmails.has(lead.email.trim().toLowerCase());
      return !hasPhone && !hasEmail;
    });

    const leadsNeedingCustomer = convertedLeads.filter((lead) => {
      const hasPhone = lead.phone && custByPhone.has(lead.phone);
      const hasEmail = lead.email && custByEmail.has(lead.email.trim().toLowerCase());
      return !hasPhone && !hasEmail;
    });

    if (leadsNeedingRequest.length === 0 && leadsNeedingCustomer.length === 0) {
      return;
    }

    let reqSeq = await prisma.onboardingRequest.count();
    let custSeq = await prisma.customer.count();

    for (const lead of leadsNeedingRequest) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      let requestNumber = `REQ-${dateStr}-${String(++reqSeq).padStart(4, "0")}`;
      while (await prisma.onboardingRequest.findUnique({ where: { requestNumber }, select: { id: true } })) {
        requestNumber = `REQ-${dateStr}-${String(++reqSeq).padStart(4, "0")}`;
      }

      const createdRequest = await prisma.onboardingRequest.create({
        data: {
          requestNumber,
          customerName: lead.name,
          phoneNumber: lead.phone,
          email: lead.email || `${lead.phone}@customer.swayog.com`,
          siteAddress: lead.address || "Address pending verification",
          location: lead.address ? lead.address.split(",")[0].trim() : null,
          requestedProduct: "Solar Rooftop System",
          customerRequirements: `Converted marketing lead (Lead ID: ${lead.id}, Source: ${lead.source || "Marketing"})`,
          stage: "NEW_REQUEST",
          createdBy: lead.createdById || "system",
        },
      });

      if (lead.createdById) {
        await prisma.onboardingAuditLog
          .create({
            data: {
              onboardingRequestId: createdRequest.id,
              actorId: lead.createdById,
              action: "REQUEST_CREATED",
              newStage: "NEW_REQUEST",
              metadata: JSON.stringify({ requestNumber, marketingLeadId: lead.id }),
            },
          })
          .catch(() => {
            // Ignore audit log error if actorId is not a valid User FK
          });
      }
    }

    for (const lead of leadsNeedingCustomer) {
      let customerCode = `CUST-${String(++custSeq).padStart(5, "0")}`;
      while (await prisma.customer.findUnique({ where: { customerCode }, select: { id: true } })) {
        customerCode = `CUST-${String(++custSeq).padStart(5, "0")}`;
      }

      const customer = await prisma.customer.create({
        data: {
          customerCode,
          fullName: lead.name,
          phoneNumber: lead.phone,
          email: lead.email || `${lead.phone}@customer.swayog.com`,
          city: lead.address ? lead.address.split(",")[0].trim() : "Unknown",
          address: lead.address || "Address pending verification",
          systemSizeKw: 3.0,
          installationDate: new Date(),
          status: "ACTIVE",
        },
      });

      try {
        const { LiaisoningService } = await import("../liaisoning/liaisoning.service.js");
        await LiaisoningService.initializeApplication(customer.id, lead.createdById || "system");
      } catch {
        // ignore liaisoning init if already present
      }
    }
  } catch (err) {
    console.warn("[MarketingService] syncConvertedMarketingLeads error:", err);
  }
}

/**
 * List all marketing leads with duplicate flags
 */
export async function listMarketingLeads() {
  await syncConvertedMarketingLeads();

  const leads = await prisma.marketingLead.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Calculate duplicate relationships among existing leads in the database
  const phoneCountMap = new Map<string, { count: number; firstLead: typeof leads[0] }>();
  const emailCountMap = new Map<string, { count: number; firstLead: typeof leads[0] }>();

  leads.forEach((l) => {
    const { normalized } = normalizePhoneNumber(l.phone);
    if (normalized) {
      const entry = phoneCountMap.get(normalized) || { count: 0, firstLead: l };
      entry.count++;
      phoneCountMap.set(normalized, entry);
    }

    if (l.email) {
      const normEmail = l.email.trim().toLowerCase();
      if (normEmail) {
        const entry = emailCountMap.get(normEmail) || { count: 0, firstLead: l };
        entry.count++;
        emailCountMap.set(normEmail, entry);
      }
    }
  });

  return leads.map((lead) => {
    const { normalized: normPhone } = normalizePhoneNumber(lead.phone);
    const normEmail = lead.email ? lead.email.trim().toLowerCase() : null;

    let isDuplicate = false;
    let duplicateReason: string | undefined;
    let matchedLeadName: string | undefined;

    const phoneMatch = normPhone ? phoneCountMap.get(normPhone) : null;
    const emailMatch = normEmail ? emailCountMap.get(normEmail) : null;

    if (phoneMatch && phoneMatch.count > 1) {
      isDuplicate = true;
      duplicateReason = `Duplicate Phone: ${lead.phone}`;
      if (phoneMatch.firstLead.id !== lead.id) {
        matchedLeadName = phoneMatch.firstLead.name;
      }
    } else if (emailMatch && emailMatch.count > 1) {
      isDuplicate = true;
      duplicateReason = `Duplicate Email: ${lead.email}`;
      if (emailMatch.firstLead.id !== lead.id) {
        matchedLeadName = emailMatch.firstLead.name;
      }
    }

    return {
      ...lead,
      isDuplicate,
      duplicateReason,
      matchedLeadName,
    };
  });
}

export async function getMarketingLeadConversionStats(month: string, timezoneOffsetMinutes: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1) + timezoneOffsetMinutes * 60_000);
  const nextMonthStart = new Date(Date.UTC(year, monthNumber, 1) + timezoneOffsetMinutes * 60_000);
  const convertedStatus = { equals: "Converted", mode: "insensitive" as const };

  const [convertedCount, monthlyConvertedCount] = await Promise.all([
    prisma.marketingLead.count({
      where: { status: convertedStatus },
    }),
    prisma.marketingLead.count({
      where: {
        status: convertedStatus,
        convertedAt: { gte: monthStart, lt: nextMonthStart },
      },
    }),
  ]);

  return { month, convertedCount, monthlyConvertedCount };
}

/**
 * Create a single marketing lead with strict validation & duplicate detection
 */
export async function createMarketingLead(auth: AuthContext, input: CreateMarketingLeadInput) {
  const name = normalizeText(input.name);
  if (!name || name.length < 2) {
    throw new ApiError(400, "Client name is required (minimum 2 characters).");
  }

  const phoneRes = normalizePhoneNumber(input.phone);
  if (!phoneRes.isValid) {
    throw new ApiError(400, phoneRes.error || "A valid 10-digit Indian mobile number is required.");
  }

  const emailRes = normalizeEmail(input.email);
  if (!emailRes.isValid) {
    throw new ApiError(400, emailRes.error || "Invalid email address format.");
  }

  const address = normalizeText(input.address);
  if (!address) {
    throw new ApiError(400, "Client address is required.");
  }

  // Duplicate Check against DB
  const duplicateCheck = await checkExistingClientDuplicate({
    phone: phoneRes.normalized,
    email: emailRes.normalized,
    name,
    address,
  });

  if (duplicateCheck.isDuplicate) {
    throw new ApiError(
      409,
      `Duplicate Client Detected: ${duplicateCheck.reason}. Matched record: ${duplicateCheck.matchedWith || "Existing Record"}. Entry rejected.`
    );
  }

  return prisma.marketingLead.create({
    data: {
      name,
      phone: phoneRes.normalized,
      email: emailRes.normalized,
      address,
      source: input.source,
      createdById: auth.userId,
    },
  });
}

/**
 * Delete a marketing lead by ID and store in DeletedMarketingLead archive with remark
 */
export async function deleteMarketingLead(auth: AuthContext, id: string, remark?: string) {
  const existing = await prisma.marketingLead.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Marketing client record not found.");
  }

  const finalRemark = (remark || "").trim();
  if (!finalRemark || finalRemark.length < 3) {
    throw new ApiError(400, "A valid remark/reason (at least 3 characters) is required to delete this entry.");
  }

  // Look up deleter name
  let deleterName: string = auth.loginId || "Marketing Executive";
  if (auth.userId) {
    try {
      const userRecord = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { fullName: true, loginId: true },
      });
      if (userRecord?.fullName) {
        deleterName = userRecord.fullName;
      }
    } catch {
      // ignore user lookup error
    }
  }

  // Transaction: Archive into DeletedMarketingLead, delete followups, delete lead
  await prisma.$transaction([
    prisma.deletedMarketingLead.create({
      data: {
        originalLeadId: existing.id,
        name: existing.name,
        phone: existing.phone,
        email: existing.email,
        address: existing.address,
        source: existing.source,
        status: existing.status,
        assignedTo: existing.assignedTo,
        followUpAt: existing.followUpAt,
        deleteRemark: finalRemark,
        deletedById: auth.userId || null,
        deletedByName: deleterName,
        convertedAt: existing.convertedAt,
        createdAt: existing.createdAt,
      },
    }),
    prisma.marketingFollowUp.deleteMany({
      where: { leadId: id },
    }),
    prisma.marketingLead.delete({
      where: { id },
    }),
  ]);

  return {
    success: true,
    message: `Client "${existing.name}" moved to deleted entries archive.`,
    id,
  };
}

/**
 * List all deleted marketing leads
 */
export async function listDeletedMarketingLeads(_auth: AuthContext) {
  return prisma.deletedMarketingLead.findMany({
    orderBy: { deletedAt: "desc" },
  });
}

/**
 * Restore a deleted marketing lead back to active leads
 */
export async function restoreDeletedMarketingLead(auth: AuthContext, id: string) {
  const archived = await prisma.deletedMarketingLead.findUnique({
    where: { id },
  });

  if (!archived) {
    throw new ApiError(404, "Deleted record not found in archive.");
  }

  // Check if active lead with this phone already exists
  const existingActive = await prisma.marketingLead.findUnique({
    where: { phone: archived.phone },
  });

  if (existingActive) {
    throw new ApiError(
      409,
      `Cannot restore: An active client with phone "${archived.phone}" already exists ("${existingActive.name}").`
    );
  }

  const restored = await prisma.$transaction(async (tx) => {
    const newLead = await tx.marketingLead.create({
      data: {
        name: archived.name,
        phone: archived.phone,
        email: archived.email,
        address: archived.address,
        source: archived.source,
        status: archived.status,
        convertedAt: archived.convertedAt,
        assignedTo: archived.assignedTo,
        followUpAt: archived.followUpAt,
        createdById: auth.userId || null,
      },
    });

    await tx.deletedMarketingLead.delete({
      where: { id },
    });

    return newLead;
  });

  return {
    success: true,
    message: `Client "${archived.name}" successfully restored to active leads.`,
    lead: restored,
  };
}

export async function updateMarketingLead(id: string, input: UpdateMarketingLeadInput) {
  try {
    const existing = await prisma.marketingLead.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Marketing lead not found.");
    }

    const isConverting = input.status?.toLowerCase() === "converted";
    const wasConverted = existing.status.toLowerCase() === "converted";
    const updated = await prisma.marketingLead.update({
      where: { id },
      data: {
        ...input,
        ...(isConverting && (!wasConverted || !existing.convertedAt) ? { convertedAt: new Date() } : {}),
        ...(input.status && !isConverting && wasConverted ? { convertedAt: null } : {}),
      },
    });

    if (isConverting) {
      await syncConvertedMarketingLeads();
    }

    return updated;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === "P2022") {
        throw new ApiError(
          503,
          "The marketing database schema is missing a required column. Deploy pending Prisma migrations and retry the status update.",
        );
      }
    }
    throw error;
  }
}

/**
 * Bulk upload and import with comprehensive individual row validation and duplicate prevention
 */
export async function bulkImportMarketingLeads(
  auth: AuthContext,
  leadsRaw: Array<{
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    source?: string;
    status?: string;
    assignedTo?: string | null;
  }>
) {
  const total = leadsRaw.length;
  const successful: any[] = [];
  const duplicatesRejected: Array<{
    row: number;
    name: string;
    phone: string;
    email?: string;
    reason: string;
    matchedWith?: string;
    status: "DUPLICATE";
  }> = [];
  const invalidRejected: Array<{
    row: number;
    name: string;
    phone?: string;
    reason: string;
    status: "INVALID";
  }> = [];

  // Track intra-file seen keys
  const seenPhones = new Map<string, number>(); // phone -> rowNumber
  const seenEmails = new Map<string, number>(); // email -> rowNumber
  const seenAddressKeys = new Map<string, number>(); // name+addr -> rowNumber

  // Fetch all existing database phones and emails for fast in-memory lookup during bulk processing
  const [existingDbLeads, existingDbCustomers, existingDbOnboarding] = await Promise.all([
    prisma.marketingLead.findMany({ select: { id: true, name: true, phone: true, email: true, address: true } }),
    prisma.customer.findMany({ select: { id: true, fullName: true, customerCode: true, phoneNumber: true, email: true, address: true } }),
    prisma.onboardingRequest.findMany({ select: { id: true, customerName: true, requestNumber: true, phoneNumber: true, email: true } }),
  ]);

  const dbPhoneMap = new Map<string, string>(); // normalizedPhone -> matchedDescription
  const dbEmailMap = new Map<string, string>(); // normalizedEmail -> matchedDescription
  const dbNameAddrMap = new Map<string, string>(); // name__addr -> matchedDescription

  existingDbLeads.forEach((l) => {
    const { normalized } = normalizePhoneNumber(l.phone);
    if (normalized) dbPhoneMap.set(normalized, `${l.name} (Marketing Lead)`);
    if (l.email) dbEmailMap.set(l.email.trim().toLowerCase(), `${l.name} (Marketing Lead)`);
    if (l.name && l.address) dbNameAddrMap.set(getAddressFuzzyKey(l.name, l.address), `${l.name} (Marketing Lead)`);
  });

  existingDbCustomers.forEach((c) => {
    const { normalized } = normalizePhoneNumber(c.phoneNumber);
    if (normalized) dbPhoneMap.set(normalized, `${c.fullName} (${c.customerCode})`);
    if (c.email) dbEmailMap.set(c.email.trim().toLowerCase(), `${c.fullName} (${c.customerCode})`);
    if (c.fullName && c.address) dbNameAddrMap.set(getAddressFuzzyKey(c.fullName, c.address), `${c.fullName} (${c.customerCode})`);
  });

  existingDbOnboarding.forEach((o) => {
    const { normalized } = normalizePhoneNumber(o.phoneNumber);
    if (normalized) dbPhoneMap.set(normalized, `${o.customerName} (${o.requestNumber})`);
    if (o.email) dbEmailMap.set(o.email.trim().toLowerCase(), `${o.customerName} (${o.requestNumber})`);
  });

  const validToInsert: Array<{
    name: string;
    phone: string;
    email: string | null;
    address: string;
    source: string;
    status: string;
    assignedTo: string | null;
    createdById: string;
  }> = [];

  for (let i = 0; i < leadsRaw.length; i++) {
    const rowNum = i + 2; // Excel row indexing (1 is header)
    const raw = leadsRaw[i];

    // 1. Validate Name
    const name = normalizeText(raw.name);
    if (!name || name.length < 2) {
      invalidRejected.push({
        row: rowNum,
        name: raw.name || "â€”",
        phone: raw.phone || "â€”",
        reason: "Client name is required (minimum 2 characters)",
        status: "INVALID",
      });
      continue;
    }

    // 2. Validate Phone
    const phoneRes = normalizePhoneNumber(raw.phone);
    if (!phoneRes.isValid) {
      invalidRejected.push({
        row: rowNum,
        name,
        phone: raw.phone || "â€”",
        reason: phoneRes.error || "Invalid 10-digit Indian mobile number",
        status: "INVALID",
      });
      continue;
    }
    const phone = phoneRes.normalized;

    // 3. Validate Email
    const emailRes = normalizeEmail(raw.email);
    if (!emailRes.isValid) {
      invalidRejected.push({
        row: rowNum,
        name,
        phone,
        reason: emailRes.error || "Invalid email format",
        status: "INVALID",
      });
      continue;
    }
    const email = emailRes.normalized;

    // 4. Validate Address
    const address = normalizeText(raw.address);
    if (!address) {
      invalidRejected.push({
        row: rowNum,
        name,
        phone,
        reason: "Address cannot be empty",
        status: "INVALID",
      });
      continue;
    }

    // 5. Intra-file duplicate check: Phone
    if (seenPhones.has(phone)) {
      const priorRow = seenPhones.get(phone);
      duplicatesRejected.push({
        row: rowNum,
        name,
        phone,
        email: email || undefined,
        reason: `Duplicate mobile number in upload (matches row ${priorRow})`,
        matchedWith: `Row ${priorRow} in same file`,
        status: "DUPLICATE",
      });
      continue;
    }

    // 6. Intra-file duplicate check: Email
    if (email && seenEmails.has(email)) {
      const priorRow = seenEmails.get(email);
      duplicatesRejected.push({
        row: rowNum,
        name,
        phone,
        email,
        reason: `Duplicate email address in upload (matches row ${priorRow})`,
        matchedWith: `Row ${priorRow} in same file`,
        status: "DUPLICATE",
      });
      continue;
    }

    // 7. Intra-file duplicate check: Name + Address
    const nameAddrKey = getAddressFuzzyKey(name, address);
    if (seenAddressKeys.has(nameAddrKey)) {
      const priorRow = seenAddressKeys.get(nameAddrKey);
      duplicatesRejected.push({
        row: rowNum,
        name,
        phone,
        email: email || undefined,
        reason: `Duplicate client name and address in upload (matches row ${priorRow})`,
        matchedWith: `Row ${priorRow} in same file`,
        status: "DUPLICATE",
      });
      continue;
    }

    // 8. Database duplicate check: Phone
    if (dbPhoneMap.has(phone)) {
      const matched = dbPhoneMap.get(phone);
      duplicatesRejected.push({
        row: rowNum,
        name,
        phone,
        email: email || undefined,
        reason: `Mobile number already exists in CRM database`,
        matchedWith: matched,
        status: "DUPLICATE",
      });
      continue;
    }

    // 9. Database duplicate check: Email
    if (email && dbEmailMap.has(email)) {
      const matched = dbEmailMap.get(email);
      duplicatesRejected.push({
        row: rowNum,
        name,
        phone,
        email,
        reason: `Email address already exists in CRM database`,
        matchedWith: matched,
        status: "DUPLICATE",
      });
      continue;
    }

    // 10. Database duplicate check: Name + Address
    if (dbNameAddrMap.has(nameAddrKey)) {
      const matched = dbNameAddrMap.get(nameAddrKey);
      duplicatesRejected.push({
        row: rowNum,
        name,
        phone,
        email: email || undefined,
        reason: `Client with identical name and address already exists in CRM database`,
        matchedWith: matched,
        status: "DUPLICATE",
      });
      continue;
    }

    // Mark as seen in this file
    seenPhones.set(phone, rowNum);
    if (email) seenEmails.set(email, rowNum);
    seenAddressKeys.set(nameAddrKey, rowNum);

    // Also update our in-memory DB map so subsequent rows in this same bulk upload detect it
    dbPhoneMap.set(phone, `${name} (This upload)`);
    if (email) dbEmailMap.set(email, `${name} (This upload)`);
    dbNameAddrMap.set(nameAddrKey, `${name} (This upload)`);

    // Valid unique lead ready to insert
    const validSource = ["Website", "Campaign", "Referral", "Partner", "Other"].includes(raw.source || "")
      ? (raw.source as string)
      : "Website";
    const validStatus = ["New", "Contacted", "Qualified", "Converted", "Disqualified"].includes(raw.status || "")
      ? (raw.status as string)
      : "New";

    validToInsert.push({
      name,
      phone,
      email: email || null,
      address,
      source: validSource,
      status: validStatus,
      assignedTo: raw.assignedTo ? normalizeText(raw.assignedTo) : null,
      createdById: auth.userId,
    });
  }

  // Insert valid unique records into database
  if (validToInsert.length > 0) {
    for (const lead of validToInsert) {
      const created = await prisma.marketingLead.create({
        data: lead,
      });
      successful.push(created);
    }
  }

  return {
    total,
    successful: successful.length,
    duplicatesCount: duplicatesRejected.length,
    invalidCount: invalidRejected.length,
    duplicatesRejected,
    invalidRejected,
  };
}

export async function listMarketingCampaigns() {
  return prisma.marketingCampaign.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createMarketingCampaign(auth: AuthContext, input: CreateMarketingCampaignInput) {
  return prisma.marketingCampaign.create({
    data: {
      ...input,
      startDate: input.startDate || null,
      createdById: auth.userId,
    },
  });
}

export async function updateMarketingCampaign(id: string, status: "Planned" | "Active" | "Completed") {
  return prisma.marketingCampaign.update({
    where: { id },
    data: { status },
  });
}

export async function listMarketingFollowUps() {
  return prisma.marketingFollowUp.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "desc" }],
  });
}

export async function createMarketingFollowUp(auth: AuthContext, input: CreateMarketingFollowUpInput) {
  return prisma.marketingFollowUp.create({
    data: {
      ...input,
      createdById: auth.userId,
    },
  });
}

export async function updateMarketingFollowUp(id: string, done: boolean) {
  return prisma.marketingFollowUp.update({
    where: { id },
    data: { done },
  });
}

export async function importMarketingWorkspace(auth: AuthContext, input: ImportMarketingWorkspaceInput) {
  // If leads are provided, run through our duplicate-safe bulk importer!
  let leadImportSummary: any = null;
  if (input.leads.length) {
    leadImportSummary = await bulkImportMarketingLeads(auth, input.leads);
  }

  const [campaigns, followUps] = await Promise.all([
    input.campaigns.length
      ? prisma.marketingCampaign.createMany({
        data: input.campaigns.map((campaign) => ({
          ...campaign,
          startDate: campaign.startDate || null,
          createdById: auth.userId,
        })),
        skipDuplicates: true,
      })
      : { count: 0 },
    input.followUps.length
      ? prisma.marketingFollowUp.createMany({
        data: input.followUps.map((followUp) => ({
          ...followUp,
          createdById: auth.userId,
        })),
        skipDuplicates: true,
      })
      : { count: 0 },
  ]);

  return {
    leads: leadImportSummary || { total: 0, successful: 0, duplicatesCount: 0, invalidCount: 0, duplicatesRejected: [], invalidRejected: [] },
    campaigns: campaigns.count,
    followUps: followUps.count,
  };
}
