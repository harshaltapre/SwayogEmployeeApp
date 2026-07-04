import { UserRole } from "@prisma/client";
import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { login, refreshSession } from "../auth/auth.service.js";
import { ApiError } from "../../middleware/error.js";
import {
  getEmployeeDashboard,
  getMyTasks,
  getTaskDetails,
  updateTaskStatus,
  markTaskCompleted,
} from "./employee.controller.js";

export const employeeRoutes = Router();

// Multer storage configurations for surveys and designs
const surveyStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/surveys";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `survey-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const uploadSurvey = multer({
  storage: surveyStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const designStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/designs";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `design-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const uploadDesign = multer({
  storage: designStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".dxf", ".dwg"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * ---------------------------------------------------------
 * PUBLIC ENDPOINTS (No authenticateAccessToken required)
 * ---------------------------------------------------------
 */

// Lookup employee details by loginId, email, or phone (requires authentication)
employeeRoutes.get(
  "/lookup",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    const { identifier } = req.query;
    if (!identifier || typeof identifier !== "string") {
      throw new ApiError(400, "Identifier is required");
    }

    const trimmed = identifier.trim();
    const cleanPhone = trimmed.replace(/[\s-+]/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmed.toLowerCase() },
          { loginId: trimmed.toUpperCase() },
          { phoneNumber: trimmed },
          { phoneNumber: cleanPhone },
          ...(cleanPhone.length > 10 ? [{ phoneNumber: cleanPhone.slice(-10) }] : [])
        ],
        role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN, UserRole.ADMIN] }
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        loginId: true,
        fullName: true,
        role: true,
      }
    });

    if (!user) {
      throw new ApiError(404, "Employee not found");
    }

    res.status(200).json({
      success: true,
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      loginId: user.loginId,
      fullName: user.fullName,
      role: user.role,
    });
  })
);

// Mobile app compat login
employeeRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { emailOrPhone, securityCode } = req.body;
    if (!emailOrPhone || !securityCode) {
      throw new ApiError(400, "Username/email and password are required");
    }

    const trimmed = emailOrPhone.trim();
    const cleanPhone = trimmed.replace(/[\s-+]/g, '');

    // Lookup user to resolve role dynamically
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmed.toLowerCase() },
          { loginId: trimmed.toUpperCase() },
          { phoneNumber: trimmed },
          { phoneNumber: cleanPhone },
          ...(cleanPhone.length > 10 ? [{ phoneNumber: cleanPhone.slice(-10) }] : [])
        ],
      },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Call standard login service
    const result = await login({
      identifier: emailOrPhone,
      password: securityCode,
      role: user.role,
    });

    // Return flat structure matching Android app's LoginResponse
    res.status(200).json({
      success: true,
      id: result.user.id,
      loginId: result.user.loginId,
      email: result.user.email,
      name: result.user.fullName,
      role: result.user.role,
      jobRole: result.user.employeeProfile?.jobRole || result.user.designationTitle || "Employee",
      employeeCode: result.user.employeeCode || result.user.loginId,
      reportingManagerId: result.user.reportingManagerId || null,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  })
);

// Mobile app compat token refresh
employeeRoutes.post(
  "/token/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const result = await refreshSession(refreshToken);
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  })
);

/**
 * ---------------------------------------------------------
 * AUTHENTICATED ENDPOINTS (Role: EMPLOYEE or SUB_ADMIN)
 * ---------------------------------------------------------
 */

