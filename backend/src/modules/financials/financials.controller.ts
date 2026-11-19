import { Request, Response } from "express";
import { InvoicePaymentStatus, InvoiceType, Prisma, UserRole, VendorBillStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import {
  getManagerApprovalLimit,
  hasFinancePermission,
  writeFinanceAudit,
} from "./finance-access.js";
import { ensureFinanceSchemaReady, safePostDoubleEntryJournal } from "./vendor-ledger.service.js";

/**
 * Figures in this controller are derived from recorded transactions:
 *  - Revenue    = invoiced amount (non-cancelled invoices), grouped by invoiceDate.
 *  - Collected  = amountPaid recorded on those invoices.
 *  - Outstanding= invoice-wise (amount − amountPaid) for open invoices.
 *  - Commission = agreed commissionAmount, recognised when confirmed paid (commissionPaidAt).
 *  - Salaries   = CONFIRMED / PAID SalaryRecord rows for that month (no reuse of current salaries).
 *
 * The only remaining estimate is `estimatedPipelineValue` (system kW × assumed rate). It is
 * returned separately and must never be presented as revenue.
 */

const ESTIMATED_RATE_PER_KW = Number(process.env.FINANCE_ESTIMATED_RATE_PER_KW) > 0
  ? Number(process.env.FINANCE_ESTIMATED_RATE_PER_KW)
  : 60000;

const OPEN_STATUSES: InvoicePaymentStatus[] = [InvoicePaymentStatus.PENDING, InvoicePaymentStatus.FAILED];

const INVOICE_TYPE_MAP: Record<string, InvoiceType> = {
  installation: InvoiceType.INSTALLATION,
  amc: InvoiceType.AMC,
  repair: InvoiceType.REPAIR,
  service: InvoiceType.SERVICE,
  other: InvoiceType.OTHER,
};

const PAYMENT_STATUS_MAP: Record<string, InvoicePaymentStatus> = {
  pending: InvoicePaymentStatus.PENDING,
  paid: InvoicePaymentStatus.PAID,
  failed: InvoicePaymentStatus.FAILED,
  cancelled: InvoicePaymentStatus.CANCELLED,
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type DateRange = { gte?: Date; lte?: Date };

function parseDate(value: unknown, field: string, endOfDay = false): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const raw = String(value);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `Invalid '${field}' date`);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) date.setHours(23, 59, 59, 999);
  return date;
}

function parseRange(query: Request["query"]): DateRange | undefined {
  const gte = parseDate(query.from, "from");
  const lte = parseDate(query.to, "to", true);
  if (!gte && !lte) return undefined;
  if (gte && lte && gte > lte) throw new ApiError(400, "'from' must be before 'to'");
  return { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

function outstandingOf(inv: { amount: number; amountPaid: number; paymentStatus: InvoicePaymentStatus }): number {
  if (!OPEN_STATUSES.includes(inv.paymentStatus)) return 0;
  return Math.max(inv.amount - inv.amountPaid, 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function requirePositiveAmount(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new ApiError(400, `'${field}' must be a positive number`);
  return round2(n);
}

const SAFE_CUSTOMER_SELECT = { id: true, fullName: true, customerCode: true, city: true, partnerId: true } as const;

// ---------------------------------------------------------------------------
// /financials/me
// ---------------------------------------------------------------------------

export const getFinanceMe = async (req: Request, res: Response) => {
  const ctx = req.finance!;
  res.json({
    status: "success",
    data: {
      level: ctx.level,
      permissions: ctx.permissions,
      isServiceCoordinator: ctx.isServiceCoordinator,
      managerApprovalLimit: getManagerApprovalLimit(),
      canApproveAboveManagerLimit: ctx.level === "head" || ctx.level === "admin",
    },
  });
};

// ---------------------------------------------------------------------------
// /financials/summary
// ---------------------------------------------------------------------------

export const getFinancialSummary = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();
  const range = parseRange(req.query);

  const [invoices, customers, vendorBills, vendorPayments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { paymentStatus: { not: InvoicePaymentStatus.CANCELLED }, ...(range ? { invoiceDate: range } : {}) },
      select: { amount: true, amountPaid: true, paymentStatus: true },
    }),
    prisma.customer.findMany({
      where: range ? { createdAt: range } : {},
      select: { systemSizeKw: true },
    }),
    prisma.vendorBill
      .findMany({
        where: {
          status: { notIn: [VendorBillStatus.CANCELLED, VendorBillStatus.DRAFT] },
          ...(range ? { invoiceDate: range } : {}),
        },
        select: { totalAmount: true, netPayable: true, amountPaid: true, balanceDue: true },
      })
      .catch(() => []),
    prisma.vendorPayment
      .findMany({
        where: range ? { paymentDate: range } : {},
        select: { amount: true },
      })
      .catch(() => []),
    prisma.expense
      .findMany({
        where: range ? { expenseDate: range } : {},
        select: { amount: true },
      })
      .catch(() => []),
  ]);

  const totalInvoiced = round2(invoices.reduce((acc, inv) => acc + inv.amount, 0));
  const collected = round2(invoices.reduce((acc, inv) => acc + inv.amountPaid, 0));
  const outstanding = round2(invoices.reduce((acc, inv) => acc + outstandingOf(inv), 0));
  const openInvoiceCount = invoices.filter((inv) => outstandingOf(inv) > 0).length;
  const collectionRate = totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0;
  const estimatedPipelineValue = round2(customers.reduce((acc, c) => acc + (c.systemSizeKw || 0) * ESTIMATED_RATE_PER_KW, 0));

  const vendorPayablesOutstanding = round2(vendorBills.reduce((acc, b) => acc + b.balanceDue, 0));
  const vendorPaymentsTotal = round2(vendorPayments.reduce((acc, p) => acc + p.amount, 0));
  const operationalExpensesTotal = round2(expenses.reduce((acc, e) => acc + e.amount, 0));
  const netCashFlow = round2(collected - vendorPaymentsTotal - operationalExpensesTotal);

  res.json({
    status: "success",
    data: {
      // Backward-compatible keys (now invoice-based)
      totalRevenue: totalInvoiced,
      pendingDues: outstanding,
      collected,
      collectionRate,
      // Explicit keys
      totalInvoiced,
      outstanding,
      invoiceCount: invoices.length,
      openInvoiceCount,
      estimatedPipelineValue,
      vendorPayablesOutstanding,
      vendorPaymentsTotal,
      operationalExpensesTotal,
      netCashFlow,
      basis: {
        revenue: "Sum of non-cancelled invoice amounts by invoice date",
        collected: "Sum of amountPaid recorded on those invoices",
        outstanding: "Invoice-wise unpaid balance of pending/failed invoices",
        estimatedPipelineValue: `Estimate only: system kW × ₹${ESTIMATED_RATE_PER_KW.toLocaleString("en-IN")} for customers created in the period. Not revenue.`,
      },
    },
  });
};

