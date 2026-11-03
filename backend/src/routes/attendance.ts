import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { prisma } from "../lib/prisma.js";
import * as AttendanceService from "../services/attendanceService.js";
import fs from "fs";
import path from "path";
import {
  getVapidPublicKey,
  saveAdminPushSubscription,
  removeAdminPushSubscription,
  getAdminSubscriptionStatus,
  sendPushToAdmins,
} from "../services/webPushService.js";
import { getNotificationTitle } from "../services/notificationService.js";



const router = Router();

const employeeAuth = [
  authenticateAccessToken,
  authorizeRoles(
    UserRole.EMPLOYEE,
    UserRole.SUB_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_HEAD,
    UserRole.TEAM_LEAD
  )
];
const adminAuth = [authenticateAccessToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD, UserRole.SUB_ADMIN)];
const superAdminAuth = [authenticateAccessToken, authorizeRoles(UserRole.SUPER_ADMIN)];

const PHOTOS_FILE_PATH = path.join(process.cwd(), "data", "profile-photos.json");

function getIndiaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const year = Number(value("year"));
  const month = Number(value("month"));
  const day = Number(value("day"));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  return {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    utcStart: new Date(Date.UTC(year, month - 1, day)),
    weekday: weekday >= 0 ? weekday : 0,
  };
}

function getIndiaMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return value("hour") * 60 + value("minute");
}

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

const isValidDescriptor = (d: any): d is number[] =>
  Array.isArray(d) && d.length === 128 && d.every((v: any) => typeof v === "number" && !isNaN(v));

const calcEuclideanDistance = (a: number[], b: number[]): number => {
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

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

// ── Festival Holidays ───────────────────────────────────────────────────────
// GET  /holidays              → list holidays (optionally filtered by year/month)
// POST /holidays              → (adminAuth) create/set festival holiday
// PATCH /holidays/:id         → (adminAuth) update festival holiday
// DELETE /holidays/:id        → (adminAuth) delete festival holiday
router.get("/holidays", authenticateAccessToken, asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;
  const month = req.query.month ? parseInt(req.query.month as string) : undefined;

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (year && month) {
    startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  } else if (year) {
    startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  }

  const holidays = await AttendanceService.getHolidaysAsync(startDate, endDate);
  const formatted = holidays.map((h) => {
    const d = new Date(h.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    return {
      ...h,
      dateStr,
    };
  });
  res.json({ holidays: formatted });
}));

router.post("/holidays", adminAuth, asyncHandler(async (req, res) => {
  const { date, name, description } = req.body;
  if (!date) {
    res.status(400).json({ error: "Holiday date is required." });
    return;
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Festival / Holiday name is required." });
    return;
  }

  const holiday = await AttendanceService.createHolidayAsync({
    date,
    name,
    description,
    createdBy: req.auth!.userId,
  });

  res.json({ success: true, holiday });
}));

router.patch("/holidays/:id", adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, name, description } = req.body;
  const holiday = await AttendanceService.updateHolidayAsync(id, { date, name, description });
  res.json({ success: true, holiday });
}));

router.delete("/holidays/:id", adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await AttendanceService.deleteHolidayAsync(id);
  res.json({ success: true, message: "Holiday deleted successfully." });
}));

// ── Profile Photo (syncs across devices) ─────────────────────────────────────
// GET  /profile-photo        → returns the current user's photo
// POST /profile-photo        → saves/updates the current user's photo
router.get("/profile-photo", authenticateAccessToken, asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImageUrl: true },
  });
  res.json({ photo: user?.profileImageUrl || null });
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
  await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: photo },
  });
  res.json({ success: true });
}));


