import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { prisma } from "../lib/prisma.js";
import * as AttendanceService from "../services/attendanceService.js";
import fs from "fs";
import path from "path";



const router = Router();

const employeeAuth = [authenticateAccessToken, authorizeRoles(UserRole.EMPLOYEE, UserRole.SUB_ADMIN)];
const adminAuth = [authenticateAccessToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD, UserRole.SUB_ADMIN)];
const superAdminAuth = [authenticateAccessToken, authorizeRoles(UserRole.SUPER_ADMIN)];

const PHOTOS_FILE_PATH = path.join(process.cwd(), "data", "profile-photos.json");

function getAllPhotos(): Record<string, string> {
  try {
    if (!fs.existsSync(path.dirname(PHOTOS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(PHOTOS_FILE_PATH), { recursive: true });
    }
    if (fs.existsSync(PHOTOS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(PHOTOS_FILE_PATH, "utf8"));
    }
  } catch { }
  return {};
}

function savePhoto(userId: string, photoDataUrl: string) {
  const all = getAllPhotos();
  all[userId] = photoDataUrl;
  if (!fs.existsSync(path.dirname(PHOTOS_FILE_PATH))) {
    fs.mkdirSync(path.dirname(PHOTOS_FILE_PATH), { recursive: true });
  }
  fs.writeFileSync(PHOTOS_FILE_PATH, JSON.stringify(all), "utf8");
}

router.get("/rules", authenticateAccessToken, asyncHandler(async (req, res) => {
  const rules = await AttendanceService.getRulesAsync();
  res.json(rules);
}));

router.post("/rules", adminAuth, asyncHandler(async (req, res) => {
  const success = await AttendanceService.saveRulesAsync(req.body);
  if (success) {
    const rules = await AttendanceService.getRulesAsync();
    res.json({ success: true, rules });
  } else {
    res.status(500).json({ error: "Failed to save settings on server" });
  }
}));

// ── Profile Photo (syncs across devices) ─────────────────────────────────────
// GET  /profile-photo        → returns the current user's photo
// POST /profile-photo        → saves/updates the current user's photo
router.get("/profile-photo", authenticateAccessToken, asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  const all = getAllPhotos();
  const photo = all[userId] || null;
  res.json({ photo });
}));

router.post("/profile-photo", authenticateAccessToken, asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  const { photo } = req.body as { photo: string };
  if (!photo || !photo.startsWith("data:image/")) {
    res.status(400).json({ error: "Invalid image data. Must be a base64 data URL." });
    return;
  }
  // Rough size check – base64 of a 2 MB image ≈ 2.7 MB string
  if (photo.length > 4 * 1024 * 1024) {
    res.status(413).json({ error: "Image too large. Please upload a photo under 2 MB." });
    return;
  }
  savePhoto(userId, photo);
  res.json({ success: true });
}));


router.post("/check-in", employeeAuth, asyncHandler(async (req, res) => {
  try {
    const { selfie, latitude, longitude, matchConfidence, matchDistance, livenessVerified } = req.body;
    const result = await AttendanceService.checkIn(req.auth!.userId, {
      selfieDataUrl: selfie ?? null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    });

    // Augment the CheckIn record with face recognition metadata if provided
    if (result?.checkInRecord?.id && (matchConfidence !== undefined || matchDistance !== undefined)) {
      await prisma.checkIn.update({
        where: { id: result.checkInRecord.id },
        data: {
          matchConfidence: matchConfidence != null ? Number(matchConfidence) : null,
          matchDistance: matchDistance != null ? Number(matchDistance) : null,
          livenessVerified: livenessVerified === true,
          // Flag entries with low confidence (between threshold and threshold+0.1)
          flagged: matchConfidence != null
            ? matchConfidence < (parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55") + 0.1 - 0 + 1 - 1) // keep readable
              && matchConfidence >= parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55")
            : false,
        },
      }).catch(() => { /* non-critical, don't fail check-in */ });
    }

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Unable to check in" });
  }
}));

router.post("/check-out", employeeAuth, asyncHandler(async (req, res) => {
  try {
    const record = await AttendanceService.checkOut(req.auth!.userId);
    res.json({ success: true, record });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Unable to check out" });
  }
}));

router.get("/today", authenticateAccessToken, asyncHandler(async (req, res) => {
  const record = await AttendanceService.getTodayAttendance(req.auth!.userId);
  res.json({ record });
}));

router.get("/monthly", authenticateAccessToken, asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const data = await AttendanceService.getMonthlyAttendance(req.auth!.userId, month, year);
  res.json(data);
}));

