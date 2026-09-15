import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import * as WorkforceService from "../services/workforceService.js";
import * as AttendanceService from "../services/attendanceService.js";

const router = Router();
const employeeAuth = [authenticateAccessToken, authorizeRoles(UserRole.EMPLOYEE, UserRole.SUB_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)];

// ── 1. Workforce Dashboard Summary ──────────────────────────────────────────
router.get("/dashboard", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const [hoursSummary, todayRecord, leaveBalance, earnings, activeSession, todayCalendarDay] = await Promise.all([
    WorkforceService.getDynamicMonthlyWorkHours(employeeId, month, year),
    AttendanceService.getTodayAttendance(employeeId),
    WorkforceService.getLeaveBalance(employeeId),
    WorkforceService.getEmployeeEarnings(employeeId, month, year),
    WorkforceService.getActiveOvertimeSession(employeeId),
    WorkforceService.getTodayAuthoritativeDay(employeeId),
  ]);

  res.json({
    success: true,
    month,
    year,
    summary: hoursSummary,
    today: todayRecord,
    todayCalendarDay,
    leaveBalance,
    earnings,
    activeOvertimeSession: activeSession,
  });
}));

// ── 2. Authoritative Calendar ───────────────────────────────────────────────
router.get("/calendar", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const calendarData = await WorkforceService.getAuthoritativeCalendar(employeeId, month, year);
  res.json({ success: true, ...calendarData });
}));

// ── 3. Dynamic Work Hours ───────────────────────────────────────────────────
router.get("/work-hours", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const hours = await WorkforceService.getDynamicMonthlyWorkHours(employeeId, month, year);
  res.json({ success: true, ...hours });
}));

// ── 4. Leave Module ─────────────────────────────────────────────────────────
router.get("/leave/balance", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const balance = await WorkforceService.getLeaveBalance(employeeId);
  res.json({ success: true, balance });
}));

router.get("/leave/history", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const leaves = WorkforceService.getLeaveRequests(employeeId);
  res.json({ success: true, leaves });
}));

router.post("/leave/request", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const { leaveType, startDate, endDate, isHalfDay, halfDayPeriod, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    res.status(400).json({ error: "Missing required leave parameters (leaveType, startDate, endDate, reason)." });
    return;
  }

  const request = WorkforceService.submitLeaveRequest(employeeId, {
    leaveType,
    startDate,
    endDate,
    isHalfDay: isHalfDay === true,
    halfDayPeriod,
    reason,
  });

  res.json({ success: true, request });
}));

// ── 5. Overtime Module ──────────────────────────────────────────────────────
router.get("/overtime/summary", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const hours = await WorkforceService.getDynamicMonthlyWorkHours(employeeId, month, year);
  const activeSession = WorkforceService.getActiveOvertimeSession(employeeId);
  const requests = WorkforceService.getOvertimeRequests(employeeId);

  res.json({
    success: true,
    approvedOvertimeHours: hours.approvedOtHours,
    activeSession,
    requests,
  });
}));

router.get("/overtime/history", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const history = WorkforceService.getOvertimeRequests(employeeId);
  res.json({ success: true, history });
}));

router.post("/overtime/request", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const { date, overtimeType, startTime, endTime, durationMinutes, reason } = req.body;

  if (!date || !overtimeType || !startTime || !durationMinutes || !reason) {
    res.status(400).json({ error: "Missing required overtime parameters." });
    return;
  }

  const request = WorkforceService.submitOvertimeRequest(employeeId, {
    date,
    overtimeType,
    startTime,
    endTime,
    durationMinutes: Number(durationMinutes),
    reason,
  });

  res.json({ success: true, request });
}));

router.get("/overtime/session/active", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const session = WorkforceService.getActiveOvertimeSession(employeeId);
  res.json({ success: true, session });
}));

router.post("/overtime/session/start", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const { requestId } = req.body;
  const session = WorkforceService.startOvertimeSession(employeeId, requestId);
  res.json({ success: true, session });
}));

router.post("/overtime/session/stop", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const { notes } = req.body;
  try {
    const session = WorkforceService.stopOvertimeSession(employeeId, notes);
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to stop overtime session" });
  }
}));

// ── 6. Earnings / Salary Module ─────────────────────────────────────────────
router.get("/earnings", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const earnings = await WorkforceService.getEmployeeEarnings(employeeId, month, year);
  res.json({ success: true, earnings });
}));

router.get("/salary/history", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const history = WorkforceService.getSalaryHistory(employeeId);
  res.json({ success: true, history });
}));

// ── 7. Advances Module ──────────────────────────────────────────────────────
router.get("/advances", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const summary = WorkforceService.getAdvanceSummary(employeeId);
  res.json({ success: true, summary });
}));

router.post("/advances/request", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const { amount, reason } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !reason) {
    res.status(400).json({ error: "Invalid amount or reason for advance request." });
    return;
  }

  const request = WorkforceService.submitAdvanceRequest(employeeId, {
    amount: Number(amount),
    reason,
  });

  res.json({ success: true, request });
}));

// ── 8. Incentives Module ────────────────────────────────────────────────────
router.get("/incentives", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const incentives = WorkforceService.getIncentives(employeeId);
  res.json({ success: true, incentives });
}));

// ── 9. Attendance Corrections Module ────────────────────────────────────────
router.get("/attendance-correction/history", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const history = WorkforceService.getAttendanceCorrections(employeeId);
  res.json({ success: true, history });
}));

router.post("/attendance-correction", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const { date, requestedCheckIn, requestedCheckOut, requestedStatus, reason } = req.body;

  if (!date || !reason || reason.trim().length < 5) {
    res.status(400).json({ error: "Date and a detailed reason (at least 5 chars) are required." });
    return;
  }

  const correction = WorkforceService.submitAttendanceCorrection(employeeId, {
    date,
    requestedCheckIn,
    requestedCheckOut,
    requestedStatus,
    reason,
  });

  res.json({ success: true, correction });
}));

// ── 10. Unified Requests Center ─────────────────────────────────────────────
router.get("/requests", employeeAuth, asyncHandler(async (req, res) => {
  const employeeId = req.auth!.userId;
  const requests = WorkforceService.getUnifiedRequests(employeeId);
  res.json({ success: true, requests });
}));

export default router;
