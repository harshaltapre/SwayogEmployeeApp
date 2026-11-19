import { randomUUID } from "node:crypto";
import { LedgerAccountType, Prisma, VendorBillStatus } from "@prisma/client";
import { isMockMode, prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";

export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Generates a collision-resistant, human-readable document number without relying on `COUNT(*) + 1`,
 * which can fail with P2002 unique constraint errors under concurrency or after deletions.
 */
export function generateDocNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const timePart = Date.now().toString(36).slice(-5).toUpperCase();
  const randPart = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${prefix}-${year}-${timePart}${randPart}`;
}

export const SYSTEM_CHART_OF_ACCOUNTS: Array<{
  code: string;
  name: string;
  accountType: LedgerAccountType;
}> = [
  { code: "1001", name: "Cash in Hand", accountType: LedgerAccountType.ASSET },
  { code: "1010", name: "Primary Bank Account", accountType: LedgerAccountType.ASSET },
  { code: "1100", name: "Accounts Receivable (Customers)", accountType: LedgerAccountType.ASSET },
  { code: "1200", name: "Solar Inventory & Materials", accountType: LedgerAccountType.ASSET },
  { code: "1310", name: "Input CGST Receivable (ITC)", accountType: LedgerAccountType.ASSET },
  { code: "1320", name: "Input SGST Receivable (ITC)", accountType: LedgerAccountType.ASSET },
  { code: "1330", name: "Input IGST Receivable (ITC)", accountType: LedgerAccountType.ASSET },
  { code: "2000", name: "Accounts Payable (Vendors)", accountType: LedgerAccountType.LIABILITY },
  { code: "2110", name: "Output CGST Payable", accountType: LedgerAccountType.LIABILITY },
  { code: "2120", name: "Output SGST Payable", accountType: LedgerAccountType.LIABILITY },
  { code: "2130", name: "Output IGST Payable", accountType: LedgerAccountType.LIABILITY },
  { code: "2200", name: "TDS Payable (Statutory)", accountType: LedgerAccountType.LIABILITY },
  { code: "2300", name: "Partner Commission Payable", accountType: LedgerAccountType.LIABILITY },
  { code: "2400", name: "Employee Payroll Payable", accountType: LedgerAccountType.LIABILITY },
  { code: "3000", name: "Opening Balance Equity", accountType: LedgerAccountType.EQUITY },
  { code: "4000", name: "Solar EPC & Installation Revenue", accountType: LedgerAccountType.INCOME },
  { code: "4100", name: "AMC & O&M Service Revenue", accountType: LedgerAccountType.INCOME },
  { code: "5000", name: "Direct Material & Subcontractor Cost", accountType: LedgerAccountType.EXPENSE },
  { code: "5100", name: "Site & Operational Expenses", accountType: LedgerAccountType.EXPENSE },
  { code: "5200", name: "Partner Commission Expense", accountType: LedgerAccountType.EXPENSE },
  { code: "5300", name: "Employee Salaries & Wages", accountType: LedgerAccountType.EXPENSE },
];

// ---------------------------------------------------------------------------
// One-time Idempotent Schema Bootstrap & In-Memory Caches
// ---------------------------------------------------------------------------

let schemaReadyPromise: Promise<void> | null = null;
let cachedAccountMap: Map<string, string> | null = null;
let lastSupplierSyncAt = 0;
const SUPPLIER_SYNC_TTL_MS = 5 * 60 * 1000; // 5 minutes

const BOOTSTRAP_SQL_STATEMENTS = [
  `DO $$ BEGIN CREATE TYPE "VendorBillStatus" AS ENUM ('DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "Vendor" ("id" TEXT NOT NULL, "vendorCode" TEXT NOT NULL, "name" TEXT NOT NULL, "vendorType" TEXT NOT NULL DEFAULT 'MATERIAL_SUPPLIER', "gstin" TEXT, "pan" TEXT, "contactPerson" TEXT, "phone" TEXT, "email" TEXT, "address" TEXT, "state" TEXT, "pinCode" TEXT, "bankAccountName" TEXT, "bankAccountNumber" TEXT, "ifscCode" TEXT, "paymentTermsDays" INTEGER NOT NULL DEFAULT 30, "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0, "tdsApplicable" BOOLEAN NOT NULL DEFAULT false, "defaultTdsRate" DOUBLE PRECISION NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id"));`,
  `CREATE TABLE IF NOT EXISTS "VendorBill" ("id" TEXT NOT NULL, "billNumber" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "vendorInvoiceNo" TEXT NOT NULL, "invoiceDate" TIMESTAMP(3) NOT NULL, "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dueDate" TIMESTAMP(3) NOT NULL, "purchaseOrderRef" TEXT, "grnRef" TEXT, "customerId" INTEGER, "zone" TEXT, "category" TEXT NOT NULL DEFAULT 'Material Purchase', "supplyType" TEXT NOT NULL DEFAULT 'INTRA_STATE', "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0, "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0, "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "tdsRate" DOUBLE PRECISION NOT NULL DEFAULT 0, "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "netPayable" DOUBLE PRECISION NOT NULL DEFAULT 0, "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0, "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0, "itcEligible" BOOLEAN NOT NULL DEFAULT true, "billableToCustomer" BOOLEAN NOT NULL DEFAULT false, "status" "VendorBillStatus" NOT NULL DEFAULT 'DRAFT', "attachmentUrl" TEXT, "notes" TEXT, "createdById" TEXT, "approvedById" TEXT, "approvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id"));`,
  `CREATE TABLE IF NOT EXISTS "VendorBillItem" ("id" TEXT NOT NULL, "billId" TEXT NOT NULL, "inventoryItemId" INTEGER, "itemName" TEXT NOT NULL, "description" TEXT, "hsnSac" TEXT, "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1, "unit" TEXT NOT NULL DEFAULT 'unit', "rate" DOUBLE PRECISION NOT NULL DEFAULT 0, "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0, "taxableValue" DOUBLE PRECISION NOT NULL DEFAULT 0, "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18, "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, CONSTRAINT "VendorBillItem_pkey" PRIMARY KEY ("id"));`,
  `CREATE TABLE IF NOT EXISTS "VendorPayment" ("id" TEXT NOT NULL, "paymentNumber" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "billId" TEXT, "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "amount" DOUBLE PRECISION NOT NULL, "tdsDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0, "paymentMode" TEXT NOT NULL DEFAULT 'NEFT', "referenceNo" TEXT, "bankAccount" TEXT, "notes" TEXT, "proofUrl" TEXT, "createdById" TEXT, "approvedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id"));`,
  `CREATE TABLE IF NOT EXISTS "LedgerAccount" ("id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "accountType" "LedgerAccountType" NOT NULL, "isSystem" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id"));`,
  `CREATE TABLE IF NOT EXISTS "JournalEntry" ("id" TEXT NOT NULL, "entryNumber" TEXT NOT NULL, "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "referenceType" TEXT NOT NULL, "referenceId" TEXT, "description" TEXT NOT NULL, "isReversed" BOOLEAN NOT NULL DEFAULT false, "reversedByEntryId" TEXT, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id"));`,
  `CREATE TABLE IF NOT EXISTS "JournalLine" ("id" TEXT NOT NULL, "entryId" TEXT NOT NULL, "accountId" TEXT NOT NULL, "debit" DOUBLE PRECISION NOT NULL DEFAULT 0, "credit" DOUBLE PRECISION NOT NULL DEFAULT 0, "vendorId" TEXT, "customerId" INTEGER, "zone" TEXT, "memo" TEXT, CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id"));`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_vendorCode_key" ON "Vendor"("vendorCode");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VendorBill_billNumber_key" ON "VendorBill"("billNumber");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VendorBill_vendorId_vendorInvoiceNo_key" ON "VendorBill"("vendorId", "vendorInvoiceNo");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VendorPayment_paymentNumber_key" ON "VendorPayment"("paymentNumber");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LedgerAccount_code_key" ON "LedgerAccount"("code");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");`,
];

/**
 * Ensures the Finance ERP tables exist in the database once per process lifecycle.
 * Prevents P2021 ("Table does not exist") errors even on environments where migrations haven't run yet.
 */
export async function ensureFinanceSchemaReady(): Promise<void> {
  if (isMockMode()) return;
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    try {
      // Quick check: if LedgerAccount already exists, skip DDL bootstrap
      await prisma.ledgerAccount.count();
    } catch (err: any) {
      if (err?.code === "P2021" || String(err?.message || "").includes("does not exist")) {
        for (const sql of BOOTSTRAP_SQL_STATEMENTS) {
          try {
            await prisma.$executeRawUnsafe(sql);
          } catch {
            // Ignore individual DDL errors (e.g. already exists)
          }
        }
      }
    }
  })().catch(() => {
    // Reset only on transient failure so future calls can retry
    schemaReadyPromise = null;
  });

  return schemaReadyPromise;
}

export type BillItemInput = {
  inventoryItemId?: number | null;
  itemName: string;
  description?: string | null;
  hsnSac?: string | null;
  quantity: number;
  unit?: string | null;
  rate: number;
  discountPct?: number | null;
  gstRate?: number | null;
};

export type CalculatedBillItem = {
  inventoryItemId: number | null;
  itemName: string;
  description: string | null;
  hsnSac: string | null;
  quantity: number;
  unit: string;
  rate: number;
  discountPct: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
};

export type CalculatedBillSummary = {
  supplyType: "INTRA_STATE" | "INTER_STATE";
  items: CalculatedBillItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  otherCharges: number;
  totalAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netPayable: number;
};

export function calculateBillTotals(input: {
  items: BillItemInput[];
  supplyType?: string | null;
  otherCharges?: number | null;
  tdsRate?: number | null;
}): CalculatedBillSummary {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new ApiError(400, "At least one line item is required for a vendor bill.");
  }

  const supplyType = String(input.supplyType || "INTRA_STATE").toUpperCase() === "INTER_STATE"
    ? "INTER_STATE"
    : "INTRA_STATE";

  let subtotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const calculatedItems: CalculatedBillItem[] = input.items.map((raw, idx) => {
    const itemName = String(raw.itemName ?? "").trim();
    if (!itemName) throw new ApiError(400, `Line item #${idx + 1} requires an item name.`);
    const quantity = Number(raw.quantity);
    const rate = Number(raw.rate);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, `Line item '${itemName}' must have a positive quantity.`);
    }
    if (!Number.isFinite(rate) || rate < 0) {
      throw new ApiError(400, `Line item '${itemName}' must have a non-negative rate.`);
    }
    const discountPct = Math.min(Math.max(Number(raw.discountPct ?? 0) || 0, 0), 100);
    const gstRate = Math.min(Math.max(Number(raw.gstRate ?? 18) || 0, 0), 28);

    const gross = round2(quantity * rate);
    const disc = round2(gross * (discountPct / 100));
    const taxable = round2(gross - disc);
    const totalGst = round2(taxable * (gstRate / 100));

    let itemCgst = 0;
    let itemSgst = 0;
    let itemIgst = 0;
    if (supplyType === "INTER_STATE") {
      itemIgst = totalGst;
    } else {
      itemCgst = round2(totalGst / 2);
      itemSgst = round2(totalGst - itemCgst);
    }

    const lineTotal = round2(taxable + itemCgst + itemSgst + itemIgst);

    subtotal = round2(subtotal + gross);
    discountAmount = round2(discountAmount + disc);
    taxableAmount = round2(taxableAmount + taxable);
    cgstAmount = round2(cgstAmount + itemCgst);
    sgstAmount = round2(sgstAmount + itemSgst);
    igstAmount = round2(igstAmount + itemIgst);

    return {
      inventoryItemId: raw.inventoryItemId ? Number(raw.inventoryItemId) : null,
      itemName,
      description: raw.description ? String(raw.description).trim() : null,
      hsnSac: raw.hsnSac ? String(raw.hsnSac).trim() : null,
      quantity: round2(quantity),
      unit: raw.unit ? String(raw.unit).trim() : "unit",
      rate: round2(rate),
      discountPct: round2(discountPct),
      taxableValue: taxable,
      gstRate: round2(gstRate),
      cgstAmount: itemCgst,
      sgstAmount: itemSgst,
      igstAmount: itemIgst,
      totalAmount: lineTotal,
    };
  });

  const otherCharges = round2(Math.max(Number(input.otherCharges ?? 0) || 0, 0));
  const totalAmount = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount + otherCharges);
  const tdsRate = Math.min(Math.max(Number(input.tdsRate ?? 0) || 0, 0), 30);
  // Per CBDT Circular 23/2017, TDS is deducted on taxable value excluding GST.
  const tdsAmount = round2(taxableAmount * (tdsRate / 100));
  const netPayable = round2(Math.max(totalAmount - tdsAmount, 0));

  return {
    supplyType,
    items: calculatedItems,
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    otherCharges,
    totalAmount,
    tdsRate: round2(tdsRate),
    tdsAmount,
    netPayable,
  };
}

