import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import {
  createInternalUserHandler,
  deleteInternalUserHandler,
  getInternalUserHandler,
  listInternalUsersHandler,
  transferInternalUserTeamHandler,
  updateInternalUserHandler,
} from "./users.controller.js";
import {
  createInternalUserSchema,
  internalUserParamsSchema,
  listInternalUsersQuerySchema,
  transferInternalUserTeamSchema,
  updateInternalUserSchema,
} from "./users.schemas.js";

import multer from "multer";
import fs from "fs";
import path from "path";
import { prisma } from "../../lib/prisma.js";

const userProfilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profile-photos";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file, cb) => {
    const userId = req.auth?.userId || "user";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname || ".jpg")}`);
  },
});

const uploadUserProfilePhotoMulter = multer({
  storage: userProfilePhotoStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const handleProfilePhotoUpload = asyncHandler(async (req: any, res: any) => {
  const userId = req.auth!.userId;
  let photoUrl: string | null = null;

  if (req.file) {
    photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    console.log(`[PROFILE_PHOTO] Multipart upload received on userRoutes for ${userId}: ${photoUrl}`);
  } else if (req.body?.photo || req.body?.photoDataUrl) {
    photoUrl = req.body.photo || req.body.photoDataUrl;
    console.log(`[PROFILE_PHOTO] Base64 upload received on userRoutes for ${userId}`);
  }

  if (!photoUrl) {
    res.status(400).json({ error: "No image file or photo data provided." });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: photoUrl },
    select: {
      id: true,
      loginId: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      profileImageUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log(`[PROFILE_PHOTO] PostgreSQL update success on userRoutes for ${userId}: ${updatedUser.profileImageUrl}`);

  res.json({
    success: true,
    data: updatedUser,
    photo: updatedUser.profileImageUrl,
  });
});

export const userRoutes = Router();

userRoutes.put(
  "/internal/profile-photo",
  authenticateAccessToken,
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      uploadUserProfilePhotoMulter.single("file")(req, res, next);
    } else {
      next();
    }
  },
  handleProfilePhotoUpload,
);

userRoutes.post(
  "/internal/profile-photo",
  authenticateAccessToken,
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      uploadUserProfilePhotoMulter.single("file")(req, res, next);
    } else {
      next();
    }
  },
  handleProfilePhotoUpload,
);

userRoutes.get(
  "/internal",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateQuery(listInternalUsersQuerySchema),
  asyncHandler(listInternalUsersHandler),
);

userRoutes.get(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateParams(internalUserParamsSchema),
  asyncHandler(getInternalUserHandler),
);

userRoutes.post(
  "/internal",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateBody(createInternalUserSchema),
  asyncHandler(createInternalUserHandler),
);

userRoutes.patch(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  validateBody(updateInternalUserSchema),
  asyncHandler(updateInternalUserHandler),
);

userRoutes.post(
  "/internal/:userId/transfer-team",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  validateBody(transferInternalUserTeamSchema),
  asyncHandler(transferInternalUserTeamHandler),
);

userRoutes.delete(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  asyncHandler(deleteInternalUserHandler),
);

// ── User Settings Endpoint ───────────────────────────────────────────────────
const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "user-settings.json");

function getUserSettingsStore(): Record<string, any> {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      const dir = path.dirname(SETTINGS_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify({}), "utf8");
      return {};
    }
    const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveUserSettingsStore(store: Record<string, any>): void {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save user settings store:", e);
  }
}

userRoutes.get(
  "/me/settings",
  authenticateAccessToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const store = getUserSettingsStore();
    const userSettings = store[userId] || {
      darkMode: false,
      biometricEnabled: false,
      notificationsEnabled: true,
      compactViewEnabled: false,
      animationsEnabled: true,
      profileVisibilityEnabled: true,
      showStatusEnabled: true,
      activitySharingEnabled: true,
      language: "en",
    };
    res.json({ success: true, data: userSettings });
  })
);

userRoutes.post(
  "/me/settings",
  authenticateAccessToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const store = getUserSettingsStore();
    const current = store[userId] || {
      darkMode: false,
      biometricEnabled: false,
      notificationsEnabled: true,
      compactViewEnabled: false,
      animationsEnabled: true,
      profileVisibilityEnabled: true,
      showStatusEnabled: true,
      activitySharingEnabled: true,
      language: "en",
    };
    const updated = { ...current, ...req.body };
    store[userId] = updated;
    saveUserSettingsStore(store);
    res.json({ success: true, data: updated });
  })
);

