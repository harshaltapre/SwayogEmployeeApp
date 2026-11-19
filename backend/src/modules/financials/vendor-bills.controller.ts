import { Request, Response } from "express";
import { VendorBillStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { checkApprovalAuthority, writeFinanceAudit } from "./finance-access.js";
import {
  buildVendorBillJournalLines,
  buildVendorPaymentJournalLines,
  calculateBillTotals,
  computeBillPaymentStatus,
  ensureFinanceSchemaReady,
  ensureSystemChartOfAccounts,
  generateDocNumber,
  postDoubleEntryJournal,
  round2,
  syncInventorySuppliersToVendors,
} from "./vendor-ledger.service.js";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

const VALID_BILL_STATUSES = new Set<string>(Object.values(VendorBillStatus));

function parseOptionalDate(val: unknown, field: string): Date | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const d = new Date(String(val));
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid date for '${field}'`);
  return d;
}

// ---------------------------------------------------------------------------
// GET /financials/vendors
// ---------------------------------------------------------------------------

export const listVendors = async (_req: Request, res: Response) => {
  await ensureFinanceSchemaReady();
  await syncInventorySuppliersToVendors();

  const [vendors, stockEntries] = await Promise.all([
    prisma.vendor
      .findMany({
        orderBy: { createdAt: "desc" },
        include: {
          bills: {
            where: { status: { not: VendorBillStatus.CANCELLED } },
            select: {
              id: true,
              totalAmount: true,
              netPayable: true,
              amountPaid: true,
              balanceDue: true,
              dueDate: true,
              status: true,
            },
          },
          payments: {
            select: { id: true, amount: true, tdsDeducted: true, paymentDate: true },
          },
        },
      })
      .catch(() => []),
    prisma.inventoryStockEntry
      .findMany({
        where: { movementType: "IN", supplier: { not: null } },
        select: { supplier: true, quantity: true, pricePerUnit: true },
      })
      .catch(() => []),
  ]);

  const inventorySpendBySupplier = new Map<string, number>();
  for (const entry of stockEntries) {
    const key = (entry.supplier ?? "").trim().toLowerCase();
    if (!key) continue;
    const prev = inventorySpendBySupplier.get(key) ?? 0;
    inventorySpendBySupplier.set(key, round2(prev + (entry.quantity || 0) * (entry.pricePerUnit || 0)));
  }

  const now = new Date();
  const data = vendors.map((v: any) => {
    const bills = Array.isArray(v.bills) ? v.bills : [];
    const payments = Array.isArray(v.payments) ? v.payments : [];
    const activeBills = bills.filter((b: any) => b.status !== VendorBillStatus.DRAFT);
    const totalBilled = round2(activeBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0));
    const totalNetPayable = round2(activeBills.reduce((s: number, b: any) => s + (b.netPayable || 0), 0));
    const totalPaid = round2(payments.reduce((s: number, p: any) => s + (p.amount || 0) + (p.tdsDeducted || 0), 0));
    const billBalanceDue = round2(activeBills.reduce((s: number, b: any) => s + (b.balanceDue || 0), 0));
    const outstandingAmount = round2(Math.max((v.openingBalance || 0) + billBalanceDue, 0));

    const overdueBills = activeBills.filter(
      (b: any) => b.balanceDue > 0.009 && new Date(b.dueDate).getTime() < now.getTime()
    );
    const overdueAmount = round2(overdueBills.reduce((s: number, b: any) => s + (b.balanceDue || 0), 0));
    const inventoryPurchaseValue = inventorySpendBySupplier.get(String(v.name ?? "").trim().toLowerCase()) ?? 0;

    const { bills: _b, payments: _p, ...vendorFields } = v;
    return {
      ...vendorFields,
      gstin: v.gstin ? String(v.gstin).toUpperCase() : null,
      pan: v.pan ? String(v.pan).toUpperCase() : null,
      billCount: bills.length,
      openBillCount: activeBills.filter((b: any) => b.balanceDue > 0.009).length,
      overdueBillCount: overdueBills.length,
      inventoryPurchaseValue,
      totalBilled,
      totalNetPayable,
      amountPaid: totalPaid,
      outstandingAmount,
      overdueAmount,
    };
  });

  res.json({ status: "success", data });
};

// ---------------------------------------------------------------------------
// POST /financials/vendors
// ---------------------------------------------------------------------------

export const createVendor = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const {
    name,
    vendorType,
    gstin,
    pan,
    contactPerson,
    phone,
    email,
    address,
    state,
    pinCode,
    bankAccountName,
    bankAccountNumber,
    ifscCode,
    paymentTermsDays,
    openingBalance,
    tdsApplicable,
    defaultTdsRate,
    notes,
  } = req.body ?? {};

  const cleanName = String(name ?? "").trim();
  if (!cleanName) throw new ApiError(400, "Vendor name is required.");

  const cleanGstin = gstin ? String(gstin).trim().toUpperCase() : null;
  if (cleanGstin && !GSTIN_REGEX.test(cleanGstin)) {
    throw new ApiError(400, "Invalid GSTIN format (expected 15-character Indian GSTIN, e.g. 27AABCU9603R1ZM).");
  }

  const cleanPan = pan ? String(pan).trim().toUpperCase() : cleanGstin ? cleanGstin.slice(2, 12) : null;
  if (cleanPan && !PAN_REGEX.test(cleanPan)) {
    throw new ApiError(400, "Invalid PAN format (expected 10-character PAN, e.g. AABCU9603R).");
  }

  const vendorCode = generateDocNumber("VND");
  const parsedTerms = Number(paymentTermsDays);
  const parsedOpening = Number(openingBalance);
  const parsedTdsRate = Number(defaultTdsRate);

  const vendor = await prisma.vendor.create({
    data: {
      vendorCode,
      name: cleanName,
      vendorType: vendorType ? String(vendorType).trim().toUpperCase() : "MATERIAL_SUPPLIER",
      gstin: cleanGstin,
      pan: cleanPan,
      contactPerson: contactPerson ? String(contactPerson).trim() : null,
      phone: phone ? String(phone).trim() : null,
      email: email ? String(email).trim() : null,
      address: address ? String(address).trim() : null,
      state: state ? String(state).trim() : null,
      pinCode: pinCode ? String(pinCode).trim() : null,
      bankAccountName: bankAccountName ? String(bankAccountName).trim() : null,
      bankAccountNumber: bankAccountNumber ? String(bankAccountNumber).trim() : null,
      ifscCode: ifscCode ? String(ifscCode).trim().toUpperCase() : null,
      paymentTermsDays: Number.isFinite(parsedTerms) ? Math.max(Math.round(parsedTerms), 0) : 30,
      openingBalance: Number.isFinite(parsedOpening) ? round2(parsedOpening) : 0,
      tdsApplicable: Boolean(tdsApplicable),
      defaultTdsRate: Number.isFinite(parsedTdsRate) ? round2(Math.max(parsedTdsRate, 0)) : 0,
      notes: notes ? String(notes).trim() : null,
    },
  });

  await writeFinanceAudit(req.auth?.userId, "VENDOR_CREATED", "Vendor", vendor.id, {
    vendorCode: vendor.vendorCode,
    name: vendor.name,
    gstin: vendor.gstin,
    vendorType: vendor.vendorType,
  });

  res.status(201).json({ status: "success", data: vendor });
};

// ---------------------------------------------------------------------------
// GET /financials/vendor-bills
// ---------------------------------------------------------------------------

export const listVendorBills = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const { vendorId, status, customerId } = req.query;
  const from = parseOptionalDate(req.query.from, "from");
  const to = parseOptionalDate(req.query.to, "to");
  if (to) to.setHours(23, 59, 59, 999);

  const where: any = {};
  if (vendorId) where.vendorId = String(vendorId);
  if (customerId !== undefined && customerId !== "") {
    const parsedCustId = Number(customerId);
    if (!Number.isInteger(parsedCustId)) throw new ApiError(400, "Invalid customerId filter");
    where.customerId = parsedCustId;
  }

  const normalizedStatus = status ? String(status).trim().toUpperCase() : "ALL";
  // Note: OVERDUE is computed dynamically from APPROVED/PARTIALLY_PAID bills past dueDate,
  // so only push non-OVERDUE valid enum statuses to the Prisma query.
  if (normalizedStatus !== "ALL" && normalizedStatus !== "OVERDUE") {
    if (!VALID_BILL_STATUSES.has(normalizedStatus)) {
      throw new ApiError(400, `Invalid bill status filter '${status}'`);
    }
    where.status = normalizedStatus as VendorBillStatus;
  }

  if (from || to) {
    where.invoiceDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const bills = await prisma.vendorBill
    .findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            name: true,
            vendorType: true,
            gstin: true,
            tdsApplicable: true,
            defaultTdsRate: true,
          },
        },
        customer: {
          select: { id: true, fullName: true, customerCode: true, city: true },
        },
        items: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    })
    .catch(() => []);

  const now = new Date();
  let enriched = bills.map((bill: any) => {
    const dueDateObj = new Date(bill.dueDate);
    const computed = computeBillPaymentStatus({
      netPayable: bill.netPayable,
      amountPaid: bill.amountPaid,
      dueDate: dueDateObj,
      currentStatus: bill.status,
      now,
    });
    return {
      ...bill,
      effectiveStatus: computed.status,
      balanceDue: computed.balanceDue,
      isOverdue:
        computed.balanceDue > 0.009 &&
        bill.status !== VendorBillStatus.DRAFT &&
        bill.status !== VendorBillStatus.CANCELLED &&
        dueDateObj.getTime() < now.getTime(),
    };
  });

  if (normalizedStatus === "OVERDUE") {
    enriched = enriched.filter((b: any) => b.isOverdue || b.effectiveStatus === VendorBillStatus.OVERDUE);
  }

  res.json({ status: "success", data: enriched });
};

// ---------------------------------------------------------------------------
// POST /financials/vendor-bills
// ---------------------------------------------------------------------------

export const createVendorBill = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const {
    vendorId,
    vendorInvoiceNo,
    invoiceDate,
    dueDate,
    purchaseOrderRef,
    grnRef,
    customerId,
    zone,
    category,
    supplyType,
    otherCharges,
    tdsRate,
    itcEligible,
    billableToCustomer,
    notes,
    attachmentUrl,
    items,
    submitMode,
  } = req.body ?? {};

  if (!vendorId) throw new ApiError(400, "vendorId is required.");
  const vendor = await prisma.vendor.findUnique({ where: { id: String(vendorId) } });
  if (!vendor) throw new ApiError(404, "Selected vendor not found.");

  const cleanInvoiceNo = String(vendorInvoiceNo ?? "").trim();
  if (!cleanInvoiceNo) throw new ApiError(400, "Vendor invoice number is required.");

  const duplicate = await prisma.vendorBill.findUnique({
    where: {
      vendorId_vendorInvoiceNo: {
        vendorId: vendor.id,
        vendorInvoiceNo: cleanInvoiceNo,
      },
    },
  });
  if (duplicate && duplicate.status !== VendorBillStatus.CANCELLED) {
    throw new ApiError(
      409,
      `Duplicate bill: Invoice '${cleanInvoiceNo}' is already recorded for vendor '${vendor.name}' (${duplicate.billNumber}).`
    );
  }

  let parsedCustomerId: number | null = null;
  if (customerId !== undefined && customerId !== null && customerId !== "" && customerId !== "none") {
    const cid = Number(customerId);
    if (!Number.isInteger(cid)) throw new ApiError(400, "Invalid customerId");
    parsedCustomerId = cid;
  }

  const parsedInvoiceDate = parseOptionalDate(invoiceDate, "invoiceDate") ?? new Date();
  const parsedDueDate =
    parseOptionalDate(dueDate, "dueDate") ??
    new Date(parsedInvoiceDate.getTime() + (vendor.paymentTermsDays || 30) * 86_400_000);

  const effectiveTdsRate =
    tdsRate !== undefined && tdsRate !== null && tdsRate !== ""
      ? Number(tdsRate)
      : vendor.tdsApplicable
        ? vendor.defaultTdsRate
        : 0;

  const calculated = calculateBillTotals({
    items: Array.isArray(items) ? items : [],
    supplyType: supplyType || "INTRA_STATE",
    otherCharges: Number(otherCharges ?? 0),
    tdsRate: effectiveTdsRate,
  });

  const mode = String(submitMode || "OPEN").toUpperCase();
  const initialStatus =
    mode === "DRAFT"
      ? VendorBillStatus.DRAFT
      : mode === "AWAITING_APPROVAL"
        ? VendorBillStatus.AWAITING_APPROVAL
        : VendorBillStatus.APPROVED;

  const billNumber = generateDocNumber("BILL");

  const createdBill = await prisma.$transaction(async (tx: any) => {
    const bill = await tx.vendorBill.create({
      data: {
        billNumber,
        vendorId: vendor.id,
        vendorInvoiceNo: cleanInvoiceNo,
        invoiceDate: parsedInvoiceDate,
        dueDate: parsedDueDate,
        purchaseOrderRef: purchaseOrderRef ? String(purchaseOrderRef).trim() : null,
        grnRef: grnRef ? String(grnRef).trim() : null,
        customerId: parsedCustomerId,
        zone: zone ? String(zone).trim() : null,
        category: category ? String(category).trim() : "Material Purchase",
        supplyType: calculated.supplyType,
        subtotal: calculated.subtotal,
        discountAmount: calculated.discountAmount,
        taxableAmount: calculated.taxableAmount,
        cgstAmount: calculated.cgstAmount,
        sgstAmount: calculated.sgstAmount,
        igstAmount: calculated.igstAmount,
        otherCharges: calculated.otherCharges,
        totalAmount: calculated.totalAmount,
        tdsRate: calculated.tdsRate,
        tdsAmount: calculated.tdsAmount,
        netPayable: calculated.netPayable,
        amountPaid: 0,
        balanceDue: calculated.netPayable,
        itcEligible: itcEligible !== undefined ? Boolean(itcEligible) : true,
        billableToCustomer: Boolean(billableToCustomer),
        status: initialStatus,
        attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
        notes: notes ? String(notes).trim() : null,
        createdById: req.auth?.userId ?? null,
        approvedById: initialStatus === VendorBillStatus.APPROVED ? (req.auth?.userId ?? null) : null,
        approvedAt: initialStatus === VendorBillStatus.APPROVED ? new Date() : null,
        items: {
          create: calculated.items,
        },
      },
      include: {
        vendor: true,
        customer: { select: { id: true, fullName: true, customerCode: true } },
        items: true,
      },
    });

    if (initialStatus === VendorBillStatus.APPROVED) {
      const journalLines = buildVendorBillJournalLines({
        vendorId: bill.vendorId,
        customerId: bill.customerId,
        zone: bill.zone,
        category: bill.category,
        taxableAmount: bill.taxableAmount,
        cgstAmount: bill.cgstAmount,
        sgstAmount: bill.sgstAmount,
        igstAmount: bill.igstAmount,
        otherCharges: bill.otherCharges,
        totalAmount: bill.totalAmount,
        tdsAmount: bill.tdsAmount,
        netPayable: bill.netPayable,
        itcEligible: bill.itcEligible,
        vendorInvoiceNo: bill.vendorInvoiceNo,
      });

      await postDoubleEntryJournal(tx, {
        entryDate: bill.invoiceDate,
        referenceType: "VENDOR_BILL",
        referenceId: bill.id,
        description: `Vendor Bill ${bill.billNumber} (${vendor.name} - Inv #${bill.vendorInvoiceNo})`,
        createdById: req.auth?.userId ?? null,
        lines: journalLines,
      });
    }

    return bill;
  });

  await writeFinanceAudit(req.auth?.userId, "VENDOR_BILL_CREATED", "VendorBill", createdBill.id, {
    billNumber: createdBill.billNumber,
    vendorId: createdBill.vendorId,
    vendorName: vendor.name,
    vendorInvoiceNo: createdBill.vendorInvoiceNo,
    totalAmount: createdBill.totalAmount,
    tdsAmount: createdBill.tdsAmount,
    netPayable: createdBill.netPayable,
    status: createdBill.status,
  });

  res.status(201).json({ status: "success", data: createdBill });
};

