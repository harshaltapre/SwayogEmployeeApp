import { prisma } from "../lib/prisma.js";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// TYPES & CONTRACTS
// ---------------------------------------------------------------------------

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  leaveType: "PAID" | "UNPAID" | "SICK" | "CASUAL" | "EMERGENCY" | "OTHER";
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isHalfDay: boolean;
  halfDayPeriod?: "FIRST_HALF" | "SECOND_HALF";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
}

export interface OvertimeRequestRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  overtimeType: "AFTER_SHIFT" | "SUNDAY" | "WEEKLY_OFF" | "HOLIDAY" | "NIGHT";
  startTime: string; // ISO
  endTime?: string;  // ISO
  durationMinutes: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  rateMultiplier: number;
  approvedHours?: number;
  payableAmount?: number;
}

export interface OvertimeSessionRecord {
  id: string;
  employeeId: string;
  requestId?: string;
  startedAt: string; // Complete ISO timestamp (handles midnight crossing)
  stoppedAt?: string; // Complete ISO timestamp
  durationMinutes?: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface AdvanceRecordItem {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  requestedDate: string; // YYYY-MM-DD
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "PARTIALLY_RECOVERED" | "FULLY_RECOVERED";
  totalRecovered: number;
  monthlyDeduction: number;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AttendanceCorrectionRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  requestedCheckIn?: string; // HH:mm or ISO
  requestedCheckOut?: string;
  requestedStatus?: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminResponse?: string;
}

export interface SalaryRevisionItem {
  effectiveDate: string;
  previousSalary: number;
  newSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  reason?: string;
}

export interface IncentiveRecordItem {
  id: string;
  employeeId: string;
  name: string;
  category: "PERFORMANCE" | "ATTENDANCE" | "PROJECT" | "OTHER";
  amount: number;
  month: number;
  year: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "PAID";
}

// ---------------------------------------------------------------------------
// PERSISTENCE STORE (JSON FALLBACK WITH HIGH RESILIENCE)
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data", "workforce");

const storeCache = new Map<string, any>();

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStoreFile<T>(filename: string, defaultVal: T): T {
  if (storeCache.has(filename)) {
    return storeCache.get(filename) as T;
  }
  try {
    ensureDirectory();
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
      storeCache.set(filename, parsed);
      return parsed;
    }
  } catch (err) {
    console.error(`Failed to read workforce store file ${filename}:`, err);
  }
  storeCache.set(filename, defaultVal);
  return defaultVal;
}