router.post("/check-in", employeeAuth, asyncHandler(async (req, res) => {
  try {
    const employeeId = req.auth!.userId;
    const { selfie, latitude, longitude, liveDescriptor, livenessVerified } = req.body;

    const rules = await AttendanceService.getRulesAsync();
    let verifiedMatchConfidence: number | null = null;
    let verifiedMatchDistance: number | null = null;

    if (rules.faceRequired) {
      const enrollment = await prisma.faceEnrollment.findUnique({
        where: { employeeId },
      });

      if (!enrollment || enrollment.isDeleted) {
        res.status(400).json({
          error: "Face enrollment required. Please go to Settings → Face ID and enroll your face before checking in.",
        });
        return;
      }

      // Determine which descriptors to match against
      let storedDescriptors: number[][] = [];
      if (enrollment.webDescriptor1 && enrollment.webDescriptor2 && enrollment.webDescriptor3) {
        storedDescriptors = [
          enrollment.webDescriptor1 as number[],
          enrollment.webDescriptor2 as number[],
          enrollment.webDescriptor3 as number[],
        ];
      } else if (enrollment.modelVersion === "face-api-ssd-mobilenetv1-v1" && enrollment.descriptor1 && enrollment.descriptor2 && enrollment.descriptor3) {
        storedDescriptors = [
          enrollment.descriptor1 as number[],
          enrollment.descriptor2 as number[],
          enrollment.descriptor3 as number[],
        ];
      } else if (enrollment.modelVersion === "mobile-facenet-v1" && !req.headers["user-agent"]?.includes("okhttp") && liveDescriptor) {
        res.status(400).json({
          error: "Your face was enrolled using the mobile app model. Please enroll your face once on the website (Settings → Face ID) to check in from your browser.",
        });
        return;
      } else if (enrollment.descriptor1 && enrollment.descriptor2 && enrollment.descriptor3) {
        storedDescriptors = [
          enrollment.descriptor1 as number[],
          enrollment.descriptor2 as number[],
          enrollment.descriptor3 as number[],
        ];
      }

      if (!isValidDescriptor(liveDescriptor)) {
        // Fallback for legacy mobile app client
        const isMobileClient = req.headers["user-agent"]?.includes("okhttp") || req.body.source === "MOBILE";
        if (isMobileClient && req.body.matchConfidence !== undefined) {
          verifiedMatchConfidence = Number(req.body.matchConfidence);
          verifiedMatchDistance = req.body.matchDistance !== undefined ? Number(req.body.matchDistance) : null;
        } else {
          res.status(400).json({
            error: "A valid live face descriptor is required for face verification.",
          });
          return;
        }
      } else {
        // Authoritative server-side Euclidean distance calculation
        let minDistance = Infinity;
        for (const stored of storedDescriptors) {
          if (isValidDescriptor(stored)) {
            const dist = calcEuclideanDistance(liveDescriptor, stored);
            if (dist < minDistance) {
              minDistance = dist;
            }
          }
        }

        const threshold = rules.faceMatchThreshold != null ? rules.faceMatchThreshold : 0.55;
        if (minDistance > threshold) {
          res.status(403).json({
            error: `Face verification failed. Verification distance (${minDistance.toFixed(3)}) exceeds threshold (${threshold}). Please ensure good lighting and look directly at the camera.`,
          });
          return;
        }

        verifiedMatchDistance = minDistance;
        verifiedMatchConfidence = Math.max(0, Math.min(1, 1 - minDistance));
      }
    } else {
      // Face matching not strictly enforced by rule; if liveDescriptor provided, record metrics
      if (isValidDescriptor(liveDescriptor)) {
        const enrollment = await prisma.faceEnrollment.findUnique({ where: { employeeId } });
        if (enrollment && !enrollment.isDeleted) {
          const stored = (enrollment.webDescriptor1 || enrollment.descriptor1) as number[];
          if (isValidDescriptor(stored)) {
            const dist = calcEuclideanDistance(liveDescriptor, stored);
            verifiedMatchDistance = dist;
            verifiedMatchConfidence = Math.max(0, Math.min(1, 1 - dist));
          }
        }
      } else if (req.body.matchConfidence !== undefined) {
        verifiedMatchConfidence = Number(req.body.matchConfidence);
        verifiedMatchDistance = req.body.matchDistance !== undefined ? Number(req.body.matchDistance) : null;
      }
    }

    const result = await AttendanceService.checkIn(employeeId, {
      selfieDataUrl: selfie ?? null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      matchConfidence: verifiedMatchConfidence,
      matchDistance: verifiedMatchDistance,
      livenessVerified: livenessVerified === true,
    });

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Unable to check in" });
  }
}));

