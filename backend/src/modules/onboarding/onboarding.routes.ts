import { Router, type RequestHandler } from "express";
import multer from "multer";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import {
  listOnboardingRequestsHandler,
  getOnboardingRequestByIdHandler,
  createOnboardingRequestHandler,
  updateOnboardingRequestHandler,
  archiveOnboardingRequestHandler,
  createSiteVisitHandler,
  updateSiteVisitHandler,
  createQuotationHandler,
  updateQuotationHandler,
  updateStageHandler,
  approveConversionHandler,
  getOnboardingStatsHandler,
  submitSurveyHandler,
  reviewSurveyHandler,
  uploadSurveyImageHandler,
  getSurveyImagesHandler,
} from "./onboarding.controller.js";
import {
  createOnboardingRequestSchema,
  updateOnboardingRequestSchema,
  archiveOnboardingRequestSchema,
  createSiteVisitSchema,
  updateSiteVisitSchema,
  createQuotationSchema,
  updateQuotationSchema,
  updateStageSchema,
  approveConversionSchema,
  listOnboardingRequestsQuerySchema,
  submitSurveySchema,
  reviewSurveySchema,
  uploadSurveyImageSchema,
} from "./onboarding.schemas.js";

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

export const onboardingRoutes = Router();

function authorizeOnboardingManagers(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
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

    if (allowedRoles.includes(req.auth.role) || isMarketingExecutive) {
      return next();
    }

    next(new ApiError(403, "Access denied. Only onboarding managers can access this route."));
  };
}

function authorizeProjectCoordinatorOrManagers(...allowedRoles: UserRole[]): RequestHandler {
  const authorizeExistingManagers = authorizeOnboardingManagers(...allowedRoles);
  return (req, res, next) => {
    const isProjectCoordinator =
      req.auth?.role === UserRole.EMPLOYEE &&
      req.auth.jobRole
        ?.trim()
        .toLowerCase()
        .replace(/[_\s-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() === "project coordinator";

    if (isProjectCoordinator) {
      return next();
    }

    return authorizeExistingManagers(req, res, next);
  };
}

// Stats
onboardingRoutes.get(
  "/stats",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  asyncHandler(getOnboardingStatsHandler)
);

// List requests
onboardingRoutes.get(
  "/requests",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateQuery(listOnboardingRequestsQuerySchema),
  asyncHandler(listOnboardingRequestsHandler)
);

// Get request by ID
onboardingRoutes.get(
  "/requests/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(getOnboardingRequestByIdHandler)
);

// Archive request while preserving its onboarding and survey history
onboardingRoutes.delete(
  "/requests/:id",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(archiveOnboardingRequestSchema),
  asyncHandler(archiveOnboardingRequestHandler)
);

// Create request
onboardingRoutes.post(
  "/requests",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(createOnboardingRequestSchema),
  asyncHandler(createOnboardingRequestHandler)
);

// Update request
onboardingRoutes.patch(
  "/requests/:id",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(updateOnboardingRequestSchema),
  asyncHandler(updateOnboardingRequestHandler)
);

// Update stage
onboardingRoutes.patch(
  "/requests/:id/stage",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(updateStageSchema),
  asyncHandler(updateStageHandler)
);

// Approve conversion
onboardingRoutes.post(
  "/requests/:id/approve-conversion",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateBody(approveConversionSchema),
  asyncHandler(approveConversionHandler)
);

// Create site visit
onboardingRoutes.post(
  "/site-visits",
  authenticateAccessToken,
  authorizeProjectCoordinatorOrManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(createSiteVisitSchema),
  asyncHandler(createSiteVisitHandler)
);

// Update site visit
onboardingRoutes.patch(
  "/site-visits/:id",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(updateSiteVisitSchema),
  asyncHandler(updateSiteVisitHandler)
);

// Create quotation
onboardingRoutes.post(
  "/quotations",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(createQuotationSchema),
  asyncHandler(createQuotationHandler)
);

// Update quotation
onboardingRoutes.patch(
  "/quotations/:id",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(updateQuotationSchema),
  asyncHandler(updateQuotationHandler)
);

// Submit survey
onboardingRoutes.post(
  "/site-visits/:id/submit-survey",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateBody(submitSurveySchema),
  asyncHandler(submitSurveyHandler)
);

// Review survey
onboardingRoutes.post(
  "/site-visits/:id/review",
  authenticateAccessToken,
  authorizeOnboardingManagers(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(reviewSurveySchema),
  asyncHandler(reviewSurveyHandler)
);

// Upload survey image
onboardingRoutes.post(
  "/site-visits/:id/images",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  upload.single("image"),
  asyncHandler(uploadSurveyImageHandler)
);

// Get survey images
onboardingRoutes.get(
  "/site-visits/:id/images",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(getSurveyImagesHandler)
);