// ---------------------------------------------------------------------------
// POST /financials/vendor-bills/:id/approve
// ---------------------------------------------------------------------------

export const approveVendorBill = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const { id } = req.params;
  if (!id) throw new ApiError(400, "Bill id is required.");

  const bill = await prisma.vendorBill.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!bill) throw new ApiError(404, "Vendor bill not found.");

  if (bill.status !== VendorBillStatus.DRAFT && bill.status !== VendorBillStatus.AWAITING_APPROVAL) {
    throw new ApiError(409, `Bill is already in '${bill.status}' status.`);
  }

  const ctx = req.finance!;
  if (!ctx.level || ctx.level === "executive") {
    throw new ApiError(403, "Only Finance Manager, Finance Head, or Admin can approve vendor bills.");
  }

  const authority = checkApprovalAuthority({
    level: ctx.level,
    approverId: req.auth!.userId,
    amount: bill.totalAmount,
    createdById: ctx.level === "manager" ? bill.createdById : null,
  });
  if (!authority.allowed) {
    throw new ApiError(403, authority.reason);
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    const approved = await tx.vendorBill.update({
      where: { id: bill.id },
      data: {
        status: VendorBillStatus.APPROVED,
        approvedById: req.auth?.userId ?? null,
        approvedAt: new Date(),
      },
      include: { vendor: true, items: true },
    });

    const journalLines = buildVendorBillJournalLines({
      vendorId: approved.vendorId,
      customerId: approved.customerId,
      zone: approved.zone,
      category: approved.category,
      taxableAmount: approved.taxableAmount,
      cgstAmount: approved.cgstAmount,
      sgstAmount: approved.sgstAmount,
      igstAmount: approved.igstAmount,
      otherCharges: approved.otherCharges,
      totalAmount: approved.totalAmount,
      tdsAmount: approved.tdsAmount,
      netPayable: approved.netPayable,
      itcEligible: approved.itcEligible,
      vendorInvoiceNo: approved.vendorInvoiceNo,
    });

    await postDoubleEntryJournal(tx, {
      entryDate: approved.invoiceDate,
      referenceType: "VENDOR_BILL",
      referenceId: approved.id,
      description: `Approved Vendor Bill ${approved.billNumber} (${approved.vendor.name} - Inv #${approved.vendorInvoiceNo})`,
      createdById: req.auth?.userId ?? null,
      lines: journalLines,
    });

    return approved;
  });

  await writeFinanceAudit(req.auth?.userId, "VENDOR_BILL_APPROVED", "VendorBill", updated.id, {
    billNumber: updated.billNumber,
    totalAmount: updated.totalAmount,
    netPayable: updated.netPayable,
    approverLevel: ctx.level,
  });

  res.json({ status: "success", data: updated });
};