// ---------------------------------------------------------------------------
// /financials/pnl
// ---------------------------------------------------------------------------

type MonthBucket = { revenue: number; commissions: number; salaries: number; otherExpenses: number };

export const getMonthlyPnL = async (req: Request, res: Response) => {
  const range = parseRange(req.query);

  const [invoices, commissions, salaryRecords, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { paymentStatus: { not: InvoicePaymentStatus.CANCELLED }, ...(range ? { invoiceDate: range } : {}) },
      select: { amount: true, invoiceDate: true },
    }),
    prisma.customer.findMany({
      where: {
        commissionStatus: "COMPLETED",
        commissionAmount: { not: null },
        commissionPaidAt: range ? range : { not: null },
      },
      select: { commissionAmount: true, commissionPaidAt: true },
    }),
    prisma.salaryRecord.findMany({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      select: { month: true, year: true, regularPay: true, overtimePay: true, incentivesTotal: true, netPayable: true },
    }),
    prisma.expense.findMany({
      where: range ? { expenseDate: range } : {},
      select: { amount: true, expenseDate: true },
    }),
  ]);

  const buckets: Record<string, MonthBucket> = {};
  const bucket = (key: string) => (buckets[key] ??= { revenue: 0, commissions: 0, salaries: 0, otherExpenses: 0 });

  invoices.forEach((inv) => { bucket(monthKey(inv.invoiceDate)).revenue += inv.amount; });
  commissions.forEach((c) => { bucket(monthKey(c.commissionPaidAt!)).commissions += c.commissionAmount ?? 0; });
  expenses.forEach((e) => { bucket(monthKey(e.expenseDate)).otherExpenses += e.amount; });

  const fromKey = range?.gte ? monthKey(range.gte) : undefined;
  const toKey = range?.lte ? monthKey(range.lte) : undefined;
  salaryRecords.forEach((s) => {
    const key = `${s.year}-${String(s.month).padStart(2, "0")}`;
    if ((fromKey && key < fromKey) || (toKey && key > toKey)) return;
    const gross = s.regularPay + s.overtimePay + s.incentivesTotal;
    bucket(key).salaries += gross > 0 ? gross : s.netPayable;
  });

  let prevProfit: number | null = null;
  const result = Object.keys(buckets)
    .sort()
    .map((key) => {
      const d = buckets[key];
      const expensesTotal = d.commissions + d.salaries + d.otherExpenses;
      const profit = d.revenue - expensesTotal;
      const margin = d.revenue > 0 ? Math.round((profit / d.revenue) * 100) : 0;
      const trend = prevProfit === null ? 0 : (pctChange(profit, prevProfit) ?? 0);
      prevProfit = profit;
      return {
        month: monthLabel(key),
        monthKey: key,
        revenue: round2(d.revenue),
        commissions: round2(d.commissions),
        salaries: round2(d.salaries),
        otherExpenses: round2(d.otherExpenses),
        expenses: round2(expensesTotal),
        profit: round2(profit),
        margin,
        trend,
      };
    });

  res.json({ status: "success", data: result });
};