function writeStoreFile<T>(filename: string, data: T) {
  try {
    storeCache.set(filename, data);
    ensureDirectory();
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Failed to write workforce store file ${filename}:`, err);
  }
}

// ---------------------------------------------------------------------------
// WORKFORCE CALCULATIONS & BUSINESS LOGIC
// ---------------------------------------------------------------------------

/**
 * Returns month calendar days, weekly offs, declared festival holidays,
 * expected working days, daily required hours, and expected monthly hours.
 * Formula:
 * Calendar days
 * minus weekly offs (Sundays)
 * minus company declared holidays
 * minus approved leave (that exempts working hours)
 * plus special working days
 * multiplied by Daily Required Hours (e.g. 8h)
 */
export async function getDynamicMonthlyWorkHours(employeeId: string, month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const totalDaysInMonth = end.getUTCDate();

  // 1. Fetch holidays from database
  let holidays: any[] = [];
  try {
    if (prisma.holiday && typeof prisma.holiday.findMany === "function") {
      holidays = await prisma.holiday.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      });
    }
  } catch (e) {
    console.error("Failed to query holidays:", e);
  }

  const holidayDateSet = new Set<string>();
  for (const h of holidays) {
    const d = new Date(h.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    holidayDateSet.add(dateStr);
  }

  // 2. Fetch approved leaves for this employee in this month
  const leaves = getLeaveRequests(employeeId).filter(
    (l) => l.status === "APPROVED" && isDateInMonth(l.startDate, month, year)
  );
  
  let approvedLeaveDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  for (const l of leaves) {
    const days = l.isHalfDay ? 0.5 : 1;
    approvedLeaveDays += days;
    if (l.leaveType === "PAID") {
      paidLeaveDays += days;
    } else {
      unpaidLeaveDays += days;
    }
  }

  // 3. Count weekly offs (Sundays) and company holidays (non-Sunday holidays)
  let weeklyOffs = 0;
  let companyHolidaysCount = 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (dayOfWeek === 0) {
      weeklyOffs++;
    } else if (holidayDateSet.has(dateStr)) {
      companyHolidaysCount++;
    }
  }

  const dailyRequiredHours = 8;
  const expectedWorkingDays = Math.max(0, totalDaysInMonth - weeklyOffs - companyHolidaysCount - approvedLeaveDays);
  const expectedMonthlyHours = Math.round(expectedWorkingDays * dailyRequiredHours);

  // 4. Fetch actual attendance records
  let records: any[] = [];
  try {
    if (prisma.attendanceRecord && typeof prisma.attendanceRecord.findMany === "function") {
      records = await prisma.attendanceRecord.findMany({
        where: { employeeId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      });
    }
  } catch (e) {
    console.error("Failed to query attendance records:", e);
  }

  let regularWorkedMinutes = 0;
  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;

  for (const rec of records) {
    if (rec.status === "PRESENT" || rec.status === "LATE") {
      presentCount++;
      regularWorkedMinutes += (rec.totalMinutes != null && rec.totalMinutes > 0) ? rec.totalMinutes : 480; // default 8h if admin marked
    } else if (rec.status === "HALF_DAY") {
      halfDayCount++;
      regularWorkedMinutes += (rec.totalMinutes != null && rec.totalMinutes > 0) ? rec.totalMinutes : 240;
    } else if (rec.status === "ABSENT") {
      absentCount++;
    }
  }

  const regularWorkedHours = Math.round((regularWorkedMinutes / 60) * 10) / 10;

  // 5. Fetch approved overtime
  const otRequests = getOvertimeRequests(employeeId).filter(
    (ot) => ot.status === "APPROVED" && isDateInMonth(ot.date, month, year)
  );
  const approvedOtHours = otRequests.reduce((sum, ot) => sum + (ot.approvedHours || (ot.durationMinutes / 60)), 0);

  const differenceInRegularHours = Math.round((regularWorkedHours - expectedMonthlyHours) * 10) / 10;
  const remainingRequiredHours = Math.max(0, Math.round((expectedMonthlyHours - regularWorkedHours) * 10) / 10);

  return {
    calendarDays: totalDaysInMonth,
    weeklyOffs,
    companyHolidays: companyHolidaysCount,
    approvedLeaveDays,
    paidLeaveDays,
    unpaidLeaveDays,
    expectedWorkingDays,
    dailyRequiredHours,
    expectedMonthlyHours,
    regularWorkedHours,
    approvedOtHours: Math.round(approvedOtHours * 10) / 10,
    differenceInRegularHours,
    remainingRequiredHours,
    presentCount,
    halfDayCount,
    absentCount,
  };
}

export async function getTodayAuthoritativeDay(employeeId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const calendarData = await getAuthoritativeCalendar(employeeId, month, year);
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return calendarData.days.find((d) => d.date === todayStr) || null;
}

function isDateInMonth(dateStr: string, month: number, year: number): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split("-").map(Number);
  return parts[0] === year && parts[1] === month;
}

// ---------------------------------------------------------------------------
// MONTHLY CALENDAR GRID WITH AUTHORITATIVE STATUSES
// ---------------------------------------------------------------------------

export async function getAuthoritativeCalendar(employeeId: string, month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const totalDays = end.getUTCDate();

  let records: any[] = [];
  let holidays: any[] = [];
  try {
    const [recList, holList] = await Promise.all([
      (prisma.attendanceRecord && typeof prisma.attendanceRecord.findMany === "function")
        ? prisma.attendanceRecord.findMany({ where: { employeeId, date: { gte: start, lte: end } } })
        : Promise.resolve([]),
      (prisma.holiday && typeof prisma.holiday.findMany === "function")
        ? prisma.holiday.findMany({ where: { date: { gte: start, lte: end } } })
        : Promise.resolve([]),
    ]);
    records = recList;
    holidays = holList;
  } catch (e) {
    console.error("Failed to query calendar records/holidays:", e);
  }

  const recordMap = new Map<string, any>();
  for (const r of records) {
    const d = new Date(r.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    recordMap.set(dateStr, r);
  }

  const holidayMap = new Map<string, any>();
  for (const h of holidays) {
    const d = new Date(h.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    holidayMap.set(dateStr, h);
  }

  const leaves = getLeaveRequests(employeeId).filter((l) => isDateInMonth(l.startDate, month, year));
  const leaveDateMap = new Map<string, LeaveRequestRecord>();
  for (const l of leaves) {
    leaveDateMap.set(l.startDate, l);
  }

  const otRequests = getOvertimeRequests(employeeId).filter((ot) => isDateInMonth(ot.date, month, year));
  const otDateMap = new Map<string, OvertimeRequestRecord>();
  for (const ot of otRequests) {
    otDateMap.set(ot.date, ot);
  }

  const corrections = getAttendanceCorrections(employeeId).filter((c) => isDateInMonth(c.date, month, year));
  const correctionDateMap = new Map<string, AttendanceCorrectionRecord>();
  for (const c of corrections) {
    correctionDateMap.set(c.date, c);
  }

  const days: any[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(Date.UTC(year, month - 1, d, 0, 0, 0));
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const rec = recordMap.get(dateStr);
    const hol = holidayMap.get(dateStr);
    const leave = leaveDateMap.get(dateStr);
    const ot = otDateMap.get(dateStr);
    const correction = correctionDateMap.get(dateStr);

    let status = "WORKING_DAY";
    let isSunday = dayOfWeek === 0;
    let isHoliday = hol != null;
    let isPresent = false;
    let isHalfDay = false;
    let isAbsent = false;
    let isPaidLeave = false;
    let isUnpaidLeave = false;
    let isAdminAssigned = false;
    let checkInTime = rec?.checkInTime ? rec.checkInTime.toISOString() : null;
    let checkOutTime = rec?.checkOutTime ? rec.checkOutTime.toISOString() : null;
    let regularHours = 0;
    let overtimeHours = 0;

    if (rec) {
      if (rec.status === "PRESENT" || rec.status === "LATE") {
        status = "PRESENT";
        isPresent = true;
        regularHours = rec.totalMinutes ? Math.round((rec.totalMinutes / 60) * 10) / 10 : 8.0;
      } else if (rec.status === "HALF_DAY") {
        status = "HALF_DAY";
        isHalfDay = true;
        regularHours = rec.totalMinutes ? Math.round((rec.totalMinutes / 60) * 10) / 10 : 4.0;
      } else if (rec.status === "ABSENT") {
        status = "ABSENT";
        isAbsent = true;
      } else if (rec.status === "LEAVE") {
        status = "LEAVE";
      }
      if (rec.manualOverride || (rec.status === "PRESENT" && !rec.checkInTime)) {
        isAdminAssigned = true;
      }
    }

    if (isSunday) {
      status = "WEEKLY_OFF";
    } else if (isHoliday) {
      status = "COMPANY_HOLIDAY";
    }

    if (leave && leave.status === "APPROVED") {
      if (leave.leaveType === "PAID") {
        status = "PAID_LEAVE";
        isPaidLeave = true;
      } else {
        status = "UNPAID_LEAVE";
        isUnpaidLeave = true;
      }
    }

    if (ot && ot.status === "APPROVED") {
      overtimeHours = ot.approvedHours || Math.round((ot.durationMinutes / 60) * 10) / 10;
    }

    days.push({
      date: dateStr,
      dayNumber: d,
      dayOfWeek,
      status,
      isSunday,
      isHoliday,
      holidayName: hol?.name ?? null,
      isPresent,
      isHalfDay,
      isAbsent,
      isPaidLeave,
      isUnpaidLeave,
      isAdminAssigned,
      checkInTime,
      checkOutTime,
      regularHours,
      overtimeHours,
      totalHours: Math.round((regularHours + overtimeHours) * 10) / 10,
      overtimeAllowed: isSunday || isHoliday || isPresent,
      hasPendingCorrection: correction?.status === "PENDING",
      correctionStatus: correction?.status ?? null,
      notes: rec?.notes || hol?.description || null,
    });
  }

  return { month, year, days };
}

// ---------------------------------------------------------------------------
// LEAVE MODULE
// ---------------------------------------------------------------------------

export function getLeaveRequests(employeeId: string): LeaveRequestRecord[] {
  const all = readStoreFile<LeaveRequestRecord[]>("leave-requests.json", []);
  return all.filter((l) => l.employeeId === employeeId);
}

export function submitLeaveRequest(employeeId: string, data: {
  leaveType: LeaveRequestRecord["leaveType"];
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: "FIRST_HALF" | "SECOND_HALF";
  reason: string;
}): LeaveRequestRecord {
  const all = readStoreFile<LeaveRequestRecord[]>("leave-requests.json", []);
  const newReq: LeaveRequestRecord = {
    id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    isHalfDay: data.isHalfDay,
    halfDayPeriod: data.halfDayPeriod,
    reason: data.reason,
    status: "PENDING",
    submittedAt: new Date().toISOString(),
  };
  all.unshift(newReq);
  writeStoreFile("leave-requests.json", all);
  return newReq;
}

export async function getLeaveBalance(employeeId: string) {
  // Annual leave allowance configured per company policy (e.g. 24 days annual allowance)
  const annualAllowance = 24;
  const leaves = getLeaveRequests(employeeId);
  
  let used = 0;
  let pending = 0;

  for (const l of leaves) {
    const days = l.isHalfDay ? 0.5 : 1;
    if (l.status === "APPROVED") {
      used += days;
    } else if (l.status === "PENDING") {
      pending += days;
    }
  }

  const remaining = Math.max(0, annualAllowance - used);

  return {
    annualAllowance,
    used,
    pending,
    remaining,
    categories: [
      { name: "Paid Leave", allowance: 12, used: Math.min(used, 12), remaining: Math.max(0, 12 - used) },
      { name: "Sick Leave", allowance: 6, used: 0, remaining: 6 },
      { name: "Casual Leave", allowance: 6, used: 0, remaining: 6 },
    ],
  };
}

// ---------------------------------------------------------------------------
// OVERTIME MODULE & MIDNIGHT-CROSSING SESSIONS
// ---------------------------------------------------------------------------

export function getOvertimeRequests(employeeId: string): OvertimeRequestRecord[] {
  const all = readStoreFile<OvertimeRequestRecord[]>("overtime-requests.json", []);
  return all.filter((ot) => ot.employeeId === employeeId);
}

export function submitOvertimeRequest(employeeId: string, data: {
  date: string;
  overtimeType: OvertimeRequestRecord["overtimeType"];
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  reason: string;
}): OvertimeRequestRecord {
  const all = readStoreFile<OvertimeRequestRecord[]>("overtime-requests.json", []);
  const newReq: OvertimeRequestRecord = {
    id: `ot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId,
    date: data.date,
    overtimeType: data.overtimeType,
    startTime: data.startTime,
    endTime: data.endTime,
    durationMinutes: data.durationMinutes,
    reason: data.reason,
    status: "PENDING",
    submittedAt: new Date().toISOString(),
    rateMultiplier: data.overtimeType === "SUNDAY" || data.overtimeType === "HOLIDAY" ? 2.0 : 1.5,
  };
  all.unshift(newReq);
  writeStoreFile("overtime-requests.json", all);
  return newReq;
}

