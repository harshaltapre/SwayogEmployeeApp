import { prisma } from "./prisma.js";

/**
 * Extracts 2-letter uppercase initials from a partner's full name or business name.
 * Examples:
 * - "Rahul Sharma" -> "RS"
 * - "Yogesh Tayade" -> "YT"
 * - "Swati Tayade" -> "ST"
 * - "Swayog" -> "SW"
 */
export function extractPartnerInitials(name?: string | null): string {
  if (!name || !name.trim()) {
    return "PT";
  }

  const clean = name.trim().replace(/[^a-zA-Z\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const first = words[0][0].toUpperCase();
    const second = words[1][0].toUpperCase();
    return `${first}${second}`;
  }

  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }

  if (words.length === 1 && words[0].length === 1) {
    return `${words[0][0].toUpperCase()}X`;
  }

  return "PT";
}

/**
 * Get or generate and persist a unique partner code (e.g. RS01, YT01) for a PartnerProfile.
 */
export async function getOrGeneratePartnerCode(
  partnerId: string,
  fallbackNameOrTx?: string | any,
  explicitTx?: any
): Promise<string> {
  const isTx =
    fallbackNameOrTx &&
    typeof fallbackNameOrTx === "object" &&
    ("partnerProfile" in fallbackNameOrTx || "$queryRaw" in fallbackNameOrTx);
  const db = explicitTx || (isTx ? fallbackNameOrTx : prisma);
  const fallbackName = typeof fallbackNameOrTx === "string" ? fallbackNameOrTx : undefined;

  const partnerProfile = await db.partnerProfile.findUnique({
    where: { id: partnerId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          employeeCode: true,
        },
      },
    },
  });

  if (!partnerProfile) {
    throw new Error(`Partner profile not found for id: ${partnerId}`);
  }

  if (partnerProfile.partnerCode) {
    return partnerProfile.partnerCode;
  }

  // Derive initials from partner user's full name or business name
  const nameToUse =
    partnerProfile.user?.fullName ||
    partnerProfile.businessName ||
    fallbackName ||
    "Partner";
  const initials = extractPartnerInitials(nameToUse);

  // Find all existing partner profiles with codes starting with these initials
  const existingWithInitials = await db.partnerProfile.findMany({
    where: {
      partnerCode: {
        startsWith: initials,
      },
    },
    select: {
      partnerCode: true,
    },
  });

  let maxSuffix = 0;
  const regex = new RegExp(`^${initials}(\\d+)$`, "i");

  for (const p of existingWithInitials) {
    if (p.partnerCode) {
      const match = p.partnerCode.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSuffix) {
          maxSuffix = num;
        }
      }
    }
  }

  const nextSuffix = maxSuffix + 1;
  const partnerCode = `${initials}${String(nextSuffix).padStart(2, "0")}`;

  // Persist to PartnerProfile
  await db.partnerProfile.update({
    where: { id: partnerId },
    data: { partnerCode },
  });

  return partnerCode;
}

/**
 * Generates next Customer ID for a partner:
 * Format: SWY-{PARTNER_INITIALS}-{YYMM}-{SEQUENCE}
 * Example: SWY-RS01-2610-0001
 *
 * Safe under concurrency.
 */
export async function generatePartnerCustomerId(
  partnerId: string,
  registrationDate: Date = new Date(),
  txPrisma?: any
): Promise<{ customerId: string; partnerCode: string }> {
  const db = txPrisma || prisma;

  const partnerCode = await getOrGeneratePartnerCode(partnerId, db);

  const fullYear = registrationDate.getFullYear();
  const yy = String(fullYear % 100).padStart(2, "0");
  const mm = String(registrationDate.getMonth() + 1).padStart(2, "0");
  const yymm = `${yy}${mm}`;

  const prefix = `SWY-${partnerCode}-${yymm}-`;

  // Find existing customers for this prefix to determine the next sequence
  const existingCustomers = await db.customer.findMany({
    where: {
      customerCode: {
        startsWith: prefix,
      },
    },
    select: {
      customerCode: true,
    },
  });

  let maxSeq = 0;
  const seqRegex = new RegExp(`^${prefix}(\\d+)$`);

  for (const c of existingCustomers) {
    if (c.customerCode) {
      const match = c.customerCode.match(seqRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;

  // Ensure uniqueness across Customer.customerCode and User.loginId
  while (true) {
    const [collidingCustomer, collidingUser] = await Promise.all([
      db.customer.findUnique({
        where: { customerCode: candidate },
        select: { id: true },
      }),
      db.user.findUnique({
        where: { loginId: candidate },
        select: { id: true },
      }),
    ]);

    if (!collidingCustomer && !collidingUser) {
      break;
    }

    nextSeq += 1;
    candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;
  }

  return { customerId: candidate, partnerCode };
}