const handleCheckOutEndpoint = asyncHandler(async (req, res) => {
  try {
    const record = await AttendanceService.checkOut(req.auth!.userId);
    res.json({ success: true, record });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Unable to check out" });
  }
});

router.post("/check-out", employeeAuth, handleCheckOutEndpoint);
router.post("/checkout", employeeAuth, handleCheckOutEndpoint);
router.post("/employee/check-out", employeeAuth, handleCheckOutEndpoint);

router.get("/today", authenticateAccessToken, asyncHandler(async (req, res) => {
  const record = await AttendanceService.getTodayAttendance(req.auth!.userId, req.auth?.role);
  res.json({ record });
}));

router.get("/monthly", authenticateAccessToken, asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const data = await AttendanceService.getMonthlyAttendance(req.auth!.userId, month, year, req.auth?.role);
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
    const data = await AttendanceService.getMonthlyAttendance(req.params.employeeId, month, year, req.auth?.role);
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

// Admin: today's attendance summary and statistics
router.get(
  "/admin/today-summary",
  adminAuth,
  asyncHandler(async (req, res) => {
    const indiaToday = getIndiaDateParts();
    const today = indiaToday.utcStart;
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [activeEmployees, todayRecords, rules, todayHoliday] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN] },
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          loginId: true,
          role: true,
          employeeProfile: {
          select: { jobRole: true, zone: true },
          },
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.attendanceRecord.findMany({
        where: { date: today },
      }),
      AttendanceService.getRulesAsync(),
      prisma.holiday.findFirst({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    const weeklyOffDays: number[] = rules.weeklyOffDays && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays : [0];
    const isWeeklyOff = weeklyOffDays.includes(indiaToday.weekday);

    const recordMap = new Map<string, any>(todayRecords.map((r: any) => [r.employeeId, r]));
    const shiftParts = String(rules.shiftStart || "09:15").split(":").map(Number);
    const shiftStartMinutes = (shiftParts[0] || 0) * 60 + (shiftParts[1] || 0);

    let onTimeCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let explicitAbsentCount = 0;
    let adminAssignedCount = 0;

    const employeeSummaries = activeEmployees.map((emp) => {
      const record = recordMap.get(emp.id);
      let status = "NOT_CHECKED_IN";

      if (record) {
        status = record.status;
        const isSelfPunchMode = Boolean(record.displayAsSelfPunch);
        if (!isSelfPunchMode && (record.source?.startsWith("ADMIN") || record.manualOverride)) adminAssignedCount++;
        if (record.status === "HALF_DAY") {
          halfDayCount++;
        } else if (record.status === "PRESENT" || record.status === "LATE" || record.checkInTime) {
          const isLate = record.status === "LATE"
            || (record.checkInTime && getIndiaMinutes(new Date(record.checkInTime)) > shiftStartMinutes);
          if (isLate) lateCount++;
          else onTimeCount++;
        }
        else if (record.status === "LEAVE") leaveCount++;
        else if (record.status === "ABSENT") explicitAbsentCount++;
      }

      return {
        id: emp.id,
        fullName: emp.fullName,
        loginId: emp.loginId,
        role: emp.role,
        jobRole: emp.employeeProfile?.jobRole || null,
        zone: emp.employeeProfile?.zone || null,
        status,
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        source: record?.displayAsSelfPunch ? "EMPLOYEE_CHECK_IN" : (record?.source || null),
        totalMinutes: record?.totalMinutes || null,
        notes: record?.displayAsSelfPunch ? null : (record?.notes || null),
      };
    });

    const checkedInCount = onTimeCount + lateCount + halfDayCount;
    const expectedEmployees = isWeeklyOff || todayHoliday ? 0 : activeEmployees.length;
    const pendingCount = Math.max(0, expectedEmployees - checkedInCount - leaveCount - explicitAbsentCount);

    res.json({
      date: indiaToday.date,
      totalEmployees: activeEmployees.length,
      checkedIn: checkedInCount,
      onTime: onTimeCount,
      late: lateCount,
      halfDay: halfDayCount,
      leave: leaveCount,
      absent: explicitAbsentCount,
      notCheckedIn: pendingCount,
      adminAssigned: adminAssignedCount,
      isWeeklyOff,
      holiday: todayHoliday ? { name: todayHoliday.name, description: todayHoliday.description } : null,
      shiftStart: rules.shiftStart,
      employees: employeeSummaries,
    });
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

// Admin: get notifications (with employee details and history preservation)
router.get("/admin/notifications", adminAuth, asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === "true";
  const notifications = await prisma.adminNotification.findMany({
    where: unreadOnly ? { read: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const employeeIds = [...new Set(notifications.map((n: any) => n.employeeId).filter(Boolean))];
  const employees = employeeIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, fullName: true, employeeCode: true, email: true, role: true },
      })
    : [];

  const employeeMap = new Map(employees.map((e: any) => [e.id, e]));

  const enriched = notifications.map((n: any) => ({
    ...n,
    title: getNotificationTitle(n.type),
    employee: employeeMap.get(n.employeeId) || null,
  }));

  res.json({ notifications: enriched });
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

// Admin: Web Push routes
router.get("/admin/push/public-key", adminAuth, asyncHandler(async (req, res) => {
  const publicKey = getVapidPublicKey();
  res.json({ publicKey });
}));

router.post("/admin/push/subscribe", adminAuth, asyncHandler(async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: "Invalid subscription payload" });
    return;
  }

  const userAgent = req.headers["user-agent"] || "";
  await saveAdminPushSubscription({
    userId: req.auth!.userId,
    role: req.auth!.role,
    subscription,
    userAgent,
  });

  res.json({ success: true, message: "Push notification subscription enrolled successfully" });
}));

router.post("/admin/push/unsubscribe", adminAuth, asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "Endpoint is required" });
    return;
  }

  const removed = await removeAdminPushSubscription(endpoint);
  res.json({ success: true, removed });
}));

