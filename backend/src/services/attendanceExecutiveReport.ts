import ExcelJS from "exceljs";
import { addCharts } from "chartsheet";
import type { ChartSpec } from "chartsheet";
import { prisma } from "../lib/prisma.js";
import * as AttendanceService from "./attendanceService.js";
import {
  buildAttendanceReport,
  REPORT_COMPANY_NAME,
  REPORT_TIMEZONE,
  type AttendanceReport,
  type AttendanceReportFilters,
} from "./attendanceReportService.js";

const COLORS = {
  navyDark: "FF0F172A",
  navy: "FF1E3A8A",
  blue: "FF2563EB",
  blueLight: "FFDBEAFE",
  skyLight: "FFE0F2FE",
  slate: "FF334155",
  slateLight: "FFF8FAFC",
  zebra: "FFF1F5F9",
  border: "FFCBD5E1",
  white: "FFFFFFFF",
  green: "FF15803D",
  greenFill: "FFDCFCE7",
  amber: "FFB45309",
  amberFill: "FFFEF3C7",
  orange: "FFC2410C",
  orangeFill: "FFFFEDD5",
  red: "FFB91C1C",
  redFill: "FFFEE2E2",
  blueText: "FF1D4ED8",
  gray: "FF475569",
  grayFill: "FFE2E8F0",
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

const DATE_FMT = "DD-MMM-YYYY";
const PCT_FMT = "0.0%";
const HRS_FMT = "0.00";
const INT_FMT = "#,##0";

function sanitizeText(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function toIndiaDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function toIndiaTimeStr(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function toIndiaDateTimeStr(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: REPORT_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function colLetter(n: number): string {
  let s = "";
  let v = n;
  while (v > 0) {
    const r = (v - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    v = Math.floor((v - 1) / 26);
  }
  return s;
}

function styleBanner(
  ws: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  colCount: number
): void {
  const lastCol = colLetter(Math.max(colCount, 6));
  ws.mergeCells(`A1:${lastCol}1`);
  const r1 = ws.getRow(1);
  r1.getCell(1).value = `${REPORT_COMPANY_NAME} — ${title}`;
  r1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navyDark } };
  r1.getCell(1).font = { name: "Calibri", size: 13, bold: true, color: { argb: COLORS.white } };
  r1.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  r1.height = 28;

  ws.mergeCells(`A2:${lastCol}2`);
  const r2 = ws.getRow(2);
  r2.getCell(1).value = sanitizeText(subtitle);
  r2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.slateLight } };
  r2.getCell(1).font = { name: "Calibri", size: 9, italic: true, color: { argb: COLORS.slate } };
  r2.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  r2.height = 20;
}

function styleTableHeader(row: ExcelJS.Row, headers: string[]): void {
  headers.forEach((h, idx) => {
    const c = row.getCell(idx + 1);
    c.value = h;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
    c.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.white } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = THIN_BORDER;
  });
  row.height = 28;
}

function styleDataRow(row: ExcelJS.Row, colCount: number, isEven: boolean): void {
  for (let i = 1; i <= colCount; i++) {
    const c = row.getCell(i);
    if (isEven) {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.zebra } };
    }
    c.border = THIN_BORDER;
    if (!c.font) c.font = { name: "Calibri", size: 9.5, color: { argb: COLORS.navyDark } };
    if (!c.alignment) c.alignment = { vertical: "middle", horizontal: "left" };
  }
  row.height = 20;
}

function setupSheetPrint(ws: ExcelJS.Worksheet, freezeRow: number, freezeCol = 0, landscape = true): void {
  ws.views = [{ state: "frozen", ySplit: freezeRow, xSplit: freezeCol }];
  ws.pageSetup = {
    orientation: landscape ? "landscape" : "portrait",
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };
  ws.headerFooter.oddFooter = "&L&8Swayog Energy Pvt. Ltd. — Confidential&C&8Page &P of &N&R&8Generated via Admin Attendance Tracking";
}

function applyCalendarCodeStyle(cell: ExcelJS.Cell, code: string): void {
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = THIN_BORDER;
  const map: Record<string, { fill: string; font: string }> = {
    P: { fill: COLORS.greenFill, font: COLORS.green },
    L: { fill: COLORS.amberFill, font: COLORS.amber },
    HD: { fill: COLORS.orangeFill, font: COLORS.orange },
    A: { fill: COLORS.redFill, font: COLORS.red },
    PL: { fill: COLORS.blueLight, font: COLORS.blueText },
    UL: { fill: COLORS.blueLight, font: COLORS.blueText },
    WO: { fill: COLORS.grayFill, font: COLORS.gray },
    H: { fill: COLORS.skyLight, font: COLORS.blue },
    MP: { fill: COLORS.amberFill, font: COLORS.red },
  };
  const style = map[code];
  if (style) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: style.font } };
  } else {
    cell.font = { name: "Calibri", size: 9, color: { argb: COLORS.gray } };
  }
}

export interface ExecutiveReportOptions {
  reportScope?: "complete" | "daily" | "department" | "individual" | "weekly" | "exceptions";
}

export async function generateDayAttendanceWorkbook(
  targetDateKey: string,
  filters: AttendanceReportFilters,
  context: { generatedBy: string; generatedAt?: Date }
): Promise<{ buffer: Buffer; filename: string }> {
  const generatedAt = context.generatedAt ?? new Date();
  const targetDate = parseYMD(targetDateKey);
  const nextDate = new Date(targetDate.getTime() + 86400000);
  const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(targetDate);

  const empWhere: any = {
    role: { in: ["EMPLOYEE", "DEPARTMENT_HEAD", "TEAM_LEAD"] },
  };
  if (filters.status === "ACTIVE") empWhere.isActive = true;
  else if (filters.status === "INACTIVE") empWhere.isActive = false;
  if (filters.employeeIds?.length) empWhere.id = { in: filters.employeeIds };
  if (filters.departmentId) empWhere.departmentId = filters.departmentId;

  const [rules, employees, records, checkIns, holidays, leaves] = await Promise.all([
    AttendanceService.getRulesAsync(),
    prisma.user.findMany({
      where: empWhere,
      select: {
        id: true,
        employeeCode: true,
        loginId: true,
        fullName: true,
        role: true,
        employeeProfile: { select: { jobRole: true } },
        department: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: targetDate, lt: nextDate } },
      select: {
        employeeId: true,
        checkInTime: true,
        checkOutTime: true,
        effectiveCheckOutTime: true,
        totalMinutes: true,
        status: true,
        source: true,
        displayAsSelfPunch: true,
        manualOverride: true,
        notes: true,
        overrideReason: true,
      },
    }),
    prisma.checkIn.findMany({
      where: { createdAt: { gte: targetDate, lt: nextDate } },
      select: {
        employeeId: true,
        createdAt: true,
        latitude: true,
        longitude: true,
        manualOverride: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: targetDate, lt: nextDate } },
      select: { name: true },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lt: nextDate },
        endDate: { gte: targetDate },
      },
      select: {
        employeeId: true,
        reason: true,
        leaveType: { select: { name: true } },
      },
    }),
  ]);

  const recMap = new Map<string, any>((records as any[]).map((r: any) => [r.employeeId, r]));
  const ciMap = new Map<string, any>();
  for (const ci of checkIns as any[]) {
    if (!ciMap.has(ci.employeeId)) ciMap.set(ci.employeeId, ci);
  }
  const leaveMap = new Map<string, any>((leaves as any[]).map((l: any) => [l.employeeId, l]));
  const isHoliday = holidays.length > 0;
  const woSet = new Set(Array.isArray(rules.weeklyOffDays) && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays.map(Number) : [0]);
  const isWeeklyOff = woSet.has(targetDate.getUTCDay());
  const expectedDailyHrs = Number(rules.dailyWorkingHours ?? 9) || 9;

  const wb = new ExcelJS.Workbook();
  wb.creator = sanitizeText(context.generatedBy);
  wb.created = generatedAt;
  wb.company = REPORT_COMPANY_NAME;

  const ws = wb.addWorksheet("Day_Attendance_Report", { properties: { tabColor: { argb: COLORS.green } } });
  const headers = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Date",
    "Day of Week",
    "Attendance Status",
    "Absent",
    "Check-In Time (IST)",
    "Check-Out Time (IST)",
    "Self-Punch",
    "Worked Hrs",
    "Remaining Hrs",
    "IST Location (Lat, Lng)",
    "Google Maps",
    "Remarks",
  ];

  styleBanner(
    ws,
    `Day Attendance Report — ${targetDateKey} (${dayOfWeek})`,
    `Generated: ${toIndiaDateTimeStr(generatedAt)} IST | Timezone: ${REPORT_TIMEZONE} | Active Employees: ${employees.length}`,
    headers.length
  );

  let presentCnt = 0;
  let lateCnt = 0;
  let absentCnt = 0;
  let leaveCnt = 0;
  let selfPunchCnt = 0;
  let pendingOutCnt = 0;

  const rows: Array<any[]> = [];
  const mapsUrls: Array<string | null> = [];

  for (const emp of employees) {
    const rec = recMap.get(emp.id);
    const ci = ciMap.get(emp.id);
    const lv = leaveMap.get(emp.id);

    const firstIn = rec?.checkInTime ? new Date(rec.checkInTime) : ci?.createdAt ? new Date(ci.createdAt) : null;
    const authOut = rec?.effectiveCheckOutTime
      ? new Date(rec.effectiveCheckOutTime)
      : rec?.checkOutTime
      ? new Date(rec.checkOutTime)
      : null;

    let status = "ABSENT";
    let isAbsent = "Yes";
    if (rec) {
      if (rec.status === "LEAVE") {
        status = "ON_LEAVE";
        isAbsent = "No";
        leaveCnt++;
      } else if (rec.status === "ABSENT") {
        status = "ABSENT";
        isAbsent = "Yes";
        absentCnt++;
      } else {
        status = firstIn && !authOut ? `${rec.status} (Checked In)` : rec.status;
        isAbsent = "No";
        presentCnt++;
        if (rec.status === "LATE") lateCnt++;
        if (firstIn && !authOut) pendingOutCnt++;
      }
    } else if (firstIn) {
      status = "PRESENT (Checked In)";
      isAbsent = "No";
      presentCnt++;
      pendingOutCnt++;
    } else if (lv) {
      status = `ON_LEAVE (${lv.leaveType?.name || "Approved"})`;
      isAbsent = "No";
      leaveCnt++;
    } else if (isHoliday) {
      status = `HOLIDAY (${holidays[0].name})`;
      isAbsent = "No";
    } else if (isWeeklyOff) {
      status = "WEEKLY_OFF";
      isAbsent = "No";
    } else {
      status = "ABSENT";
      isAbsent = "Yes";
      absentCnt++;
    }

    const isSelfPunch = Boolean(
      rec?.displayAsSelfPunch ||
        rec?.source === "EMPLOYEE_CHECK_IN" ||
        (ci && !ci.manualOverride && !rec?.manualOverride)
    );
    const selfPunchLabel = firstIn ? (isSelfPunch ? "Yes (Self-Punch)" : "No (Admin / Manual)") : "—";
    if (firstIn && isSelfPunch) selfPunchCnt++;

    let workedHrs = 0;
    if (firstIn && authOut) {
      workedHrs = Math.max(0, Math.round(((authOut.getTime() - firstIn.getTime()) / 3600000) * 100) / 100);
    } else if (firstIn && !authOut && toIndiaDateKey(generatedAt) === targetDateKey) {
      workedHrs = Math.max(0, Math.round(((generatedAt.getTime() - firstIn.getTime()) / 3600000) * 100) / 100);
    } else if (rec?.totalMinutes) {
      workedHrs = Math.round((rec.totalMinutes / 60) * 100) / 100;
    }
    const remainingHrs = Math.max(0, Math.round((expectedDailyHrs - workedHrs) * 100) / 100);

    const lat = ci?.latitude ?? null;
    const lng = ci?.longitude ?? null;
    const coords = lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "—";
    const mUrl = lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
    mapsUrls.push(mUrl);

    rows.push([
      sanitizeText(emp.employeeCode || emp.loginId || emp.id),
      sanitizeText(emp.fullName),
      sanitizeText(emp.department?.name || "Not Assigned"),
      sanitizeText(emp.employeeProfile?.jobRole || emp.role),
      targetDate,
      dayOfWeek,
      status,
      isAbsent,
      firstIn ? `${toIndiaTimeStr(firstIn)} IST` : "—",
      authOut ? `${toIndiaTimeStr(authOut)} IST` : firstIn ? "Not Checked Out Yet" : "—",
      selfPunchLabel,
      workedHrs,
      remainingHrs,
      coords,
      mUrl ? { text: "Open Google Maps", hyperlink: mUrl } : "—",
      sanitizeText(rec?.notes || rec?.overrideReason || lv?.reason || "—"),
    ]);
  }

  // Top KPI strip (Rows 4-5)
  styleTableHeader(ws.getRow(4), [
    "Total Employees",
    "Checked In / Present",
    "Late",
    "Absent",
    "On Leave",
    "Self-Punches",
    "Pending Check-Out",
  ]);
  const kpiR = ws.getRow(5);
  kpiR.values = [employees.length, presentCnt, lateCnt, absentCnt, leaveCnt, selfPunchCnt, pendingOutCnt];
  styleDataRow(kpiR, 7, false);
  for (let c = 1; c <= 7; c++) {
    kpiR.getCell(c).font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.navyDark } };
    kpiR.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
  }

  // Main Day Table (Row 7+)
  styleTableHeader(ws.getRow(7), headers);
  rows.forEach((vals, idx) => {
    const r = ws.getRow(8 + idx);
    r.values = vals;
    styleDataRow(r, headers.length, idx % 2 === 1);
    r.getCell(5).numFmt = DATE_FMT;
    r.getCell(12).numFmt = HRS_FMT;
    r.getCell(13).numFmt = HRS_FMT;

    const absCell = r.getCell(8);
    if (vals[7] === "Yes") {
      absCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.redFill } };
      absCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.red } };
      absCell.alignment = { horizontal: "center", vertical: "middle" };
    } else {
      absCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.greenFill } };
      absCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.green } };
      absCell.alignment = { horizontal: "center", vertical: "middle" };
    }

    if (mapsUrls[idx]) {
      const mCell = r.getCell(15);
      mCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.blueLight } };
      mCell.font = { name: "Calibri", size: 9.5, bold: true, underline: true, color: { argb: COLORS.blue } };
      mCell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  ws.columns = [
    { width: 22 }, { width: 28 }, { width: 18 }, { width: 22 }, { width: 14 }, { width: 14 },
    { width: 24 }, { width: 12 }, { width: 19 }, { width: 23 }, { width: 20 }, { width: 14 },
    { width: 15 }, { width: 26 }, { width: 20 }, { width: 32 },
  ];
  ws.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7 + Math.max(1, rows.length), column: headers.length } };
  setupSheetPrint(ws, 7, 2, true);

  const rawArr = await wb.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(rawArr as ArrayBuffer),
    filename: `Swayog_Day_Attendance_Report_${targetDateKey}.xlsx`,
  };
}