// ---------------------------------------------------------------------------
// /financials/zones
// ---------------------------------------------------------------------------

export const getZoneBreakdown = async (req: Request, res: Response) => {
  const range = parseRange(req.query);
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  // Growth compares the selected window with the immediately preceding window of equal length
  // (default: last 30 days vs the 30 days before that).
  const currentEnd = range?.lte ?? now;
  const currentStart = range?.gte ?? new Date(currentEnd.getTime() - 30 * DAY);
  const spanMs = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - spanMs);

  const invoices = await prisma.invoice.findMany({
    where: { paymentStatus: { not: InvoicePaymentStatus.CANCELLED } },
    select: { amount: true, invoiceDate: true, zone: true, customerId: true, Customer: { select: { city: true } } },
  });

  const zones: Record<string, { revenue: number; customers: Set<number>; current: number; previous: number }> = {};
  invoices.forEach((inv) => {
    const zone = inv.zone || inv.Customer?.city || "Other";
    const z = (zones[zone] ??= { revenue: 0, customers: new Set(), current: 0, previous: 0 });
    const t = inv.invoiceDate.getTime();
    const inSelected = !range || (t >= currentStart.getTime() && t <= currentEnd.getTime());
    if (inSelected) {
      z.revenue += inv.amount;
      z.customers.add(inv.customerId);
    }
    if (t >= currentStart.getTime() && t <= currentEnd.getTime()) z.current += inv.amount;
    else if (t >= previousStart.getTime() && t < currentStart.getTime()) z.previous += inv.amount;
  });

  const result = Object.entries(zones)
    .map(([zone, z]) => ({
      zone,
      revenue: round2(z.revenue),
      customers: z.customers.size,
      growth: pctChange(z.current, z.previous), // null when there is no prior-period revenue
    }))
    .filter((z) => z.revenue > 0 || z.growth !== null)
    .sort((a, b) => b.revenue - a.revenue);

  res.json({ status: "success", data: result });
};

// ---------------------------------------------------------------------------
// /financials/amc
// ---------------------------------------------------------------------------

export const getAmcContracts = async (_req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { amcStatus: "ACTIVE" },
    select: { id: true, fullName: true, amcExpiryDate: true },
  });

  const result = customers.map((c) => ({
    id: c.id,
    customerName: c.fullName,
    expiryDate: c.amcExpiryDate,
    plan: "Premium",
    status: "active",
  }));

  res.json({ status: "success", data: result });
};

// ---------------------------------------------------------------------------
// /financials/payouts
// ---------------------------------------------------------------------------

export const getPartnerPayouts = async (req: Request, res: Response) => {
  const ctx = req.finance!;
  const canViewAll = hasFinancePermission(ctx.level, "finance.commission.view_all");

  const partners = await prisma.partnerProfile.findMany({
    where: canViewAll ? {} : { id: ctx.partnerProfileId ?? "__none__" },
    select: {
      id: true,
      businessName: true,
      user: { select: { fullName: true } },
      customers: { select: { id: true, commissionAmount: true, commissionStatus: true } },
    },
  });

  const customerIds = partners.flatMap((p) => p.customers.map((c) => c.id));
  const invoiceTotals = customerIds.length
    ? await prisma.invoice.groupBy({
        by: ["customerId"],
        where: { customerId: { in: customerIds }, paymentStatus: { not: InvoicePaymentStatus.CANCELLED } },
        _sum: { amount: true },
      })
    : [];
  const invoicedByCustomer = new Map<number, number>(invoiceTotals.map((t) => [t.customerId, Number(t._sum?.amount ?? 0)]));

  const result = partners.map((p) => {
    let totalInvoicedValue = 0;
    let earnedCommission = 0;
    let pendingCommission = 0;
    let commissionNotSetCount = 0;

    p.customers.forEach((cust) => {
      totalInvoicedValue += invoicedByCustomer.get(cust.id) ?? 0;
      if (cust.commissionAmount == null) {
        if (cust.commissionStatus !== "COMPLETED") commissionNotSetCount += 1;
        return;
      }
      if (cust.commissionStatus === "COMPLETED") earnedCommission += cust.commissionAmount;
      else pendingCommission += cust.commissionAmount;
    });

    return {
      id: p.id,
      partnerName: p.user.fullName,
      businessName: p.businessName,
      totalProjectValue: round2(totalInvoicedValue), // backward-compatible key: invoiced value of partner's customers
      totalInvoicedValue: round2(totalInvoicedValue),
      earnedCommission: round2(earnedCommission),
      pendingAmount: round2(pendingCommission),
      commissionNotSetCount,
      status: pendingCommission > 0 || commissionNotSetCount > 0 ? "pending" : "completed",
    };
  });

  res.json({ status: "success", data: result });
};

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const listInvoices = async (req: Request, res: Response) => {
  const ctx = req.finance!;
  const { customerId, invoiceType } = req.query;
  const range = parseRange(req.query);
  const where: Prisma.InvoiceWhereInput = {};

  if (customerId) {
    const id = Number(customerId);
    if (!Number.isInteger(id)) throw new ApiError(400, "Invalid customerId");
    where.customerId = id;
  }
  if (invoiceType) {
    const type = INVOICE_TYPE_MAP[String(invoiceType).toLowerCase()];
    if (!type) throw new ApiError(400, "Invalid invoiceType");
    where.invoiceType = type;
  }
  if (range) where.invoiceDate = range;

  // Row-level scoping
  if (hasFinancePermission(ctx.level, "finance.invoice.view_all")) {
    // full access
  } else if (ctx.isServiceCoordinator) {
    where.invoiceType = InvoiceType.AMC;
  } else if (ctx.role === UserRole.CUSTOMER) {
    if (!ctx.customerId) {
      res.json({ status: "success", data: [] });
      return;
    }
    where.customerId = ctx.customerId;
  } else if (ctx.role === UserRole.PARTNER && ctx.partnerProfileId) {
    where.Customer = { partnerId: ctx.partnerProfileId };
  } else {
    throw new ApiError(403, "You do not have access to invoices.");
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    include: { Customer: { select: SAFE_CUSTOMER_SELECT } },
  });

  res.json({
    status: "success",
    data: invoices.map((row) => {
      const { Customer, ...inv } = row;
      return {
        ...inv,
        customer: Customer?.fullName,
        customerCode: Customer?.customerCode,
        status: row.paymentStatus,
        date: row.invoiceDate,
        outstanding: round2(outstandingOf(row)),
      };
    }),
  });
};