router.get("/admin/push/status", adminAuth, asyncHandler(async (req, res) => {
  const status = await getAdminSubscriptionStatus(req.auth!.userId);
  res.json(status);
}));

router.post("/admin/push/test", adminAuth, asyncHandler(async (req, res) => {
  const result = await sendPushToAdmins({
    title: "Swayog Admin Notification Test",
    body: "Browser Web Push notifications are active and connected to live employee events!",
    data: {
      url: "/admin/attendance",
      type: "SYSTEM_TEST",
    },
  });

  res.json({ success: true, ...result });
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
 * Supports source tag: "MOBILE" | "WEB"
 */
router.post(
  "/face/enroll",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const { descriptor1, descriptor2, descriptor3, source } = req.body as {
      descriptor1: number[];
      descriptor2: number[];
      descriptor3: number[];
      source?: string;
    };

    if (!isValidDescriptor(descriptor1) || !isValidDescriptor(descriptor2) || !isValidDescriptor(descriptor3)) {
      res.status(400).json({
        error: "Invalid face descriptors. Each descriptor must be a 128-element float array.",
      });
      return;
    }

    const enrollmentSource = source || (req.headers["user-agent"]?.includes("okhttp") ? "MOBILE" : "WEB");
    const modelVersion = enrollmentSource === "MOBILE" ? "mobile-facenet-v1" : "face-api-ssd-mobilenetv1-v1";

    const existing = await prisma.faceEnrollment.findUnique({ where: { employeeId } });
    const nextVersion = existing ? existing.syncVersion + 1 : 1;

    if (enrollmentSource === "WEB") {
      const keepMobile = existing && existing.enrollmentSource === "MOBILE" && !existing.isDeleted;
      const updateData: any = {
        webDescriptor1: descriptor1,
        webDescriptor2: descriptor2,
        webDescriptor3: descriptor3,
        webModelVersion: modelVersion,
        webEnrolledAt: new Date(),
        syncVersion: nextVersion,
        isDeleted: false,
        deletedAt: null,
      };

      if (!keepMobile) {
        updateData.descriptor1 = descriptor1;
        updateData.descriptor2 = descriptor2;
        updateData.descriptor3 = descriptor3;
        updateData.modelVersion = modelVersion;
        updateData.enrollmentSource = "WEB";
        updateData.enrolledAt = new Date();
      }

      const enrollment = await prisma.faceEnrollment.upsert({
        where: { employeeId },
        create: {
          employeeId,
          descriptor1,
          descriptor2,
          descriptor3,
          modelVersion,
          syncVersion: nextVersion,
          enrollmentSource: "WEB",
          webDescriptor1: descriptor1,
          webDescriptor2: descriptor2,
          webDescriptor3: descriptor3,
          webModelVersion: modelVersion,
          webEnrolledAt: new Date(),
          isDeleted: false,
          deletedAt: null,
        },
        update: updateData,
      });

      res.json({
        success: true,
        enrolledAt: enrollment.webEnrolledAt || enrollment.enrolledAt,
        syncVersion: enrollment.syncVersion,
        enrollmentId: enrollment.id,
        enrollmentSource: "WEB",
      });
      return;
    }

    // MOBILE enrollment
    const enrollment = await prisma.faceEnrollment.upsert({
      where: { employeeId },
      create: {
        employeeId,
        descriptor1,
        descriptor2,
        descriptor3,
        modelVersion,
        syncVersion: nextVersion,
        enrollmentSource: "MOBILE",
        isDeleted: false,
        deletedAt: null,
      },
      update: {
        descriptor1,
        descriptor2,
        descriptor3,
        enrolledAt: new Date(),
        modelVersion,
        syncVersion: nextVersion,
        enrollmentSource: "MOBILE",
        isDeleted: false,
        deletedAt: null,
      },
    });

    res.json({
      success: true,
      enrolledAt: enrollment.enrolledAt,
      syncVersion: enrollment.syncVersion,
      enrollmentId: enrollment.id,
      enrollmentSource: enrollment.enrollmentSource,
    });
  }),
);

/**
 * POST /face/enroll/:employeeId
 * Admin/SuperAdmin: enroll face descriptors on behalf of an employee.
 */
router.post(
  "/face/enroll/:employeeId",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { descriptor1, descriptor2, descriptor3, source } = req.body as {
      descriptor1: number[];
      descriptor2: number[];
      descriptor3: number[];
      source?: string;
    };

    const targetUser = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!targetUser) {
      res.status(404).json({ error: "Employee not found." });
      return;
    }

    if (!isValidDescriptor(descriptor1) || !isValidDescriptor(descriptor2) || !isValidDescriptor(descriptor3)) {
      res.status(400).json({
        error: "Invalid face descriptors. Each descriptor must be a 128-element float array.",
      });
      return;
    }

    const enrollmentSource = source || "WEB";
    const modelVersion = enrollmentSource === "MOBILE" ? "mobile-facenet-v1" : "face-api-ssd-mobilenetv1-v1";

    const existing = await prisma.faceEnrollment.findUnique({ where: { employeeId } });
    const nextVersion = existing ? existing.syncVersion + 1 : 1;

    if (enrollmentSource === "WEB") {
      const keepMobile = existing && existing.enrollmentSource === "MOBILE" && !existing.isDeleted;
      const updateData: any = {
        webDescriptor1: descriptor1,
        webDescriptor2: descriptor2,
        webDescriptor3: descriptor3,
        webModelVersion: modelVersion,
        webEnrolledAt: new Date(),
        syncVersion: nextVersion,
        isDeleted: false,
        deletedAt: null,
      };

      if (!keepMobile) {
        updateData.descriptor1 = descriptor1;
        updateData.descriptor2 = descriptor2;
        updateData.descriptor3 = descriptor3;
        updateData.modelVersion = modelVersion;
        updateData.enrollmentSource = "WEB";
        updateData.enrolledAt = new Date();
      }

      const enrollment = await prisma.faceEnrollment.upsert({
        where: { employeeId },
        create: {
          employeeId,
          descriptor1,
          descriptor2,
          descriptor3,
          modelVersion,
          syncVersion: nextVersion,
          enrollmentSource: "WEB",
          webDescriptor1: descriptor1,
          webDescriptor2: descriptor2,
          webDescriptor3: descriptor3,
          webModelVersion: modelVersion,
          webEnrolledAt: new Date(),
          isDeleted: false,
          deletedAt: null,
        },
        update: updateData,
      });

      res.json({
        success: true,
        enrolledAt: enrollment.webEnrolledAt || enrollment.enrolledAt,
        syncVersion: enrollment.syncVersion,
        enrollmentId: enrollment.id,
        enrollmentSource: "WEB",
      });
      return;
    }

    // MOBILE enrollment
    const enrollment = await prisma.faceEnrollment.upsert({
      where: { employeeId },
      create: {
        employeeId,
        descriptor1,
        descriptor2,
        descriptor3,
        modelVersion,
        syncVersion: nextVersion,
        enrollmentSource: "MOBILE",
        isDeleted: false,
        deletedAt: null,
      },
      update: {
        descriptor1,
        descriptor2,
        descriptor3,
        enrolledAt: new Date(),
        modelVersion,
        syncVersion: nextVersion,
        enrollmentSource: "MOBILE",
        isDeleted: false,
        deletedAt: null,
      },
    });

    res.json({
      success: true,
      enrolledAt: enrollment.enrolledAt,
      syncVersion: enrollment.syncVersion,
      enrollmentId: enrollment.id,
      enrollmentSource: enrollment.enrollmentSource,
    });
  }),
);

