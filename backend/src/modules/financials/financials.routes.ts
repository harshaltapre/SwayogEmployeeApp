import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles, requireMinRole } from "../../middleware/auth.js";
import {
  getFinancialSummary,
  getMonthlyPnL,
  getZoneBreakdown,
  getAmcContracts,
  getPartnerPayouts
} from "./financials.controller.js";
import { confirmCommissionPayment, upload } from "./commissions.controller.js";

export const financialsRoutes = Router();

// All financial routes require ADMIN-tier roles
const financialAuth = [
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
];

financialsRoutes.get("/summary", ...financialAuth, asyncHandler(getFinancialSummary));
financialsRoutes.get("/pnl", ...financialAuth, asyncHandler(getMonthlyPnL));
financialsRoutes.get("/zones", ...financialAuth, asyncHandler(getZoneBreakdown));
financialsRoutes.get("/amc", ...financialAuth, asyncHandler(getAmcContracts));
financialsRoutes.get("/payouts", ...financialAuth, asyncHandler(getPartnerPayouts));
financialsRoutes.post("/commissions/:customerId/confirm", authenticateAccessToken, requireMinRole(UserRole.ADMIN), upload.single("proof"), asyncHandler(confirmCommissionPayment));