export type ProposedJournalLine = {
  accountCode: string;
  debit: number;
  credit: number;
  vendorId?: string | null;
  customerId?: number | null;
  zone?: string | null;
  memo?: string;
};

export function assertBalancedLines(lines: ProposedJournalLine[]): void {
  if (lines.length < 2) {
    throw new ApiError(500, "Journal entry requires at least two lines.");
  }
  const totalDebit = round2(lines.reduce((s, l) => s + round2(l.debit), 0));
  const totalCredit = round2(lines.reduce((s, l) => s + round2(l.credit), 0));
  if (Math.abs(totalDebit - totalCredit) > 0.01 || totalDebit <= 0) {
    throw new ApiError(
      500,
      `Unbalanced journal entry rejected: Debit ₹${totalDebit} != Credit ₹${totalCredit}`
    );
  }
}

export function buildVendorBillJournalLines(bill: {
  vendorId: string;
  customerId?: number | null;
  zone?: string | null;
  category?: string | null;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  otherCharges: number;
  totalAmount: number;
  tdsAmount: number;
  netPayable: number;
  itcEligible: boolean;
  vendorInvoiceNo: string;
}): ProposedJournalLine[] {
  const isMaterialOrSubcontract =
    !bill.category ||
    /material|panel|inverter|cable|structure|subcontract|installation|epc/i.test(bill.category);
  const expenseAccountCode = isMaterialOrSubcontract ? "5000" : "5100";

  const lines: ProposedJournalLine[] = [];

  if (bill.itcEligible) {
    const baseCost = round2(bill.taxableAmount + bill.otherCharges);
    if (baseCost > 0) {
      lines.push({
        accountCode: expenseAccountCode,
        debit: baseCost,
        credit: 0,
        vendorId: bill.vendorId,
        customerId: bill.customerId ?? null,
        zone: bill.zone ?? null,
        memo: `Vendor Bill ${bill.vendorInvoiceNo} - Base Cost`,
      });
    }
    if (bill.cgstAmount > 0) {
      lines.push({
        accountCode: "1310",
        debit: round2(bill.cgstAmount),
        credit: 0,
        vendorId: bill.vendorId,
        memo: `Input CGST on ${bill.vendorInvoiceNo}`,
      });
    }
    if (bill.sgstAmount > 0) {
      lines.push({
        accountCode: "1320",
        debit: round2(bill.sgstAmount),
        credit: 0,
        vendorId: bill.vendorId,
        memo: `Input SGST on ${bill.vendorInvoiceNo}`,
      });
    }
    if (bill.igstAmount > 0) {
      lines.push({
        accountCode: "1330",
        debit: round2(bill.igstAmount),
        credit: 0,
        vendorId: bill.vendorId,
        memo: `Input IGST on ${bill.vendorInvoiceNo}`,
      });
    }
  } else {
    lines.push({
      accountCode: expenseAccountCode,
      debit: round2(bill.totalAmount),
      credit: 0,
      vendorId: bill.vendorId,
      customerId: bill.customerId ?? null,
      zone: bill.zone ?? null,
      memo: `Vendor Bill ${bill.vendorInvoiceNo} (ITC Ineligible)`,
    });
  }

  if (bill.tdsAmount > 0) {
    lines.push({
      accountCode: "2200",
      debit: 0,
      credit: round2(bill.tdsAmount),
      vendorId: bill.vendorId,
      memo: `TDS deducted on ${bill.vendorInvoiceNo}`,
    });
  }

  lines.push({
    accountCode: "2000",
    debit: 0,
    credit: round2(bill.netPayable),
    vendorId: bill.vendorId,
    customerId: bill.customerId ?? null,
    zone: bill.zone ?? null,
    memo: `Payable for Vendor Bill ${bill.vendorInvoiceNo}`,
  });

  assertBalancedLines(lines);
  return lines;
}

