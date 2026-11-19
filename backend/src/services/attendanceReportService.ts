import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import * as AttendanceService from "./attendanceService.js";

export const REPORT_COMPANY_NAME = "Swayog Energy Pvt. Ltd.";
export const REPORT_TIMEZONE = "Asia/Kolkata";

const STAFF_ROLES: UserRole[] = [
  UserRole.EMPLOYEE,
  UserRole.DEPARTMENT_HEAD,
  UserRole.TEAM_LEAD,
];
const MAX_RANGE_DAYS = 800;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export class AttendanceReportError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "INVALID_REPORT_REQUEST") {
    super(message);
    this.name = "AttendanceReportError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export type ReportEmploymentStatus = "ACTIVE" | "INACTIVE" | "ALL";

export interface AttendanceReportFilters {
  startDate: string;
  endDate: string;
  employeeIds?: string[];
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  zone?: string;
  status: ReportEmploymentStatus;
}

export interface AttendanceReportRules {
  shiftStart: string;
  shiftEnd: string;
  dailyWorkingHours: number;
  weeklyOffDays: number[];
  timezone: string;
}

export interface ReportEmployeeSummary {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  zone: string;
  reportingPeriod: string;
  scheduledWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  leaveDays: number;
  weeklyOffs: number;
  companyHolidays: number;
  expectedWorkingHours: number;
  regularWorkingHours: number;
  approvedOvertimeHours: number;
  lateArrivals: number;
  lateArrivalMinutes: number;
  missingCheckOuts: number;
  attendancePercent: number;
  creditDays: number;
}

export interface ReportDailyLog {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  date: Date;
  dateKey: string;
  dayOfWeek: string;
  scheduledShift: string;
  checkInTime: string;
  checkOutTime: string;
  actualWorkingHours: number;
  expectedWorkingHours: number;
  status: string;
  lateArrivalMinutes: number;
  overtimeHours: number;
  approvedOvertimeHours: number;
  source: string;
  remarks: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  missingCheckOut: boolean;
}

export interface ReportMonthlyBreakdown {
  monthKey: string;
  monthLabel: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  attendancePercent: number | null;
  regularWorkingHours: number;
  approvedOvertimeHours: number;
}

export interface ReportLocationRow {
  employeeName: string;
  employeeCode: string;
  date: Date;
  dateKey: string;
  checkInLocation: string;
  checkOutLocation: string;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  mapUrl: string;
  attendanceSource: string;
  locationAvailability: string;
}

export interface ReportDashboardMetrics {
  totalEmployees: number;
  scheduledWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  weeklyOffs: number;
  companyHolidays: number;
  averageAttendancePercent: number;
  recordedWorkingHours: number;
  approvedOvertimeHours: number;
  lateArrivals: number;
  missingCheckOuts: number;
}

export interface ReportTrendPoint {
  label: string;
  attendancePercent: number | null;
}

export interface ReportStatusSlice {
  label: string;
  value: number;
}

export interface AttendanceReport {
  companyName: string;
  reportType: "Monthly" | "Yearly" | "Custom Date Range";
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  generatedBy: string;
  dataSource: string;
  appliedFilters: string;
  policyNote: string;
  rules: AttendanceReportRules;
  employees: ReportEmployeeSummary[];
  dailyLogs: ReportDailyLog[];
  monthlyBreakdown: ReportMonthlyBreakdown[];
  locationRows: ReportLocationRow[];
  dashboard: ReportDashboardMetrics;
  statusDistribution: ReportStatusSlice[];
  trend: ReportTrendPoint[];
  trendGranularity: "daily" | "monthly";
}

interface ReportDay {
  key: string;
  date: Date;
  weekday: number;
  isHoliday: boolean;
  holidayName?: string;
  isWeeklyOff: boolean;
  isWorking: boolean;
}

interface Agg {
  scheduled: number;
  present: number;
  absent: number;
  half: number;
  paidLeave: number;
  unpaidLeave: number;
  otherLeave: number;
  leaveDays: number;
  compOff: number;
  weeklyOffs: number;
  holidays: number;
  lateArrivals: number;
  lateMinutes: number;
  missingCheckOuts: number;
  regularMinutes: number;
  approvedOtMinutes: number;
  credit: number;
}

interface LeaveDayInfo {
  paid: boolean;
  days: number;
  typeNames: string[];
  reason: string;
}

interface CheckInLite {
  employeeId: string;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
}

interface RecordLite {
  employeeId: string;
  date: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  totalMinutes: number | null;
  overtimeMinutes: number | null;
  status: string;
  source: string | null;
  notes: string | null;
  manualOverride: boolean;
  overrideReason: string | null;
  displayAsSelfPunch: boolean;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function emptyAgg(): Agg {
  return {
    scheduled: 0,
    present: 0,
    absent: 0,
    half: 0,
    paidLeave: 0,
    unpaidLeave: 0,
    otherLeave: 0,
    leaveDays: 0,
    compOff: 0,
    weeklyOffs: 0,
    holidays: 0,
    lateArrivals: 0,
    lateMinutes: 0,
    missingCheckOuts: 0,
    regularMinutes: 0,
    approvedOtMinutes: 0,
    credit: 0,
  };
}

function parseDateKey(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new AttendanceReportError("Dates must use the YYYY-MM-DD format.", 400, "INVALID_DATE");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AttendanceReportError(`"${value}" is not a valid calendar date.`, 400, "INVALID_DATE");
  }
  return date;
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function monthKeyOf(dateKeyValue: string): string {
  return dateKeyValue.slice(0, 7);
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[month - 1] ?? monthKey} ${year}`;
}

function monthKeysBetween(start: Date, end: Date): string[] {
  const keys: string[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${pad(month)}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

function indiaDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function formatIndiaTime(value: Date | null | undefined): string {
  if (!value) return "Not Available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not Available";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: REPORT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatIndiaDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: REPORT_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

function indiaMinutes(value: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return read("hour") * 60 + read("minute");
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function hoursFromMinutes(minutes: number): number {
  return round(Math.max(0, minutes) / 60, 2);
}

function percentage(credit: number, scheduled: number): number {
  if (!scheduled) return 0;
  return round((credit / scheduled) * 100, 1);
}

function computeLateMinutes(checkInTime: Date | null, shiftStart: string): number {
  if (!checkInTime) return 0;
  const [shiftHour, shiftMinute] = shiftStart.split(":").map(Number);
  const shiftMinutes = (Number.isFinite(shiftHour) ? shiftHour : 0) * 60 + (Number.isFinite(shiftMinute) ? shiftMinute : 0);
  let diff = indiaMinutes(new Date(checkInTime)) - shiftMinutes;
  if (diff < -12 * 60) diff += 24 * 60;
  return diff > 0 ? Math.round(diff) : 0;
}

function recordMinutes(record: RecordLite): number {
  if (record.totalMinutes !== null && record.totalMinutes !== undefined) {
    return Math.max(0, record.totalMinutes);
  }
  if (record.checkInTime && record.checkOutTime) {
    return Math.max(0, Math.round((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / 60000));
  }
  return 0;
}

function derivePeriod(start: Date, end: Date): {
  reportType: AttendanceReport["reportType"];
  periodLabel: string;
  key: string;
} {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const lastDayOfMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();

  if (sameMonth && start.getUTCDate() === 1 && end.getUTCDate() === lastDayOfMonth) {
    return {
      reportType: "Monthly",
      periodLabel: monthLabel(`${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`),
      key: `${start.getUTCFullYear()}_${pad(start.getUTCMonth() + 1)}`,
    };
  }

  if (
    sameYear &&
    start.getUTCMonth() === 0 &&
    start.getUTCDate() === 1 &&
    end.getUTCMonth() === 11 &&
    end.getUTCDate() === 31
  ) {
    return {
      reportType: "Yearly",
      periodLabel: String(start.getUTCFullYear()),
      key: String(start.getUTCFullYear()),
    };
  }

  return {
    reportType: "Custom Date Range",
    periodLabel: `${dateKey(start)} to ${dateKey(end)}`,
    key: `${dateKey(start)}_${dateKey(end)}`,
  };
}

export function parseAttendanceReportFilters(query: Record<string, unknown>): AttendanceReportFilters {
  const startDate = String(query.startDate ?? "").trim();
  const endDate = String(query.endDate ?? "").trim();
  if (!startDate || !endDate) {
    throw new AttendanceReportError(
      "Both startDate and endDate are required (YYYY-MM-DD).",
      400,
      "MISSING_DATE_RANGE",
    );
  }

  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (end.getTime() < start.getTime()) {
    throw new AttendanceReportError("The end date must be on or after the start date.", 400, "INVALID_DATE_RANGE");
  }
  const rangeDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw new AttendanceReportError(
      `The selected range is too large. Please choose ${MAX_RANGE_DAYS} days or fewer.`,
      400,
      "DATE_RANGE_TOO_LARGE",
    );
  }

  const rawStatus = String(query.status ?? "ACTIVE").trim().toUpperCase();
  const status: ReportEmploymentStatus =
    rawStatus === "INACTIVE" ? "INACTIVE" : rawStatus === "ALL" ? "ALL" : "ACTIVE";
  if (!["ACTIVE", "INACTIVE", "ALL"].includes(rawStatus)) {
    throw new AttendanceReportError(
      'Employment status must be one of "ACTIVE", "INACTIVE" or "ALL".',
      400,
      "INVALID_STATUS_FILTER",
    );
  }

  const employeeIdsRaw = query.employeeIds;
  const employeeIds = employeeIdsRaw
    ? String(employeeIdsRaw)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  const designation = String(query.designation ?? "").trim() || undefined;
  const departmentId = String(query.departmentId ?? "").trim() || undefined;
  const departmentName = String(query.department ?? "").trim() || undefined;
  const zone = String(query.zone ?? "").trim() || undefined;

  return {
    startDate: dateKey(start),
    endDate: dateKey(end),
    employeeIds,
    designation,
    departmentId,
    departmentName,
    zone,
    status,
  };
}

function buildEmployeeWhere(filters: AttendanceReportFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    role: { in: STAFF_ROLES },
  };

  if (filters.status === "ACTIVE") where.isActive = true;
  else if (filters.status === "INACTIVE") where.isActive = false;

  if (filters.employeeIds?.length) {
    where.id = { in: filters.employeeIds };
  }

  const profileFilter: Prisma.EmployeeProfileWhereInput = {};
  if (filters.designation) profileFilter.jobRole = filters.designation;
  if (filters.zone) profileFilter.zone = filters.zone;
  if (Object.keys(profileFilter).length > 0) {
    where.employeeProfile = { is: profileFilter };
  }

  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  } else if (filters.departmentName) {
    where.department = { is: { name: filters.departmentName } };
  }

  return where;
}

function buildReportDays(
  start: Date,
  endExclusive: Date,
  holidays: Map<string, string>,
  weeklyOffDays: number[],
  cutoffKey: string,
): ReportDay[] {
  const days: ReportDay[] = [];
  for (let cursor = new Date(start); cursor.getTime() < endExclusive.getTime(); cursor = addDays(cursor, 1)) {
    const key = dateKey(cursor);
    if (key > cutoffKey) break;
    const holidayName = holidays.get(key);
    const weekday = cursor.getUTCDay();
    const isHoliday = Boolean(holidayName);
    const isWeeklyOff = !isHoliday && weeklyOffDays.includes(weekday);
    days.push({
      key,
      date: new Date(cursor),
      weekday,
      isHoliday,
      holidayName,
      isWeeklyOff,
      isWorking: !isHoliday && !isWeeklyOff,
    });
  }
  return days;
}

function pickCheckIn(
  record: RecordLite,
  recordKey: string,
  checkIns: CheckInLite[] | undefined,
): CheckInLite | null {
  if (!checkIns || checkIns.length === 0) return null;

  if (record.checkInTime) {
    const target = new Date(record.checkInTime).getTime();
    let best: CheckInLite | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const candidate of checkIns) {
      const diff = Math.abs(new Date(candidate.createdAt).getTime() - target);
      if (diff < bestDiff) {
        best = candidate;
        bestDiff = diff;
      }
    }
    if (best && bestDiff <= 8 * 60 * 60 * 1000) return best;
  }

  return checkIns.find((candidate) => dateKey(new Date(candidate.createdAt)) === recordKey) ?? null;
}

function isEmployeeGeneratedRecord(record: RecordLite): boolean {
  return (
    !record.manualOverride &&
    !record.displayAsSelfPunch &&
    (!record.source || record.source === "EMPLOYEE_CHECK_IN")
  );
}

function applyDay(
  agg: Agg,
  params: {
    day: ReportDay;
    status: string;
    record: RecordLite | null;
    leave: LeaveDayInfo | null;
    lateMinutes: number;
    approvedOvertimeMinutes: number;
  },
): void {
  const { day, status, record, leave, lateMinutes, approvedOvertimeMinutes } = params;

  if (day.isHoliday) agg.holidays += 1;
  else if (day.isWeeklyOff) agg.weeklyOffs += 1;

  if (record && record.checkInTime && !record.checkOutTime) {
    agg.missingCheckOuts += 1;
  }
  agg.approvedOtMinutes += Math.max(0, approvedOvertimeMinutes);

  if (!day.isWorking) return;

  agg.scheduled += 1;

  if (
    (status === "LATE" || status === "PRESENT" || status === "HALF_DAY") &&
    lateMinutes > 0
  ) {
    agg.lateArrivals += 1;
    agg.lateMinutes += lateMinutes;
  }

  switch (status) {
    case "PRESENT":
    case "LATE":
      agg.present += 1;
      agg.credit += 1;
      break;
    case "HALF_DAY":
      agg.half += 1;
      agg.credit += 0.5;
      break;
    case "COMP_OFF":
      agg.compOff += 1;
      agg.credit += 1;
      break;
    case "ABSENT":
      agg.absent += 1;
      break;
    default:
      break;
  }

  if (leave) {
    if (leave.paid) agg.paidLeave += leave.days;
    else agg.unpaidLeave += leave.days;
    agg.leaveDays += leave.days;
  } else if (status === "LEAVE") {
    agg.otherLeave += 1;
    agg.leaveDays += 1;
  }

  if (record) {
    agg.regularMinutes += recordMinutes(record);
  }
}

function buildAppliedFiltersLabel(
  filters: AttendanceReportFilters,
  employeeNames: string[],
  departmentName?: string,
): string {
  const parts: string[] = [];
  if (filters.employeeIds?.length) {
    const names = employeeNames.slice(0, 8).join(", ");
    const suffix = employeeNames.length > 8 ? ` +${employeeNames.length - 8} more` : "";
    parts.push(`Employees: ${names}${suffix}`);
  } else {
    parts.push("Employees: All matching employees");
  }
  parts.push(
    `Employment status: ${
      filters.status === "ACTIVE" ? "Active only" : filters.status === "INACTIVE" ? "Inactive only" : "All"
    }`,
  );
  if (filters.designation) parts.push(`Designation: ${filters.designation}`);
  if (departmentName) parts.push(`Department: ${departmentName}`);
  if (filters.zone) parts.push(`Zone: ${filters.zone}`);
  return parts.join(" | ");
}

export async function buildAttendanceReport(
  filters: AttendanceReportFilters,
  context: { generatedBy: string; generatedAt?: Date },
): Promise<AttendanceReport> {
  const start = parseDateKey(filters.startDate);
  const endInclusive = parseDateKey(filters.endDate);
  const endExclusive = addDays(endInclusive, 1);
  const generatedAt = context.generatedAt ?? new Date();

  const [rules, employees] = await Promise.all([
    AttendanceService.getRulesAsync(),
    prisma.user.findMany({
      where: buildEmployeeWhere(filters),
      select: {
        id: true,
        employeeCode: true,
        loginId: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        employeeProfile: {
          select: { jobRole: true, zone: true, createdAt: true },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (employees.length === 0) {
    throw new AttendanceReportError(
      "No employees match the selected filters. Adjust the employee, designation, department, zone or status filters and try again.",
      404,
      "NO_EMPLOYEES",
    );
  }

  const employeeIds = employees.map((employee) => employee.id);

  const [records, checkIns, holidayRows, leaveRows, overtimeRows] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: start, lt: endExclusive },
      },
      select: {
        employeeId: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        totalMinutes: true,
        overtimeMinutes: true,
        status: true,
        source: true,
        notes: true,
        manualOverride: true,
        overrideReason: true,
        displayAsSelfPunch: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.checkIn.findMany({
      where: {
        employeeId: { in: employeeIds },
        createdAt: { gte: start, lt: endExclusive },
      },
      select: {
        employeeId: true,
        createdAt: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: start, lt: endExclusive } },
      select: { date: true, name: true },
      orderBy: { date: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: "APPROVED",
        startDate: { lt: endExclusive },
        endDate: { gte: start },
      },
      select: {
        id: true,
        employeeId: true,
        startDate: true,
        endDate: true,
        isHalfDay: true,
        reason: true,
        leaveType: { select: { name: true, isPaid: true } },
      },
    }),
    prisma.overtimeRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: "APPROVED",
        date: { gte: start, lt: endExclusive },
      },
      select: {
        employeeId: true,
        date: true,
        approvedMinutes: true,
        durationMinutes: true,
        startTime: true,
        expectedEndTime: true,
        actualEndTime: true,
      },
    }),
  ]);

  if (records.length === 0 && leaveRows.length === 0 && overtimeRows.length === 0) {
    throw new AttendanceReportError(
      "No attendance records were found for the selected period and filters. Try a different period or employee selection.",
      404,
      "NO_ATTENDANCE_DATA",
    );
  }

  const holidayByKey = new Map<string, string>();
  for (const holiday of holidayRows) {
    holidayByKey.set(dateKey(new Date(holiday.date)), holiday.name);
  }

  const weeklyOffDays =
    Array.isArray(rules.weeklyOffDays) && rules.weeklyOffDays.length > 0
      ? rules.weeklyOffDays.map(Number)
      : [0];
  const shiftStart = rules.shiftStart || "09:15";
  const shiftEnd = rules.shiftEnd || "18:30";
  const dailyWorkingHours = Number(rules.dailyWorkingHours ?? 9) || 9;

  const cutoffKey = indiaDateKey(generatedAt);
  const days = buildReportDays(start, endExclusive, holidayByKey, weeklyOffDays, cutoffKey);
  const monthKeys = monthKeysBetween(start, endInclusive);
  const singleMonth = monthKeys.length === 1;

  const recordsByEmployee = new Map<string, Map<string, RecordLite>>();
  for (const record of records) {
    const employeeRecords = recordsByEmployee.get(record.employeeId) ?? new Map<string, RecordLite>();
    employeeRecords.set(dateKey(new Date(record.date)), record as RecordLite);
    recordsByEmployee.set(record.employeeId, employeeRecords);
  }

  const checkInsByEmployee = new Map<string, CheckInLite[]>();
  for (const checkIn of checkIns) {
    const list = checkInsByEmployee.get(checkIn.employeeId) ?? [];
    list.push(checkIn as CheckInLite);
    checkInsByEmployee.set(checkIn.employeeId, list);
  }

  const leaveByEmployeeDay = new Map<string, LeaveDayInfo>();
  for (const leave of leaveRows) {
    const leaveStart = dateKey(new Date(leave.startDate));
    const leaveEnd = dateKey(new Date(leave.endDate));
    const from = leaveStart < filters.startDate ? filters.startDate : leaveStart;
    const to = leaveEnd > filters.endDate ? filters.endDate : leaveEnd;
    if (from > to) continue;

    let cursor = parseDateKey(from);
    const endCursor = parseDateKey(to);
    while (cursor.getTime() <= endCursor.getTime()) {
      const key = `${leave.employeeId}|${dateKey(cursor)}`;
      const dayShare = leave.isHalfDay ? 0.5 : 1;
      const existing = leaveByEmployeeDay.get(key);
      if (existing) {
        existing.paid = existing.paid || Boolean(leave.leaveType?.isPaid);
        existing.days = Math.min(1, existing.days + dayShare);
        if (leave.leaveType?.name && !existing.typeNames.includes(leave.leaveType.name)) {
          existing.typeNames.push(leave.leaveType.name);
        }
        if (!existing.reason && leave.reason) existing.reason = leave.reason;
      } else {
        leaveByEmployeeDay.set(key, {
          paid: Boolean(leave.leaveType?.isPaid),
          days: dayShare,
          typeNames: leave.leaveType?.name ? [leave.leaveType.name] : [],
          reason: leave.reason || "",
        });
      }
      cursor = addDays(cursor, 1);
    }
  }

  const overtimeByEmployeeDay = new Map<string, number>();
  for (const overtime of overtimeRows) {
    const key = `${overtime.employeeId}|${dateKey(new Date(overtime.date))}`;
    let minutes = overtime.approvedMinutes ?? overtime.durationMinutes ?? 0;
    if (!minutes) {
      const startTime = overtime.startTime ? new Date(overtime.startTime) : null;
      const endTime = overtime.actualEndTime
        ? new Date(overtime.actualEndTime)
        : overtime.expectedEndTime
          ? new Date(overtime.expectedEndTime)
          : null;
      if (startTime && endTime) {
        minutes = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
      }
    }
    overtimeByEmployeeDay.set(key, (overtimeByEmployeeDay.get(key) ?? 0) + Math.max(0, minutes));
  }

  const period = derivePeriod(start, endInclusive);
  const employeesSummary: ReportEmployeeSummary[] = [];
  const dailyLogs: ReportDailyLog[] = [];
  const monthlyBreakdown: ReportMonthlyBreakdown[] = [];
  const locationRows: ReportLocationRow[] = [];
  const dashboardAccumulator = emptyAgg();
  const trendByMonth = new Map<string, { scheduled: number; credit: number }>();
  const trendByDay = new Map<string, { scheduled: number; credit: number }>();
  let distinctWeeklyOffs = 0;
  let distinctHolidays = 0;
  for (const day of days) {
    if (day.isHoliday) distinctHolidays += 1;
    else if (day.isWeeklyOff) distinctWeeklyOffs += 1;
  }

  for (const employee of employees) {
    const employeeRecords = recordsByEmployee.get(employee.id) ?? new Map<string, RecordLite>();
    const employeeCheckIns = checkInsByEmployee.get(employee.id);
    const employeeLeaveKeys = [...leaveByEmployeeDay.keys()]
      .filter((key) => key.startsWith(`${employee.id}|`))
      .map((key) => key.split("|")[1]);
    const employeeOvertimeKeys = [...overtimeByEmployeeDay.keys()]
      .filter((key) => key.startsWith(`${employee.id}|`))
      .map((key) => key.split("|")[1]);

    const joinedAt = employee.employeeProfile?.createdAt ?? employee.createdAt;
    const joinKey = dateKey(new Date(joinedAt));
    const activityKeys = [
      ...employeeRecords.keys(),
      ...employeeLeaveKeys,
      ...employeeOvertimeKeys,
    ].sort();
    let effectiveStartKey = activityKeys.length > 0 && activityKeys[0] < joinKey ? activityKeys[0] : joinKey;
    if (effectiveStartKey < filters.startDate) effectiveStartKey = filters.startDate;
    if (effectiveStartKey > filters.endDate) continue;

    const employeeAgg = emptyAgg();
    const monthAggs = new Map<string, Agg>();
    let firstScheduledKey: string | null = null;

    for (const day of days) {
      if (day.key < effectiveStartKey) continue;
      if (day.isWorking && !firstScheduledKey) firstScheduledKey = day.key;

      const record = employeeRecords.get(day.key) ?? null;
      const leave = leaveByEmployeeDay.get(`${employee.id}|${day.key}`) ?? null;
      const approvedOvertimeMinutes = overtimeByEmployeeDay.get(`${employee.id}|${day.key}`) ?? 0;

      let status: string;
      if (day.isHoliday) status = "HOLIDAY";
      else if (day.isWeeklyOff) status = "WEEKLY_OFF";
      else if (leave) status = "LEAVE";
      else if (record) status = record.status;
      else status = "ABSENT";

      if (record && day.isWorking) {
        status = record.status;
        if (leave && (record.status === "ABSENT" || record.status === "LEAVE")) status = "LEAVE";
      } else if (!record && leave && day.isWorking) {
        status = "LEAVE";
      }

      const lateMinutes = day.isWorking ? computeLateMinutes(record?.checkInTime ?? null, shiftStart) : 0;
      const checkIn = record && isEmployeeGeneratedRecord(record) ? pickCheckIn(record, day.key, employeeCheckIns) : null;

      applyDay(employeeAgg, {
        day,
        status,
        record,
        leave,
        lateMinutes,
        approvedOvertimeMinutes,
      });

      const monthKey = monthKeyOf(day.key);
      const monthAgg = monthAggs.get(monthKey) ?? emptyAgg();
      applyDay(monthAgg, {
        day,
        status,
        record,
        leave,
        lateMinutes,
        approvedOvertimeMinutes,
      });
      monthAggs.set(monthKey, monthAgg);

      const monthTrend = trendByMonth.get(monthKey) ?? { scheduled: 0, credit: 0 };
      if (day.isWorking) {
        monthTrend.scheduled += 1;
        monthTrend.credit += status === "PRESENT" || status === "LATE" ? 1 : status === "HALF_DAY" ? 0.5 : status === "COMP_OFF" ? 1 : 0;
      }
      trendByMonth.set(monthKey, monthTrend);

      const dayTrend = trendByDay.get(day.key) ?? { scheduled: 0, credit: 0 };
      if (day.isWorking) {
        dayTrend.scheduled += 1;
        dayTrend.credit += status === "PRESENT" || status === "LATE" ? 1 : status === "HALF_DAY" ? 0.5 : status === "COMP_OFF" ? 1 : 0;
      }
      trendByDay.set(day.key, dayTrend);

      const hasGps =
        checkIn &&
        checkIn.latitude !== null &&
        checkIn.latitude !== undefined &&
        checkIn.longitude !== null &&
        checkIn.longitude !== undefined;
      const latitude = hasGps ? Number(checkIn!.latitude) : null;
      const longitude = hasGps ? Number(checkIn!.longitude) : null;
      const mapUrl =
        latitude !== null && longitude !== null
          ? `https://www.google.com/maps?q=${latitude},${longitude}`
          : null;
      const actualSource = record
        ? record.source || (record.manualOverride ? "ADMIN_ASSIGNED" : "EMPLOYEE_CHECK_IN")
        : (day.isHoliday || day.isWeeklyOff ? "Not Applicable" : status === "LEAVE" ? "Approved Leave" : "No Record");
      const scheduledShift = day.isWorking
        ? `${shiftStart} - ${shiftEnd}`
        : day.isHoliday
          ? "Company Holiday"
          : "Weekly Off";
      const remarksParts: string[] = [];
      if (record?.notes) remarksParts.push(record.notes);
      if (record?.overrideReason) remarksParts.push(record.overrideReason);
      if (leave?.reason) remarksParts.push(`Approved leave: ${leave.reason}`);
      if (day.holidayName) remarksParts.push(`Holiday: ${day.holidayName}`);

      dailyLogs.push({
        employeeId: employee.id,
        employeeCode: employee.employeeCode || employee.loginId || employee.id,
        employeeName: employee.fullName,
        designation: employee.employeeProfile?.jobRole || employee.role,
        department: employee.department?.name || "Not Assigned",
        date: day.date,
        dateKey: day.key,
        dayOfWeek: WEEKDAY_NAMES[day.weekday],
        scheduledShift,
        checkInTime: formatIndiaTime(record?.checkInTime),
        checkOutTime: formatIndiaTime(record?.checkOutTime),
        actualWorkingHours: record ? hoursFromMinutes(recordMinutes(record)) : 0,
        expectedWorkingHours: day.isWorking ? round(dailyWorkingHours, 2) : 0,
        status,
        lateArrivalMinutes: lateMinutes,
        overtimeHours: hoursFromMinutes(record?.overtimeMinutes ?? 0),
        approvedOvertimeHours: hoursFromMinutes(approvedOvertimeMinutes),
        source: actualSource,
        remarks: remarksParts.join(" | "),
        location:
          latitude !== null && longitude !== null
            ? `GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
            : "Not Available",
        latitude,
        longitude,
        mapUrl,
        missingCheckOut: Boolean(record?.checkInTime && !record?.checkOutTime),
      });

      if (hasGps && latitude !== null && longitude !== null) {
        locationRows.push({
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode || employee.loginId || employee.id,
          date: day.date,
          dateKey: day.key,
          checkInLocation: `GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
          checkOutLocation: "Not Available",
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkOutLatitude: null,
          checkOutLongitude: null,
          mapUrl: mapUrl as string,
          attendanceSource: actualSource,
          locationAvailability: "GPS captured at check-in",
        });
      }
    }

    if (employeeAgg.scheduled === 0 && employeeRecords.size === 0 && employeeLeaveKeys.length === 0) {
      // Employee was not scheduled or active during the selected period (for example, joined later).
      if (!firstScheduledKey) continue;
    }

    const attendancePercent = percentage(employeeAgg.credit, employeeAgg.scheduled);
    const employeeCode = employee.employeeCode || employee.loginId || employee.id;
    const designation = employee.employeeProfile?.jobRole || employee.role;
    const department = employee.department?.name || "Not Assigned";
    const zone = employee.employeeProfile?.zone || "Not Assigned";

    employeesSummary.push({
      employeeId: employee.id,
      employeeCode,
      employeeName: employee.fullName,
      designation,
      department,
      zone,
      reportingPeriod: period.periodLabel,
      scheduledWorkingDays: employeeAgg.scheduled,
      presentDays: employeeAgg.present,
      absentDays: employeeAgg.absent,
      halfDays: employeeAgg.half,
      paidLeaveDays: round(employeeAgg.paidLeave, 1),
      unpaidLeaveDays: round(employeeAgg.unpaidLeave, 1),
      leaveDays: round(employeeAgg.leaveDays, 1),
      weeklyOffs: employeeAgg.weeklyOffs,
      companyHolidays: employeeAgg.holidays,
      expectedWorkingHours: round(employeeAgg.scheduled * dailyWorkingHours, 2),
      regularWorkingHours: hoursFromMinutes(employeeAgg.regularMinutes),
      approvedOvertimeHours: hoursFromMinutes(employeeAgg.approvedOtMinutes),
      lateArrivals: employeeAgg.lateArrivals,
      lateArrivalMinutes: employeeAgg.lateMinutes,
      missingCheckOuts: employeeAgg.missingCheckOuts,
      attendancePercent,
      creditDays: round(employeeAgg.credit, 2),
    });

    for (const monthKey of monthKeys) {
      const monthAgg = monthAggs.get(monthKey) ?? emptyAgg();
      monthlyBreakdown.push({
        monthKey,
        monthLabel: monthLabel(monthKey),
        employeeId: employee.id,
        employeeCode,
        employeeName: employee.fullName,
        presentDays: monthAgg.present,
        absentDays: monthAgg.absent,
        halfDays: monthAgg.half,
        leaveDays: round(monthAgg.leaveDays, 1),
        attendancePercent: monthAgg.scheduled > 0 ? percentage(monthAgg.credit, monthAgg.scheduled) : null,
        regularWorkingHours: hoursFromMinutes(monthAgg.regularMinutes),
        approvedOvertimeHours: hoursFromMinutes(monthAgg.approvedOtMinutes),
      });
    }

    dashboardAccumulator.scheduled += employeeAgg.scheduled;
    dashboardAccumulator.present += employeeAgg.present;
    dashboardAccumulator.absent += employeeAgg.absent;
    dashboardAccumulator.half += employeeAgg.half;
    dashboardAccumulator.paidLeave += employeeAgg.paidLeave;
    dashboardAccumulator.unpaidLeave += employeeAgg.unpaidLeave;
    dashboardAccumulator.leaveDays += employeeAgg.leaveDays;
    dashboardAccumulator.lateArrivals += employeeAgg.lateArrivals;
    dashboardAccumulator.lateMinutes += employeeAgg.lateMinutes;
    dashboardAccumulator.missingCheckOuts += employeeAgg.missingCheckOuts;
    dashboardAccumulator.regularMinutes += employeeAgg.regularMinutes;
    dashboardAccumulator.approvedOtMinutes += employeeAgg.approvedOtMinutes;
    dashboardAccumulator.credit += employeeAgg.credit;
  }

  if (employeesSummary.length === 0) {
    throw new AttendanceReportError(
      "No employees were employed during the selected period. Try a different period or employee selection.",
      404,
      "NO_EMPLOYEES_IN_PERIOD",
    );
  }

  const dashboard: ReportDashboardMetrics = {
    totalEmployees: employeesSummary.length,
    scheduledWorkingDays: dashboardAccumulator.scheduled,
    presentDays: dashboardAccumulator.present,
    absentDays: dashboardAccumulator.absent,
    halfDays: dashboardAccumulator.half,
    paidLeaveDays: round(dashboardAccumulator.paidLeave, 1),
    unpaidLeaveDays: round(dashboardAccumulator.unpaidLeave, 1),
    weeklyOffs: distinctWeeklyOffs,
    companyHolidays: distinctHolidays,
    averageAttendancePercent: percentage(dashboardAccumulator.credit, dashboardAccumulator.scheduled),
    recordedWorkingHours: hoursFromMinutes(dashboardAccumulator.regularMinutes),
    approvedOvertimeHours: hoursFromMinutes(dashboardAccumulator.approvedOtMinutes),
    lateArrivals: dashboardAccumulator.lateArrivals,
    missingCheckOuts: dashboardAccumulator.missingCheckOuts,
  };

  const trend: ReportTrendPoint[] = singleMonth
    ? days
        .filter((day) => day.isWorking || trendByDay.has(day.key))
        .map((day) => {
          const entry = trendByDay.get(day.key);
          const label = `${pad(day.date.getUTCDate())} ${WEEKDAY_NAMES[day.weekday].slice(0, 3)}`;
          return {
            label,
            attendancePercent:
              entry && entry.scheduled > 0 ? percentage(entry.credit, entry.scheduled) : null,
          };
        })
    : monthKeys.map((key) => {
        const entry = trendByMonth.get(key);
        return {
          label: monthLabel(key),
          attendancePercent:
            entry && entry.scheduled > 0 ? percentage(entry.credit, entry.scheduled) : null,
        };
      });

  const statusDistribution: ReportStatusSlice[] = [
    { label: "Present", value: dashboard.presentDays },
    { label: "Absent", value: dashboard.absentDays },
    { label: "Half Day", value: dashboard.halfDays },
    { label: "Paid Leave", value: dashboard.paidLeaveDays },
    { label: "Unpaid Leave", value: dashboard.unpaidLeaveDays },
  ];

  dailyLogs.sort((a, b) => {
    const nameCompare = a.employeeName.localeCompare(b.employeeName);
    return nameCompare !== 0 ? nameCompare : a.dateKey.localeCompare(b.dateKey);
  });
  monthlyBreakdown.sort((a, b) => {
    const monthCompare = a.monthKey.localeCompare(b.monthKey);
    return monthCompare !== 0 ? monthCompare : a.employeeName.localeCompare(b.employeeName);
  });
  locationRows.sort((a, b) => {
    const nameCompare = a.employeeName.localeCompare(b.employeeName);
    return nameCompare !== 0 ? nameCompare : a.dateKey.localeCompare(b.dateKey);
  });

  const departmentName =
    filters.departmentId || filters.departmentName
      ? employeesSummary[0]?.department
      : undefined;

  const policyNote = [
    `Attendance % = (Present days + 0.5 x Half days + Comp-off days) / Scheduled working days x 100.`,
    `Scheduled working days exclude weekly offs (${weeklyOffDays.map((day) => WEEKDAY_NAMES[day] ?? day).join(", ")}) and company holidays, and are prorated from each employee's join date.`,
    `Approved paid/unpaid leave is reported separately and is not counted as attendance credit, matching the Attendance Tracking dashboard.`,
    `Approved overtime is reported separately and is never used to offset an attendance deficit.`,
    `Working hours use recorded check-in/check-out times. GPS and map links are included only when coordinates were actually captured.`,
    `All dates and times are reported in ${REPORT_TIMEZONE} (IST).`,
  ].join(" ");

  return {
    companyName: REPORT_COMPANY_NAME,
    reportType: period.reportType,
    periodLabel: period.periodLabel,
    startDate: start,
    endDate: endInclusive,
    generatedAt,
    generatedBy: context.generatedBy,
    dataSource:
      "Swayog Dashboard - AttendanceRecord, CheckIn (GPS), LeaveRequest (approved), OvertimeRequest (approved), Holiday calendar and AttendanceRule",
    appliedFilters: buildAppliedFiltersLabel(
      filters,
      employeesSummary.map((employee) => employee.employeeName),
      departmentName,
    ),
    policyNote,
    rules: {
      shiftStart,
      shiftEnd,
      dailyWorkingHours: round(dailyWorkingHours, 2),
      weeklyOffDays,
      timezone: REPORT_TIMEZONE,
    },
    employees: employeesSummary,
    dailyLogs,
    monthlyBreakdown,
    locationRows,
    dashboard,
    statusDistribution,
    trend,
    trendGranularity: singleMonth ? "daily" : "monthly",
  };
}

