/**
 * Run: node --test --import tsx src/modules/financials/vendor-ledger.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { VendorBillStatus } from "@prisma/client";
import {
  buildVendorBillJournalLines,
  buildVendorPaymentJournalLines,
  calculateBillTotals,
  computeBillPaymentStatus,
  generateDocNumber,
  round2,
} from "./vendor-ledger.service.js";

test("calculateBillTotals computes intra-state CGST/SGST and TDS on taxable value", () => {
  const result = calculateBillTotals({
    supplyType: "INTRA_STATE",
    otherCharges: 500,
    tdsRate: 2, // 2% Sec 194C contractor TDS
    items: [
      {
        itemName: "Solar DC Cable 4 sq mm",
        hsnSac: "8544",
        quantity: 100,
        unit: "metre",
        rate: 35,
        discountPct: 0,
        gstRate: 18,
      },
    ],
  });

  assert.equal(result.subtotal, 3500);
  assert.equal(result.taxableAmount, 3500);
  assert.equal(result.cgstAmount, 315);
  assert.equal(result.sgstAmount, 315);
  assert.equal(result.igstAmount, 0);
  assert.equal(result.otherCharges, 500);
  assert.equal(result.totalAmount, 4630);
  // 2% TDS on taxable 3500 = 70
  assert.equal(result.tdsAmount, 70);
  assert.equal(result.netPayable, 4560);
});

test("calculateBillTotals computes inter-state IGST with discount", () => {
  const result = calculateBillTotals({
    supplyType: "INTER_STATE",
    items: [
      {
        itemName: "550W Mono PERC Solar Panel",
        hsnSac: "85414300",
        quantity: 10,
        unit: "nos",
        rate: 10000,
        discountPct: 10, // 90,000 taxable
        gstRate: 12,
      },
    ],
  });

  assert.equal(result.subtotal, 100000);
  assert.equal(result.discountAmount, 10000);
  assert.equal(result.taxableAmount, 90000);
  assert.equal(result.cgstAmount, 0);
  assert.equal(result.sgstAmount, 0);
  assert.equal(result.igstAmount, 10800);
  assert.equal(result.totalAmount, 100800);
  assert.equal(result.netPayable, 100800);
});

test("buildVendorBillJournalLines produces balanced double-entry lines with Input GST and TDS Payable", () => {
  const lines = buildVendorBillJournalLines({
    vendorId: "vnd_1",
    customerId: 42,
    zone: "Nagpur",
    category: "Material Purchase",
    taxableAmount: 50000,
    cgstAmount: 4500,
    sgstAmount: 4500,
    igstAmount: 0,
    otherCharges: 0,
    totalAmount: 59000,
    tdsAmount: 1000,
    netPayable: 58000,
    itcEligible: true,
    vendorInvoiceNo: "INV-AVANTI-101",
  });

  const totalDebit = round2(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = round2(lines.reduce((s, l) => s + l.credit, 0));
  assert.equal(totalDebit, 59000);
  assert.equal(totalCredit, 59000);

  // Verify specific accounts: 5000 (Direct Cost), 1310 (Input CGST), 1320 (Input SGST), 2200 (TDS Payable), 2000 (AP)
  const byCode = new Map(lines.map((l) => [l.accountCode, l]));
  assert.equal(byCode.get("5000")?.debit, 50000);
  assert.equal(byCode.get("1310")?.debit, 4500);
  assert.equal(byCode.get("1320")?.debit, 4500);
  assert.equal(byCode.get("2200")?.credit, 1000);
  assert.equal(byCode.get("2000")?.credit, 58000);
});

test("computeBillPaymentStatus tracks partial and full payments accurately", () => {
  const futureDue = new Date(Date.now() + 7 * 86_400_000);
  const pastDue = new Date(Date.now() - 7 * 86_400_000);

  // ₹50,000 bill with ₹20,000 first payment -> PARTIALLY_PAID, ₹30,000 remaining
  const firstPayment = computeBillPaymentStatus({
    netPayable: 50000,
    amountPaid: 20000,
    dueDate: futureDue,
    currentStatus: VendorBillStatus.APPROVED,
  });
  assert.equal(firstPayment.status, VendorBillStatus.PARTIALLY_PAID);
  assert.equal(firstPayment.balanceDue, 30000);

  // Second payment of ₹10,000 (total ₹30,000 paid) -> PARTIALLY_PAID, ₹20,000 remaining
  const secondPayment = computeBillPaymentStatus({
    netPayable: 50000,
    amountPaid: 30000,
    dueDate: futureDue,
    currentStatus: VendorBillStatus.PARTIALLY_PAID,
  });
  assert.equal(secondPayment.status, VendorBillStatus.PARTIALLY_PAID);
  assert.equal(secondPayment.balanceDue, 20000);

  // Final payment of ₹20,000 (total ₹50,000 paid) -> PAID, ₹0 remaining
  const fullPayment = computeBillPaymentStatus({
    netPayable: 50000,
    amountPaid: 50000,
    dueDate: futureDue,
    currentStatus: VendorBillStatus.PARTIALLY_PAID,
  });
  assert.equal(fullPayment.status, VendorBillStatus.PAID);
  assert.equal(fullPayment.balanceDue, 0);

  // Unpaid bill past due date -> OVERDUE
  const overdueCheck = computeBillPaymentStatus({
    netPayable: 50000,
    amountPaid: 0,
    dueDate: pastDue,
    currentStatus: VendorBillStatus.APPROVED,
  });
  assert.equal(overdueCheck.status, VendorBillStatus.OVERDUE);
  assert.equal(overdueCheck.balanceDue, 50000);
});

test("buildVendorPaymentJournalLines balances AP debit with Bank/Cash and TDS credits", () => {
  const lines = buildVendorPaymentJournalLines({
    vendorId: "vnd_1",
    amount: 19600,
    tdsDeducted: 400,
    paymentMode: "NEFT",
    referenceNo: "UTR987654321",
    paymentNumber: "VPAY-2026-0001",
  });

  const totalDebit = round2(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = round2(lines.reduce((s, l) => s + l.credit, 0));
  assert.equal(totalDebit, 20000);
  assert.equal(totalCredit, 20000);
});

test("generateDocNumber produces collision-free unique identifiers", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const code = generateDocNumber("BILL");
    assert.match(code, /^BILL-\d{4}-[A-Z0-9]{9}$/);
    assert.equal(seen.has(code), false);
    seen.add(code);
  }
});

