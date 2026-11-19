import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  getFinancialSummary,
  getMonthlyPnL,
  getZoneBreakdown,
  getAmcContracts,
  getPartnerPayouts,
  getFinanceMe,
  getCustomerLedger,
  getVendorPayables,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./financials.controller.js";
import {
  listVendors,
  createVendor,
  listVendorBills,
  createVendorBill,
  approveVendorBill,
  updateVendorBill,
  deleteVendorBill,
  listVendorPayments,
  recordVendorPayment,
  getGeneralLedger,
} from "./vendor-bills.controller.js";
import { confirmCommissionPayment, upload } from "./commissions.controller.js";
import { attachFinanceContext, hasFinancePermission, requireFinancePermission } from "./finance-access.js";

export const financialsRoutes = Router();

// Every financial route resolves the caller's finance authority from the database.
financialsRoutes.use(authenticateAccessToken, attachFinanceContext);

// Caller's own finance capabilities (used by the UI to show/hide actions; the API still enforces them).
financialsRoutes.get("/me", asyncHandler(getFinanceMe));

// Company-wide figures: finance staff and Admin/Super Admin only. Partners are NOT allowed here.
financialsRoutes.get("/summary", requireFinancePermission("finance.dashboard.view"), asyncHandler(getFinancialSummary));
financialsRoutes.get("/zones", requireFinancePermission("finance.dashboard.view"), asyncHandler(getZoneBreakdown));
financialsRoutes.get("/pnl", requireFinancePermission("finance.reports.company"), asyncHandler(getMonthlyPnL));
financialsRoutes.get("/customer-ledger", requireFinancePermission("finance.dashboard.view"), asyncHandler(getCustomerLedger));
financialsRoutes.get("/vendor-payables", requireFinancePermission("finance.dashboard.view"), asyncHandler(getVendorPayables));
financialsRoutes.get("/expenses", requireFinancePermission("finance.dashboard.view"), asyncHandler(listExpenses));
financialsRoutes.post("/expenses", requireFinancePermission("finance.invoice.create"), asyncHandler(createExpense));
financialsRoutes.put("/expenses/:id", requireFinancePermission("finance.invoice.update"), asyncHandler(updateExpense));
financialsRoutes.delete("/expenses/:id", requireFinancePermission("finance.invoice.update"), asyncHandler(deleteExpense));

// Vendor Master, Vendor Bills (AP Lifecycle), Vendor Payments & Double-Entry General Ledger
financialsRoutes.get("/vendors", requireFinancePermission("finance.dashboard.view"), asyncHandler(listVendors));
financialsRoutes.post("/vendors", requireFinancePermission("finance.invoice.create"), asyncHandler(createVendor));
financialsRoutes.get("/vendor-bills", requireFinancePermission("finance.dashboard.view"), asyncHandler(listVendorBills));
financialsRoutes.post("/vendor-bills", requireFinancePermission("finance.invoice.create"), asyncHandler(createVendorBill));
financialsRoutes.put("/vendor-bills/:id", requireFinancePermission("finance.invoice.update"), asyncHandler(updateVendorBill));
financialsRoutes.delete("/vendor-bills/:id", requireFinancePermission("finance.invoice.update"), asyncHandler(deleteVendorBill));
financialsRoutes.post("/vendor-bills/:id/approve", requireFinancePermission("finance.commission.approve"), asyncHandler(approveVendorBill));
financialsRoutes.get("/vendor-payments", requireFinancePermission("finance.dashboard.view"), asyncHandler(listVendorPayments));
financialsRoutes.post("/vendor-payments", requireFinancePermission("finance.invoice.create"), asyncHandler(recordVendorPayment));
financialsRoutes.get("/ledger", requireFinancePermission("finance.dashboard.view"), asyncHandler(getGeneralLedger));

// AMC contracts: finance staff plus Service Coordinators (AMC is their operational domain).
financialsRoutes.get(
  "/amc",
  (req, _res, next) => {
    const ctx = req.finance!;
    if (hasFinancePermission(ctx.level, "finance.dashboard.view") || ctx.isServiceCoordinator) return next();
    next(new ApiError(403, "You do not have access to AMC financial records."));
  },
  asyncHandler(getAmcContracts)
);

// Partner payouts: finance staff see all partners; a partner sees only their own row (scoped in controller).
financialsRoutes.get(
  "/payouts",
  (req, _res, next) => {
    const ctx = req.finance!;
    if (hasFinancePermission(ctx.level, "finance.commission.view_all") || ctx.partnerProfileId) return next();
    next(new ApiError(403, "You do not have access to partner payouts."));
  },
  asyncHandler(getPartnerPayouts)
);

// Confirming a commission payout is a money movement: Finance Manager / Head / Admin, within limits.
financialsRoutes.post(
  "/commissions/:customerId/confirm",
  requireFinancePermission("finance.commission.approve"),
  upload.single("proof"),
  asyncHandler(confirmCommissionPayment)
);
