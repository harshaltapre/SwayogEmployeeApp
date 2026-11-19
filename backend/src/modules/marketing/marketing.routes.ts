import { Router, type RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import {
  bulkImportMarketingLeadsHandler,
  createMarketingCampaignHandler,
  createMarketingFollowUpHandler,
  createMarketingLeadHandler,
  deleteMarketingLeadHandler,
  importMarketingWorkspaceHandler,
  listDeletedMarketingLeadsHandler,
  listMarketingCampaignsHandler,
  listMarketingFollowUpsHandler,
  listMarketingLeadsHandler,
  marketingLeadConversionStatsHandler,
  restoreDeletedMarketingLeadHandler,
  updateMarketingCampaignHandler,
  updateMarketingFollowUpHandler,
  updateMarketingLeadHandler,
} from "./marketing.controller.js";
import {
  createMarketingCampaignSchema,
  createMarketingFollowUpSchema,
  createMarketingLeadSchema,
  importMarketingWorkspaceSchema,
  updateMarketingCampaignSchema,
  updateMarketingFollowUpSchema,
  marketingLeadConversionStatsQuerySchema,
  updateMarketingLeadSchema,
} from "./marketing.schemas.js";
import { z } from "zod";

const authorizeMarketingUsers: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    return next(new ApiError(401, "Authentication required"));
  }

  const normalizedJobRole = req.auth.jobRole
    ?.trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "")
    .trim();
  const isMarketingRole =
    req.auth.role === UserRole.EMPLOYEE ||
    req.auth.role === UserRole.TEAM_LEAD ||
    req.auth.role === UserRole.DEPARTMENT_HEAD;
  const isMarketingExecutive = isMarketingRole && normalizedJobRole === "marketingexecutive";
  const isProjectCoordinator =
    req.auth.role === UserRole.EMPLOYEE &&
    (normalizedJobRole === "projectcoordinator" || normalizedJobRole?.includes("coordinator"));
  const isLiaisoningOrMonitoring =
    req.auth.role === UserRole.EMPLOYEE &&
    (normalizedJobRole === "liaisoningemployee" ||
      normalizedJobRole === "monitoringanalyst" ||
      normalizedJobRole?.includes("liaison") ||
      normalizedJobRole?.includes("monitoring"));

  const isManagement =
    req.auth.role === UserRole.ADMIN ||
    req.auth.role === UserRole.SUPER_ADMIN ||
    (req.auth.role as string) === "SUB_ADMIN";

  if (isManagement || isMarketingExecutive) {
    return next();
  }

  // Project coordinators, liaisoning employees, and monitoring analysts have read access to view leads
  if ((isProjectCoordinator || isLiaisoningOrMonitoring) && req.method === "GET") {
    return next();
  }

  next(new ApiError(403, "Access denied. Marketing users only."));
};

export const marketingRoutes = Router();

marketingRoutes.use(authenticateAccessToken, authorizeMarketingUsers);

marketingRoutes.get("/leads", asyncHandler(listMarketingLeadsHandler));
marketingRoutes.get(
  "/leads/conversion-stats",
  validateQuery(marketingLeadConversionStatsQuerySchema),
  asyncHandler(marketingLeadConversionStatsHandler),
);
marketingRoutes.post(
  "/workspace/import",
  validateBody(importMarketingWorkspaceSchema),
  asyncHandler(importMarketingWorkspaceHandler),
);
marketingRoutes.post(
  "/leads/bulk",
  asyncHandler(bulkImportMarketingLeadsHandler),
);
marketingRoutes.post(
  "/leads",
  validateBody(createMarketingLeadSchema),
  asyncHandler(createMarketingLeadHandler),
);
marketingRoutes.patch(
  "/leads/:id",
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateMarketingLeadSchema),
  asyncHandler(updateMarketingLeadHandler),
);
marketingRoutes.delete(
  "/leads/:id",
  validateParams(z.object({ id: z.string().min(1) })),
  asyncHandler(deleteMarketingLeadHandler),
);
marketingRoutes.get("/deleted-leads", asyncHandler(listDeletedMarketingLeadsHandler));
marketingRoutes.post(
  "/deleted-leads/:id/restore",
  validateParams(z.object({ id: z.string().min(1) })),
  asyncHandler(restoreDeletedMarketingLeadHandler),
);
marketingRoutes.get("/campaigns", asyncHandler(listMarketingCampaignsHandler));
marketingRoutes.post(
  "/campaigns",
  validateBody(createMarketingCampaignSchema),
  asyncHandler(createMarketingCampaignHandler),
);
marketingRoutes.patch(
  "/campaigns/:id",
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateMarketingCampaignSchema),
  asyncHandler(updateMarketingCampaignHandler),
);
marketingRoutes.get("/follow-ups", asyncHandler(listMarketingFollowUpsHandler));
marketingRoutes.post(
  "/follow-ups",
  validateBody(createMarketingFollowUpSchema),
  asyncHandler(createMarketingFollowUpHandler),
);
marketingRoutes.patch(
  "/follow-ups/:id",
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateMarketingFollowUpSchema),
  asyncHandler(updateMarketingFollowUpHandler),
);