// ---------------------------------------------------------------------------
// PUT /financials/vendor-bills/:id (Update Bill)
// ---------------------------------------------------------------------------

export const updateVendorBill = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const { id } = req.params;
  if (!id) throw new ApiError(400, "Bill id is required.");

  const existingBill = await prisma.vendorBill.findUnique({
    where: { id },
    include: { vendor: true, items: true, payments: true },
  });
  if (!existingBill) throw new ApiError(404, "Vendor bill not found.");

  if (existingBill.status === VendorBillStatus.CANCELLED) {
    throw new ApiError(409, "Cannot update a cancelled vendor bill.");
  }

  const {
    vendorId,
    vendorInvoiceNo,
    invoiceDate,
    dueDate,
    purchaseOrderRef,
    grnRef,
    customerId,
    zone,
    category,
    supplyType,
    otherCharges,
    tdsRate,
    itcEligible,
    billableToCustomer,
    notes,
    attachmentUrl,
    items,
    submitMode,
  } = req.body ?? {};

  const targetVendorId = vendorId ? String(vendorId) : existingBill.vendorId;
  const vendor = await prisma.vendor.findUnique({ where: { id: targetVendorId } });
  if (!vendor) throw new ApiError(404, "Selected vendor not found.");

  const cleanInvoiceNo =
    vendorInvoiceNo !== undefined ? String(vendorInvoiceNo ?? "").trim() : existingBill.vendorInvoiceNo;
  if (!cleanInvoiceNo) throw new ApiError(400, "Vendor invoice number cannot be empty.");

  if (targetVendorId !== existingBill.vendorId || cleanInvoiceNo !== existingBill.vendorInvoiceNo) {
    const duplicate = await prisma.vendorBill.findUnique({
      where: {
        vendorId_vendorInvoiceNo: {
          vendorId: targetVendorId,
          vendorInvoiceNo: cleanInvoiceNo,
        },
      },
    });
    if (duplicate && duplicate.id !== existingBill.id && duplicate.status !== VendorBillStatus.CANCELLED) {
      throw new ApiError(
        409,
        `Duplicate bill: Invoice '${cleanInvoiceNo}' is already recorded for vendor '${vendor.name}' (${duplicate.billNumber}).`
      );
    }
  }

  let parsedCustomerId: number | null | undefined = undefined;
  if (customerId !== undefined) {
    if (customerId === null || customerId === "" || customerId === "none") {
      parsedCustomerId = null;
    } else {
      const cid = Number(customerId);
      if (!Number.isInteger(cid)) throw new ApiError(400, "Invalid customerId");
      parsedCustomerId = cid;
    }
  }

  const parsedInvoiceDate =
    invoiceDate !== undefined ? parseOptionalDate(invoiceDate, "invoiceDate") ?? new Date() : existingBill.invoiceDate;
  const parsedDueDate =
    dueDate !== undefined ? parseOptionalDate(dueDate, "dueDate") ?? existingBill.dueDate : existingBill.dueDate;

  const targetItems = Array.isArray(items) && items.length > 0 ? items : existingBill.items;
  const targetSupplyType = supplyType || existingBill.supplyType;
  const targetOtherCharges = otherCharges !== undefined ? Number(otherCharges ?? 0) : existingBill.otherCharges;
  const effectiveTdsRate =
    tdsRate !== undefined && tdsRate !== null && tdsRate !== ""
      ? Number(tdsRate)
      : existingBill.tdsRate;

  const calculated = calculateBillTotals({
    items: targetItems,
    supplyType: targetSupplyType,
    otherCharges: targetOtherCharges,
    tdsRate: effectiveTdsRate,
  });

  if (existingBill.amountPaid > 0 && calculated.netPayable < existingBill.amountPaid) {
    throw new ApiError(
      400,
      `New net payable (₹${calculated.netPayable.toLocaleString("en-IN")}) cannot be less than already paid amount (₹${existingBill.amountPaid.toLocaleString("en-IN")}).`
    );
  }

  const newBalanceDue = round2(Math.max(calculated.netPayable - existingBill.amountPaid, 0));

  let finalStatus = existingBill.status;
  if (submitMode) {
    const mode = String(submitMode).toUpperCase();
    if (mode === "DRAFT") finalStatus = VendorBillStatus.DRAFT;
    else if (mode === "AWAITING_APPROVAL") finalStatus = VendorBillStatus.AWAITING_APPROVAL;
    else if (mode === "OPEN") finalStatus = VendorBillStatus.APPROVED;
  }
  if (existingBill.amountPaid > 0) {
    finalStatus = newBalanceDue <= 0.009 ? VendorBillStatus.PAID : VendorBillStatus.PARTIALLY_PAID;
  }

  const updatedBill = await prisma.$transaction(async (tx: any) => {
    if (Array.isArray(items)) {
      await tx.vendorBillItem.deleteMany({ where: { billId: existingBill.id } });
    }

    const bill = await tx.vendorBill.update({
      where: { id: existingBill.id },
      data: {
        vendorId: targetVendorId,
        vendorInvoiceNo: cleanInvoiceNo,
        invoiceDate: parsedInvoiceDate,
        dueDate: parsedDueDate,
        purchaseOrderRef:
          purchaseOrderRef !== undefined
            ? purchaseOrderRef
              ? String(purchaseOrderRef).trim()
              : null
            : existingBill.purchaseOrderRef,
        grnRef: grnRef !== undefined ? (grnRef ? String(grnRef).trim() : null) : existingBill.grnRef,
        customerId: parsedCustomerId !== undefined ? parsedCustomerId : existingBill.customerId,
        zone: zone !== undefined ? (zone ? String(zone).trim() : null) : existingBill.zone,
        category: category !== undefined ? String(category).trim() : existingBill.category,
        supplyType: calculated.supplyType,
        subtotal: calculated.subtotal,
        discountAmount: calculated.discountAmount,
        taxableAmount: calculated.taxableAmount,
        cgstAmount: calculated.cgstAmount,
        sgstAmount: calculated.sgstAmount,
        igstAmount: calculated.igstAmount,
        otherCharges: calculated.otherCharges,
        totalAmount: calculated.totalAmount,
        tdsRate: calculated.tdsRate,
        tdsAmount: calculated.tdsAmount,
        netPayable: calculated.netPayable,
        balanceDue: newBalanceDue,
        status: finalStatus,
        itcEligible: itcEligible !== undefined ? Boolean(itcEligible) : existingBill.itcEligible,
        billableToCustomer:
          billableToCustomer !== undefined ? Boolean(billableToCustomer) : existingBill.billableToCustomer,
        attachmentUrl:
          attachmentUrl !== undefined
            ? attachmentUrl
              ? String(attachmentUrl)
              : null
            : existingBill.attachmentUrl,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : existingBill.notes,
        ...(finalStatus === VendorBillStatus.APPROVED && !existingBill.approvedAt
          ? {
              approvedById: req.auth?.userId ?? null,
              approvedAt: new Date(),
            }
          : {}),
        ...(Array.isArray(items)
          ? {
              items: {
                create: calculated.items,
              },
            }
          : {}),
      },
      include: {
        vendor: true,
        customer: { select: { id: true, fullName: true, customerCode: true } },
        items: true,
      },
    });

    const existingJournals = await tx.journalEntry.findMany({
      where: { referenceType: "VENDOR_BILL", referenceId: existingBill.id },
      select: { id: true },
    });
    for (const je of existingJournals) {
      await tx.journalLine.deleteMany({ where: { entryId: je.id } });
      await tx.journalEntry.delete({ where: { id: je.id } });
    }

    if (
      finalStatus !== VendorBillStatus.DRAFT &&
      finalStatus !== VendorBillStatus.AWAITING_APPROVAL &&
      finalStatus !== VendorBillStatus.CANCELLED
    ) {
      const journalLines = buildVendorBillJournalLines({
        vendorId: bill.vendorId,
        customerId: bill.customerId,
        zone: bill.zone,
        category: bill.category,
        taxableAmount: bill.taxableAmount,
        cgstAmount: bill.cgstAmount,
        sgstAmount: bill.sgstAmount,
        igstAmount: bill.igstAmount,
        otherCharges: bill.otherCharges,
        totalAmount: bill.totalAmount,
        tdsAmount: bill.tdsAmount,
        netPayable: bill.netPayable,
        itcEligible: bill.itcEligible,
        vendorInvoiceNo: bill.vendorInvoiceNo,
      });

      await postDoubleEntryJournal(tx, {
        entryDate: bill.invoiceDate,
        referenceType: "VENDOR_BILL",
        referenceId: bill.id,
        description: `Updated Vendor Bill ${bill.billNumber} (${vendor.name} - Inv #${bill.vendorInvoiceNo})`,
        createdById: req.auth?.userId ?? null,
        lines: journalLines,
      });
    }

    return bill;
  });

  await writeFinanceAudit(req.auth?.userId, "VENDOR_BILL_UPDATED", "VendorBill", updatedBill.id, {
    billNumber: updatedBill.billNumber,
    vendorId: updatedBill.vendorId,
    vendorName: vendor.name,
    vendorInvoiceNo: updatedBill.vendorInvoiceNo,
    totalAmount: updatedBill.totalAmount,
    netPayable: updatedBill.netPayable,
    status: updatedBill.status,
  });

  res.json({ status: "success", data: updatedBill });
};