/**
 * GET /face/enrollment
 * Returns the stored face descriptors for the requesting employee.
 * Admin/SuperAdmin can pass ?employeeId= to get another employee's descriptors.
 * Supports ?platform=WEB | MOBILE to return model-compatible descriptors.
 */
router.get(
  "/face/enrollment",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    let employeeId = req.auth!.userId;
    const role = req.auth!.role;

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
        webDescriptor1: true,
        webDescriptor2: true,
        webDescriptor3: true,
        webModelVersion: true,
        webEnrolledAt: true,
        enrolledAt: true,
        modelVersion: true,
        syncVersion: true,
        enrollmentSource: true,
        isDeleted: true,
        updatedAt: true,
      },
    });

    if (!enrollment || enrollment.isDeleted) {
      res.json({ enrollment: null, enrolled: false });
      return;
    }

    const platform = String(req.query.platform || (req.headers["user-agent"]?.includes("okhttp") ? "MOBILE" : "WEB")).toUpperCase();

    if (platform === "WEB") {
      // Check for web descriptors first
      if (enrollment.webDescriptor1 && enrollment.webDescriptor2 && enrollment.webDescriptor3) {
        res.json({
          enrolled: true,
          enrollment: {
            id: enrollment.id,
            employeeId: enrollment.employeeId,
            descriptor1: enrollment.webDescriptor1,
            descriptor2: enrollment.webDescriptor2,
            descriptor3: enrollment.webDescriptor3,
            enrolledAt: enrollment.webEnrolledAt || enrollment.enrolledAt,
            modelVersion: enrollment.webModelVersion || "face-api-ssd-mobilenetv1-v1",
            syncVersion: enrollment.syncVersion,
            enrollmentSource: "WEB",
            updatedAt: enrollment.updatedAt,
          },
        });
        return;
      }

      // Check if primary enrollment is web-compatible
      if (enrollment.modelVersion === "face-api-ssd-mobilenetv1-v1") {
        res.json({
          enrolled: true,
          enrollment: {
            id: enrollment.id,
            employeeId: enrollment.employeeId,
            descriptor1: enrollment.descriptor1,
            descriptor2: enrollment.descriptor2,
            descriptor3: enrollment.descriptor3,
            enrolledAt: enrollment.enrolledAt,
            modelVersion: enrollment.modelVersion,
            syncVersion: enrollment.syncVersion,
            enrollmentSource: enrollment.enrollmentSource,
            updatedAt: enrollment.updatedAt,
          },
        });
        return;
      }

      // Only mobile enrollment exists — inform client to enroll on web
      res.json({
        enrolled: false,
        enrollment: null,
        mobileEnrolled: true,
        modelVersion: enrollment.modelVersion,
        message: "Face was enrolled using the mobile app model. Please enroll your face in Settings → Face ID to enable browser check-in.",
      });
      return;
    }

    // MOBILE or other client
    res.json({
      enrolled: true,
      enrollment: {
        id: enrollment.id,
        employeeId: enrollment.employeeId,
        descriptor1: enrollment.descriptor1,
        descriptor2: enrollment.descriptor2,
        descriptor3: enrollment.descriptor3,
        enrolledAt: enrollment.enrolledAt,
        modelVersion: enrollment.modelVersion,
        syncVersion: enrollment.syncVersion,
        enrollmentSource: enrollment.enrollmentSource,
        updatedAt: enrollment.updatedAt,
      },
    });
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
          select: {
            id: true,
            enrolledAt: true,
            modelVersion: true,
            syncVersion: true,
            enrollmentSource: true,
            isDeleted: true,
            updatedAt: true,
            webDescriptor1: true,
            webEnrolledAt: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const result = employees.map((e) => {
      const activeEnrollment = e.faceEnrollment && !e.faceEnrollment.isDeleted ? e.faceEnrollment : null;
      const webEnrolled = activeEnrollment !== null && Boolean(
        activeEnrollment.webDescriptor1 || activeEnrollment.modelVersion === "face-api-ssd-mobilenetv1-v1"
      );
      return {
        id: e.id,
        fullName: e.fullName,
        email: e.email,
        employeeCode: e.employeeCode,
        department: e.department?.name ?? "—",
        enrolled: activeEnrollment !== null,
        webEnrolled,
        enrolledAt: activeEnrollment?.enrolledAt ?? null,
        modelVersion: activeEnrollment?.modelVersion ?? null,
        syncVersion: activeEnrollment?.syncVersion ?? null,
        enrollmentSource: activeEnrollment?.enrollmentSource ?? null,
      };
    });

    res.json({ enrollments: result });
  }),
);