function assertServiceCoordinatorAmcOnly(req: Request, type: InvoiceType, action: string) {
  const ctx = req.finance!;
  const isFinanceWriter = hasFinancePermission(ctx.level, "finance.invoice.create") || hasFinancePermission(ctx.level, "finance.invoice.update");
  if (!isFinanceWriter && type !== InvoiceType.AMC) {
    throw new ApiError(403, `Service Coordinators can only ${action} AMC invoices.`);
  }
}

export const createInvoice = async (req: Request, res: Response) => {
  const { customerId, description, amount, date, status, paymentMethod, invoiceType, invoiceNumber } = req.body;
  const file = req.file;
  const proofUrl = file ? `/uploads/invoices/${file.filename}` : undefined;

  const custId = Number(customerId);
  if (!Number.isInteger(custId)) throw new ApiError(400, "Valid customerId is required");
  const customer = await prisma.customer.findUnique({ where: { id: custId }, select: { id: true, partnerId: true } });
  if (!customer) throw new ApiError(404, "Customer not found");

  const parsedAmount = requirePositiveAmount(amount, "amount");
  const mappedInvoiceType = INVOICE_TYPE_MAP[String(invoiceType || "installation").toLowerCase()];
  if (!mappedInvoiceType) throw new ApiError(400, "Invalid invoiceType");
  const mappedPaymentStatus = PAYMENT_STATUS_MAP[String(status || "pending").toLowerCase()];
  if (!mappedPaymentStatus) throw new ApiError(400, "Invalid status");

  assertServiceCoordinatorAmcOnly(req, mappedInvoiceType, "create");

  const isPaid = mappedPaymentStatus === InvoicePaymentStatus.PAID;
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        customerId: custId,
        partnerId: customer.partnerId ?? null,
        invoiceType: mappedInvoiceType,
        description,
        amount: parsedAmount,
        paymentStatus: mappedPaymentStatus,
        paymentMethod: paymentMethod || "online",
        proofUrl,
        invoiceNumber: invoiceNumber || null,
        amountPaid: isPaid ? parsedAmount : 0,
        paymentDate: isPaid ? new Date() : null,
        invoiceDate: date ? parseDate(date, "date")! : new Date(),
      },
    });

    const revAccountCode = mappedInvoiceType === InvoiceType.AMC ? "4100" : "4000";
    await safePostDoubleEntryJournal(tx, {
      entryDate: created.invoiceDate,
      referenceType: "CUSTOMER_INVOICE",
      referenceId: created.id,
      description: `Customer Invoice ${created.invoiceNumber || created.id.slice(0, 8)} (${mappedInvoiceType})`,
      createdById: req.auth?.userId ?? null,
      lines: [
        {
          accountCode: "1100",
          debit: parsedAmount,
          credit: 0,
          customerId: custId,
          memo: `AR Receivable for Invoice ${created.invoiceNumber || created.id.slice(0, 8)}`,
        },
        {
          accountCode: revAccountCode,
          debit: 0,
          credit: parsedAmount,
          customerId: custId,
          memo: `Revenue recognized (${mappedInvoiceType})`,
        },
      ],
    });

    if (isPaid) {
      const isCash = String(paymentMethod || "").toUpperCase() === "CASH";
      await safePostDoubleEntryJournal(tx, {
        entryDate: new Date(),
        referenceType: "CUSTOMER_PAYMENT",
        referenceId: created.id,
        description: `Collection received on Invoice ${created.invoiceNumber || created.id.slice(0, 8)}`,
        createdById: req.auth?.userId ?? null,
        lines: [
          {
            accountCode: isCash ? "1001" : "1010",
            debit: parsedAmount,
            credit: 0,
            customerId: custId,
            memo: `Customer collection (${paymentMethod || "online"})`,
          },
          {
            accountCode: "1100",
            debit: 0,
            credit: parsedAmount,
            customerId: custId,
            memo: `AR settled for Invoice ${created.invoiceNumber || created.id.slice(0, 8)}`,
          },
        ],
      });
    }

    return created;
  });

  await writeFinanceAudit(req.auth?.userId, "INVOICE_CREATED", "Invoice", invoice.id, {
    customerId: custId,
    amount: parsedAmount,
    invoiceType: mappedInvoiceType,
    paymentStatus: mappedPaymentStatus,
    financeLevel: req.finance?.level ?? null,
  });

  res.json({ status: "success", data: invoice });
};