router.get("/performance", authenticateAccessToken, asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const snapshot = await prisma.performanceSnapshot.findUnique({
    where: { employeeId_month_year: { employeeId: req.auth!.userId, month, year } },
  });
  res.json({ snapshot });
}));

router.post("/work-submissions", employeeAuth, asyncHandler(async (req, res) => {
  const { title, description, proofUrl, proofNotes, hoursSpent, taskId } = req.body;
  const submission = await prisma.workSubmission.create({
    data: {
      employeeId: req.auth!.userId,
      taskId: taskId ? Number(taskId) : null,
      title,
      description,
      proofUrl: proofUrl ?? null,
      proofNotes: proofNotes ?? null,
      hoursSpent: parseFloat(hoursSpent) || 0,
    },
  });
  res.json({ success: true, submission });
}));

async function getRecursiveReporteeIds(userId: string): Promise<string[]> {
  const reports = await prisma.user.findMany({
    where: { reportingManagerId: userId, isActive: true },
    select: { id: true },
  });
  const ids = reports.map((r) => r.id);
  if (ids.length === 0) return [];

  const subReportIds = await Promise.all(ids.map((id) => getRecursiveReporteeIds(id)));
  return [...ids, ...subReportIds.flat()];
}

router.get("/work-submissions", authenticateAccessToken, asyncHandler(async (req, res) => {
  let employeeId = req.auth!.userId;

  if (req.query.employeeId) {
    const requestedId = String(req.query.employeeId);
    
    // Check if the requested employee reports recursively to the logged-in user
    // or if the logged-in user is an Admin/Superadmin/Subadmin
    const isAdmin =
      req.auth!.role === UserRole.SUPER_ADMIN ||
      req.auth!.role === UserRole.ADMIN ||
      req.auth!.role === UserRole.SUB_ADMIN;
    
    let isAllowed = isAdmin;
    if (!isAllowed) {
      const reporteeIds = await getRecursiveReporteeIds(req.auth!.userId);
      if (reporteeIds.includes(requestedId)) {
        isAllowed = true;
      }
    }

    if (isAllowed) {
      employeeId = requestedId;
    } else {
      res.status(403).json({ error: "Unauthorized to view submissions for this employee" });
      return;
    }
  }

  const submissions = await prisma.workSubmission.findMany({
    where: { employeeId },
    include: { task: true },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
  res.json({ submissions });
}));

router.get(
  "/admin/employee/:employeeId/monthly",
  adminAuth,
  asyncHandler(async (req, res) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await AttendanceService.getMonthlyAttendance(req.params.employeeId, month, year);
    res.json(data);
  }),
);

router.get(
  "/admin/employee/:employeeId/performance",
  adminAuth,
  asyncHandler(async (req, res) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const snapshot = await prisma.performanceSnapshot.findUnique({
      where: { employeeId_month_year: { employeeId: req.params.employeeId, month, year } },
    });
    res.json({ snapshot });
  }),
);