// ---------------------------------------------------------------------------
// DELETE /financials/vendor-bills/:id (Delete Bill)
// ---------------------------------------------------------------------------

export const deleteVendorBill = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const { id } = req.params;
  if (!id) throw new ApiError(400, "Bill id is required.");

  const bill = await prisma.vendorBill.findUnique({
    where: { id },
    include: { payments: true, vendor: true },
  });
  if (!bill) throw new ApiError(404, "Vendor bill not found.");

  if (bill.amountPaid > 0 || (bill.payments && bill.payments.length > 0)) {
    throw new ApiError(
      409,
      "Cannot delete a vendor bill that has recorded payments. Please delete or reverse the payments first."
    );
  }

  await prisma.$transaction(async (tx: any) => {
    const journalEntries = await tx.journalEntry.findMany({
      where: { referenceType: "VENDOR_BILL", referenceId: bill.id },
      select: { id: true },
    });
    for (const je of journalEntries) {
      await tx.journalLine.deleteMany({ where: { entryId: je.id } });
      await tx.journalEntry.delete({ where: { id: je.id } });
    }

    await tx.vendorBillItem.deleteMany({ where: { billId: bill.id } });
    await tx.vendorBill.delete({ where: { id: bill.id } });
  });

  await writeFinanceAudit(req.auth?.userId, "VENDOR_BILL_DELETED", "VendorBill", id, {
    billNumber: bill.billNumber,
    vendorId: bill.vendorId,
    vendorName: bill.vendor?.name,
    vendorInvoiceNo: bill.vendorInvoiceNo,
    totalAmount: bill.totalAmount,
    netPayable: bill.netPayable,
    status: bill.status,
  });

  res.json({ status: "success", message: `Vendor bill ${bill.billNumber} deleted successfully.` });
};