export const updateInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, amount, status, amountPaid, dueDate, invoiceNumber } = req.body;

  const current = await prisma.invoice.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Invoice not found");
  assertServiceCoordinatorAmcOnly(req, current.invoiceType, "update");

  const data: Prisma.InvoiceUpdateInput = {};
  if (description !== undefined) data.description = description;
  if (invoiceNumber !== undefined) data.invoiceNumber = invoiceNumber;
  const finalAmount = amount !== undefined ? requirePositiveAmount(amount, "amount") : current.amount;
  if (amount !== undefined) data.amount = finalAmount;

  let newStatus: InvoicePaymentStatus | undefined;
  if (status !== undefined) {
    newStatus = PAYMENT_STATUS_MAP[String(status).toLowerCase()];
    if (!newStatus) throw new ApiError(400, "Invalid status");
    data.paymentStatus = newStatus;
  }

  if (amountPaid !== undefined) {
    const paid = Number(amountPaid);
    if (!Number.isFinite(paid) || paid < 0) throw new ApiError(400, "'amountPaid' must be zero or more");
    if (paid > finalAmount) throw new ApiError(400, "'amountPaid' cannot exceed the invoice amount");
    data.amountPaid = round2(paid);
  } else if (newStatus === InvoicePaymentStatus.PAID) {
    data.amountPaid = finalAmount;
  }

  if (newStatus === InvoicePaymentStatus.PAID && !current.paymentDate) data.paymentDate = new Date();
  if (dueDate !== undefined) data.invoiceDate = parseDate(dueDate, "dueDate");

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({ where: { id }, data });
    const deltaPaid = round2(updated.amountPaid - current.amountPaid);
    if (deltaPaid > 0.009) {
      const isCash = String(updated.paymentMethod || "").toUpperCase() === "CASH";
      await safePostDoubleEntryJournal(tx, {
        entryDate: new Date(),
        referenceType: "CUSTOMER_PAYMENT",
        referenceId: updated.id,
        description: `Collection recorded on Invoice ${updated.invoiceNumber || updated.id.slice(0, 8)}`,
        createdById: req.auth?.userId ?? null,
        lines: [
          {
            accountCode: isCash ? "1001" : "1010",
            debit: deltaPaid,
            credit: 0,
            customerId: updated.customerId,
            memo: `Customer payment received`,
          },
          {
            accountCode: "1100",
            debit: 0,
            credit: deltaPaid,
            customerId: updated.customerId,
            memo: `AR reduced on Invoice ${updated.invoiceNumber || updated.id.slice(0, 8)}`,
          },
        ],
      });
    }
    return updated;
  });

  await writeFinanceAudit(req.auth?.userId, "INVOICE_UPDATED", "Invoice", id, {
    before: { amount: current.amount, amountPaid: current.amountPaid, paymentStatus: current.paymentStatus, invoiceDate: current.invoiceDate },
    after: { amount: invoice.amount, amountPaid: invoice.amountPaid, paymentStatus: invoice.paymentStatus, invoiceDate: invoice.invoiceDate },
    financeLevel: req.finance?.level ?? null,
  });

  res.json({ status: "success", data: invoice });
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const current = await prisma.invoice.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Invoice not found");

  // An invoice with recorded collections must be cancelled, not deleted, to preserve the payment trail.
  if (current.amountPaid > 0) {
    throw new ApiError(409, "This invoice has recorded payments and cannot be deleted. Mark it as cancelled instead.");
  }

  await prisma.invoice.delete({ where: { id } });
  await writeFinanceAudit(req.auth?.userId, "INVOICE_DELETED", "Invoice", id, {
    snapshot: {
      customerId: current.customerId,
      amount: current.amount,
      invoiceType: current.invoiceType,
      paymentStatus: current.paymentStatus,
      invoiceNumber: current.invoiceNumber,
      invoiceDate: current.invoiceDate,
    },
    financeLevel: req.finance?.level ?? null,
  });
  res.json({ status: "success", message: "Invoice deleted" });
};