router.get(
  "/admin/team-performance",
  adminAuth,
  asyncHandler(async (req, res) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    let snapshots = await prisma.performanceSnapshot.findMany({
      where: { month, year },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            loginId: true,
            employeeProfile: { select: { jobRole: true, zone: true } },
          },
        },
      },
      orderBy: { performanceScore: "desc" },
    });

    if (snapshots.length === 0) {
      // Find all employees and sub-admins
      const employees = await prisma.user.findMany({
        where: { role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN] } },
      });
      
      for (const emp of employees) {
        try {
          await AttendanceService.recalculateMonthlyPerformance(emp.id, month, year);
        } catch (err) {
          console.error(`Failed to generate performance snapshot for ${emp.fullName}:`, err);
        }
      }

      // Re-fetch calculations
      snapshots = await prisma.performanceSnapshot.findMany({
        where: { month, year },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              loginId: true,
              employeeProfile: { select: { jobRole: true, zone: true } },
            },
          },
        },
        orderBy: { performanceScore: "desc" },
      });
    }

    res.json({ snapshots });
  }),
);

router.get(
  "/admin/work-submissions/pending",
  adminAuth,
  asyncHandler(async (req, res) => {
    const submissions = await prisma.workSubmission.findMany({
      where: { status: "PENDING" },
      include: { employee: { select: { id: true, fullName: true, loginId: true } }, task: true },
      orderBy: { submittedAt: "desc" },
    });
    res.json({ submissions });
  }),
);

// Admin: list recent check-ins with face recognition metadata
router.get("/admin/checkins", adminAuth, asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const checkins = await prisma.checkIn.findMany({
    where: { createdAt: { gte: start } },
    include: { employee: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ checkins });
}));

// Admin: get notifications (unread only)
router.get("/admin/notifications", adminAuth, asyncHandler(async (req, res) => {
  const notifications = await prisma.adminNotification.findMany({
    where: { read: false },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ notifications });
}));

// Admin: mark all notifications as read
router.post("/admin/notifications/read-all", adminAuth, asyncHandler(async (req, res) => {
  const updated = await prisma.adminNotification.updateMany({
    where: { read: false },
    data: { read: true }
  });
  res.json({ success: true, count: updated.count });
}));

// Admin: clear/delete all notifications
router.delete("/admin/notifications/clear-all", adminAuth, asyncHandler(async (req, res) => {
  const deleted = await prisma.adminNotification.deleteMany({});
  res.json({ success: true, count: deleted.count });
}));

// Admin: delete single notification
router.delete("/admin/notifications/:id", adminAuth, asyncHandler(async (req, res) => {
  const id = req.params.id;
  await prisma.adminNotification.delete({ where: { id } }).catch(() => {});
  res.json({ success: true });
}));

// Admin: mark notification read
router.patch("/admin/notifications/:id/read", adminAuth, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const updated = await prisma.adminNotification.update({ where: { id }, data: { read: true } });
  res.json({ success: true, updated });
}));

router.patch(
  "/admin/work-submissions/:id/review",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { status, reviewScore, reviewNotes } = req.body;
    const submission = await prisma.workSubmission.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewScore: reviewScore ? parseInt(reviewScore, 10) : null,
        reviewNotes: reviewNotes ?? null,
        reviewedAt: new Date(),
        reviewedBy: req.auth!.userId,
      },
    });

    await AttendanceService.recalculateMonthlyPerformance(submission.employeeId);
    res.json({ success: true, submission });
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// FACE RECOGNITION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /face/enroll
 * Save 3 face descriptors for the authenticated employee.
 * Descriptors are 128-dim float arrays from face-api.js, run client-side.
 * Each is stored as a JSON number[] array.
 */
router.post(
  "/face/enroll",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const { descriptor1, descriptor2, descriptor3 } = req.body as {
      descriptor1: number[];
      descriptor2: number[];
      descriptor3: number[];
    };

    // Validate — each descriptor must be a 128-length float array
    const isValidDescriptor = (d: any) =>
      Array.isArray(d) && d.length === 128 && d.every((v: any) => typeof v === "number");

    if (!isValidDescriptor(descriptor1) || !isValidDescriptor(descriptor2) || !isValidDescriptor(descriptor3)) {
      res.status(400).json({
        error: "Invalid face descriptors. Each descriptor must be a 128-element float array.",
      });
      return;
    }

    const enrollment = await prisma.faceEnrollment.upsert({
      where: { employeeId },
      create: {
        employeeId,
        descriptor1,
        descriptor2,
        descriptor3,
        modelVersion: "face-api-ssd-mobilenetv1-v1",
      },
      update: {
        descriptor1,
        descriptor2,
        descriptor3,
        enrolledAt: new Date(),
        modelVersion: "face-api-ssd-mobilenetv1-v1",
      },
    });

    res.json({ success: true, enrolledAt: enrollment.enrolledAt });
  }),
);

