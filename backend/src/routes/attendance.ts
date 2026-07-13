import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { prisma } from "../lib/prisma.js";
import * as AttendanceService from "../services/attendanceService.js";
import fs from "fs";
import path from "path";

const RULES_FILE_PATH = path.join(process.cwd(), "data", "attendance-rules.json");

function getRules() {
  try {
    if (!fs.existsSync(path.dirname(RULES_FILE_PATH))) {
      fs.mkdirSync(path.dirname(RULES_FILE_PATH), { recursive: true });
    }
    if (fs.existsSync(RULES_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(RULES_FILE_PATH, "utf8"));
    }
  } catch (err) {
    console.error("Failed to read rules file, using defaults:", err);
  }
  return {
    shiftStart: "09:15",
    faceRequired: true,
    geofenceEnabled: false,
    officeLat: 18.5204,
    officeLng: 73.8567,
    officeRadius: 150,
  };
}

function saveRules(rules: any) {
  try {
    if (!fs.existsSync(path.dirname(RULES_FILE_PATH))) {
      fs.mkdirSync(path.dirname(RULES_FILE_PATH), { recursive: true });
    }
    fs.writeFileSync(RULES_FILE_PATH, JSON.stringify(rules, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write rules file:", err);
    return false;
  }
}

const router = Router();

const employeeAuth = [authenticateAccessToken, authorizeRoles(UserRole.EMPLOYEE, UserRole.SUB_ADMIN)];
const adminAuth = [authenticateAccessToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD, UserRole.SUB_ADMIN)];

router.get("/rules", authenticateAccessToken, asyncHandler(async (req, res) => {
  res.json(getRules());
}));

router.post("/rules", adminAuth, asyncHandler(async (req, res) => {
  const success = saveRules(req.body);
  if (success) {
    res.json({ success: true, rules: getRules() });
  } else {
    res.status(500).json({ error: "Failed to save settings on server" });
  }
}));

router.post("/check-in", employeeAuth, asyncHandler(async (req, res) => {
  try {
    const { selfie, latitude, longitude } = req.body;
    const result = await AttendanceService.checkIn(req.auth!.userId, {
      selfieDataUrl: selfie ?? null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    });
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

// Admin: list recent check-ins (today)
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

export default router;