// ---------------------------------------------------------------------------
// /financials/customer-ledger (AR per customer: quoted, invoiced, collected, due)
// ---------------------------------------------------------------------------

export const getCustomerLedger = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerCode: true,
      fullName: true,
      city: true,
      phoneNumber: true,
      systemSizeKw: true,
      projectStage: true,
      status: true,
      Invoice: {
        where: { paymentStatus: { not: InvoicePaymentStatus.CANCELLED } },
        select: { id: true, amount: true, amountPaid: true, paymentStatus: true, invoiceDate: true },
      },
      payments: {
        where: { paymentStatus: "PAID" },
        select: { amount: true },
      },
      onboardingRequests: {
        select: {
          quotations: {
            orderBy: { version: "desc" },
            select: { total: true, status: true },
          },
        },
      },
    },
  });

  const rows = customers.map((c) => {
    const allQuotes = c.onboardingRequests.flatMap((r) => r.quotations);
    const approvedQuote = allQuotes.find((q) => q.status === "APPROVED") ?? allQuotes[0];
    const contractValue = approvedQuote ? round2(approvedQuote.total) : null;

    const totalInvoiced = round2(c.Invoice.reduce((s, i) => s + i.amount, 0));
    const invoiceCollected = round2(c.Invoice.reduce((s, i) => s + i.amountPaid, 0));
    const serviceCollected = round2(c.payments.reduce((s, p) => s + p.amount, 0));
    const totalCollected = round2(invoiceCollected + serviceCollected);
    const receivableBalance = round2(c.Invoice.reduce((s, i) => s + outstandingOf(i), 0));
    const unbilledContract = contractValue !== null ? round2(Math.max(contractValue - totalInvoiced, 0)) : null;
    const openInvoiceCount = c.Invoice.filter((i) => outstandingOf(i) > 0).length;
    const lastInvoiceDate = c.Invoice.length
      ? c.Invoice.reduce((latest, i) => (i.invoiceDate > latest ? i.invoiceDate : latest), c.Invoice[0].invoiceDate)
      : null;

    return {
      customerId: c.id,
      customerCode: c.customerCode,
      fullName: c.fullName,
      city: c.city,
      phoneNumber: c.phoneNumber,
      systemSizeKw: c.systemSizeKw,
      projectStage: c.projectStage,
      status: c.status,
      contractValue,
      totalInvoiced,
      totalCollected,
      receivableBalance,
      unbilledContract,
      invoiceCount: c.Invoice.length,
      openInvoiceCount,
      lastInvoiceDate,
    };
  });

  const summary = {
    totalCustomers: rows.length,
    customersWithDues: rows.filter((r) => r.receivableBalance > 0).length,
    totalContracted: round2(rows.reduce((s, r) => s + (r.contractValue ?? 0), 0)),
    totalInvoiced: round2(rows.reduce((s, r) => s + r.totalInvoiced, 0)),
    totalCollected: round2(rows.reduce((s, r) => s + r.totalCollected, 0)),
    totalReceivable: round2(rows.reduce((s, r) => s + r.receivableBalance, 0)),
    totalUnbilled: round2(rows.reduce((s, r) => s + (r.unbilledContract ?? 0), 0)),
  };

  res.json({ status: "success", data: { summary, customers: rows } });
};

// ---------------------------------------------------------------------------
// /financials/vendor-payables (Inventory suppliers, partner commissions, payroll)
// ---------------------------------------------------------------------------