/**
 * GET /face/enrollment
 * Returns the stored face descriptors for the requesting employee.
 * Admin/SuperAdmin can pass ?employeeId= to get another employee's descriptors.
 * This endpoint is used by the client to load descriptors for client-side matching.
 */
router.get(
  "/face/enrollment",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    let employeeId = req.auth!.userId;
    const role = req.auth!.role;

    // Admins can request any employee's enrollment for management purposes
    if (
      req.query.employeeId &&
      (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.SUB_ADMIN)
    ) {
      employeeId = String(req.query.employeeId);
    }

    const enrollment = await prisma.faceEnrollment.findUnique({
      where: { employeeId },
      select: {
        id: true,
        employeeId: true,
        descriptor1: true,
        descriptor2: true,
        descriptor3: true,
        enrolledAt: true,
        modelVersion: true,
      },
    });

    if (!enrollment) {
      res.json({ enrollment: null, enrolled: false });
      return;
    }

    res.json({ enrollment, enrolled: true });
  }),
);

/**
 * GET /face/enrollments
 * Admin/SuperAdmin: list all employees with their enrollment status.
 */
router.get(
  "/face/enrollments",
  adminAuth,
  asyncHandler(async (req, res) => {
    const employees = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeCode: true,
        departmentId: true,
        department: { select: { name: true } },
        faceEnrollment: {
          select: { id: true, enrolledAt: true, modelVersion: true },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const result = employees.map((e) => ({
      id: e.id,
      fullName: e.fullName,
      email: e.email,
      employeeCode: e.employeeCode,
      department: e.department?.name ?? "—",
      enrolled: e.faceEnrollment !== null,
      enrolledAt: e.faceEnrollment?.enrolledAt ?? null,
      modelVersion: e.faceEnrollment?.modelVersion ?? null,
    }));

    res.json({ enrollments: result });
  }),
);

/**
 * DELETE /face/enrollment/:employeeId
 * SuperAdmin only: delete an employee's face enrollment, forcing re-enrollment.
 */
router.delete(
  "/face/enrollment/:employeeId",
  superAdminAuth,
  asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    const existing = await prisma.faceEnrollment.findUnique({ where: { employeeId } });
    if (!existing) {
      res.status(404).json({ error: "No face enrollment found for this employee." });
      return;
    }

    await prisma.faceEnrollment.delete({ where: { employeeId } });

    res.json({ success: true, message: "Face enrollment deleted. Employee must re-enroll." });
  }),
);

/**
 * PATCH /checkin/:checkInId/override
 * Admin/SuperAdmin: manually override/correct an attendance check-in record.
 * Requires a reason field for the audit trail.
 */
router.patch(
  "/checkin/:checkInId/override",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { checkInId } = req.params;
    const { status, reason } = req.body as { status?: string; reason: string };

    if (!reason || reason.trim().length < 5) {
      res.status(400).json({ error: "A reason of at least 5 characters is required for manual override." });
      return;
    }

    const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) {
      res.status(404).json({ error: "Check-in record not found." });
      return;
    }

    const updated = await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        manualOverride: true,
        overrideReason: reason.trim(),
        reviewedBy: req.auth!.userId,
        flagged: false, // resolved by admin review
        ...(status ? { status: status as any } : {}),
      },
    });

    res.json({ success: true, checkIn: updated });
  }),
);

export default router;

