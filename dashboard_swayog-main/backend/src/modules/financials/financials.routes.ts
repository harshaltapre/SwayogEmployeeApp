import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireRole } from "../../middleware/auth.js";
import {
  getFinancialSummary,
  getMonthlyPnL,
  getZoneBreakdown,
  getAmcContracts,
  getPartnerPayouts
} from "./financials.controller.js";
import { confirmCommissionPayment, upload } from "./commissions.controller.js";

export const financialsRoutes = Router();

// Financials require ADMIN or SUPER_ADMIN role
const adminAuth = [authenticateAccessToken, requireRole(UserRole.ADMIN)];
const superAdminAuth = [authenticateAccessToken, requireRole(UserRole.SUPER_ADMIN)];
const anyAdminAuth = [authenticateAccessToken]; // Logic inside controller if needed, or use a helper

financialsRoutes.get("/summary", authenticateAccessToken, asyncHandler(getFinancialSummary));
financialsRoutes.get("/pnl", authenticateAccessToken, asyncHandler(getMonthlyPnL));
financialsRoutes.get("/zones", authenticateAccessToken, asyncHandler(getZoneBreakdown));
financialsRoutes.get("/amc", authenticateAccessToken, asyncHandler(getAmcContracts));
financialsRoutes.get("/payouts", authenticateAccessToken, asyncHandler(getPartnerPayouts));
financialsRoutes.post("/commissions/:customerId/confirm", ...superAdminAuth, upload.single("proof"), asyncHandler(confirmCommissionPayment));