/**
 * GET /face/sync
 * Returns enrollments changed/updated since ?since= (ISO 8601 string or ms timestamp).
 * Useful for mobile app periodic or resume-based delta synchronization.
 */
router.get(
  "/face/sync",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    const sinceParam = req.query.since ? String(req.query.since) : null;
    const sinceDate = sinceParam ? new Date(isNaN(Number(sinceParam)) ? sinceParam : Number(sinceParam)) : new Date(0);

    const changed = await prisma.faceEnrollment.findMany({
      where: {
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        employeeId: true,
        descriptor1: true,
        descriptor2: true,
        descriptor3: true,
        enrolledAt: true,
        modelVersion: true,
        syncVersion: true,
        enrollmentSource: true,
        isDeleted: true,
        updatedAt: true,
      },
    });

    res.json({
      serverTime: new Date().toISOString(),
      enrollments: changed,
    });
  }),
);

/**
 * DELETE /face/enrollment/:employeeId
 * SuperAdmin only: soft-delete an employee's face enrollment so mobile/web can sync the deletion.
 */
router.delete(
  "/face/enrollment/:employeeId",
  superAdminAuth,
  asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    const existing = await prisma.faceEnrollment.findUnique({ where: { employeeId } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: "No active face enrollment found for this employee." });
      return;
    }

    await prisma.faceEnrollment.update({
      where: { employeeId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        syncVersion: existing.syncVersion + 1,
      },
    });

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

