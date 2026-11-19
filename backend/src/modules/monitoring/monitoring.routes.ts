import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { MonitoringService } from "./monitoring.service.js";
import { ApiError } from "../../middleware/error.js";
import { prisma } from "../../lib/prisma.js";

export const monitoringRoutes = Router();

// Configure multer with in-memory storage for R2/disk upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype) || file.mimetype === "application/pdf";
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed."));
  },
});

// Guard: verify monitoring analyst, liaisoning, admin, super admin
const requireMonitoringAccess = (req: any, _res: any, next: any) => {
  const role = req.auth?.role;
  const jobRole = String(req.auth?.jobRole || "").toLowerCase().replace(/[_\s-]+/g, "");

  const isMonitoringAnalyst =
    jobRole === "monitoringanalyst" ||
    jobRole === "monitoring_analyst" ||
    jobRole.includes("monitoring");

  const isLiaisoning = jobRole.includes("liaisoning");

  const isAllowed =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    (role === "EMPLOYEE" && (isMonitoringAnalyst || isLiaisoning));

  if (!isAllowed) {
    throw new ApiError(403, "Access restricted to Monitoring Analysts and Administrators.");
  }
  next();
};

monitoringRoutes.use(authenticateAccessToken);
monitoringRoutes.use(requireMonitoringAccess);

/**
 * GET /api/v1/monitoring/dashboard-summary
 */
monitoringRoutes.get(
  "/dashboard-summary",
  asyncHandler(async (_req, res) => {
    const summary = await MonitoringService.getDashboardSummary();
    res.json({ success: true, data: summary });
  })
);

/**
 * GET /api/v1/monitoring/customers
 */
monitoringRoutes.get(
  "/customers",
  asyncHandler(async (req, res) => {
    const { query, projectStatus, docStatus, city, page, limit } = req.query as any;
    const result = await MonitoringService.getCustomers({
      query,
      projectStatus,
      docStatus,
      city,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
    });
    res.json({ success: true, ...result });
  })
);

/**
 * POST /api/v1/monitoring/customers
 * Add a new customer directly from Monitoring Analysis with synced R2 directory
 */
monitoringRoutes.post(
  "/customers",
  asyncHandler(async (req: any, res) => {
    const result = await MonitoringService.createCustomer(req.body, req.auth!.userId);
    res.status(201).json({
      success: true,
      message: "Customer added to Monitoring Analysis successfully",
      data: result,
    });
  })
);

/**
 * GET /api/v1/monitoring/customers/:id
 */
monitoringRoutes.get(
  "/customers/:id",
  asyncHandler(async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) throw new ApiError(400, "Invalid customer ID");

    const profile360 = await MonitoringService.getCustomer360(customerId);

    // Record activity: viewed customer profile
    await MonitoringService.logActivity(
      req.auth!.userId,
      "CUSTOMER_VIEWED",
      "Customer Profile Accessed",
      `Viewed 360-degree profile for customer ${profile360.customer.fullName}`,
      customerId
    );

    res.json({ success: true, data: profile360 });
  })
);

/**
 * GET /api/v1/monitoring/documents
 */
