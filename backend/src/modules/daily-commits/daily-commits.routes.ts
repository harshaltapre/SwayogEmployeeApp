import { UserRole } from "@prisma/client";
import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import {
  attachDailyCommitFileHandler,
  exportMonthlyTeamCommitsCsvHandler,
  getMyDailyCommitByDateHandler,
  listMyDailyCommitsHandler,
  listTeamDailyCommitsHandler,
  passDailyCommitUpwardHandler,
  submitDailyCommitHandler,
} from "./daily-commits.controller.js";
import {
  exportMonthlyCsvQuerySchema,
  commitIdParamsSchema,
  listMyCommitsQuerySchema,
  listTeamCommitsQuerySchema,
  passCommitBodySchema,
  submitDailyCommitSchema,
} from "./daily-commits.schemas.js";

const submitRoles = [
  UserRole.EMPLOYEE,
  UserRole.SUB_ADMIN,
  UserRole.TEAM_LEAD,
  UserRole.DEPARTMENT_HEAD,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];


const teamViewRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.EMPLOYEE,
  UserRole.SUB_ADMIN,
  UserRole.TEAM_LEAD,
  UserRole.DEPARTMENT_HEAD,
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/daily-commits";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `attachment-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .pdf, .doc and .docx files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const dailyCommitRoutes = Router();

dailyCommitRoutes.post(
  "/",
  authenticateAccessToken,
  authorizeRoles(...submitRoles),
  validateBody(submitDailyCommitSchema),
  asyncHandler(submitDailyCommitHandler),
);

dailyCommitRoutes.get(
  "/mine",
  authenticateAccessToken,
  authorizeRoles(...submitRoles, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateQuery(listMyCommitsQuerySchema),
  asyncHandler(listMyDailyCommitsHandler),
);

dailyCommitRoutes.get(
  "/mine/:date",
  authenticateAccessToken,
  authorizeRoles(...submitRoles, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getMyDailyCommitByDateHandler),
);

dailyCommitRoutes.get(
  "/team/export-monthly-csv",
  authenticateAccessToken,
  authorizeRoles(...teamViewRoles),
  validateQuery(exportMonthlyCsvQuerySchema),
  asyncHandler(exportMonthlyTeamCommitsCsvHandler),
);

dailyCommitRoutes.get(
  "/team",
  authenticateAccessToken,
  authorizeRoles(...teamViewRoles),
  validateQuery(listTeamCommitsQuerySchema),
  asyncHandler(listTeamDailyCommitsHandler),
);

dailyCommitRoutes.post(
  "/:id/pass",
  authenticateAccessToken,
  authorizeRoles(...submitRoles, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(commitIdParamsSchema),
  validateBody(passCommitBodySchema),
  asyncHandler(passDailyCommitUpwardHandler),
);

dailyCommitRoutes.post(
  "/:id/attachment",
  authenticateAccessToken,
  authorizeRoles(...submitRoles),
  validateParams(commitIdParamsSchema),
  upload.single("attachment"),
  asyncHandler(attachDailyCommitFileHandler),
);