export async function generateExecutiveAttendanceWorkbook(
  filters: AttendanceReportFilters,
  context: { generatedBy: string; generatedAt?: Date },
  options?: ExecutiveReportOptions
): Promise<{ buffer: Buffer; filename: string; report: AttendanceReport }> {
  if (options?.reportScope === "daily") {
    const dayKey = filters.endDate || toIndiaDateKey(context.generatedAt ?? new Date());
    const dayRes = await generateDayAttendanceWorkbook(dayKey, filters, context);
    return { ...dayRes, report: {} as AttendanceReport };
  }
  const generatedAt = context.generatedAt ?? new Date();
  const baseReport = await buildAttendanceReport(filters, {
    generatedBy: context.generatedBy,
    generatedAt,
  });

  const employeeIds = baseReport.employees.map((e) => e.employeeId);
  const start = parseYMD(filters.startDate);
  const end = parseYMD(filters.endDate);
  const endExcl = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  // 12-month historical window ending at endDate's month
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth(); // 0-indexed
  const start12M = new Date(Date.UTC(endYear, endMonth - 11, 1));

  // Fetch additional datasets in parallel
  const [
    rules,
    holidays12M,
    records12M,
    otRequestsAll,
    leaveRequestsAll,
    checkInsPeriod,
    correctionsPeriod,
    regularizationsPeriod,
    empCreatedMapRows,
  ] = await Promise.all([
    AttendanceService.getRulesAsync(),
    prisma.holiday.findMany({
      where: { date: { gte: start12M, lt: endExcl } },
      orderBy: { date: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: start12M, lt: endExcl } },
      select: {
        id: true,
        employeeId: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        actualCheckOutTime: true,
        effectiveCheckOutTime: true,
        checkOutSource: true,
        autoClosedAt: true,
        autoClosureReason: true,
        totalMinutes: true,
        overtimeMinutes: true,
        status: true,
        source: true,
        notes: true,
        manualOverride: true,
        overrideReason: true,
        reviewedBy: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.overtimeRequest.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: start12M, lt: endExcl } },
      orderBy: { date: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId: { in: employeeIds }, startDate: { lt: endExcl }, endDate: { gte: start } },
      include: { leaveType: { select: { name: true, isPaid: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.checkIn.findMany({
      where: { employeeId: { in: employeeIds }, createdAt: { gte: start, lt: endExcl } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.attendanceCorrection.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: start, lt: endExcl } },
      orderBy: { date: "asc" },
    }),
    prisma.attendanceRegularizationRequest.findMany({
      where: { employeeId: { in: employeeIds }, date: { gte: start, lt: endExcl } },
      orderBy: { date: "asc" },
    }),
    prisma.user.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, createdAt: true },
    }),
  ]);

  const empMap = new Map(baseReport.employees.map((e) => [e.employeeId, e]));
  const empCreatedMap = new Map(empCreatedMapRows.map((u) => [u.id, u.createdAt]));

  // Map record details for authoritative checkout & calculated OT
  const periodRecordMap = new Map<string, typeof records12M[0]>();
  for (const r of records12M) {
    const dk = toIndiaDateKey(new Date(r.date));
    if (dk >= filters.startDate && dk <= filters.endDate) {
      periodRecordMap.set(`${r.employeeId}|${dk}`, r);
    }
  }

  const approvedOtMap = new Map<string, number>();
  for (const ot of otRequestsAll) {
    if (ot.status === "APPROVED") {
      const dk = toIndiaDateKey(new Date(ot.date));
      const key = `${ot.employeeId}|${dk}`;
      approvedOtMap.set(key, (approvedOtMap.get(key) || 0) + (ot.approvedMinutes ?? ot.durationMinutes ?? 0));
    }
  }

  const regByEmpDay = new Map<string, typeof regularizationsPeriod[0]>();
  for (const reg of regularizationsPeriod) {
    const dk = toIndiaDateKey(new Date(reg.date));
    regByEmpDay.set(`${reg.employeeId}|${dk}`, reg);
  }

  // Calculated OT per employee in period
  const calcOtByEmp = new Map<string, number>();
  let totalCalcOtHours = 0;
  let totalEarlyExitMin = 0;
  for (const log of baseReport.dailyLogs) {
    const rec = periodRecordMap.get(`${log.employeeId}|${log.dateKey}`);
    const calcMin = rec?.overtimeMinutes ?? Math.round((log.overtimeHours || 0) * 60);
    const calcHrs = Math.round((calcMin / 60) * 100) / 100;
    calcOtByEmp.set(log.employeeId, (calcOtByEmp.get(log.employeeId) || 0) + calcHrs);
    totalCalcOtHours += calcHrs;
  }

  // Pending corrections + regularizations count
  const pendingCorrectionsCount =
    correctionsPeriod.filter((c) => c.status === "PENDING").length +
    regularizationsPeriod.filter((r) => r.requestStatus === "PENDING").length;

  // Build Department Summary
  const deptMap = new Map<
    string,
    {
      dept: string;
      empCount: number;
      scheduled: number;
      present: number;
      absent: number;
      half: number;
      leave: number;
      regHours: number;
      calcOt: number;
      appOt: number;
      lateMin: number;
      missingOut: number;
    }
  >();

  for (const emp of baseReport.employees) {
    const d = deptMap.get(emp.department) ?? {
      dept: emp.department,
      empCount: 0,
      scheduled: 0,
      present: 0,
      absent: 0,
      half: 0,
      leave: 0,
      regHours: 0,
      calcOt: 0,
      appOt: 0,
      lateMin: 0,
      missingOut: 0,
    };
    d.empCount += 1;
    d.scheduled += emp.scheduledWorkingDays;
    d.present += emp.presentDays;
    d.absent += emp.absentDays;
    d.half += emp.halfDays;
    d.leave += emp.leaveDays;
    d.regHours += emp.regularWorkingHours;
    d.calcOt += calcOtByEmp.get(emp.employeeId) || 0;
    d.appOt += emp.approvedOvertimeHours;
    d.lateMin += emp.lateArrivalMinutes;
    d.missingOut += emp.missingCheckOuts;
    deptMap.set(emp.department, d);
  }
  const deptRows = [...deptMap.values()].sort((a, b) => a.dept.localeCompare(b.dept));

  // Build 12-Month Sequence
  const months12: Array<{ key: string; label: string; year: number; month: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(endYear, endMonth - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(d);
    months12.push({ key, label, year: y, month: m });
  }

  // Group 12-month records by monthKey & employeeId
  const rec12ByMonth = new Map<string, typeof records12M>();
  for (const r of records12M) {
    const mk = toIndiaDateKey(new Date(r.date)).slice(0, 7);
    const list = rec12ByMonth.get(mk) ?? [];
    list.push(r);
    rec12ByMonth.set(mk, list);
  }

  const ot12ByMonth = new Map<string, typeof otRequestsAll>();
  for (const o of otRequestsAll) {
    if (o.status === "APPROVED") {
      const mk = toIndiaDateKey(new Date(o.date)).slice(0, 7);
      const list = ot12ByMonth.get(mk) ?? [];
      list.push(o);
      ot12ByMonth.set(mk, list);
    }
  }

  // Map check-in events by employeeId|dateKey for IST Location & Google Maps links
  const checkInByEmpDay = new Map<string, typeof checkInsPeriod[0]>();
  for (const ci of checkInsPeriod) {
    const dk = toIndiaDateKey(new Date(ci.createdAt));
    const key = `${ci.employeeId}|${dk}`;
    if (!checkInByEmpDay.has(key)) {
      checkInByEmpDay.set(key, ci);
    }
  }

  // Create ExcelJS Workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = sanitizeText(context.generatedBy);
  wb.created = generatedAt;
  wb.modified = generatedAt;
  wb.company = REPORT_COMPANY_NAME;

  const metaSubtitle = `Period: ${baseReport.periodLabel} (${filters.startDate} to ${filters.endDate}) | Filters: ${baseReport.appliedFilters} | Generated: ${toIndiaDateTimeStr(generatedAt)} IST | Timezone: ${REPORT_TIMEZONE}`;

  // =========================================================================
  // SHEET 00 (WHEN SINGLE DAY IN 10-SHEET WORKBOOK): DAY REPORT
  // =========================================================================
  const isSingleDayReport = filters.startDate === filters.endDate;
  if (isSingleDayReport) {
    const targetDayKey = filters.endDate;
    const wsDay = wb.addWorksheet("00_Day_Report", { properties: { tabColor: { argb: COLORS.green } } });
    const dayHeaders = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Day Status",
      "In Time (IST)",
      "Out Time (IST)",
      "Worked Hrs",
      "Remaining Hrs",
      "Late (Min)",
      "IST Location (Lat, Lng)",
      "Google Maps",
      "Face / GPS",
      "Remarks",
    ];
    styleBanner(
      wsDay,
      `Daily Employee Attendance & Location Report (${targetDayKey})`,
      `${metaSubtitle} | Click "Open Google Maps" to view exact punch coordinates`,
      dayHeaders.length
    );

    const expectedDailyHrs = Number(rules.dailyWorkingHours ?? 9) || 9;
    const targetDayDate = parseYMD(targetDayKey);
    const holidaySet = new Set(holidays12M.map((h) => toIndiaDateKey(new Date(h.date))));
    const woSet = new Set(Array.isArray(rules.weeklyOffDays) && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays.map(Number) : [0]);

    let checkedInCount = 0;
    let checkedOutCount = 0;
    let stillOnDutyCount = 0;
    let notCheckedInCount = 0;
    let onLeaveCount = 0;
    let lateCount = 0;

    const dayRowsData: Array<{
      empCode: string;
      empName: string;
      dept: string;
      desig: string;
      status: string;
      inTime: string;
      outTime: string;
      workedHrs: number;
      remainingHrs: number;
      lateMin: number;
      coords: string;
      mapsUrl: string | null;
      verification: string;
      remarks: string;
    }> = [];

    for (const emp of baseReport.employees) {
      const rec = periodRecordMap.get(`${emp.employeeId}|${targetDayKey}`);
      const ci = checkInByEmpDay.get(`${emp.employeeId}|${targetDayKey}`);
      const leaveHit = leaveRequestsAll.find((lv) => {
        const ls = toIndiaDateKey(new Date(lv.startDate));
        const le = toIndiaDateKey(new Date(lv.endDate));
        return lv.employeeId === emp.employeeId && lv.status === "APPROVED" && targetDayKey >= ls && targetDayKey <= le;
      });

      const firstIn = rec?.checkInTime ? new Date(rec.checkInTime) : ci?.createdAt ? new Date(ci.createdAt) : null;
      const authOut = rec?.effectiveCheckOutTime
        ? new Date(rec.effectiveCheckOutTime)
        : rec?.checkOutTime
        ? new Date(rec.checkOutTime)
        : null;

      let workedHrs = 0;
      if (firstIn && authOut) {
        workedHrs = Math.max(0, Math.round(((authOut.getTime() - firstIn.getTime()) / 3600000) * 100) / 100);
      } else if (firstIn && !authOut) {
        const nowRef = generatedAt;
        if (toIndiaDateKey(nowRef) === targetDayKey) {
          workedHrs = Math.max(0, Math.round(((nowRef.getTime() - firstIn.getTime()) / 3600000) * 100) / 100);
        }
      } else if (rec?.totalMinutes) {
        workedHrs = Math.round((rec.totalMinutes / 60) * 100) / 100;
      }

      const remainingHrs = Math.max(0, Math.round((expectedDailyHrs - workedHrs) * 100) / 100);

      let dayStatus = "NOT_CHECKED_IN (REMAINING)";
      if (rec) {
        if (firstIn && !authOut) {
          dayStatus = toIndiaDateKey(generatedAt) === targetDayKey ? "STILL_ON_DUTY (REMAINING OUT)" : "MISSING_OUT";
          checkedInCount++;
          stillOnDutyCount++;
        } else if (rec.status === "LEAVE") {
          dayStatus = "ON_LEAVE";
          onLeaveCount++;
        } else if (rec.status === "ABSENT") {
          dayStatus = "ABSENT";
          notCheckedInCount++;
        } else {
          dayStatus = rec.status;
          checkedInCount++;
          if (authOut) checkedOutCount++;
          if (rec.status === "LATE") lateCount++;
        }
      } else if (firstIn) {
        dayStatus = "STILL_ON_DUTY (REMAINING OUT)";
        checkedInCount++;
        stillOnDutyCount++;
      } else if (leaveHit) {
        dayStatus = `ON_LEAVE (${leaveHit.leaveType?.name || "Approved"})`;
        onLeaveCount++;
      } else if (holidaySet.has(targetDayKey)) {
        dayStatus = "HOLIDAY";
      } else if (woSet.has(targetDayDate.getUTCDay())) {
        dayStatus = "WEEKLY_OFF";
      } else {
        dayStatus = "NOT_CHECKED_IN (REMAINING)";
        notCheckedInCount++;
      }

      const lat = ci?.latitude ?? null;
      const lng = ci?.longitude ?? null;
      const coords = lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Location Not Recorded";
      const mapsUrl = lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : null;

      let lateMin = 0;
      if (firstIn) {
        const [shH, shM] = (rules.shiftStart || "09:15").split(":").map(Number);
        const istParts = new Intl.DateTimeFormat("en-GB", {
          timeZone: REPORT_TIMEZONE,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
          .format(firstIn)
          .split(":")
          .map(Number);
        const inMin = (istParts[0] || 0) * 60 + (istParts[1] || 0);
        const schedMin = (shH || 9) * 60 + (shM || 15);
        if (inMin > schedMin) lateMin = inMin - schedMin;
      }

      const verification = ci
        ? `${ci.livenessVerified ? "Face OK" : ci.flagged ? "Flagged" : "Unverified"} | ${lat !== null ? "GPS OK" : "No GPS"}`
        : "—";

      dayRowsData.push({
        empCode: emp.employeeCode,
        empName: emp.employeeName,
        dept: emp.department,
        desig: emp.designation,
        status: dayStatus,
        inTime: firstIn ? `${toIndiaTimeStr(firstIn)} IST` : "—",
        outTime: authOut ? `${toIndiaTimeStr(authOut)} IST` : firstIn ? "PENDING OUT" : "—",
        workedHrs,
        remainingHrs,
        lateMin,
        coords,
        mapsUrl,
        verification,
        remarks: rec?.notes || rec?.overrideReason || leaveHit?.reason || (dayStatus.includes("REMAINING") ? "Pending attendance / remaining" : "—"),
      });
    }

    // Top Summary Strip on Row 4-5
    styleTableHeader(wsDay.getRow(4), [
      "Total Employees",
      "Checked In",
      "Checked Out",
      "Still On Duty (Remaining OUT)",
      "Not Checked In (Remaining)",
      "Late Arrivals",
      "On Leave",
      "Shift Expected (Hrs)",
    ]);
    const kpiR = wsDay.getRow(5);
    kpiR.values = [
      baseReport.employees.length,
      checkedInCount,
      checkedOutCount,
      stillOnDutyCount,
      notCheckedInCount,
      lateCount,
      onLeaveCount,
      expectedDailyHrs,
    ];
    styleDataRow(kpiR, 8, false);
    for (let c = 1; c <= 8; c++) {
      kpiR.getCell(c).font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.navyDark } };
      kpiR.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
    }

    // Main Day Report Table starting at Row 7
    styleTableHeader(wsDay.getRow(7), dayHeaders);
    dayRowsData.forEach((dRow, idx) => {
      const r = wsDay.getRow(8 + idx);
      r.values = [
        sanitizeText(dRow.empCode),
        sanitizeText(dRow.empName),
        sanitizeText(dRow.dept),
        sanitizeText(dRow.desig),
        dRow.status,
        dRow.inTime,
        dRow.outTime,
        dRow.workedHrs,
        dRow.remainingHrs,
        dRow.lateMin,
        dRow.coords,
        dRow.mapsUrl ? { text: "Open Google Maps", hyperlink: dRow.mapsUrl } : "No GPS",
        dRow.verification,
        sanitizeText(dRow.remarks),
      ];
      styleDataRow(r, dayHeaders.length, idx % 2 === 1);
      r.getCell(8).numFmt = HRS_FMT;
      r.getCell(9).numFmt = HRS_FMT;

      if (dRow.mapsUrl) {
        const mapCell = r.getCell(12);
        mapCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.blueLight } };
        mapCell.font = { name: "Calibri", size: 9.5, bold: true, underline: true, color: { argb: COLORS.blue } };
        mapCell.alignment = { horizontal: "center", vertical: "middle" };
      }

      const stCell = r.getCell(5);
      if (dRow.status === "PRESENT") {
        stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.greenFill } };
        stCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.green } };
      } else if (dRow.status === "LATE" || dRow.status.includes("STILL_ON_DUTY")) {
        stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.amberFill } };
        stCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.amber } };
      } else if (dRow.status.includes("NOT_CHECKED_IN") || dRow.status === "ABSENT" || dRow.status === "MISSING_OUT") {
        stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.redFill } };
        stCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.red } };
      }
    });

    wsDay.columns = [
      { width: 13 }, { width: 22 }, { width: 16 }, { width: 18 }, { width: 26 },
      { width: 15 }, { width: 15 }, { width: 12 }, { width: 14 }, { width: 11 },
      { width: 24 }, { width: 20 }, { width: 20 }, { width: 30 },
    ];
    wsDay.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7 + Math.max(1, dayRowsData.length), column: dayHeaders.length } };
    setupSheetPrint(wsDay, 7, 2, true);
  }

  // =========================================================================
  // SHEET 01: EXECUTIVE DASHBOARD
  // =========================================================================
  const ws01 = wb.addWorksheet("01_Executive_Dashboard", { properties: { tabColor: { argb: COLORS.navyDark } } });
  styleBanner(ws01, "Executive Attendance & Workforce Dashboard", metaSubtitle, 10);

  const avgDailyHours =
    baseReport.dashboard.presentDays + baseReport.dashboard.halfDays > 0
      ? baseReport.dashboard.recordedWorkingHours / (baseReport.dashboard.presentDays + baseReport.dashboard.halfDays * 0.5)
      : 0;
  const totalLateMin = baseReport.employees.reduce((s, e) => s + e.lateArrivalMinutes, 0);
  const avgLateMin =
    baseReport.dashboard.lateArrivals > 0 ? totalLateMin / baseReport.dashboard.lateArrivals : 0;

  // KPI Table (Rows 4..16)
  ws01.getRow(4).getCell(1).value = "COMPANY-WIDE EXECUTIVE KPI SUMMARY";
  ws01.getRow(4).getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.navy } };
  styleTableHeader(ws01.getRow(5), ["KPI Metric", "Value", "Notes / Basis", "KPI Metric", "Value", "Notes / Basis"]);

  const kpiPairs: Array<[string, number | string, string, string, number | string, string, string?, string?]> = [
    ["Total Active Employees", baseReport.dashboard.totalEmployees, "All staff included by default", "Attendance %", baseReport.dashboard.averageAttendancePercent / 100, "Present / Eligible Scheduled Days", INT_FMT, PCT_FMT],
    ["Present Days", baseReport.dashboard.presentDays, "Full working days recorded", "Avg Daily Working Hours", Math.round(avgDailyHours * 100) / 100, "First IN to Last OUT (Gross)", INT_FMT, HRS_FMT],
    ["Absent Days", baseReport.dashboard.absentDays, "Unexcused absences", "Avg Late Arrival (Min)", Math.round(avgLateMin * 10) / 10, "Across late check-ins", INT_FMT, "0.0"],
    ["Half-Days", baseReport.dashboard.halfDays, "Shifts < 4 hrs (< 240 min)", "Calculated Overtime (Hrs)", Math.round(totalCalcOtHours * 100) / 100, "From AttendanceRecord.overtimeMinutes", INT_FMT, HRS_FMT],
    ["Leave Days (Paid / Unpaid)", `${baseReport.dashboard.paidLeaveDays} / ${baseReport.dashboard.unpaidLeaveDays}`, "Approved LeaveRequest entries", "Approved Overtime (Hrs)", Math.round(baseReport.dashboard.approvedOvertimeHours * 100) / 100, "Approved OvertimeRequest only", INT_FMT, HRS_FMT],
    ["Missing IN/OUT Punches", baseReport.dashboard.missingCheckOuts, "Flagged for admin verification", "Pending Corrections", pendingCorrectionsCount, "Pending Correction + Regularization", INT_FMT, INT_FMT],
  ];

  kpiPairs.forEach((p, idx) => {
    const r = ws01.getRow(6 + idx);
    r.getCell(1).value = p[0];
    r.getCell(2).value = p[1];
    r.getCell(3).value = p[2];
    r.getCell(4).value = p[3];
    r.getCell(5).value = p[4];
    r.getCell(6).value = p[5];
    styleDataRow(r, 6, idx % 2 === 1);
    r.getCell(1).font = { name: "Calibri", size: 9.5, bold: true };
    r.getCell(4).font = { name: "Calibri", size: 9.5, bold: true };
    r.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    if (p[6] && typeof p[1] === "number") r.getCell(2).numFmt = p[6];
    if (p[7] && typeof p[4] === "number") r.getCell(5).numFmt = p[7];
  });

  // Department-Wise Table on Dashboard (starting row 14)
  const deptHeaderRow = 14;
  ws01.getRow(13).getCell(1).value = "DEPARTMENT-WISE ATTENDANCE & OVERTIME BREAKDOWN";
  ws01.getRow(13).getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.navy } };
  styleTableHeader(ws01.getRow(deptHeaderRow), [
    "Department",
    "Employees",
    "Scheduled Days",
    "Present",
    "Absent",
    "Half-Days",
    "Leave",
    "Attendance %",
    "Working Hrs",
    "Calc OT (Hrs)",
    "Approved OT (Hrs)",
  ]);

  deptRows.forEach((d, idx) => {
    const r = ws01.getRow(deptHeaderRow + 1 + idx);
    const attPct = d.scheduled > 0 ? (d.present + d.half * 0.5) / d.scheduled : 0;
    r.values = [
      sanitizeText(d.dept),
      d.empCount,
      d.scheduled,
      d.present,
      d.absent,
      d.half,
      d.leave,
      attPct,
      Math.round(d.regHours * 100) / 100,
      Math.round(d.calcOt * 100) / 100,
      Math.round(d.appOt * 100) / 100,
    ];
    styleDataRow(r, 11, idx % 2 === 1);
    r.getCell(8).numFmt = PCT_FMT;
    r.getCell(9).numFmt = HRS_FMT;
    r.getCell(10).numFmt = HRS_FMT;
    r.getCell(11).numFmt = HRS_FMT;
  });

  // Status Distribution mini-table for Chart (Columns M-N on Dashboard)
  const distStartRow = 5;
  ws01.getRow(4).getCell(13).value = "Status";
  ws01.getRow(4).getCell(14).value = "Count";
  const distItems = [
    ["Present", baseReport.dashboard.presentDays],
    ["Late", baseReport.dashboard.lateArrivals],
    ["Half-Day", baseReport.dashboard.halfDays],
    ["Absent", baseReport.dashboard.absentDays],
    ["Leave", baseReport.dashboard.paidLeaveDays + baseReport.dashboard.unpaidLeaveDays],
  ];
  distItems.forEach((item, i) => {
    ws01.getRow(distStartRow + i).getCell(13).value = item[0];
    ws01.getRow(distStartRow + i).getCell(14).value = item[1];
  });

  ws01.columns = [
    { width: 26 }, { width: 14 }, { width: 32 }, { width: 26 }, { width: 14 }, { width: 32 },
    { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 4 },
    { width: 14 }, { width: 12 },
  ];
  setupSheetPrint(ws01, 2, 0, true);

  // =========================================================================
  // SHEET 02: MONTHLY ATTENDANCE CALENDAR (Employee-wise matrix, dates as columns)
  // =========================================================================
  const ws02 = wb.addWorksheet("02_Attendance_Calendar", { properties: { tabColor: { argb: COLORS.blue } } });
  const calStart = start;
  const calEnd = end;
  const calDates: Date[] = [];
  for (let dt = new Date(calStart.getTime()); dt.getTime() <= calEnd.getTime() && calDates.length < 62; dt = new Date(dt.getTime() + 86400000)) {
    calDates.push(new Date(dt.getTime()));
  }

  const holidayKeySet = new Set(holidays12M.map((h) => toIndiaDateKey(new Date(h.date))));
  const weeklyOffSet = new Set(Array.isArray(rules.weeklyOffDays) && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays.map(Number) : [0]);

  const calHeaders = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    ...calDates.map((d) => `${String(d.getUTCDate()).padStart(2, "0")}-${new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d)}`),
    "Present (P+L)",
    "Absent (A)",
    "Half-Day (HD)",
    "Leave (PL+UL)",
    "Weekly Off (WO)",
    "Holiday (H)",
    "Missing (MP)",
    "Attendance %",
  ];

  styleBanner(ws02, "Monthly Attendance Calendar Matrix", `${metaSubtitle} | Legend: P=Present, L=Late, HD=Half-Day, A=Absent, PL=Paid Leave, UL=Unpaid Leave, WO=Weekly Off, H=Holiday, MP=Missing Punch`, calHeaders.length);
  styleTableHeader(ws02.getRow(4), calHeaders);

  const dailyLogMap = new Map(baseReport.dailyLogs.map((l) => [`${l.employeeId}|${l.dateKey}`, l]));
  const leaveLookup = new Map<string, { isPaid: boolean }>();
  for (const lv of leaveRequestsAll) {
    if (lv.status === "APPROVED") {
      let c = new Date(lv.startDate);
      const e = new Date(lv.endDate);
      while (c.getTime() <= e.getTime()) {
        leaveLookup.set(`${lv.employeeId}|${toIndiaDateKey(c)}`, { isPaid: Boolean(lv.leaveType?.isPaid) });
        c = new Date(c.getTime() + 86400000);
      }
    }
  }

  baseReport.employees.forEach((emp, idx) => {
    const r = ws02.getRow(5 + idx);
    let pCnt = 0, aCnt = 0, hdCnt = 0, lvCnt = 0, woCnt = 0, hCnt = 0, mpCnt = 0;

    r.getCell(1).value = sanitizeText(emp.employeeCode);
    r.getCell(2).value = sanitizeText(emp.employeeName);
    r.getCell(3).value = sanitizeText(emp.department);
    r.getCell(4).value = sanitizeText(emp.designation);

    calDates.forEach((d, dIdx) => {
      const dk = toIndiaDateKey(d);
      const log = dailyLogMap.get(`${emp.employeeId}|${dk}`);
      const lv = leaveLookup.get(`${emp.employeeId}|${dk}`);
      const isHol = holidayKeySet.has(dk);
      const isWO = weeklyOffSet.has(d.getUTCDay());

      let code = "-";
      if (log) {
        if (log.missingCheckOut) {
          code = "MP";
          mpCnt++;
        } else if (log.status === "HALF_DAY") {
          code = "HD";
          hdCnt++;
        } else if (log.status === "LATE") {
          code = "L";
          pCnt++;
        } else if (log.status === "PRESENT") {
          code = "P";
          pCnt++;
        } else if (log.status === "ABSENT") {
          code = "A";
          aCnt++;
        } else if (log.status === "LEAVE") {
          code = lv?.isPaid ? "PL" : "UL";
          lvCnt++;
        }
      } else if (lv) {
        code = lv.isPaid ? "PL" : "UL";
        lvCnt++;
      } else if (isHol) {
        code = "H";
        hCnt++;
      } else if (isWO) {
        code = "WO";
        woCnt++;
      } else if (dk <= toIndiaDateKey(generatedAt)) {
        code = "A";
        aCnt++;
      }

      const cell = r.getCell(5 + dIdx);
      cell.value = code;
      applyCalendarCodeStyle(cell, code);
    });

    const baseCol = 5 + calDates.length;
    r.getCell(baseCol).value = pCnt;
    r.getCell(baseCol + 1).value = aCnt;
    r.getCell(baseCol + 2).value = hdCnt;
    r.getCell(baseCol + 3).value = lvCnt;
    r.getCell(baseCol + 4).value = woCnt;
    r.getCell(baseCol + 5).value = hCnt;
    r.getCell(baseCol + 6).value = mpCnt;
    const sched = emp.scheduledWorkingDays > 0 ? emp.scheduledWorkingDays : Math.max(1, pCnt + aCnt + hdCnt);
    r.getCell(baseCol + 7).value = (pCnt + hdCnt * 0.5) / sched;
    r.getCell(baseCol + 7).numFmt = PCT_FMT;

    for (let c = 1; c <= 4; c++) {
      r.getCell(c).border = THIN_BORDER;
      r.getCell(c).font = { name: "Calibri", size: 9.5, bold: c === 2 };
    }
    for (let c = baseCol; c <= baseCol + 7; c++) {
      r.getCell(c).border = THIN_BORDER;
      r.getCell(c).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(c).font = { name: "Calibri", size: 9.5, bold: c === baseCol + 7 };
    }
    r.height = 20;
  });

  ws02.getColumn(1).width = 14;
  ws02.getColumn(2).width = 24;
  ws02.getColumn(3).width = 18;
  ws02.getColumn(4).width = 18;
  for (let i = 5; i < 5 + calDates.length; i++) ws02.getColumn(i).width = 6.5;
  for (let i = 5 + calDates.length; i <= calHeaders.length; i++) ws02.getColumn(i).width = 13;
  ws02.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + baseReport.employees.length, column: calHeaders.length } };
  setupSheetPrint(ws02, 4, 2, true);

  // =========================================================================
  // SHEET 03: DAILY ATTENDANCE REGISTER
  // =========================================================================
  const ws03 = wb.addWorksheet("03_Daily_Register", { properties: { tabColor: { argb: COLORS.green } } });
  const dailyHeaders = [
    "Date",
    "Day",
    "Employee ID",
    "Employee Name",
    "Department",
    "Shift",
    "Scheduled IN",
    "Scheduled OUT",
    "Actual First IN",
    "Actual Last OUT",
    "Gross Duration (Hrs)",
    "Unpaid Break",
    "Net Duration (Hrs)",
    "Late (Min)",
    "Early Exit (Min)",
    "Calculated OT (Hrs)",
    "Approved OT (Hrs)",
    "Status",
    "Regularization",
    "IST Location (Lat, Lng)",
    "Google Maps",
    "Remarks",
  ];
  styleBanner(ws03, "Daily Attendance Register (First IN to Last OUT)", metaSubtitle, dailyHeaders.length);
  styleTableHeader(ws03.getRow(4), dailyHeaders);

  const shiftStartStr = rules.shiftStart || "09:15";
  const shiftEndStr = rules.shiftEnd || "18:30";
  const [shEndH, shEndM] = shiftEndStr.split(":").map(Number);

  baseReport.dailyLogs.forEach((log, idx) => {
    const rec = periodRecordMap.get(`${log.employeeId}|${log.dateKey}`);
    const reg = regByEmpDay.get(`${log.employeeId}|${log.dateKey}`);
    const firstIn = rec?.checkInTime ? new Date(rec.checkInTime) : null;
    const authOut = rec?.effectiveCheckOutTime
      ? new Date(rec.effectiveCheckOutTime)
      : rec?.checkOutTime
        ? new Date(rec.checkOutTime)
        : null;

    let grossHrs = log.actualWorkingHours;
    if (firstIn && authOut) {
      grossHrs = Math.max(0, Math.round(((authOut.getTime() - firstIn.getTime()) / 3600000) * 100) / 100);
    }

    let earlyExitMin = 0;
    if (authOut && !isNaN(shEndH) && !isNaN(shEndM)) {
      const istParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: REPORT_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(authOut)
        .split(":")
        .map(Number);
      const outMin = (istParts[0] || 0) * 60 + (istParts[1] || 0);
      const schedEndMin = shEndH * 60 + shEndM;
      if (outMin < schedEndMin && log.status !== "HALF_DAY") {
        earlyExitMin = schedEndMin - outMin;
        totalEarlyExitMin += earlyExitMin;
      }
    }

    const calcOtHrs = Math.round(((rec?.overtimeMinutes ?? Math.round((log.overtimeHours || 0) * 60)) / 60) * 100) / 100;
    const appOtHrs = Math.round(((approvedOtMap.get(`${log.employeeId}|${log.dateKey}`) || 0) / 60) * 100) / 100;
    const ci = checkInByEmpDay.get(`${log.employeeId}|${log.dateKey}`);
    const lat = ci?.latitude ?? log.latitude ?? null;
    const lng = ci?.longitude ?? log.longitude ?? null;
    const coordsStr = lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "—";
    const mapsUrl = lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : null;

    const r = ws03.getRow(5 + idx);
    r.values = [
      log.date,
      log.dayOfWeek,
      sanitizeText(log.employeeCode),
      sanitizeText(log.employeeName),
      sanitizeText(log.department),
      sanitizeText(log.scheduledShift),
      shiftStartStr,
      shiftEndStr,
      firstIn ? toIndiaTimeStr(firstIn) : log.checkInTime || "—",
      authOut ? toIndiaTimeStr(authOut) : log.missingCheckOut ? "MISSING OUT" : log.checkOutTime || "—",
      grossHrs,
      "N/A (No break field)",
      grossHrs,
      log.lateArrivalMinutes,
      earlyExitMin,
      calcOtHrs,
      appOtHrs,
      log.missingCheckOut ? "MISSING_PUNCH" : log.status,
      reg ? reg.requestStatus : "None",
      coordsStr,
      mapsUrl ? { text: "Open Google Maps", hyperlink: mapsUrl } : "—",
      sanitizeText(
        [
          log.remarks,
          rec?.checkOutSource === "SYSTEM_AUTO_CLOSURE" ? `Auto-closed (${rec.autoClosureReason || "policy"})` : "",
        ]
          .filter(Boolean)
          .join(" | ")
      ),
    ];
    styleDataRow(r, dailyHeaders.length, idx % 2 === 1);
    r.getCell(1).numFmt = DATE_FMT;
    r.getCell(11).numFmt = HRS_FMT;
    r.getCell(13).numFmt = HRS_FMT;
    r.getCell(16).numFmt = HRS_FMT;
    r.getCell(17).numFmt = HRS_FMT;
    if (mapsUrl) {
      const mapCell = r.getCell(21);
      mapCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.blueLight } };
      mapCell.font = { name: "Calibri", size: 9.5, bold: true, underline: true, color: { argb: COLORS.blue } };
      mapCell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  ws03.columns = [
    { width: 13 }, { width: 11 }, { width: 13 }, { width: 22 }, { width: 16 }, { width: 14 },
    { width: 12 }, { width: 13 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 18 },
    { width: 16 }, { width: 11 }, { width: 13 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 14 }, { width: 24 }, { width: 20 }, { width: 30 },
  ];
  ws03.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + Math.max(1, baseReport.dailyLogs.length), column: dailyHeaders.length } };
  setupSheetPrint(ws03, 4, 4, true);

  // =========================================================================
  // SHEET 04: WEEKLY ATTENDANCE ANALYSIS
  // =========================================================================
  const ws04 = wb.addWorksheet("04_Weekly_Analysis", { properties: { tabColor: { argb: COLORS.amber } } });
  const weeklyHeaders = [
    "Week Label",
    "Week Start",
    "Week End",
    "Employee ID",
    "Employee Name",
    "Department",
    "Scheduled Days",
    "Present",
    "Absent",
    "Half-Days",
    "Leave",
    "Late Count",
    "Late (Min)",
    "Total Hours",
    "Avg Daily Hrs",
    "Calc OT (Hrs)",
    "Approved OT (Hrs)",
    "Missing Punches",
    "Weekly Attendance %",
  ];
  styleBanner(ws04, "Weekly Attendance Analysis (Month Boundary Aware)", metaSubtitle, weeklyHeaders.length);
  styleTableHeader(ws04.getRow(4), weeklyHeaders);

  // Group dailyLogs by ISO week (Monday-Sunday clamped to reporting period) + employee
  const weekBuckets = new Map<
    string,
    {
      label: string;
      start: string;
      end: string;
      empId: string;
      empCode: string;
      empName: string;
      dept: string;
      sched: number;
      present: number;
      absent: number;
      half: number;
      leave: number;
      lateCnt: number;
      lateMin: number;
      hours: number;
      calcOt: number;
      appOt: number;
      missing: number;
    }
  >();

  for (const log of baseReport.dailyLogs) {
    const d = log.date;
    const day = d.getUTCDay();
    const diffToMon = (day + 6) % 7;
    const mon = new Date(d.getTime() - diffToMon * 86400000);
    const sun = new Date(mon.getTime() + 6 * 86400000);
    const monKey = toIndiaDateKey(mon) < filters.startDate ? filters.startDate : toIndiaDateKey(mon);
    const sunKey = toIndiaDateKey(sun) > filters.endDate ? filters.endDate : toIndiaDateKey(sun);
    const wKey = `${monKey}_${sunKey}|${log.employeeId}`;

    const b = weekBuckets.get(wKey) ?? {
      label: `${monKey} to ${sunKey}`,
      start: monKey,
      end: sunKey,
      empId: log.employeeId,
      empCode: log.employeeCode,
      empName: log.employeeName,
      dept: log.department,
      sched: 0,
      present: 0,
      absent: 0,
      half: 0,
      leave: 0,
      lateCnt: 0,
      lateMin: 0,
      hours: 0,
      calcOt: 0,
      appOt: 0,
      missing: 0,
    };

    const isSched = !holidayKeySet.has(log.dateKey) && !weeklyOffSet.has(d.getUTCDay());
    if (isSched) b.sched += 1;
    if (log.status === "PRESENT" || log.status === "LATE") b.present += 1;
    if (log.status === "LATE") {
      b.lateCnt += 1;
      b.lateMin += log.lateArrivalMinutes;
    }
    if (log.status === "HALF_DAY") b.half += 1;
    if (log.status === "ABSENT") b.absent += 1;
    if (log.status === "LEAVE") b.leave += 1;
    b.hours += log.actualWorkingHours;
    b.calcOt += log.overtimeHours;
    b.appOt += log.approvedOvertimeHours;
    if (log.missingCheckOut) b.missing += 1;
    weekBuckets.set(wKey, b);
  }

  const weeklyList = [...weekBuckets.values()].sort((a, b) => a.start.localeCompare(b.start) || a.empName.localeCompare(b.empName));
  weeklyList.forEach((w, idx) => {
    const r = ws04.getRow(5 + idx);
    const worked = w.present + w.half;
    const avgHrs = worked > 0 ? w.hours / worked : 0;
    const pct = w.sched > 0 ? (w.present + w.half * 0.5) / w.sched : 0;
    r.values = [
      w.label,
      parseYMD(w.start),
      parseYMD(w.end),
      sanitizeText(w.empCode),
      sanitizeText(w.empName),
      sanitizeText(w.dept),
      w.sched,
      w.present,
      w.absent,
      w.half,
      w.leave,
      w.lateCnt,
      w.lateMin,
      Math.round(w.hours * 100) / 100,
      Math.round(avgHrs * 100) / 100,
      Math.round(w.calcOt * 100) / 100,
      Math.round(w.appOt * 100) / 100,
      w.missing,
      pct,
    ];
    styleDataRow(r, weeklyHeaders.length, idx % 2 === 1);
    r.getCell(2).numFmt = DATE_FMT;
    r.getCell(3).numFmt = DATE_FMT;
    r.getCell(14).numFmt = HRS_FMT;
    r.getCell(15).numFmt = HRS_FMT;
    r.getCell(16).numFmt = HRS_FMT;
    r.getCell(17).numFmt = HRS_FMT;
    r.getCell(19).numFmt = PCT_FMT;
  });

  ws04.columns = weeklyHeaders.map((_, i) => ({ width: i === 0 ? 24 : i === 4 ? 22 : i === 5 ? 16 : 13 }));
  ws04.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + Math.max(1, weeklyList.length), column: weeklyHeaders.length } };
  setupSheetPrint(ws04, 4, 5, true);

  // =========================================================================
  // SHEET 05: MONTHLY EMPLOYEE SUMMARY
  // =========================================================================
  const ws05 = wb.addWorksheet("05_Monthly_Summary", { properties: { tabColor: { argb: COLORS.navy } } });
  const sumHeaders = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Scheduled Days",
    "Present Days",
    "Absent Days",
    "Half-Days",
    "Paid Leave",
    "Unpaid Leave",
    "Weekly Offs",
    "Holidays",
    "Expected Hrs",
    "Total Working Hrs",
    "Avg Hrs/Day",
    "Late Arrivals",
    "Late Min",
    "Calc OT (Hrs)",
    "Approved OT (Hrs)",
    "Short Hrs",
    "Missing Punches",
    "Attendance %",
  ];
  styleBanner(ws05, "Monthly Employee Summary", metaSubtitle, sumHeaders.length);
  styleTableHeader(ws05.getRow(4), sumHeaders);

  baseReport.employees.forEach((emp, idx) => {
    const r = ws05.getRow(5 + idx);
    const worked = emp.presentDays + emp.halfDays;
    const avgH = worked > 0 ? emp.regularWorkingHours / worked : 0;
    const calcOt = Math.round((calcOtByEmp.get(emp.employeeId) || 0) * 100) / 100;
    const shortHrs = Math.max(0, Math.round((emp.expectedWorkingHours - emp.regularWorkingHours) * 100) / 100);

    r.values = [
      sanitizeText(emp.employeeCode),
      sanitizeText(emp.employeeName),
      sanitizeText(emp.department),
      sanitizeText(emp.designation),
      emp.scheduledWorkingDays,
      emp.presentDays,
      emp.absentDays,
      emp.halfDays,
      emp.paidLeaveDays,
      emp.unpaidLeaveDays,
      emp.weeklyOffs,
      emp.companyHolidays,
      emp.expectedWorkingHours,
      emp.regularWorkingHours,
      Math.round(avgH * 100) / 100,
      emp.lateArrivals,
      emp.lateArrivalMinutes,
      calcOt,
      emp.approvedOvertimeHours,
      shortHrs,
      emp.missingCheckOuts,
      emp.attendancePercent / 100,
    ];
    styleDataRow(r, sumHeaders.length, idx % 2 === 1);
    r.getCell(13).numFmt = HRS_FMT;
    r.getCell(14).numFmt = HRS_FMT;
    r.getCell(15).numFmt = HRS_FMT;
    r.getCell(18).numFmt = HRS_FMT;
    r.getCell(19).numFmt = HRS_FMT;
    r.getCell(20).numFmt = HRS_FMT;
    r.getCell(22).numFmt = PCT_FMT;
  });

  ws05.columns = sumHeaders.map((_, i) => ({ width: i === 1 ? 24 : i === 2 || i === 3 ? 18 : 13 }));
  ws05.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + baseReport.employees.length, column: sumHeaders.length } };
  setupSheetPrint(ws05, 4, 2, true);

  // =========================================================================
  // SHEET 06: 12-MONTH COMPARISON
  // =========================================================================
  const ws06 = wb.addWorksheet("06_12Month_Comparison", { properties: { tabColor: { argb: COLORS.blue } } });
  const m12Headers = [
    "Month",
    "Active Employees",
    "Present Days",
    "Absent Days",
    "Half-Days",
    "Leave Days",
    "Total Working Hrs",
    "Avg Hrs/Day",
    "Late Count",
    "Late Min",
    "Calc OT (Hrs)",
    "Approved OT (Hrs)",
    "Attendance %",
    "MoM Change (%)",
  ];
  styleBanner(ws06, "12-Month Historical Trend & Comparison", `${metaSubtitle} | Note: Months with no historical data are shown as N/A (not converted to 0).`, m12Headers.length);
  styleTableHeader(ws06.getRow(4), m12Headers);

  let prevPct: number | null = null;
  months12.forEach((m, idx) => {
    const recs = rec12ByMonth.get(m.key) || [];
    const ots = ot12ByMonth.get(m.key) || [];
    const r = ws06.getRow(5 + idx);

    if (recs.length === 0) {
      r.values = [m.label, "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A"];
      styleDataRow(r, m12Headers.length, idx % 2 === 1);
      prevPct = null;
      return;
    }

    const activeEmps = new Set(recs.map((x) => x.employeeId)).size;
    const pres = recs.filter((x) => x.status === "PRESENT" || x.status === "LATE").length;
    const abs = recs.filter((x) => x.status === "ABSENT").length;
    const half = recs.filter((x) => x.status === "HALF_DAY").length;
    const lv = recs.filter((x) => x.status === "LEAVE").length;
    const lateCnt = recs.filter((x) => x.status === "LATE").length;
    const totMin = recs.reduce((s, x) => s + (x.totalMinutes || 0), 0);
    const calcOt = recs.reduce((s, x) => s + (x.overtimeMinutes || 0), 0) / 60;
    const appOt = ots.reduce((s, x) => s + (x.approvedMinutes ?? x.durationMinutes ?? 0), 0) / 60;
    const denom = pres + abs + half;
    const pct = denom > 0 ? (pres + half * 0.5) / denom : 0;
    const mom = prevPct !== null ? pct - prevPct : null;
    prevPct = pct;

    r.values = [
      m.label,
      activeEmps,
      pres,
      abs,
      half,
      lv,
      Math.round((totMin / 60) * 100) / 100,
      pres + half > 0 ? Math.round((totMin / 60 / (pres + half)) * 100) / 100 : 0,
      lateCnt,
      0,
      Math.round(calcOt * 100) / 100,
      Math.round(appOt * 100) / 100,
      pct,
      mom !== null ? mom : "N/A",
    ];
    styleDataRow(r, m12Headers.length, idx % 2 === 1);
    r.getCell(7).numFmt = HRS_FMT;
    r.getCell(8).numFmt = HRS_FMT;
    r.getCell(11).numFmt = HRS_FMT;
    r.getCell(12).numFmt = HRS_FMT;
    r.getCell(13).numFmt = PCT_FMT;
    if (mom !== null) r.getCell(14).numFmt = "+0.0%;-0.0%;0.0%";
  });

  // Employee-wise 12-Month Attendance % Matrix (starting row 19)
  const emp12Start = 19;
  ws06.getRow(18).getCell(1).value = "EMPLOYEE-WISE 12-MONTH ATTENDANCE % MATRIX";
  ws06.getRow(18).getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.navy } };
  const emp12Headers = ["Employee ID", "Employee Name", "Department", ...months12.map((m) => m.label)];
  styleTableHeader(ws06.getRow(emp12Start), emp12Headers);

  baseReport.employees.forEach((emp, eIdx) => {
    const r = ws06.getRow(emp12Start + 1 + eIdx);
    const createdRaw = empCreatedMap.get(emp.employeeId);
    const createdDateKey = toIndiaDateKey(createdRaw instanceof Date ? createdRaw : new Date(0)).slice(0, 7);
    r.getCell(1).value = sanitizeText(emp.employeeCode);
    r.getCell(2).value = sanitizeText(emp.employeeName);
    r.getCell(3).value = sanitizeText(emp.department);

    months12.forEach((m, mIdx) => {
      const mRecs = (rec12ByMonth.get(m.key) || []).filter((x) => x.employeeId === emp.employeeId);
      const cell = r.getCell(4 + mIdx);
      if (m.key < createdDateKey || mRecs.length === 0) {
        cell.value = "N/A";
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        const p = mRecs.filter((x) => x.status === "PRESENT" || x.status === "LATE").length;
        const h = mRecs.filter((x) => x.status === "HALF_DAY").length;
        const a = mRecs.filter((x) => x.status === "ABSENT").length;
        const denom = p + h + a;
        cell.value = denom > 0 ? (p + h * 0.5) / denom : "N/A";
        if (typeof cell.value === "number") cell.numFmt = PCT_FMT;
      }
    });
    styleDataRow(r, emp12Headers.length, eIdx % 2 === 1);
  });

  ws06.columns = emp12Headers.map((_, i) => ({ width: i === 1 ? 24 : i === 2 ? 18 : 13 }));
  setupSheetPrint(ws06, 4, 2, true);

  // =========================================================================
  // SHEET 07: EMPLOYEE INDIVIDUAL ANALYSIS
  // =========================================================================
  const ws07 = wb.addWorksheet("07_Individual_Analysis", { properties: { tabColor: { argb: COLORS.slate } } });
  const indHeaders = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Zone",
    "Scheduled Days",
    "Present",
    "Absent",
    "Half-Days",
    "Leave",
    "Regular Hrs",
    "Calc OT Hrs",
    "Approved OT Hrs",
    "Late Count",
    "Late Min",
    "Missing Punches",
    "Attendance %",
    "Audit / Correction Refs",
  ];
  styleBanner(ws07, "Employee Individual Analysis & Audit Summary", metaSubtitle, indHeaders.length);
  styleTableHeader(ws07.getRow(4), indHeaders);

  const corrCountByEmp = new Map<string, number>();
  for (const c of correctionsPeriod) corrCountByEmp.set(c.employeeId, (corrCountByEmp.get(c.employeeId) || 0) + 1);
  for (const rg of regularizationsPeriod) corrCountByEmp.set(rg.employeeId, (corrCountByEmp.get(rg.employeeId) || 0) + 1);

  baseReport.employees.forEach((emp, idx) => {
    const r = ws07.getRow(5 + idx);
    r.values = [
      sanitizeText(emp.employeeCode),
      sanitizeText(emp.employeeName),
      sanitizeText(emp.department),
      sanitizeText(emp.designation),
      sanitizeText(emp.zone),
      emp.scheduledWorkingDays,
      emp.presentDays,
      emp.absentDays,
      emp.halfDays,
      emp.leaveDays,
      emp.regularWorkingHours,
      Math.round((calcOtByEmp.get(emp.employeeId) || 0) * 100) / 100,
      emp.approvedOvertimeHours,
      emp.lateArrivals,
      emp.lateArrivalMinutes,
      emp.missingCheckOuts,
      emp.attendancePercent / 100,
      `${corrCountByEmp.get(emp.employeeId) || 0} corrections/regularizations`,
    ];
    styleDataRow(r, indHeaders.length, idx % 2 === 1);
    r.getCell(11).numFmt = HRS_FMT;
    r.getCell(12).numFmt = HRS_FMT;
    r.getCell(13).numFmt = HRS_FMT;
    r.getCell(17).numFmt = PCT_FMT;
  });

  ws07.columns = indHeaders.map((_, i) => ({ width: i === 1 ? 24 : i === 17 ? 26 : 14 }));
  ws07.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + baseReport.employees.length, column: indHeaders.length } };
  setupSheetPrint(ws07, 4, 2, true);

  // =========================================================================
  // SHEET 08: PUNCH & AUDIT LOG
  // =========================================================================
  const ws08 = wb.addWorksheet("08_Punch_Audit_Log", { properties: { tabColor: { argb: COLORS.gray } } });
  const auditHeaders = [
    "Event ID",
    "Employee ID",
    "Employee Name",
    "Event Timestamp (IST)",
    "Event Type",
    "Source",
    "Face Verification",
    "GPS Verification",
    "Original Status",
    "Correction Ref",
    "Corrected Value / Reason",
    "Approver",
    "Approval Timestamp",
  ];
  styleBanner(ws08, "Original Punch Events & Audit Correction Trail", metaSubtitle, auditHeaders.length);
  styleTableHeader(ws08.getRow(4), auditHeaders);

  let auditRowIdx = 0;
  for (const ci of checkInsPeriod) {
    const emp = empMap.get(ci.employeeId);
    const dk = toIndiaDateKey(new Date(ci.createdAt));
    const rec = periodRecordMap.get(`${ci.employeeId}|${dk}`);
    const r = ws08.getRow(5 + auditRowIdx);
    r.values = [
      ci.id,
      sanitizeText(emp?.employeeCode || ci.employeeId),
      sanitizeText(emp?.employeeName || "Employee"),
      toIndiaDateTimeStr(new Date(ci.createdAt)),
      ci.status,
      rec?.source || "SELF_CHECK_IN",
      ci.livenessVerified ? `Verified (${ci.matchConfidence ? Math.round(ci.matchConfidence * 100) + "%" : "OK"})` : ci.flagged ? "Flagged" : "Not Recorded",
      ci.latitude && ci.longitude ? `${ci.latitude.toFixed(5)}, ${ci.longitude.toFixed(5)}` : "Not Recorded",
      rec?.status || "PRESENT",
      rec?.manualOverride ? "MANUAL_OVERRIDE" : "—",
      sanitizeText(ci.overrideReason || rec?.overrideReason || "—"),
      sanitizeText(ci.reviewedBy || rec?.reviewedBy || "—"),
      "—",
    ];
    styleDataRow(r, auditHeaders.length, auditRowIdx % 2 === 1);
    auditRowIdx++;
  }

  for (const corr of correctionsPeriod) {
    const emp = empMap.get(corr.employeeId);
    const r = ws08.getRow(5 + auditRowIdx);
    r.values = [
      corr.id,
      sanitizeText(emp?.employeeCode || corr.employeeId),
      sanitizeText(emp?.employeeName || "Employee"),
      toIndiaDateTimeStr(new Date(corr.date)),
      "CORRECTION_REQUEST",
      "ADMIN_CORRECTION",
      "—",
      "—",
      corr.status,
      corr.id,
      sanitizeText(`Req IN: ${toIndiaTimeStr(corr.requestedCheckIn)} | OUT: ${toIndiaTimeStr(corr.requestedCheckOut)} | ${corr.reason}`),
      sanitizeText(corr.approvedBy || "—"),
      toIndiaDateTimeStr(corr.approvedAt),
    ];
    styleDataRow(r, auditHeaders.length, auditRowIdx % 2 === 1);
    auditRowIdx++;
  }

  for (const reg of regularizationsPeriod) {
    const emp = empMap.get(reg.employeeId);
    const r = ws08.getRow(5 + auditRowIdx);
    r.values = [
      reg.id,
      sanitizeText(emp?.employeeCode || reg.employeeId),
      sanitizeText(emp?.employeeName || "Employee"),
      toIndiaDateTimeStr(new Date(reg.date)),
      "REGULARIZATION",
      "EMPLOYEE_REQUEST",
      "—",
      "—",
      reg.requestStatus,
      reg.id,
      sanitizeText(`${reg.status}: ${reg.checkInTime || ""} ${reg.checkInPeriod || ""} - ${reg.checkOutTime || ""} ${reg.checkOutPeriod || ""} (${reg.reason})`),
      sanitizeText(reg.approvedBy || "—"),
      toIndiaDateTimeStr(reg.approvedAt),
    ];
    styleDataRow(r, auditHeaders.length, auditRowIdx % 2 === 1);
    auditRowIdx++;
  }

  ws08.columns = auditHeaders.map((_, i) => ({ width: i === 0 || i === 10 ? 28 : i === 2 || i === 3 ? 22 : 16 }));
  ws08.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + Math.max(1, auditRowIdx), column: auditHeaders.length } };
  setupSheetPrint(ws08, 4, 3, true);

  // =========================================================================
  // SHEET 09: EXCEPTIONS, LEAVE & OVERTIME
  // =========================================================================
  const ws09 = wb.addWorksheet("09_Exceptions_Leave_OT", { properties: { tabColor: { argb: COLORS.red } } });
  const excHeaders = [
    "Category",
    "Date",
    "Employee ID",
    "Employee Name",
    "Department",
    "Metric / Status",
    "Calculated Value",
    "Approved / Action Value",
    "Details / Reason",
  ];
  styleBanner(ws09, "Exceptions, Leave & Overtime Audit Report", metaSubtitle, excHeaders.length);
  styleTableHeader(ws09.getRow(4), excHeaders);

  const excRows: Array<Array<string | number | Date>> = [];

  for (const log of baseReport.dailyLogs) {
    const rec = periodRecordMap.get(`${log.employeeId}|${log.dateKey}`);
    if (log.missingCheckOut) {
      excRows.push(["Missing Check-Out", log.date, log.employeeCode, log.employeeName, log.department, "MISSING_OUT", log.checkInTime || "—", "Pending", "Employee checked in without valid checkout"]);
    }
    if (log.lateArrivalMinutes > 0) {
      excRows.push(["Late Arrival", log.date, log.employeeCode, log.employeeName, log.department, "LATE", `${log.lateArrivalMinutes} min`, log.checkInTime, `Arrived after ${shiftStartStr}`]);
    }
    if (rec?.checkOutSource === "SYSTEM_AUTO_CLOSURE") {
      excRows.push(["System Auto-Closure", log.date, log.employeeCode, log.employeeName, log.department, "AUTO_CLOSED", toIndiaTimeStr(rec.effectiveCheckOutTime), "System", rec.autoClosureReason || "Auto-closed by policy"]);
    }
    if (log.actualWorkingHours > 0 && log.actualWorkingHours < (rules.dailyWorkingHours || 9) - 1 && log.status !== "HALF_DAY") {
      excRows.push(["Short Working Hours", log.date, log.employeeCode, log.employeeName, log.department, log.status, `${log.actualWorkingHours} hrs`, `${rules.dailyWorkingHours || 9} hrs expected`, "Below scheduled hours"]);
    }
  }

  for (const ci of checkInsPeriod) {
    if (ci.flagged) {
      const emp = empMap.get(ci.employeeId);
      excRows.push(["Face / GPS Verification Failure", new Date(ci.createdAt), emp?.employeeCode || ci.employeeId, emp?.employeeName || "Employee", emp?.department || "—", "FLAGGED", ci.livenessVerified ? "Face OK" : "Face Flag", ci.overrideReason || "Needs Review", "Flagged punch event"]);
    }
  }

  for (const reg of regularizationsPeriod) {
    if (reg.requestStatus === "PENDING") {
      const emp = empMap.get(reg.employeeId);
      excRows.push(["Pending Regularization", new Date(reg.date), emp?.employeeCode || reg.employeeId, emp?.employeeName || "Employee", emp?.department || "—", "PENDING", reg.status, "Awaiting Admin", reg.reason]);
    }
  }

  for (const lv of leaveRequestsAll) {
    const emp = empMap.get(lv.employeeId);
    excRows.push([
      lv.status === "APPROVED" ? "Approved Leave" : `Leave (${lv.status})`,
      new Date(lv.startDate),
      emp?.employeeCode || lv.employeeId,
      emp?.employeeName || "Employee",
      emp?.department || "—",
      lv.leaveType?.name || "Leave",
      `${lv.totalDays || 1} day(s)`,
      lv.leaveType?.isPaid ? "Paid" : "Unpaid",
      lv.reason || "—",
    ]);
  }

  for (const ot of otRequestsAll) {
    const emp = empMap.get(ot.employeeId);
    const dk = toIndiaDateKey(new Date(ot.date));
    if (dk >= filters.startDate && dk <= filters.endDate) {
      excRows.push([
        "Overtime Request",
        new Date(ot.date),
        emp?.employeeCode || ot.employeeId,
        emp?.employeeName || "Employee",
        emp?.department || "—",
        ot.status,
        `${Math.round(((ot.durationMinutes || 0) / 60) * 100) / 100} hrs`,
        ot.status === "APPROVED" ? `${Math.round(((ot.approvedMinutes ?? ot.durationMinutes ?? 0) / 60) * 100) / 100} hrs` : "0.00 hrs",
        ot.reason || "—",
      ]);
    }
  }

  excRows.forEach((rowVals, idx) => {
    const r = ws09.getRow(5 + idx);
    r.values = rowVals.map((v, i) => (i === 1 ? v : sanitizeText(v)));
    styleDataRow(r, excHeaders.length, idx % 2 === 1);
    r.getCell(2).numFmt = DATE_FMT;
  });

  ws09.columns = [
    { width: 26 }, { width: 13 }, { width: 14 }, { width: 22 }, { width: 18 },
    { width: 16 }, { width: 16 }, { width: 18 }, { width: 36 },
  ];
  ws09.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + Math.max(1, excRows.length), column: excHeaders.length } };
  setupSheetPrint(ws09, 4, 0, true);

  // =========================================================================
  // SHEET 10: POLICY & CALCULATION LEGEND
  // =========================================================================
  const ws10 = wb.addWorksheet("10_Policy_Legend", { properties: { tabColor: { argb: COLORS.navyDark } } });
  styleBanner(ws10, "Policy, Calculation Rules & Definitions", metaSubtitle, 4);
  styleTableHeader(ws10.getRow(4), ["Policy / Definition", "Configured Value / Rule", "Source / Implementation", "Notes"]);

  const legendRows: Array<[string, string, string, string]> = [
    ["Reporting Time / Shift Schedule", `${shiftStartStr} to ${shiftEndStr} (${rules.dailyWorkingHours || 9} hrs/day)`, "AttendanceRule", "Configured company shift timings"],
    ["Weekly Off Days", [...weeklyOffSet].map((d) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(d)] || String(d)).join(", "), "AttendanceRule.weeklyOffDays", "Excluded from absence count"],
    ["Company Holidays in Period", `${holidays12M.filter((h) => toIndiaDateKey(new Date(h.date)) >= filters.startDate && toIndiaDateKey(new Date(h.date)) <= filters.endDate).length} holiday(s)`, "Holiday table", "Excluded from scheduled working days"],
    ["Half-Day Criteria", "Total worked minutes < 240 min (< 4 hours)", "attendanceService.ts", "Half-days carry 0.5 weight in Attendance %"],
    ["Working Hours Formula", "Gross Duration = Last Valid OUT − First Valid IN", "AttendanceRecord", "Uses effectiveCheckOutTime ?? checkOutTime"],
    ["Break Deduction Rule", "No break-duration field in AttendanceRecord", "Schema audit", "Gross duration reported unadjusted; no assumed break subtracted"],
    ["Overtime Reporting Rule", "Calculated OT vs Approved OT shown separately", "AttendanceRecord & OvertimeRequest", "Approved OT includes status = APPROVED only"],
    ["12-Month Comparison Rule", "Selected month + 11 preceding months", "AttendanceRecord history", "Months without records shown as N/A (not 0)"],
    ["Timezone", REPORT_TIMEZONE, "Asia/Kolkata (IST)", "All dates and timestamps formatted in IST"],
    ["Calendar Status Codes", "P=Present, L=Late, HD=Half-Day, A=Absent, PL=Paid Leave, UL=Unpaid Leave, WO=Weekly Off, H=Holiday, MP=Missing Punch", "Sheet 02 Legend", "Preserved with color coding"],
    ["Report Generated At", toIndiaDateTimeStr(generatedAt), `Generated by: ${context.generatedBy}`, "Reporting artifact only; database remains source of truth"],
  ];

  legendRows.forEach((lr, idx) => {
    const r = ws10.getRow(5 + idx);
    r.values = lr.map((v) => sanitizeText(v));
    styleDataRow(r, 4, idx % 2 === 1);
    r.getCell(1).font = { name: "Calibri", size: 9.5, bold: true };
  });

  ws10.columns = [{ width: 28 }, { width: 46 }, { width: 32 }, { width: 44 }];
  setupSheetPrint(ws10, 4, 0, true);

  // Add native Excel charts on Executive Dashboard using chartsheet (best-effort)
  try {
    const chartSpecs: ChartSpec[] = [
      {
        sheet: "01_Executive_Dashboard",
        type: "doughnut",
        title: "Attendance Status Distribution",
        categories: "'01_Executive_Dashboard'!$M$5:$M$9",
        series: [{ name: "Days", ref: "'01_Executive_Dashboard'!$N$5:$N$9" }],
        anchor: { row: 14 + deptRows.length + 2, col: 0 },
        width: 480,
        height: 280,
      },
      {
        sheet: "01_Executive_Dashboard",
        type: "line",
        title: "12-Month Attendance % Trend",
        categories: "'06_12Month_Comparison'!$A$5:$A$16",
        series: [{ name: "Attendance %", ref: "'06_12Month_Comparison'!$M$5:$M$16", colour: "2563EB" }],
        anchor: { row: 14 + deptRows.length + 2, col: 6 },
        width: 520,
        height: 280,
      },
    ];
    if (deptRows.length > 0) {
      const deptEndRow = 14 + deptRows.length;
      chartSpecs.push({
        sheet: "01_Executive_Dashboard",
        type: "column",
        title: "Department Calculated vs Approved OT (Hrs)",
        categories: `'01_Executive_Dashboard'!$A$15:$A$${deptEndRow}`,
        series: [
          { name: "Calculated OT", ref: `'01_Executive_Dashboard'!$J$15:$J$${deptEndRow}`, colour: "F59E0B" },
          { name: "Approved OT", ref: `'01_Executive_Dashboard'!$K$15:$K$${deptEndRow}`, colour: "16A34A" },
        ],
        anchor: { row: 14 + deptRows.length + 18, col: 0 },
        width: 620,
        height: 280,
      });
    }
    const rawArr = await wb.xlsx.writeBuffer();
    const rawBuf = Buffer.from(rawArr as ArrayBuffer);
    const withCharts = await addCharts(rawBuf, chartSpecs);
    const filename = `Swayog_CEO_Attendance_Report_${filters.startDate}_to_${filters.endDate}.xlsx`;
    return { buffer: Buffer.from(withCharts), filename, report: baseReport };
  } catch (chartErr) {
    console.warn("[ExecutiveReport] Chart embedding fallback to plain ExcelJS buffer:", chartErr);
    const rawArr = await wb.xlsx.writeBuffer();
    const filename = `Swayog_CEO_Attendance_Report_${filters.startDate}_to_${filters.endDate}.xlsx`;
    return { buffer: Buffer.from(rawArr as ArrayBuffer), filename, report: baseReport };
  }
}