export function buildVendorPaymentJournalLines(payment: {
  vendorId: string;
  amount: number;
  tdsDeducted?: number;
  paymentMode: string;
  referenceNo?: string | null;
  paymentNumber: string;
}): ProposedJournalLine[] {
  const tds = round2(payment.tdsDeducted ?? 0);
  const cashPaid = round2(payment.amount);
  const totalSettled = round2(cashPaid + tds);
  const isCash = String(payment.paymentMode).toUpperCase() === "CASH";
  const bankOrCashCode = isCash ? "1001" : "1010";

  const lines: ProposedJournalLine[] = [
    {
      accountCode: "2000",
      debit: totalSettled,
      credit: 0,
      vendorId: payment.vendorId,
      memo: `Vendor Payment ${payment.paymentNumber}${payment.referenceNo ? ` (${payment.referenceNo})` : ""}`,
    },
    {
      accountCode: bankOrCashCode,
      debit: 0,
      credit: cashPaid,
      vendorId: payment.vendorId,
      memo: `Paid via ${payment.paymentMode}${payment.referenceNo ? ` Ref: ${payment.referenceNo}` : ""}`,
    },
  ];

  if (tds > 0) {
    lines.push({
      accountCode: "2200",
      debit: 0,
      credit: tds,
      vendorId: payment.vendorId,
      memo: `TDS withheld on payment ${payment.paymentNumber}`,
    });
  }

  assertBalancedLines(lines);
  return lines;
}