export function buildReportFilename(report: AttendanceReport): string {
  if (report.reportType === "Monthly") {
    const year = report.startDate.getUTCFullYear();
    const month = pad(report.startDate.getUTCMonth() + 1);
    return `Swayog_Attendance_Report_${year}_${month}.xlsx`;
  }
  if (report.reportType === "Yearly") {
    return `Swayog_Attendance_Report_${report.startDate.getUTCFullYear()}.xlsx`;
  }
  return `Swayog_Attendance_Report_${dateKey(report.startDate)}_${dateKey(report.endDate)}.xlsx`;
}

export async function getAttendanceReportOptions(): Promise<{
  employees: Array<{
    id: string;
    employeeCode: string;
    fullName: string;
    designation: string;
    departmentId: string | null;
    department: string;
    zone: string;
    role: string;
    status: "active" | "inactive";
  }>;
  designations: string[];
  departments: Array<{ id: string; name: string }>;
  zones: string[];
  years: number[];
  today: string;
  month: number;
}> {
  const employees = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: {
      id: true,
      employeeCode: true,
      loginId: true,
      fullName: true,
      role: true,
      isActive: true,
      employeeProfile: { select: { jobRole: true, zone: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const designations = new Set<string>();
  const departments = new Map<string, string>();
  const zones = new Set<string>();

  const normalized = employees.map((employee) => {
    const designation = employee.employeeProfile?.jobRole || employee.role;
    const department = employee.department?.name || "Not Assigned";
    const zone = employee.employeeProfile?.zone || "Not Assigned";
    designations.add(designation);
    if (employee.department) departments.set(employee.department.id, employee.department.name);
    zones.add(zone);
    return {
      id: employee.id,
      employeeCode: employee.employeeCode || employee.loginId || employee.id,
      fullName: employee.fullName,
      designation,
      departmentId: employee.department?.id ?? null,
      department,
      zone,
      role: employee.role,
      status: employee.isActive ? ("active" as const) : ("inactive" as const),
    };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, index) => currentYear - 4 + index);
  const nowParts = indiaDateKey().split("-").map(Number);

  return {
    employees: normalized,
    designations: [...designations].sort((a, b) => a.localeCompare(b)),
    departments: [...departments.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    zones: [...zones].sort((a, b) => a.localeCompare(b)),
    years,
    today: indiaDateKey(),
    month: nowParts[1] ?? 1,
  };
}