export function getActiveOvertimeSession(employeeId: string): OvertimeSessionRecord | null {
  const all = readStoreFile<OvertimeSessionRecord[]>("overtime-sessions.json", []);
  return all.find((s) => s.employeeId === employeeId && s.status === "ACTIVE") || null;
}

export function startOvertimeSession(employeeId: string, requestId?: string): OvertimeSessionRecord {
  const all = readStoreFile<OvertimeSessionRecord[]>("overtime-sessions.json", []);
  // Stop existing active session if any
  for (const s of all) {
    if (s.employeeId === employeeId && s.status === "ACTIVE") {
      s.status = "COMPLETED";
      s.stoppedAt = new Date().toISOString();
    }
  }

  const session: OvertimeSessionRecord = {
    id: `ots_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId,
    requestId,
    startedAt: new Date().toISOString(),
    status: "ACTIVE",
  };
  all.unshift(session);
  writeStoreFile("overtime-sessions.json", all);
  return session;
}

export function stopOvertimeSession(employeeId: string, notes?: string): OvertimeSessionRecord {
  const all = readStoreFile<OvertimeSessionRecord[]>("overtime-sessions.json", []);
  const session = all.find((s) => s.employeeId === employeeId && s.status === "ACTIVE");
  if (!session) {
    throw new Error("No active overtime session found.");
  }

  const now = new Date();
  session.stoppedAt = now.toISOString();
  session.status = "COMPLETED";
  session.notes = notes;

  const startMs = new Date(session.startedAt).getTime();
  const stopMs = now.getTime();
  session.durationMinutes = Math.max(0, Math.round((stopMs - startMs) / 60000));

  writeStoreFile("overtime-sessions.json", all);
  return session;
}

// ---------------------------------------------------------------------------
// EARNINGS & SALARY
// ---------------------------------------------------------------------------

export async function getEmployeeEarnings(employeeId: string, month: number, year: number) {
  const profile = await prisma.employeeProfile.findUnique({
    where: { userId: employeeId },
  });

  const baseSalary = profile?.monthlySalaryInr || 30000;
  
  // Calculate approved overtime earnings
  const otRequests = getOvertimeRequests(employeeId).filter(
    (ot) => ot.status === "APPROVED" && isDateInMonth(ot.date, month, year)
  );

  // Hourly base rate = monthly salary / 200 hours
  const hourlyBaseRate = Math.round(baseSalary / 200);
  let overtimeEarnings = 0;
  let approvedOtHours = 0;

  for (const ot of otRequests) {
    const hours = ot.approvedHours || (ot.durationMinutes / 60);
    approvedOtHours += hours;
    overtimeEarnings += Math.round(hours * hourlyBaseRate * ot.rateMultiplier);
  }

  // Fetch incentives
  const incentives = getIncentives(employeeId).filter(
    (inc) => inc.month === month && inc.year === year && inc.status !== "PENDING"
  );
  const totalIncentives = incentives.reduce((sum, inc) => sum + inc.amount, 0);

  // Fetch advance deduction for this month
  const advances = getAdvances(employeeId).filter(
    (adv) => adv.status === "PAID" || adv.status === "PARTIALLY_RECOVERED"
  );
  const advanceDeduction = advances.reduce((sum, adv) => sum + adv.monthlyDeduction, 0);

  const otherDeductions = 500; // PF / ESI / standard tax deduction
  const estimatedPayable = Math.max(0, baseSalary + overtimeEarnings + totalIncentives - advanceDeduction - otherDeductions);

  // Status is ESTIMATED during current/future month, FINAL once payroll approved
  const isCurrentMonth = new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
  const payrollStatus = isCurrentMonth ? "ESTIMATED" : "FINAL / PAYROLL CONFIRMED";

  return {
    month,
    year,
    baseSalary,
    regularPay: baseSalary,
    overtimeHours: Math.round(approvedOtHours * 10) / 10,
    overtimeEarnings,
    incentives: totalIncentives,
    advanceDeduction,
    otherDeductions,
    estimatedPayable,
    payrollStatus,
    hourlyRate: hourlyBaseRate,
    isFinalized: payrollStatus.startsWith("FINAL"),
  };
}

export function getSalaryHistory(employeeId: string): SalaryRevisionItem[] {
  return [
    {
      effectiveDate: "2026-09-01",
      previousSalary: 28000,
      newSalary: 30000,
      incrementAmount: 2000,
      incrementPercentage: 7.14,
      reason: "Annual performance appraisal",
    },
    {
      effectiveDate: "2026-01-01",
      previousSalary: 25000,
      newSalary: 28000,
      incrementAmount: 3000,
      incrementPercentage: 12.0,
      reason: "Role upgrade and tenure adjustment",
    },
  ];
}

// ---------------------------------------------------------------------------
// ADVANCES MODULE
// ---------------------------------------------------------------------------

export function getAdvances(employeeId: string): AdvanceRecordItem[] {
  const all = readStoreFile<AdvanceRecordItem[]>("advances.json", []);
  return all.filter((a) => a.employeeId === employeeId);
}

export function submitAdvanceRequest(employeeId: string, data: { amount: number; reason: string }): AdvanceRecordItem {
  const all = readStoreFile<AdvanceRecordItem[]>("advances.json", []);
  const todayStr = new Date().toISOString().split("T")[0];
  const newAdv: AdvanceRecordItem = {
    id: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId,
    amount: data.amount,
    reason: data.reason,
    requestedDate: todayStr,
    status: "PENDING",
    totalRecovered: 0,
    monthlyDeduction: Math.round(data.amount / 5), // default 5-month recovery
  };
  all.unshift(newAdv);
  writeStoreFile("advances.json", all);
  return newAdv;
}

export function getAdvanceSummary(employeeId: string) {
  const advances = getAdvances(employeeId);
  const activeOrPaid = advances.filter((a) => a.status === "PAID" || a.status === "PARTIALLY_RECOVERED");
  
  const totalReceived = activeOrPaid.reduce((sum, a) => sum + a.amount, 0);
  const totalRecovered = activeOrPaid.reduce((sum, a) => sum + a.totalRecovered, 0);
  const remainingAdvance = Math.max(0, totalReceived - totalRecovered);
  const currentMonthDeduction = activeOrPaid.reduce((sum, a) => sum + a.monthlyDeduction, 0);

  return {
    totalReceived,
    totalRecovered,
    remainingAdvance,
    currentMonthDeduction,
    records: advances,
  };
}

// ---------------------------------------------------------------------------
// INCENTIVES MODULE
// ---------------------------------------------------------------------------

export function getIncentives(employeeId: string): IncentiveRecordItem[] {
  const all = readStoreFile<IncentiveRecordItem[]>("incentives.json", [
    {
      id: "inc_01",
      employeeId,
      name: "Attendance Excellence",
      category: "ATTENDANCE",
      amount: 1000,
      month: 9,
      year: 2026,
      reason: "100% on-time attendance for the month",
      status: "APPROVED",
    },
    {
      id: "inc_02",
      employeeId,
      name: "Special Solar Commissioning",
      category: "PROJECT",
      amount: 2000,
      month: 9,
      year: 2026,
      reason: "Completed project installation ahead of schedule",
      status: "APPROVED",
    },
  ]);
  return all.filter((i) => i.employeeId === employeeId);
}

// ---------------------------------------------------------------------------
// ATTENDANCE CORRECTIONS MODULE
// ---------------------------------------------------------------------------

export function getAttendanceCorrections(employeeId: string): AttendanceCorrectionRecord[] {
  const all = readStoreFile<AttendanceCorrectionRecord[]>("attendance-corrections.json", []);
  return all.filter((c) => c.employeeId === employeeId);
}

export function submitAttendanceCorrection(employeeId: string, data: {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  requestedStatus?: string;
  reason: string;
}): AttendanceCorrectionRecord {
  const all = readStoreFile<AttendanceCorrectionRecord[]>("attendance-corrections.json", []);
  const newCorr: AttendanceCorrectionRecord = {
    id: `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId,
    date: data.date,
    requestedCheckIn: data.requestedCheckIn,
    requestedCheckOut: data.requestedCheckOut,
    requestedStatus: data.requestedStatus,
    reason: data.reason,
    status: "PENDING",
    submittedAt: new Date().toISOString(),
  };
  all.unshift(newCorr);
  writeStoreFile("attendance-corrections.json", all);
  return newCorr;
}