export function computeBillPaymentStatus(params: {
  netPayable: number;
  amountPaid: number;
  dueDate: Date;
  currentStatus: VendorBillStatus;
  now?: Date;
}): { status: VendorBillStatus; balanceDue: number } {
  const paid = round2(params.amountPaid);
  const payable = round2(params.netPayable);
  const balanceDue = round2(Math.max(payable - paid, 0));
  const now = params.now ?? new Date();

  if (params.currentStatus === VendorBillStatus.CANCELLED || params.currentStatus === VendorBillStatus.DRAFT) {
    return { status: params.currentStatus, balanceDue };
  }

  if (balanceDue <= 0.009 && payable > 0) {
    return { status: VendorBillStatus.PAID, balanceDue: 0 };
  }
  if (paid > 0 && balanceDue > 0.009) {
    return { status: VendorBillStatus.PARTIALLY_PAID, balanceDue };
  }
  if (params.currentStatus === VendorBillStatus.APPROVED && params.dueDate.getTime() < now.getTime()) {
    return { status: VendorBillStatus.OVERDUE, balanceDue };
  }
  return { status: params.currentStatus, balanceDue };
}

/**
 * Ensures all 17 system Chart of Accounts rows exist and caches the `code -> id` map in memory
 * so subsequent GL postings require zero extra database lookups.
 */