export const getVendorPayables = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();
  const range = parseRange(req.query);

  const [stockEntries, partnerCustomers, salaryRecords, expenses, vendorBills, vendorPayments] = await Promise.all([
    prisma.inventoryStockEntry.findMany({
      where: {
        movementType: "IN",
        ...(range ? { entryDate: range } : {}),
      },
      orderBy: { entryDate: "desc" },
      select: {
        id: true,
        supplier: true,
        quantity: true,
        pricePerUnit: true,
        entryDate: true,
        notes: true,
        item: { select: { name: true, category: true } },
      },
    }),
    prisma.customer.findMany({
      where: { partnerId: { not: null } },
      select: {
        commissionAmount: true,
        commissionStatus: true,
        partner: { select: { id: true, businessName: true, user: { select: { fullName: true } } } },
      },
    }),
    prisma.salaryRecord.findMany({
      select: { month: true, year: true, netPayable: true, status: true },
    }),
    prisma.expense.findMany({
      where: range ? { expenseDate: range } : {},
      orderBy: { expenseDate: "desc" },
    }),
    prisma.vendorBill
      .findMany({
        where: {
          status: { notIn: [VendorBillStatus.CANCELLED, VendorBillStatus.DRAFT] },
          ...(range ? { invoiceDate: range } : {}),
        },
        select: {
          id: true,
          totalAmount: true,
          netPayable: true,
          amountPaid: true,
          balanceDue: true,
          dueDate: true,
          status: true,
        },
      })
      .catch(() => []),
    prisma.vendorPayment
      .findMany({
        where: range ? { paymentDate: range } : {},
        select: { amount: true, tdsDeducted: true },
      })
      .catch(() => []),
  ]);

  const supplierMap: Record<
    string,
    { supplier: string; totalSpend: number; entryCount: number; lastPurchaseDate: Date; items: Set<string> }
  > = {};
  stockEntries.forEach((e) => {
    const name = (e.supplier || "Direct / Unspecified Supplier").trim();
    const row = (supplierMap[name] ??= {
      supplier: name,
      totalSpend: 0,
      entryCount: 0,
      lastPurchaseDate: e.entryDate,
      items: new Set(),
    });
    row.totalSpend += (e.quantity || 0) * (e.pricePerUnit || 0);
    row.entryCount += 1;
    if (e.entryDate > row.lastPurchaseDate) row.lastPurchaseDate = e.entryDate;
    if (e.item?.name) row.items.add(e.item.name);
  });

  const suppliers = Object.values(supplierMap)
    .map((s) => ({
      supplier: s.supplier,
      totalSpend: round2(s.totalSpend),
      entryCount: s.entryCount,
      lastPurchaseDate: s.lastPurchaseDate,
      items: Array.from(s.items).slice(0, 5),
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const partnerPendingPayables = round2(
    partnerCustomers
      .filter((c) => c.commissionStatus !== "COMPLETED" && c.commissionAmount != null)
      .reduce((s, c) => s + (c.commissionAmount ?? 0), 0)
  );
  const partnerPaidTotal = round2(
    partnerCustomers
      .filter((c) => c.commissionStatus === "COMPLETED" && c.commissionAmount != null)
      .reduce((s, c) => s + (c.commissionAmount ?? 0), 0)
  );

  const payrollPending = round2(
    salaryRecords
      .filter((r) => r.status === "ESTIMATED" || r.status === "PROCESSING")
      .reduce((s, r) => s + r.netPayable, 0)
  );
  const payrollFinalized = round2(
    salaryRecords
      .filter((r) => r.status === "CONFIRMED" || r.status === "PAID")
      .reduce((s, r) => s + r.netPayable, 0)
  );

  const totalMaterialPurchases = round2(suppliers.reduce((s, v) => s + v.totalSpend, 0));
  const totalExpenses = round2(expenses.reduce((s, e) => s + e.amount, 0));

  const now = new Date();
  const vendorBillsTotal = round2(vendorBills.reduce((s, b) => s + b.totalAmount, 0));
  const vendorNetPayableTotal = round2(vendorBills.reduce((s, b) => s + b.netPayable, 0));
  const vendorPaidTotal = round2(vendorPayments.reduce((s, p) => s + p.amount + p.tdsDeducted, 0));
  const vendorOutstandingTotal = round2(vendorBills.reduce((s, b) => s + b.balanceDue, 0));
  const vendorOverdueTotal = round2(
    vendorBills
      .filter((b) => b.balanceDue > 0.009 && b.dueDate.getTime() < now.getTime())
      .reduce((s, b) => s + b.balanceDue, 0)
  );
  const openVendorBillCount = vendorBills.filter((b) => b.balanceDue > 0.009).length;

  res.json({
    status: "success",
    data: {
      summary: {
        totalMaterialPurchases,
        supplierCount: suppliers.length,
        partnerPendingPayables,
        partnerPaidTotal,
        payrollPending,
        payrollFinalized,
        totalExpenses,
        vendorBillsTotal,
        vendorNetPayableTotal,
        vendorPaidTotal,
        vendorOutstandingTotal,
        vendorOverdueTotal,
        openVendorBillCount,
      },
      suppliers,
      expenses,
    },
  });
};

// ---------------------------------------------------------------------------
// /financials/expenses (list + record operational/project expenses)
// ---------------------------------------------------------------------------

export const listExpenses = async (req: Request, res: Response) => {
  const range = parseRange(req.query);
  const expenses = await prisma.expense.findMany({
    where: range ? { expenseDate: range } : {},
    orderBy: { expenseDate: "desc" },
  });
  res.json({ status: "success", data: expenses });
};

export const createExpense = async (req: Request, res: Response) => {
  const { category, amount, expenseDate, zone, notes } = req.body;
  if (!category || !String(category).trim()) {
    throw new ApiError(400, "Expense category is required");
  }
  const parsedAmount = Math.round(requirePositiveAmount(amount, "amount"));
  const date = expenseDate ? parseDate(expenseDate, "expenseDate")! : new Date();
  const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        id,
        category: String(category).trim(),
        amount: parsedAmount,
        expenseDate: date,
        zone: zone ? String(zone).trim() : null,
        notes: notes ? String(notes).trim() : null,
        updatedAt: new Date(),
      },
    });

    await safePostDoubleEntryJournal(tx, {
      entryDate: date,
      referenceType: "EXPENSE",
      referenceId: created.id,
      description: `Operational Expense: ${created.category}${created.notes ? ` (${created.notes})` : ""}`,
      createdById: req.auth?.userId ?? null,
      lines: [
        {
          accountCode: "5100",
          debit: parsedAmount,
          credit: 0,
          zone: created.zone,
          memo: `${created.category}${created.notes ? ` - ${created.notes}` : ""}`,
        },
        {
          accountCode: "1010",
          debit: 0,
          credit: parsedAmount,
          zone: created.zone,
          memo: `Expense paid (${created.category})`,
        },
      ],
    });

    return created;
  });

  await writeFinanceAudit(req.auth?.userId, "EXPENSE_CREATED", "Expense", expense.id, {
    category: expense.category,
    amount: expense.amount,
    zone: expense.zone,
    financeLevel: req.finance?.level ?? null,
  });

  res.status(201).json({ status: "success", data: expense });
};