// ---------------------------------------------------------------------------
// UNIFIED REQUESTS HUB
// ---------------------------------------------------------------------------

export function getUnifiedRequests(employeeId: string) {
  const leaves = getLeaveRequests(employeeId).map((l) => ({
    id: l.id,
    type: "LEAVE",
    title: `${l.leaveType} Leave`,
    date: l.startDate === l.endDate ? l.startDate : `${l.startDate} to ${l.endDate}`,
    submittedAt: l.submittedAt,
    status: l.status,
    reason: l.reason,
    details: `${l.isHalfDay ? "Half Day (" + (l.halfDayPeriod || "First Half") + ")" : "Full Day"}`,
    adminResponse: l.reviewerNotes || null,
  }));

  const overtimes = getOvertimeRequests(employeeId).map((ot) => ({
    id: ot.id,
    type: "OVERTIME",
    title: `${ot.overtimeType} Overtime`,
    date: ot.date,
    submittedAt: ot.submittedAt,
    status: ot.status,
    reason: ot.reason,
    details: `Duration: ${Math.round((ot.durationMinutes / 60) * 10) / 10}h (Multiplier: ${ot.rateMultiplier}x)`,
    adminResponse: ot.reviewerNotes || null,
  }));

  const corrections = getAttendanceCorrections(employeeId).map((c) => ({
    id: c.id,
    type: "CORRECTION",
    title: "Attendance Correction",
    date: c.date,
    submittedAt: c.submittedAt,
    status: c.status,
    reason: c.reason,
    details: `In: ${c.requestedCheckIn || "N/A"} | Out: ${c.requestedCheckOut || "N/A"}`,
    adminResponse: c.adminResponse || null,
  }));

  const advances = getAdvances(employeeId).map((a) => ({
    id: a.id,
    type: "ADVANCE",
    title: `Advance (₹${a.amount})`,
    date: a.requestedDate,
    submittedAt: a.requestedDate,
    status: a.status,
    reason: a.reason,
    details: `Recovery: ₹${a.monthlyDeduction}/month`,
    adminResponse: null,
  }));

  const combined = [...leaves, ...overtimes, ...corrections, ...advances];
  combined.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return combined;
}