// ---------------------------------------------------------------------------
// POST /financials/vendor-payments (Partial or Full Payment against Vendor Bill)
// ---------------------------------------------------------------------------

export const recordVendorPayment = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const {
    vendorId,
    billId,
    amount,
    tdsDeducted,
    paymentDate,
    paymentMode,
    referenceNo,
    bankAccount,
    notes,
  } = req.body ?? {};

  const parsedAmount = round2(Number(amount));
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero.");
  }
  const parsedTds = round2(Math.max(Number(tdsDeducted ?? 0) || 0, 0));
  const totalSettlement = round2(parsedAmount + parsedTds);

  const parsedDate = parseOptionalDate(paymentDate, "paymentDate") ?? new Date();
  const mode = paymentMode ? String(paymentMode).trim().toUpperCase() : "NEFT";

  const result = await prisma.$transaction(async (tx: any) => {
    let targetVendorId = vendorId ? String(vendorId) : "";
    let updatedBill: { id: string; billNumber: string } | null = null;

    if (billId) {
      const bill = await tx.vendorBill.findUnique({
        where: { id: String(billId) },
        include: { vendor: true },
      });
      if (!bill) throw new ApiError(404, "Vendor bill not found.");
      if (bill.status === VendorBillStatus.DRAFT || bill.status === VendorBillStatus.AWAITING_APPROVAL) {
        throw new ApiError(409, "Cannot record payment against a draft or unapproved bill. Approve the bill first.");
      }
      if (bill.status === VendorBillStatus.CANCELLED) {
        throw new ApiError(409, "Cannot record payment against a cancelled bill.");
      }
      if (totalSettlement > bill.balanceDue + 0.01) {
        throw new ApiError(
          400,
          `Payment (₹${totalSettlement.toLocaleString("en-IN")}) exceeds the bill's outstanding balance of ₹${bill.balanceDue.toLocaleString("en-IN")}.`
        );
      }

      targetVendorId = bill.vendorId;
      const newAmountPaid = round2(bill.amountPaid + totalSettlement);
      const nextState = computeBillPaymentStatus({
        netPayable: bill.netPayable,
        amountPaid: newAmountPaid,
        dueDate: new Date(bill.dueDate),
        currentStatus: VendorBillStatus.APPROVED,
      });

      updatedBill = await tx.vendorBill.update({
        where: { id: bill.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: nextState.balanceDue,
          status: nextState.status,
        },
      });
    }

    if (!targetVendorId) {
      throw new ApiError(400, "vendorId or billId is required to record a vendor payment.");
    }

    const vendor = await tx.vendor.findUnique({ where: { id: targetVendorId } });
    if (!vendor) throw new ApiError(404, "Vendor not found.");

    const paymentNumber = generateDocNumber("VPAY");

    const payment = await tx.vendorPayment.create({
      data: {
        paymentNumber,
        vendorId: vendor.id,
        billId: updatedBill ? updatedBill.id : null,
        paymentDate: parsedDate,
        amount: parsedAmount,
        tdsDeducted: parsedTds,
        paymentMode: mode,
        referenceNo: referenceNo ? String(referenceNo).trim() : null,
        bankAccount: bankAccount ? String(bankAccount).trim() : "Primary Current Account",
        notes: notes ? String(notes).trim() : null,
        createdById: req.auth?.userId ?? null,
      },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } },
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorInvoiceNo: true,
            netPayable: true,
            amountPaid: true,
            balanceDue: true,
            status: true,
          },
        },
      },
    });

    const journalLines = buildVendorPaymentJournalLines({
      vendorId: vendor.id,
      amount: parsedAmount,
      tdsDeducted: parsedTds,
      paymentMode: mode,
      referenceNo: payment.referenceNo,
      paymentNumber: payment.paymentNumber,
    });

    await postDoubleEntryJournal(tx, {
      entryDate: parsedDate,
      referenceType: "VENDOR_PAYMENT",
      referenceId: payment.id,
      description: `Vendor Payment ${payment.paymentNumber} to ${vendor.name}${updatedBill ? ` against ${updatedBill.billNumber}` : " (Advance)"}`,
      createdById: req.auth?.userId ?? null,
      lines: journalLines,
    });

    return payment;
  });

  await writeFinanceAudit(req.auth?.userId, "VENDOR_PAYMENT_RECORDED", "VendorPayment", result.id, {
    paymentNumber: result.paymentNumber,
    vendorId: result.vendorId,
    billId: result.billId,
    amount: result.amount,
    tdsDeducted: result.tdsDeducted,
    paymentMode: result.paymentMode,
    referenceNo: result.referenceNo,
    billStatusAfter: result.bill?.status ?? "ADVANCE",
    billBalanceAfter: result.bill?.balanceDue ?? null,
  });

  res.status(201).json({ status: "success", data: result });
};