export async function ensureSystemChartOfAccounts(
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<Map<string, string>> {
  if (cachedAccountMap && cachedAccountMap.size >= SYSTEM_CHART_OF_ACCOUNTS.length) {
    return cachedAccountMap;
  }

  await ensureFinanceSchemaReady();

  if (isMockMode()) {
    const mockMap = new Map<string, string>(
      SYSTEM_CHART_OF_ACCOUNTS.map((a) => [a.code, `mock_acc_${a.code}`])
    );
    cachedAccountMap = mockMap;
    return mockMap;
  }

  const existing = await tx.ledgerAccount.findMany({
    select: { id: true, code: true },
  });
  const map = new Map<string, string>(existing.map((a: { id: string; code: string }) => [a.code, a.id]));

  const missing = SYSTEM_CHART_OF_ACCOUNTS.filter((acc) => !map.has(acc.code));
  if (missing.length > 0) {
    await tx.ledgerAccount.createMany({
      data: missing.map((acc) => ({
        id: randomUUID(),
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        isSystem: true,
      })),
      skipDuplicates: true,
    });

    const refreshed = await tx.ledgerAccount.findMany({
      select: { id: true, code: true },
    });
    for (const row of refreshed) {
      map.set(row.code, row.id);
    }
  }

  if (map.size >= SYSTEM_CHART_OF_ACCOUNTS.length) {
    cachedAccountMap = map;
  }
  return map;
}

export async function postDoubleEntryJournal(
  tx: Prisma.TransactionClient,
  input: {
    entryDate?: Date;
    referenceType: string;
    referenceId?: string | null;
    description: string;
    createdById?: string | null;
    lines: ProposedJournalLine[];
  }
) {
  assertBalancedLines(input.lines);
  const accountMap = await ensureSystemChartOfAccounts(tx);
  const entryNumber = generateDocNumber("JE");

  return tx.journalEntry.create({
    data: {
      entryNumber,
      entryDate: input.entryDate ?? new Date(),
      referenceType: input.referenceType,
      referenceId: input.referenceId ?? null,
      description: input.description,
      createdById: input.createdById ?? null,
      lines: {
        create: input.lines.map((l) => {
          const accountId = accountMap.get(l.accountCode);
          if (!accountId) {
            throw new ApiError(500, `Missing ledger account code ${l.accountCode}`);
          }
          return {
            accountId,
            debit: round2(l.debit),
            credit: round2(l.credit),
            vendorId: l.vendorId ?? null,
            customerId: l.customerId ?? null,
            zone: l.zone ?? null,
            memo: l.memo ?? null,
          };
        }),
      },
    },
    include: { lines: true },
  });
}

/**
 * Fault-tolerant wrapper for posting GL journals from existing AR / Expense flows.
 * Ensures that even if the ledger tables are unavailable or in mock mode, the primary
 * invoice/expense operation never throws an unhandled error.
 */
export async function safePostDoubleEntryJournal(
  tx: Prisma.TransactionClient,
  input: Parameters<typeof postDoubleEntryJournal>[1]
): Promise<void> {
  if (isMockMode()) return;
  try {
    await postDoubleEntryJournal(tx, input);
  } catch (err) {
    console.warn(`[Ledger] Non-fatal warning posting journal for ${input.referenceType}:`, err);
  }
}

/**
 * Throttled batch sync of distinct supplier names from InventoryStockEntry into Vendor master.
 * Runs at most once every 5 minutes (unless `force = true`) and uses a single `createMany` call.
 */
export async function syncInventorySuppliersToVendors(force = false): Promise<void> {
  if (isMockMode()) return;
  const now = Date.now();
  if (!force && now - lastSupplierSyncAt < SUPPLIER_SYNC_TTL_MS) {
    return;
  }

  try {
    await ensureFinanceSchemaReady();
    const [stockSuppliers, existingVendors] = await Promise.all([
      prisma.inventoryStockEntry.findMany({
        where: { movementType: "IN", supplier: { not: null } },
        select: { supplier: true },
        distinct: ["supplier"],
      }),
      prisma.vendor.findMany({
        select: { name: true },
      }),
    ]);

    const existingNames = new Set(
      existingVendors.map((v: { name: string }) => v.name.trim().toLowerCase())
    );

    const toCreate: Array<{
      id: string;
      vendorCode: string;
      name: string;
      vendorType: string;
      paymentTermsDays: number;
      status: string;
      notes: string;
    }> = [];

    for (const row of stockSuppliers) {
      const rawName = String(row.supplier ?? "").trim();
      if (!rawName || rawName.toLowerCase() === "swayog internal") continue;
      const lower = rawName.toLowerCase();
      if (existingNames.has(lower)) continue;
      existingNames.add(lower);

      toCreate.push({
        id: randomUUID(),
        vendorCode: generateDocNumber("VND"),
        name: rawName,
        vendorType: "MATERIAL_SUPPLIER",
        paymentTermsDays: 30,
        status: "ACTIVE",
        notes: "Auto-synced from Inventory Stock-In records",
      });
    }

    if (toCreate.length > 0) {
      await prisma.vendor.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    lastSupplierSyncAt = now;
  } catch (err) {
    console.warn("[VendorSync] Non-fatal warning syncing inventory suppliers:", err);
  }
}