const employeeAuth = [
  authenticateAccessToken,
  authorizeRoles(UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
];

// Get employee dashboard with task summary
employeeRoutes.get(
  "/dashboard",
  employeeAuth,
  asyncHandler(getEmployeeDashboard)
);

// Get my assigned tasks
employeeRoutes.get(
  "/tasks",
  employeeAuth,
  asyncHandler(getMyTasks)
);

// Get specific task details
employeeRoutes.get(
  "/tasks/:taskId",
  employeeAuth,
  asyncHandler(getTaskDetails)
);

// Update task status
employeeRoutes.patch(
  "/tasks/:taskId/status",
  employeeAuth,
  asyncHandler(updateTaskStatus)
);

// Mark task as completed with documentation
employeeRoutes.post(
  "/tasks/:taskId/complete",
  employeeAuth,
  asyncHandler(markTaskCompleted)
);

// Mobile app compat work submissions (commits)
employeeRoutes.post(
  "/submissions",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const { title, description, hoursSpent, taskId } = req.body;
    const parsedTaskId = taskId ? parseInt(taskId) : null;

    const submission = await prisma.workSubmission.create({
      data: {
        employeeId: req.auth!.userId,
        taskId: parsedTaskId && !isNaN(parsedTaskId) ? parsedTaskId : null,
        title,
        description,
        hoursSpent: parseFloat(hoursSpent) || 0,
        status: "PENDING",
      },
    });

    res.status(200).json({
      success: true,
      message: "Work submission successfully recorded.",
    });
  })
);

// Mobile app compat site surveys upload proxy
employeeRoutes.post(
  "/surveys",
  employeeAuth,
  uploadSurvey.array("photos"),
  asyncHandler(async (req, res) => {
    const {
      taskId,
      customerId,
      roofType,
      lengthFt,
      widthFt,
      obstacleNotes,
      shadowFactors,
      recommendedCapacityKw,
      latitude,
      longitude,
    } = req.body;

    const files = (req.files as Express.Multer.File[]) || [];
    const photoUrls = files.map((file) => `/uploads/surveys/${file.filename}`);

    const parsedTaskId = taskId ? parseInt(taskId) : null;
    const description = `Roof Type: ${roofType || "N/A"}\nDimensions: ${lengthFt || 0} x ${widthFt || 0} ft\nObstacle Notes: ${obstacleNotes || "None"}\nRecommended Capacity: ${recommendedCapacityKw || 0} kW\nGPS: ${latitude || 0}, ${longitude || 0}`;

    const submission = await prisma.workSubmission.create({
      data: {
        employeeId: req.auth!.userId,
        taskId: parsedTaskId && !isNaN(parsedTaskId) ? parsedTaskId : null,
        title: "Site Survey Submission",
        description,
        proofUrl: photoUrls.join(","),
        proofNotes: shadowFactors || "No shadow factors provided",
        status: "PENDING",
      },
    });

    res.status(200).json({
      success: true,
      surveyId: submission.id,
      message: "Site survey submitted for engineering draft review.",
    });
  })
);

// Mobile app compat designs upload proxy
employeeRoutes.post(
  "/designs",
  employeeAuth,
  uploadDesign.fields([
    { name: "cadLayout", maxCount: 1 },
    { name: "sldDiagram", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const { customerId, panelCount, inverterModel, systemCapacityKw, tiltAngle } = req.body;

    const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
    const cadFile = files["cadLayout"]?.[0];
    const sldFile = files["sldDiagram"]?.[0];

    const cadUrl = cadFile ? `/uploads/designs/${cadFile.filename}` : "";
    const sldUrl = sldFile ? `/uploads/designs/${sldFile.filename}` : "";

    const description = `Customer ID: ${customerId || "N/A"}\nPanel Count: ${panelCount || 0}\nInverter Model: ${inverterModel || "N/A"}\nSystem Capacity: ${systemCapacityKw || 0} kW\nTilt Angle: ${tiltAngle || 0}°`;

    const submission = await prisma.workSubmission.create({
      data: {
        employeeId: req.auth!.userId,
        title: "System Design Submission",
        description,
        proofUrl: cadUrl || sldUrl ? `${cadUrl},${sldUrl}` : null,
        proofNotes: `CAD Layout: ${cadUrl || "None"}\nSLD Diagram: ${sldUrl || "None"}`,
        status: "PENDING",
      },
    });

    res.status(200).json({
      success: true,
      designId: submission.id,
      message: "System design files successfully uploaded.",
    });
  })
);

