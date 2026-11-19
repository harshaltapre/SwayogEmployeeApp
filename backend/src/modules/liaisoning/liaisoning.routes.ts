import { Router } from "express";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { LiaisoningService, upload } from "./liaisoning.service.js";
import { ApiError } from "../../middleware/error.js";

export const liaisoningRoutes = Router();

// Guard: verify liaisoning employee, admin, or super admin only
const requireLiaisoningAccess = (req: any, _res: any, next: any) => {
  const role = req.auth?.role;
  const jobRole = String(req.auth?.jobRole || "").toLowerCase().replace(/[_\s-]+/g, "");

  const isLiaisoningEmployee = jobRole === "liaisoningemployee" || jobRole === "liaisoning_employee";
  const isMonitoringAnalyst = jobRole === "monitoringanalyst" || jobRole === "monitoring_analyst";
  const isAllowed =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    (role === "EMPLOYEE" && (isLiaisoningEmployee || isMonitoringAnalyst));

  if (!isAllowed) {
    throw new ApiError(403, "Access restricted to Liaisoning Employees and Administrators.");
  }
  next();
};

liaisoningRoutes.use(authenticateAccessToken);
liaisoningRoutes.use(requireLiaisoningAccess);

/**
 * GET /api/v1/liaisoning/dashboard-summary
 */
liaisoningRoutes.get(
  "/dashboard-summary",
  asyncHandler(async (_req, res) => {
    const summary = await LiaisoningService.getDashboardSummary();
    res.json({ success: true, data: summary });
  })
);

/**
 * GET /api/v1/liaisoning/applications
 */
liaisoningRoutes.get(
  "/applications",
  asyncHandler(async (req, res) => {
    const { query, discomName, overallStatus, currentStage, assignedEmployeeId, page, limit } = req.query as any;
    const result = await LiaisoningService.getApplications({
      query,
      discomName,
      overallStatus,
      currentStage,
      assignedEmployeeId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json({ success: true, ...result });
  })
);

/**
 * GET /api/v1/liaisoning/applications/:id
 */
liaisoningRoutes.get(
  "/applications/:id",
  asyncHandler(async (req, res) => {
    const application = await LiaisoningService.getApplicationById(req.params.id);
    res.json({ success: true, data: application });
  })
);

/**
 * POST /api/v1/liaisoning/applications/initialize
 */
liaisoningRoutes.post(
  "/applications/initialize",
  asyncHandler(async (req, res) => {
    const { customerId } = req.body;
    if (!customerId) {
      throw new ApiError(400, "customerId is required");
    }
    const application = await LiaisoningService.initializeApplication(
      parseInt(customerId),
      req.auth!.userId
    );
    res.json({ success: true, data: application });
  })
);

/**
 * PUT /api/v1/liaisoning/applications/:id
 */
liaisoningRoutes.put(
  "/applications/:id",
  asyncHandler(async (req, res) => {
    const application = await LiaisoningService.updateApplication(
      req.params.id,
      req.auth!.userId,
      req.body
    );
    res.json({ success: true, data: application });
  })
);

/**
 * PUT /api/v1/liaisoning/applications/:id/stages/:stage
 */
liaisoningRoutes.put(
  "/applications/:id/stages/:stage",
  asyncHandler(async (req, res) => {
    const { status, remarks, rejectionReason } = req.body;
    if (!status) {
      throw new ApiError(400, "status is required");
    }
    const stage = await LiaisoningService.updateStageStatus(
      req.params.id,
      req.params.stage,
      status,
      req.auth!.userId,
      { remarks, rejectionReason }
    );
    res.json({ success: true, data: stage });
  })
);

/**
 * POST /api/v1/liaisoning/applications/:id/documents
 */
liaisoningRoutes.post(
  "/applications/:id/documents",
  upload.single("file"),
  asyncHandler(async (req: any, res) => {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }
    const { documentType, title, description } = req.body;
    if (!documentType || !title) {
      throw new ApiError(400, "documentType and title are required");
    }
    const document = await LiaisoningService.uploadDocument(
      req.params.id,
      req.auth!.userId,
      req.file,
      { documentType, title, description }
    );
    res.json({ success: true, data: document });
  })
);

/**
 * POST /api/v1/liaisoning/applications/:id/follow-ups
 */
liaisoningRoutes.post(
  "/applications/:id/follow-ups",
  asyncHandler(async (req, res) => {
    const { followUpDate, followUpType, remarks, assignedTo } = req.body;
    if (!followUpDate || !followUpType) {
      throw new ApiError(400, "followUpDate and followUpType are required");
    }
    const followUp = await LiaisoningService.addFollowUp(
      req.params.id,
      req.auth!.userId,
      {
        followUpDate: new Date(followUpDate),
        followUpType,
        remarks,
        assignedTo,
      }
    );
    res.json({ success: true, data: followUp });
  })
);

/**
 * PUT /api/v1/liaisoning/follow-ups/:id/complete
 */
liaisoningRoutes.put(
  "/follow-ups/:id/complete",
  asyncHandler(async (req, res) => {
    const { completionNotes } = req.body;
    const followUp = await LiaisoningService.completeFollowUp(
      req.params.id,
      req.auth!.userId,
      { completionNotes }
    );
    res.json({ success: true, data: followUp });
  })
);

/**
 * GET /api/v1/liaisoning/reports/:type
 */
liaisoningRoutes.get(
  "/reports/:type",
  asyncHandler(async (req, res) => {
    const { startDate, endDate, discomName, employeeId } = req.query as any;
    const report = await LiaisoningService.getReports(req.params.type, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      discomName,
      employeeId,
    });
    res.json({ success: true, data: report });
  })
);

/**
 * GET /api/v1/liaisoning/activities
 */
liaisoningRoutes.get(
  "/activities",
  asyncHandler(async (req, res) => {
    const { applicationId, page, limit } = req.query as any;
    const result = await LiaisoningService.getAuditLogs({
      applicationId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, ...result });
  })
);

/**
 * GET /api/v1/liaisoning/follow-ups
 */
liaisoningRoutes.get(
  "/follow-ups",
  asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query as any;
    const result = await LiaisoningService.getFollowUps({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, ...result });
  })
);

/**
 * GET /api/v1/liaisoning/documents
 */
liaisoningRoutes.get(
  "/documents",
  asyncHandler(async (req, res) => {
    const { status, documentType, query, page, limit } = req.query as any;
    const result = await LiaisoningService.getDocuments({
      status,
      documentType,
      query,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, ...result });
  })
);

/**
 * PUT /api/v1/liaisoning/documents/:id/verify
 */
liaisoningRoutes.put(
  "/documents/:id/verify",
  asyncHandler(async (req, res) => {
    const { status, remarks } = req.body;
    if (!status) {
      throw new ApiError(400, "status is required");
    }
    const doc = await LiaisoningService.verifyDocument(
      req.params.id,
      req.auth!.userId,
      { status, remarks }
    );
    res.json({ success: true, data: doc });
  })
);

/**
 * GET /api/v1/liaisoning/eligible-customers
 */
liaisoningRoutes.get(
  "/eligible-customers",
  asyncHandler(async (req, res) => {
    const { query } = req.query as any;
    const customers = await LiaisoningService.getEligibleCustomers(query);
    res.json({ success: true, data: customers });
  })
);