monitoringRoutes.get(
  "/documents",
  asyncHandler(async (req, res) => {
    const { category, documentType, status, customerId, search, page, limit } = req.query as any;

    const result = await MonitoringService.getDocuments({
      category,
      documentType,
      status,
      customerId: customerId ? parseInt(customerId) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * POST /api/v1/monitoring/documents/upload
 */
monitoringRoutes.post(
  "/documents/upload",
  upload.single("file"),
  asyncHandler(async (req: any, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded.");

    const { customerId, category, documentType, title, remarks } = req.body;
    if (!customerId || !category || !documentType || !title) {
      throw new ApiError(400, "Missing required fields: customerId, category, documentType, title.");
    }

    const doc = await MonitoringService.uploadDocument({
      customerId: parseInt(customerId),
      actorId: req.auth!.userId,
      category,
      documentType,
      title,
      file: req.file,
      remarks,
    });

    res.json({ success: true, message: "Document uploaded successfully", data: doc });
  })
);

/**
 * PUT /api/v1/monitoring/documents/:id/verify
 */
monitoringRoutes.put(
  "/documents/:id/verify",
  asyncHandler(async (req, res) => {
    const { action, rejectionReason, remarks } = req.body;
    if (!action || !["VERIFIED", "REJECTED", "REUPLOAD_REQUESTED", "UNDER_REVIEW"].includes(action)) {
      throw new ApiError(400, "Invalid action. Must be VERIFIED, REJECTED, REUPLOAD_REQUESTED, or UNDER_REVIEW.");
    }

    const result = await MonitoringService.verifyDocument({
      documentId: req.params.id,
      actorId: req.auth!.userId,
      action,
      rejectionReason,
      remarks,
    });

    res.json({ success: true, message: `Document marked as ${action}`, data: result });
  })
);

/**
 * PUT /api/v1/monitoring/site-surveys/:customerId
 */
monitoringRoutes.put(
  "/site-surveys/:customerId",
  asyncHandler(async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) throw new ApiError(400, "Invalid customer ID");

    const result = await MonitoringService.updateSiteSurvey(customerId, req.auth!.userId, req.body);
    res.json({ success: true, message: "Site survey details saved successfully", data: result });
  })
);

/**
 * PUT /api/v1/monitoring/installations/:customerId
 */
monitoringRoutes.put(
  "/installations/:customerId",
  asyncHandler(async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) throw new ApiError(400, "Invalid customer ID");

    const result = await MonitoringService.updateInstallation(customerId, req.auth!.userId, req.body);
    res.json({ success: true, message: "Installation documentation updated successfully", data: result });
  })
);

/**
 * PUT /api/v1/monitoring/net-metering/:customerId
 */
monitoringRoutes.put(
  "/net-metering/:customerId",
  asyncHandler(async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) throw new ApiError(400, "Invalid customer ID");

    const result = await MonitoringService.updateNetMetering(customerId, req.auth!.userId, req.body);
    res.json({ success: true, message: "Net Metering and Subsidy status updated successfully", data: result });
  })
);

/**
 * GET /api/v1/monitoring/tasks
 */
monitoringRoutes.get(
  "/tasks",
  asyncHandler(async (req, res) => {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const tasks = await MonitoringService.getSmartPendingTasks(customerId);
    res.json({ success: true, tasks });
  })
);

/**
 * POST /api/v1/monitoring/tasks
 */
monitoringRoutes.post(
  "/tasks",
  asyncHandler(async (req, res) => {
    const { customerId, title, description, taskType, priority, dueDate, assignedToId } = req.body;
    if (!customerId || !title) throw new ApiError(400, "Customer ID and task title are required.");

    const task = await prisma.monitoringTask.create({
      data: {
        customerId: parseInt(customerId),
        title,
        description,
        taskType: taskType || "GENERAL",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        createdById: req.auth!.userId,
      },
    });

    await MonitoringService.logActivity(
      req.auth!.userId,
      "TASK_CREATED",
      `Task Created: ${title}`,
      `Created task "${title}" for customer #${customerId}`,
      parseInt(customerId)
    );

    res.json({ success: true, message: "Task created successfully", data: task });
  })
);

/**
 * PUT /api/v1/monitoring/tasks/:id
 */
monitoringRoutes.put(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const { status, priority, dueDate, assignedToId } = req.body;

    const task = await prisma.monitoringTask.update({
      where: { id: req.params.id },
      data: {
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedToId,
      },
    });

    res.json({ success: true, message: "Task updated successfully", data: task });
  })
);

/**
 * GET /api/v1/monitoring/activities
 */
monitoringRoutes.get(
  "/activities",
  asyncHandler(async (req, res) => {
    const { page, limit, customerId, action } = req.query as any;
    const result = await MonitoringService.getActivityLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      customerId: customerId ? parseInt(customerId) : undefined,
      action,
    });
    res.json({ success: true, ...result });
  })
);

/**
 * GET /api/v1/monitoring/reports/data
 */
monitoringRoutes.get(
  "/reports/data",
  asyncHandler(async (req, res) => {
    const { reportType, dateFrom, dateTo, customerId } = req.query as any;
    const result = await MonitoringService.getReportsData({
      reportType,
      dateFrom,
      dateTo,
      customerId: customerId ? parseInt(customerId) : undefined,
    });
    res.json({ success: true, ...result });
  })
);