/**
 * POST /admin/apply & /admin/attendance/apply
 * Admin/SuperAdmin: manually apply or update attendance for an employee who forgot to check in.
 * Requires mandatory remark explaining why the employee forgot.
 */
const handleAdminApplyAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, status, checkInTime, checkOutTime, remark, displayAsSelfPunch, display_as_self_punch } = req.body;

  if (!employeeId) {
    res.status(400).json({ error: "Employee ID is required." });
    return;
  }
  if (!date) {
    res.status(400).json({ error: "Date (YYYY-MM-DD) is required." });
    return;
  }
  if (!status) {
    res.status(400).json({ error: "Attendance status is required." });
    return;
  }
  const validStatuses = ["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  // Authorize displayAsSelfPunch - ONLY Super Admin can set it to true
  const requestedDisplayAsSelfPunch = displayAsSelfPunch !== undefined ? displayAsSelfPunch : display_as_self_punch;
  if (requestedDisplayAsSelfPunch === true && req.auth?.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ error: "Unauthorized: Only Super Admin can enable 'Display as Self Punch'." });
    return;
  }

  const isSelfPunch = Boolean(requestedDisplayAsSelfPunch);
  if (!isSelfPunch && (!remark || typeof remark !== "string" || remark.trim().length < 3)) {
    res.status(400).json({ error: "A remark explaining why the employee forgot or why attendance is being updated is required (at least 3 characters)." });
    return;
  }

  const sanitizedRemark = (typeof remark === "string" && remark.trim().length > 0)
    ? remark.trim()
    : (isSelfPunch ? "Self Punch Regularization" : "");

  const result = await AttendanceService.applyOrUpdateAttendanceRecord({
    employeeId,
    date,
    status,
    checkInTime,
    checkOutTime,
    remark: sanitizedRemark,
    adminUserId: req.auth!.userId,
    displayAsSelfPunch: requestedDisplayAsSelfPunch !== undefined ? Boolean(requestedDisplayAsSelfPunch) : undefined,
  });

  res.json({
    success: true,
    message: "Attendance recorded successfully.",
    attendance: result.attendance,
    performance: result.performance,
  });
});