// ---------------------------------------------------------------------------
// GET /financials/vendor-payments
// ---------------------------------------------------------------------------

export const listVendorPayments = async (req: Request, res: Response) => {
  await ensureFinanceSchemaReady();

  const { vendorId, billId } = req.query;
  const where: any = {};
  if (vendorId) where.vendorId = String(vendorId);
  if (billId) where.billId = String(billId);

  const payments = await prisma.vendorPayment
    .findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } },
        bill: {
          select: {
            id: true,
            billNumber: true,
            vendorInvoiceNo: true,
            totalAmount: true,
            netPayable: true,
            balanceDue: true,
            status: true,
          },
        },
      },
    })
    .catch(() => []);

  res.json({ status: "success", data: payments });
};

// ---------------------------------------------------------------------------
// GET /financials/ledger (Database-Aggregated Trial Balance & Journal Entries)
// ---------------------------------------------------------------------------

export const getGeneralLedger = async (_req: Request, res: Response) => {
  await ensureFinanceSchemaReady();
  await ensureSystemChartOfAccounts();

  // Perform O(1) SQL aggregation by accountId instead of loading all JournalLine rows into Node memory
  const [accounts, lineSums, entries] = await Promise.all([
    prisma.ledgerAccount
      .findMany({
        orderBy: { code: "asc" },
      })
      .catch(() => []),
    prisma.journalLine
      .groupBy({
        by: ["accountId"],
        _sum: { debit: true, credit: true },
      })
      .catch(() => []),
    prisma.journalEntry
      .findMany({
        orderBy: { entryDate: "desc" },
        take: 100,
        include: {
          lines: {
            include: {
              account: { select: { code: true, name: true, accountType: true } },
            },
          },
        },
      })
      .catch(() => []),
  ]);

  const sumByAccountId = new Map<string, { debit: number; credit: number }>();
  for (const row of lineSums as any[]) {
    if (!row?.accountId) continue;
    sumByAccountId.set(row.accountId, {
      debit: round2(Number(row._sum?.debit ?? 0)),
      credit: round2(Number(row._sum?.credit ?? 0)),
    });
  }

  let trialBalanceDebit = 0;
  let trialBalanceCredit = 0;

  const trialBalance = accounts.map((acc: any) => {
    const sums = sumByAccountId.get(acc.id) ?? { debit: 0, credit: 0 };
    const totalDebit = sums.debit;
    const totalCredit = sums.credit;
    trialBalanceDebit = round2(trialBalanceDebit + totalDebit);
    trialBalanceCredit = round2(trialBalanceCredit + totalCredit);

    const isDebitNormal = acc.accountType === "ASSET" || acc.accountType === "EXPENSE";
    const netBalance = isDebitNormal ? round2(totalDebit - totalCredit) : round2(totalCredit - totalDebit);

    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      accountType: acc.accountType,
      totalDebit,
      totalCredit,
      netBalance,
    };
  });

  const byCode = new Map<string, any>(trialBalance.map((a: any) => [a.code, a]));
  const inputCgst = byCode.get("1310")?.netBalance ?? 0;
  const inputSgst = byCode.get("1320")?.netBalance ?? 0;
  const inputIgst = byCode.get("1330")?.netBalance ?? 0;
  const tdsPayable = byCode.get("2200")?.netBalance ?? 0;
  const accountsPayable = byCode.get("2000")?.netBalance ?? 0;

  res.json({
    status: "success",
    data: {
      summary: {
        trialBalanceDebit,
        trialBalanceCredit,
        isBalanced: Math.abs(trialBalanceDebit - trialBalanceCredit) < 0.01,
        inputCgst,
        inputSgst,
        inputIgst,
        totalItcAvailable: round2(inputCgst + inputSgst + inputIgst),
        tdsPayable,
        accountsPayable,
      },
      trialBalance,
      journalEntries: entries,
    },
  });
};