export const updateExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Expense id is required");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Expense not found");

  const { category, amount, expenseDate, zone, notes } = req.body ?? {};
  const cleanCategory = category !== undefined ? String(category).trim() : existing.category;
  if (!cleanCategory) {
    throw new ApiError(400, "Expense category is required");
  }
  const parsedAmount =
    amount !== undefined ? Math.round(requirePositiveAmount(amount, "amount")) : existing.amount;
  const date = expenseDate ? parseDate(expenseDate, "expenseDate")! : existing.expenseDate;
  const cleanZone = zone !== undefined ? (zone ? String(zone).trim() : null) : existing.zone;
  const cleanNotes = notes !== undefined ? (notes ? String(notes).trim() : null) : existing.notes;

  const updated = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.update({
      where: { id },
      data: {
        category: cleanCategory,
        amount: parsedAmount,
        expenseDate: date,
        zone: cleanZone,
        notes: cleanNotes,
        updatedAt: new Date(),
      },
    });

    const existingJournals = await tx.journalEntry.findMany({
      where: { referenceType: "EXPENSE", referenceId: id },
      select: { id: true },
    });
    for (const je of existingJournals) {
      await tx.journalLine.deleteMany({ where: { entryId: je.id } });
      await tx.journalEntry.delete({ where: { id: je.id } });
    }

    await safePostDoubleEntryJournal(tx, {
      entryDate: date,
      referenceType: "EXPENSE",
      referenceId: exp.id,
      description: `Operational Expense (Updated): ${exp.category}${exp.notes ? ` (${exp.notes})` : ""}`,
      createdById: req.auth?.userId ?? null,
      lines: [
        {
          accountCode: "5100",
          debit: parsedAmount,
          credit: 0,
          zone: exp.zone,
          memo: `${exp.category}${exp.notes ? ` - ${exp.notes}` : ""}`,
        },
        {
          accountCode: "1010",
          debit: 0,
          credit: parsedAmount,
          zone: exp.zone,
          memo: `Expense paid (${exp.category})`,
        },
      ],
    });

    return exp;
  });

  await writeFinanceAudit(req.auth?.userId, "EXPENSE_UPDATED", "Expense", updated.id, {
    category: updated.category,
    amount: updated.amount,
    zone: updated.zone,
    financeLevel: req.finance?.level ?? null,
  });

  res.json({ status: "success", data: updated });
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Expense id is required");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Expense not found");

  await prisma.$transaction(async (tx) => {
    const existingJournals = await tx.journalEntry.findMany({
      where: { referenceType: "EXPENSE", referenceId: id },
      select: { id: true },
    });
    for (const je of existingJournals) {
      await tx.journalLine.deleteMany({ where: { entryId: je.id } });
      await tx.journalEntry.delete({ where: { id: je.id } });
    }

    await tx.expense.delete({ where: { id } });
  });

  await writeFinanceAudit(req.auth?.userId, "EXPENSE_DELETED", "Expense", id, {
    category: existing.category,
    amount: existing.amount,
    zone: existing.zone,
    financeLevel: req.finance?.level ?? null,
  });

  res.json({ status: "success", message: "Expense deleted successfully" });
};