router.post("/admin/apply", adminAuth, handleAdminApplyAttendance);
router.post("/admin/attendance/apply", adminAuth, handleAdminApplyAttendance);

router.get(
  "/download-data",
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employeeProfile: true,
        AttendanceRecord: {
          orderBy: { date: "desc" },
        },
        checkIns: {
          orderBy: { createdAt: "desc" },
        },
        assignedTasks: {
          orderBy: { createdAt: "desc" },
        },
        workSubmissions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { passwordHash, portalPassword, ...safeUser } = user;

    res.setHeader("Content-Disposition", `attachment; filename="swayog_data_${user.loginId}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(safeUser, null, 2));
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// REGULARIZATION / MISSED ATTENDANCE REQUEST ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /regularization-request
 * Employee submits a request for a missed attendance punch.
 */
router.post(
  "/regularization-request",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const { date, status, checkInTime, checkInPeriod, checkOutTime, checkOutPeriod, reason } = req.body;

    if (!date) {
      res.status(400).json({ error: "Attendance date is required." });
      return;
    }
    if (!status) {
      res.status(400).json({ error: "Attendance status is required." });
      return;
    }
    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      res.status(400).json({ error: "A mandatory reason of at least 3 characters explaining why you missed attendance is required." });
      return;
    }

    const request = await AttendanceService.createRegularizationRequest({
      employeeId,
      date,
      status,
      checkInTime,
      checkInPeriod,
      checkOutTime,
      checkOutPeriod,
      reason,
    });

    res.json({
      success: true,
      message: "Attendance regularization request submitted successfully. It has been sent to the administrator for approval.",
      request,
    });
  }),
);

/**
 * GET /my-regularization-requests
 * Employee fetches their submitted regularization requests.
 */
router.get(
  "/my-regularization-requests",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const requests = await AttendanceService.getEmployeeRegularizationRequests(employeeId);
    res.json({ requests });
  }),
);

/**
 * GET /admin/regularization-requests
 * Admin fetches all employee regularization requests with optional status filter.
 */
router.get(
  "/admin/regularization-requests",
  adminAuth,
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const requests = await AttendanceService.getAdminRegularizationRequests(status);
    res.json({ requests });
  }),
);

/**
 * POST /admin/regularization-requests/:id/accept
 * Admin approves request, automatically allocating the attendance record for that date.
 */
router.post(
  "/admin/regularization-requests/:id/accept",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminUserId = req.auth!.userId;

    const result = await AttendanceService.acceptRegularizationRequest(id, adminUserId, adminNotes);

    res.json({
      success: true,
      message: "Attendance regularization request accepted and attendance successfully allocated to the employee.",
      request: result.request,
      attendance: result.attendance,
      performance: result.performance,
    });
  }),
);

/**
 * POST /admin/regularization-requests/:id/reject
 * Admin rejects request with optional notes.
 */
router.post(
  "/admin/regularization-requests/:id/reject",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminUserId = req.auth!.userId;

    const request = await AttendanceService.rejectRegularizationRequest(id, adminUserId, adminNotes);

    res.json({
      success: true,
      message: "Attendance regularization request rejected.",
      request,
    });
  }),
);

export default router;
