/**
 * Swayog Dashboard — Advanced Monthly Attendance Analytics & Professional Excel Report Generator
 * 
 * Synchronizes with:
 * - Swayog Attendance Tracking System (AttendanceRecord & CheckIn)
 * - Company Master Calendar & Weekly Off policy (rules.weeklyOffDays)
 * - Company Holiday Calendar (Holiday table)
 * - Approved Employee Leave Records (LeaveRequest table)
 * - Overtime & Regularization Records
 */

export interface ReportDataPayload {
  employees: Array<{
    id: string;
    loginId?: string;
    employeeCode?: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    createdAt?: string | Date;
    department?: { id: string; name: string; code: string } | null;
    employeeProfile?: {
      jobRole?: string;
      zone?: string;
      monthlySalaryInr?: number;
      isActive?: boolean;
    } | null;
  }>;
  attendanceRecords: Array<{
    id: string;
    employeeId: string;
    date: string | Date;
    checkInTime?: string | Date | null;
    checkOutTime?: string | Date | null;
    status: string;
    workingDuration?: number;
    additionalWorkingDuration?: number;
    overtimeDuration?: number;
    approvedOvertimeDuration?: number;
    totalMinutes?: number | null;
    overtimeMinutes?: number | null;
    source?: string | null;
    remarks?: string | null;
    notes?: string | null;
    overrideReason?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    location?: string | null;
    selfieUrl?: string | null;
    manualOverride?: boolean;
    displayAsSelfPunch?: boolean;
  }>;
  holidays: Array<{
    id: string;
    date: string | Date;
    name: string;
    description?: string | null;
  }>;
  leaveRequests: Array<{
    id: string;
    employeeId: string;
    startDate: string | Date;
    endDate: string | Date;
    leaveType: string;
    leaveTypeName?: string;
    isPaid?: boolean;
    isHalfDay?: boolean;
    halfDayPart?: string | null;
    totalDays?: number;
    reason?: string;
    status: string;
  }>;
  rules: {
    shiftStart?: string;
    shiftEnd?: string;
    weeklyOffDays?: number[];
    dailyWorkingHours?: number;
    officeLat?: number;
    officeLng?: number;
    officeRadius?: number;
  };
  startDate: string | Date;
  endDate: string | Date;
}

// Format Date to YYYY-MM-DD in UTC
function toYMD(dateOrStr: Date | string | null | undefined): string {
  if (!dateOrStr) return "";
  if (typeof dateOrStr === "string") {
    return dateOrStr.slice(0, 10);
  }
  return dateOrStr.toISOString().slice(0, 10);
}

// Generate all dates in range [startStr, endStr] in UTC
function getDatesList(startStr: string, endStr: string): Date[] {
  const list: Date[] = [];
  const [y1, m1, d1] = startStr.slice(0, 10).split("-").map(Number);
  const [y2, m2, d2] = endStr.slice(0, 10).split("-").map(Number);
  const current = new Date(Date.UTC(y1, m1 - 1, d1));
  const end = new Date(Date.UTC(y2, m2 - 1, d2));

  while (current <= end) {
    list.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return list;
}

// Visual horizontal progress bar for Excel text cells
function makeProgressBar(percent: number): string {
  if (isNaN(percent) || percent <= 0) return "[░░░░░░░░░░] 0%";
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  const filled = Math.min(10, Math.max(0, Math.round(p / 10)));
  const empty = 10 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${p}%`;
}

// Health status indicator badge
function getHealthRating(percent: number): string {
  if (isNaN(percent)) return "N/A";
  if (percent >= 95) return "🟢 Excellent (≥95%)";
  if (percent >= 85) return "🟢 Good (85-94%)";
  if (percent >= 75) return "🟡 Average (75-84%)";
  return "🔴 Needs Attention (<75%)";
}

// Format time string to 12-hour AM/PM
function formatTimeString(dt: Date | string | null | undefined): string {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "—";
  }
}

// Auto-fit column widths
function calculateColWidths(rows: any[][], minWidth = 14, maxWidth = 50): { wch: number }[] {
  const widths: number[] = [];
  for (const r of rows) {
    if (!Array.isArray(r)) continue;
    for (let c = 0; c < r.length; c++) {
      const val = r[c] != null ? String(r[c]) : "";
      widths[c] = Math.max(widths[c] || minWidth, Math.min(maxWidth, val.length + 3));
    }
  }
  return widths.map((w) => ({ wch: w }));
}

/**
 * Main Excel Workbook Builder
 */
export async function generateAttendanceExcelWorkbook(
  data: ReportDataPayload,
  period: "monthly" | "yearly" | "custom",
  year: number,
  month: number // 0-indexed (0=Jan ... 11=Dec)
) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const {
    employees = [],
    attendanceRecords = [],
    holidays = [],
    leaveRequests = [],
    rules = {},
  } = data;

  const startStr = toYMD(data.startDate);
  const endStr = toYMD(data.endDate);
  const calendarDates = getDatesList(startStr, endStr);

  const weeklyOffDays: number[] =
    rules.weeklyOffDays && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays : [0];
  const standardHours = rules.dailyWorkingHours || 9.0;
  const shiftStart = rules.shiftStart || "09:15";
  const shiftEnd = rules.shiftEnd || "18:30";

  // Build Map for Company Holidays: YYYY-MM-DD -> Holiday
  const holidayMap = new Map<string, any>();
  for (const h of holidays) {
    const key = toYMD(h.date);
    if (key) holidayMap.set(key, h);
  }

  // Build Map for Attendance: `${employeeId}_${dateStr}` -> Record
  const attendanceMap = new Map<string, any>();
  for (const rec of attendanceRecords) {
    const dateKey = toYMD(rec.date);
    if (dateKey && rec.employeeId) {
      attendanceMap.set(`${rec.employeeId}_${dateKey}`, rec);
    }
  }

  // Build Approved Leaves Map: list of approved leaves per employee
  const employeeLeavesMap = new Map<string, any[]>();
  for (const req of leaveRequests) {
    if (String(req.status).toUpperCase() === "APPROVED") {
      const list = employeeLeavesMap.get(req.employeeId) || [];
      list.push(req);
      employeeLeavesMap.set(req.employeeId, list);
    }
  }

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CALCULATE INDIVIDUAL EMPLOYEE METRICS
  // ─────────────────────────────────────────────────────────────────────────────
  interface EmployeeMetric {
    emp: (typeof employees)[0];
    employeeCode: string;
    fullName: string;
    jobRole: string;
    departmentName: string;
    zone: string;
    periodLabel: string;
    scheduledWorkingDays: number;
    approvedLeaveDays: number;
    expectedAttendanceDays: number;
    regularPresentDays: number;
    absentDays: number;
    halfDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    weeklyOffsCount: number;
    companyHolidaysCount: number;
    additionalDaysWorked: number;
    totalDaysAttended: number;
    regularWorkingHours: number;
    additionalWorkingHours: number;
    approvedOvertimeHours: number;
    regularAttendanceCredit: number;
    attendancePercentNum: number;
    attendancePercentStr: string;
    healthRating: string;
    progressBar: string;
  }

  const employeeMetrics: EmployeeMetric[] = [];
  const dailyAuditRows: any[][] = [];

  for (const emp of employees) {
    const leaves = employeeLeavesMap.get(emp.id) || [];
    let scheduledWorkingDays = 0;
    let approvedLeaveDays = 0;
    let regularPresentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let weeklyOffsCount = 0;
    let companyHolidaysCount = 0;
    let additionalDaysWorked = 0;
    let regularWorkingHours = 0;
    let additionalWorkingHours = 0;
    let approvedOvertimeHours = 0;

    const empJoinDateStr = emp.createdAt ? toYMD(emp.createdAt) : "";

    for (const d of calendarDates) {
      const dateStr = toYMD(d);
      const dayOfWeek = d.getUTCDay();
      const dayName = DAY_NAMES[dayOfWeek];

      const isWeeklyOff = weeklyOffDays.includes(dayOfWeek);
      const holiday = holidayMap.get(dateStr);
      const isCompanyHoliday = Boolean(holiday);
      const isCompanyWorkingDay = !isWeeklyOff && !isCompanyHoliday;

      // Check employee active tenure (joined date)
      const isActiveOnDate = !empJoinDateStr || dateStr >= empJoinDateStr;

      if (isWeeklyOff) weeklyOffsCount++;
      if (isCompanyHoliday) companyHolidaysCount++;

      // Check if employee has an approved leave for this date
      const activeLeave = leaves.find((l) => {
        const lStart = toYMD(l.startDate);
        const lEnd = toYMD(l.endDate);
        return dateStr >= lStart && dateStr <= lEnd;
      });

      // Check attendance record
      const record = attendanceMap.get(`${emp.id}_${dateStr}`);
      const isAttended =
        record &&
        (record.status === "PRESENT" ||
          record.status === "LATE" ||
          record.status === "HALF_DAY" ||
          Boolean(record.checkInTime));
      const isHalfDay = record?.status === "HALF_DAY";

      const totalMinutes = record?.totalMinutes || 0;
      const hoursLogged =
        record?.workingDuration ??
        (totalMinutes > 0 ? Math.round((totalMinutes / 60) * 100) / 100 : 0);
      const otHours =
        record?.approvedOvertimeDuration ??
        record?.overtimeDuration ??
        (record?.overtimeMinutes ? Math.round((record.overtimeMinutes / 60) * 100) / 100 : 0);

      let dayClassification = "";
      let isScheduledWorkingDay = false;
      let attendanceStatus = "";
      let isAdditionalWorkingDay = false;
      let regDur = 0;
      let addDur = 0;
      let leaveTypeLabel = "None";

      if (isCompanyWorkingDay && isActiveOnDate) {
        isScheduledWorkingDay = true;
        scheduledWorkingDays++;

        if (activeLeave) {
          const isPaid = activeLeave.leaveType === "PAID" || activeLeave.isPaid;
          const isHalfLeave = Boolean(activeLeave.isHalfDay || activeLeave.halfDayPart);
          leaveTypeLabel = isHalfLeave
            ? "Half-Day Leave"
            : isPaid
            ? "Paid Leave"
            : "Unpaid Leave";
          dayClassification = `Approved Leave (${leaveTypeLabel})`;

          if (isPaid) paidLeaveDays += isHalfLeave ? 0.5 : 1;
          else unpaidLeaveDays += isHalfLeave ? 0.5 : 1;
          approvedLeaveDays += isHalfLeave ? 0.5 : 1;

          if (isAttended) {
            // Worked on approved leave day -> Additional working day!
            isAdditionalWorkingDay = true;
            additionalDaysWorked++;
            attendanceStatus = "ADDITIONAL_WORK_LEAVE";
            addDur = hoursLogged;
            additionalWorkingHours += hoursLogged;
            approvedOvertimeHours += otHours;
          } else {
            attendanceStatus = isHalfLeave ? "HALF_DAY_LEAVE" : isPaid ? "PAID_LEAVE" : "UNPAID_LEAVE";
          }
        } else {
          dayClassification = "Scheduled Working Day";
          if (isAttended) {
            if (isHalfDay) {
              halfDays++;
              attendanceStatus = "HALF_DAY";
              regDur = hoursLogged;
              regularWorkingHours += hoursLogged;
            } else {
              regularPresentDays++;
              attendanceStatus = record.status === "LATE" ? "LATE" : "PRESENT";
              regDur = hoursLogged;
              regularWorkingHours += hoursLogged;
              approvedOvertimeHours += otHours;
            }
          } else {
            absentDays++;
            attendanceStatus = "ABSENT";
          }
        }
      } else {
        // Non-working day (Weekly off or Holiday or prior to joining)
        isScheduledWorkingDay = false;
        dayClassification = isCompanyHoliday
          ? `Company Holiday: ${holiday?.name || "Holiday"}`
          : isWeeklyOff
          ? `Weekly Off (${dayName})`
          : "Pre-joining Date";

        if (isAttended && isActiveOnDate) {
          // Employee came to work on Sunday or Company Holiday!
          isAdditionalWorkingDay = true;
          additionalDaysWorked++;
          attendanceStatus = isCompanyHoliday
            ? "ADDITIONAL_WORK_HOLIDAY"
            : "ADDITIONAL_WORK_WEEKLY_OFF";
          addDur = hoursLogged;
          additionalWorkingHours += hoursLogged;
          approvedOvertimeHours += otHours;
        } else {
          attendanceStatus = isCompanyHoliday ? "COMPANY_HOLIDAY" : "WEEKLY_OFF";
        }
      }

      // Collect Daily Audit Row
      const checkInStr = formatTimeString(record?.checkInTime);
      const checkOutStr = formatTimeString(record?.checkOutTime);
      const remarks = record?.remarks || record?.notes || record?.overrideReason || "";
      const source = record?.source || (record?.manualOverride ? "ADMIN_ASSIGNED" : "SELF_PUNCH");
      const lat = record?.latitude != null ? Number(record.latitude).toFixed(6) : "N/A";
      const lng = record?.longitude != null ? Number(record.longitude).toFixed(6) : "N/A";
      const loc = record?.location || (record?.latitude ? "Workplace (GPS Captured)" : "Workplace");
      const mapLink =
        record?.latitude && record?.longitude
          ? `https://www.google.com/maps?q=${record.latitude},${record.longitude}`
          : "N/A";

      dailyAuditRows.push([
        emp.employeeCode || emp.loginId || emp.id,
        emp.fullName,
        emp.employeeProfile?.jobRole || emp.role,
        emp.department?.name || "Operations",
        dateStr,
        dayName,
        dayClassification,
        isScheduledWorkingDay ? "YES" : "NO",
        attendanceStatus,
        isAdditionalWorkingDay ? "YES" : "NO",
        checkInStr,
        checkOutStr,
        regDur > 0 ? Number(regDur.toFixed(2)) : 0,
        addDur > 0 ? Number(addDur.toFixed(2)) : 0,
        otHours > 0 ? Number(otHours.toFixed(2)) : 0,
        leaveTypeLabel,
        source,
        remarks,
        lat,
        lng,
        loc,
        mapLink,
      ]);
    }

    // Formulas:
    // Expected Attendance Days = Scheduled Working Days - Approved Leave Days
    const expectedAttendanceDays = Math.max(0, scheduledWorkingDays - approvedLeaveDays);
    // Regular Attendance Credit = Regular Present + (Half Days * 0.5)
    const regularAttendanceCredit = regularPresentDays + halfDays * 0.5;
    // Total Days Attended = Regular Present + Additional Days Worked + (Half Days * 0.5)
    const totalDaysAttended = regularPresentDays + halfDays * 0.5 + additionalDaysWorked;
    // Attendance % = (Regular Attendance Credit ÷ Expected Attendance Days) * 100
    const attendancePercentNum =
      expectedAttendanceDays > 0
        ? Math.round((regularAttendanceCredit / expectedAttendanceDays) * 1000) / 10
        : 0;
    const attendancePercentStr =
      expectedAttendanceDays > 0 ? `${attendancePercentNum.toFixed(1)}%` : "N/A";

    const periodLabel =
      period === "monthly"
        ? `${new Date(year, month, 1).toLocaleString("default", { month: "long" })} ${year}`
        : period === "yearly"
        ? `Full Year ${year}`
        : `${startStr} to ${endStr}`;

    employeeMetrics.push({
      emp,
      employeeCode: emp.employeeCode || emp.loginId || emp.id,
      fullName: emp.fullName,
      jobRole: emp.employeeProfile?.jobRole || emp.role,
      departmentName: emp.department?.name || "Operations",
      zone: emp.employeeProfile?.zone || "Nagpur HQ",
      periodLabel,
      scheduledWorkingDays,
      approvedLeaveDays,
      expectedAttendanceDays,
      regularPresentDays,
      absentDays,
      halfDays,
      paidLeaveDays,
      unpaidLeaveDays,
      weeklyOffsCount: Math.round(weeklyOffsCount / Math.max(1, calendarDates.length)) * 4,
      companyHolidaysCount: holidays.length,
      additionalDaysWorked,
      totalDaysAttended,
      regularWorkingHours: Math.round(regularWorkingHours * 10) / 10,
      additionalWorkingHours: Math.round(additionalWorkingHours * 10) / 10,
      approvedOvertimeHours: Math.round(approvedOvertimeHours * 10) / 10,
      regularAttendanceCredit,
      attendancePercentNum,
      attendancePercentStr,
      healthRating: getHealthRating(attendancePercentNum),
      progressBar: makeProgressBar(attendancePercentNum),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SHEET 1: OVERALL ATTENDANCE DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  const totalEmployees = employeeMetrics.length;
  const totalScheduledDays = employeeMetrics.reduce((s, m) => s + m.scheduledWorkingDays, 0);
  const totalRegularPresent = employeeMetrics.reduce((s, m) => s + m.regularPresentDays, 0);
  const totalAbsentDays = employeeMetrics.reduce((s, m) => s + m.absentDays, 0);
  const totalHalfDays = employeeMetrics.reduce((s, m) => s + m.halfDays, 0);
  const totalApprovedLeave = employeeMetrics.reduce((s, m) => s + m.approvedLeaveDays, 0);
  const totalPaidLeave = employeeMetrics.reduce((s, m) => s + m.paidLeaveDays, 0);
  const totalUnpaidLeave = employeeMetrics.reduce((s, m) => s + m.unpaidLeaveDays, 0);
  const totalAdditionalWorked = employeeMetrics.reduce((s, m) => s + m.additionalDaysWorked, 0);
  const totalDaysAttendedAll = employeeMetrics.reduce((s, m) => s + m.totalDaysAttended, 0);
  const totalRegularHoursAll = Math.round(employeeMetrics.reduce((s, m) => s + m.regularWorkingHours, 0) * 10) / 10;
  const totalAdditionalHoursAll = Math.round(employeeMetrics.reduce((s, m) => s + m.additionalWorkingHours, 0) * 10) / 10;
  const totalOvertimeAll = Math.round(employeeMetrics.reduce((s, m) => s + m.approvedOvertimeHours, 0) * 10) / 10;

  const totalExpectedDaysAll = employeeMetrics.reduce((s, m) => s + m.expectedAttendanceDays, 0);
  const totalRegularCreditAll = employeeMetrics.reduce((s, m) => s + m.regularAttendanceCredit, 0);
  const companyAvgAttendance =
    totalExpectedDaysAll > 0
      ? Math.round((totalRegularCreditAll / totalExpectedDaysAll) * 1000) / 10
      : 0;

  const reportPeriodHeading =
    period === "monthly"
      ? `${new Date(year, month, 1).toLocaleString("default", { month: "long" })} ${year}`
      : period === "yearly"
      ? `Full Year ${year}`
      : `${startStr} to ${endStr}`;

  const generatedTimestamp = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const dashboardRows: any[][] = [
    ["SWAYOG ENERGY PRIVATE LIMITED"],
    ["MONTHLY ATTENDANCE ANALYTICS & EXECUTIVE REPORT"],
    [
      `Reporting Period: ${reportPeriodHeading}  |  Generated: ${generatedTimestamp} (IST)  |  Standard Shift: ${shiftStart} - ${shiftEnd} (${standardHours} hrs/day)`,
    ],
    [],
    ["═══ EXECUTIVE KEY PERFORMANCE INDICATORS (KPIs) ═══"],
    [
      "Total Active Employees",
      "Total Scheduled Working Days",
      "Regular Present Days",
      "Total Absent Days",
      "Approved Leave Days",
      "Additional Days Worked",
      "Total Days Attended",
      "Total Regular Hours",
      "Additional Working Hours",
      "Approved Overtime Hours",
      "Company Attendance %",
    ],
    [
      totalEmployees,
      totalScheduledDays,
      totalRegularPresent,
      totalAbsentDays,
      totalApprovedLeave,
      totalAdditionalWorked,
      totalDaysAttendedAll,
      `${totalRegularHoursAll.toLocaleString()} hrs`,
      `${totalAdditionalHoursAll.toLocaleString()} hrs`,
      `${totalOvertimeAll.toLocaleString()} hrs`,
      `${companyAvgAttendance.toFixed(1)}%`,
    ],
    [],
    ["═══ ATTENDANCE STATUS & COMPOSITION BREAKDOWN ═══"],
    [
      "Attendance Category",
      "Total Days",
      "Share of Scheduled (%)",
      "Total Hours Logged",
      "Visual Distribution Progress",
    ],
    [
      "Regular Full-Day Present",
      totalRegularPresent,
      totalScheduledDays > 0
        ? `${((totalRegularPresent / totalScheduledDays) * 100).toFixed(1)}%`
        : "0%",
      `${totalRegularHoursAll} hrs`,
      makeProgressBar(totalScheduledDays > 0 ? (totalRegularPresent / totalScheduledDays) * 100 : 0),
    ],
    [
      "Half Days (Partial Attendance)",
      totalHalfDays,
      totalScheduledDays > 0 ? `${((totalHalfDays / totalScheduledDays) * 100).toFixed(1)}%` : "0%",
      `${totalHalfDays * (standardHours / 2)} hrs`,
      makeProgressBar(totalScheduledDays > 0 ? (totalHalfDays / totalScheduledDays) * 100 : 0),
    ],
    [
      "Approved Paid Leave",
      totalPaidLeave,
      totalScheduledDays > 0 ? `${((totalPaidLeave / totalScheduledDays) * 100).toFixed(1)}%` : "0%",
      "—",
      makeProgressBar(totalScheduledDays > 0 ? (totalPaidLeave / totalScheduledDays) * 100 : 0),
    ],
    [
      "Approved Unpaid Leave",
      totalUnpaidLeave,
      totalScheduledDays > 0 ? `${((totalUnpaidLeave / totalScheduledDays) * 100).toFixed(1)}%` : "0%",
      "—",
      makeProgressBar(totalScheduledDays > 0 ? (totalUnpaidLeave / totalScheduledDays) * 100 : 0),
    ],
    [
      "Unapproved Absent (Scheduled Working Days)",
      totalAbsentDays,
      totalScheduledDays > 0 ? `${((totalAbsentDays / totalScheduledDays) * 100).toFixed(1)}%` : "0%",
      "—",
      makeProgressBar(totalScheduledDays > 0 ? (totalAbsentDays / totalScheduledDays) * 100 : 0),
    ],
    [
      "Additional Work (Sundays / Weekly Offs)",
      totalAdditionalWorked,
      "— (Extra Non-scheduled)",
      `${totalAdditionalHoursAll} hrs`,
      "⭐ Operational Support",
    ],
    [],
    ["═══ DEPARTMENT & ROLE PERFORMANCE OVERVIEW ═══"],
    [
      "Department / Team",
      "Staff Count",
      "Scheduled Days",
      "Attended Days",
      "Additional Days Worked",
      "Total Hours Logged",
      "Overtime Hours",
      "Average Attendance %",
      "Performance Status",
    ],
  ];

  // Group by Department
  const deptMap = new Map<string, EmployeeMetric[]>();
  for (const m of employeeMetrics) {
    const dName = m.departmentName || "Operations";
    const list = deptMap.get(dName) || [];
    list.push(m);
    deptMap.set(dName, list);
  }

  deptMap.forEach((metrics, dName) => {
    const count = metrics.length;
    const sched = metrics.reduce((s, m) => s + m.scheduledWorkingDays, 0);
    const attended = metrics.reduce((s, m) => s + m.totalDaysAttended, 0);
    const addWorked = metrics.reduce((s, m) => s + m.additionalDaysWorked, 0);
    const hrs = Math.round(metrics.reduce((s, m) => s + m.regularWorkingHours + m.additionalWorkingHours, 0) * 10) / 10;
    const ot = Math.round(metrics.reduce((s, m) => s + m.approvedOvertimeHours, 0) * 10) / 10;
    const expDays = metrics.reduce((s, m) => s + m.expectedAttendanceDays, 0);
    const cred = metrics.reduce((s, m) => s + m.regularAttendanceCredit, 0);
    const deptPct = expDays > 0 ? Math.round((cred / expDays) * 1000) / 10 : 0;

    dashboardRows.push([
      dName,
      count,
      sched,
      attended,
      addWorked,
      `${hrs.toLocaleString()} hrs`,
      `${ot.toLocaleString()} hrs`,
      `${deptPct.toFixed(1)}%`,
      getHealthRating(deptPct),
    ]);
  });

  // Top Additional Work Contributors
  dashboardRows.push([]);
  dashboardRows.push(["═══ ADDITIONAL WORK & OVERTIME CONTRIBUTORS ═══"]);
  dashboardRows.push([
    "Employee Code",
    "Employee Name",
    "Department",
    "Additional Days Worked",
    "Additional Hours Logged",
    "Approved Overtime Hours",
    "Special Contribution Rating",
  ]);

  const contributors = [...employeeMetrics]
    .filter((m) => m.additionalDaysWorked > 0 || m.approvedOvertimeHours > 0)
    .sort((a, b) => b.additionalDaysWorked - a.additionalDaysWorked || b.approvedOvertimeHours - a.approvedOvertimeHours);

  if (contributors.length === 0) {
    dashboardRows.push(["—", "No additional weekend/holiday work logged in this period", "—", 0, "0 hrs", "0 hrs", "Normal Operations"]);
  } else {
    for (const c of contributors) {
      dashboardRows.push([
        c.employeeCode,
        c.fullName,
        c.departmentName,
        c.additionalDaysWorked,
        `${c.additionalWorkingHours} hrs`,
        `${c.approvedOvertimeHours} hrs`,
        c.additionalDaysWorked >= 3 ? "⭐ High Weekend Support" : "👍 Extra Effort",
      ]);
    }
  }

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardRows);
  wsDashboard["!cols"] = calculateColWidths(dashboardRows, 16, 50);
  XLSX.utils.book_append_sheet(wb, wsDashboard, "Executive Dashboard");

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SHEET 2: INDIVIDUAL EMPLOYEE ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  const employeeAnalysisRows: any[][] = [
    ["SWAYOG ENERGY PRIVATE LIMITED — INDIVIDUAL EMPLOYEE ATTENDANCE ANALYSIS"],
    [
      `Comprehensive monthly breakdown for ${reportPeriodHeading} — Scheduled vs Expected vs Actual Days, Leave & Overtime`,
    ],
    [],
    [
      "Employee Code",
      "Employee Name",
      "Designation / Job Role",
      "Department",
      "Zone",
      "Reporting Period",
      "Scheduled Working Days",
      "Approved Leave Days",
      "Expected Attendance Days",
      "Regular Present Days",
      "Absent Days",
      "Half Days",
      "Paid Leave Days",
      "Unpaid Leave Days",
      "Weekly Offs (Month)",
      "Company Holidays (Month)",
      "Additional Days Worked",
      "Total Days Attended",
      "Regular Working Hours",
      "Additional Working Hours",
      "Approved Overtime Hours",
      "Attendance Percentage",
      "Health Rating",
      "Attendance Progress Indicator",
    ],
  ];

  for (const m of employeeMetrics) {
    employeeAnalysisRows.push([
      m.employeeCode,
      m.fullName,
      m.jobRole,
      m.departmentName,
      m.zone,
      m.periodLabel,
      m.scheduledWorkingDays,
      m.approvedLeaveDays,
      m.expectedAttendanceDays,
      m.regularPresentDays,
      m.absentDays,
      m.halfDays,
      m.paidLeaveDays,
      m.unpaidLeaveDays,
      m.weeklyOffsCount,
      m.companyHolidaysCount,
      m.additionalDaysWorked,
      m.totalDaysAttended,
      m.regularWorkingHours,
      m.additionalWorkingHours,
      m.approvedOvertimeHours,
      m.attendancePercentStr,
      m.healthRating,
      m.progressBar,
    ]);
  }

  const wsAnalysis = XLSX.utils.aoa_to_sheet(employeeAnalysisRows);
  wsAnalysis["!cols"] = calculateColWidths(employeeAnalysisRows, 16, 45);
  XLSX.utils.book_append_sheet(wb, wsAnalysis, "Employee Analysis");

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SHEET 3: DAILY ATTENDANCE DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  const dailyDetailsRows: any[][] = [
    ["SWAYOG ENERGY PRIVATE LIMITED — DAILY ATTENDANCE & FIELD AUDIT LOG"],
    [
      `Complete day-by-day record of working days, weekly offs, holidays, leave, check-ins, GPS coordinates, and punch sources.`,
    ],
    [],
    [
      "Employee ID",
      "Employee Name",
      "Designation",
      "Department",
      "Date",
      "Day of Week",
      "Calendar Day Type",
      "Scheduled Working Day?",
      "Attendance Status",
      "Additional Working Day?",
      "Check-in Time",
      "Check-out Time",
      "Regular Working Duration (Hrs)",
      "Additional Working Duration (Hrs)",
      "Approved Overtime (Hrs)",
      "Leave Category",
      "Punch Source",
      "Remarks / Notes",
      "GPS Latitude",
      "GPS Longitude",
      "Workplace Address / GPS Status",
      "Google Maps Location Link",
    ],
    ...dailyAuditRows,
  ];

  const wsDaily = XLSX.utils.aoa_to_sheet(dailyDetailsRows);
  wsDaily["!cols"] = calculateColWidths(dailyDetailsRows, 15, 50);
  XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Attendance Details");

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SHEET 4: MONTHLY EMPLOYEE COMPARISON
  // ─────────────────────────────────────────────────────────────────────────────
  const monthlyComparisonRows: any[][] = [
    ["SWAYOG ENERGY PRIVATE LIMITED — MONTH-WISE ATTENDANCE TRENDS & COMPARISON"],
    [
      `Monthly attendance progression, scheduled working days, leave utilization, and overtime analysis.`,
    ],
    [],
    [
      "Employee ID",
      "Employee Name",
      "Department",
      "Month",
      "Year",
      "Company Working Days",
      "Expected Attendance Days",
      "Regular Present Days",
      "Absent Days",
      "Approved Leave Days",
      "Additional Days Worked",
      "Total Days Attended",
      "Attendance %",
      "Regular Working Hours",
      "Additional Working Hours",
      "Approved Overtime Hours",
      "Performance Status",
      "Progress Indicator",
    ],
  ];

  if (period === "yearly") {
    // Generate 12 rows for each employee (Jan through Dec)
    for (const emp of employees) {
      const leaves = employeeLeavesMap.get(emp.id) || [];
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(Date.UTC(year, m, 1));
        const monthEnd = new Date(Date.UTC(year, m + 1, 0));
        const mStartStr = toYMD(monthStart);
        const mEndStr = toYMD(monthEnd);
        const mDates = getDatesList(mStartStr, mEndStr);

        let mScheduled = 0;
        let mApprovedLeave = 0;
        let mPresent = 0;
        let mAbsent = 0;
        let mHalf = 0;
        let mAddWorked = 0;
        let mRegHrs = 0;
        let mAddHrs = 0;
        let mOtHrs = 0;

        for (const d of mDates) {
          const dStr = toYMD(d);
          const dow = d.getUTCDay();
          const isOff = weeklyOffDays.includes(dow);
          const isHol = holidayMap.has(dStr);
          const isWorkDay = !isOff && !isHol;

          const rec = attendanceMap.get(`${emp.id}_${dStr}`);
          const hasAttended =
            rec &&
            (rec.status === "PRESENT" ||
              rec.status === "LATE" ||
              rec.status === "HALF_DAY" ||
              Boolean(rec.checkInTime));
          const isHalf = rec?.status === "HALF_DAY";
          const hrs =
            rec?.workingDuration ??
            (rec?.totalMinutes ? Math.round((rec.totalMinutes / 60) * 100) / 100 : 0);
          const ot =
            rec?.approvedOvertimeDuration ??
            rec?.overtimeDuration ??
            (rec?.overtimeMinutes ? Math.round((rec.overtimeMinutes / 60) * 100) / 100 : 0);

          const hasLeave = leaves.some((l) => {
            const ls = toYMD(l.startDate);
            const le = toYMD(l.endDate);
            return dStr >= ls && dStr <= le;
          });

          if (isWorkDay) {
            mScheduled++;
            if (hasLeave) {
              mApprovedLeave++;
              if (hasAttended) {
                mAddWorked++;
                mAddHrs += hrs;
                mOtHrs += ot;
              }
            } else if (hasAttended) {
              if (isHalf) {
                mHalf++;
                mRegHrs += hrs;
              } else {
                mPresent++;
                mRegHrs += hrs;
                mOtHrs += ot;
              }
            } else {
              mAbsent++;
            }
          } else {
            if (hasAttended) {
              mAddWorked++;
              mAddHrs += hrs;
              mOtHrs += ot;
            }
          }
        }

        const expDays = Math.max(0, mScheduled - mApprovedLeave);
        const credit = mPresent + mHalf * 0.5;
        const totalAttended = mPresent + mHalf * 0.5 + mAddWorked;
        const pct = expDays > 0 ? Math.round((credit / expDays) * 1000) / 10 : 0;
        const mName = new Date(year, m, 1).toLocaleString("default", { month: "long" });

        monthlyComparisonRows.push([
          emp.employeeCode || emp.loginId || emp.id,
          emp.fullName,
          emp.department?.name || "Operations",
          mName,
          year,
          mScheduled,
          expDays,
          mPresent,
          mAbsent,
          mApprovedLeave,
          mAddWorked,
          totalAttended,
          expDays > 0 ? `${pct.toFixed(1)}%` : "N/A",
          Math.round(mRegHrs * 10) / 10,
          Math.round(mAddHrs * 10) / 10,
          Math.round(mOtHrs * 10) / 10,
          getHealthRating(pct),
          makeProgressBar(pct),
        ]);
      }
    }
  } else {
    // Single month view
    for (const m of employeeMetrics) {
      monthlyComparisonRows.push([
        m.employeeCode,
        m.fullName,
        m.departmentName,
        new Date(year, month, 1).toLocaleString("default", { month: "long" }),
        year,
        m.scheduledWorkingDays,
        m.expectedAttendanceDays,
        m.regularPresentDays,
        m.absentDays,
        m.approvedLeaveDays,
        m.additionalDaysWorked,
        m.totalDaysAttended,
        m.attendancePercentStr,
        m.regularWorkingHours,
        m.additionalWorkingHours,
        m.approvedOvertimeHours,
        m.healthRating,
        m.progressBar,
      ]);
    }
  }

  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyComparisonRows);
  wsMonthly["!cols"] = calculateColWidths(monthlyComparisonRows, 15, 45);
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Comparison");

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SHEET 5: CALENDAR AND LEAVE AUDIT
  // ─────────────────────────────────────────────────────────────────────────────
  const calendarAuditRows: any[][] = [
    ["SWAYOG ENERGY PRIVATE LIMITED — CALENDAR & LEAVE AUDIT REGISTER"],
    [
      `Authoritative company calendar and approved leave audit register for period ${reportPeriodHeading}`,
    ],
    [],
    ["═══ SECTION 1: MASTER COMPANY CALENDAR SCHEDULE ═══"],
    [
      "Date (YYYY-MM-DD)",
      "Day of Week",
      "Day Classification",
      "Is Scheduled Working Day?",
      "Weekly Off / Sunday?",
      "Company Holiday Name",
      "Official Notes / Policy Description",
    ],
  ];

  for (const d of calendarDates) {
    const dStr = toYMD(d);
    const dow = d.getUTCDay();
    const dayName = DAY_NAMES[dow];
    const isOff = weeklyOffDays.includes(dow);
    const holiday = holidayMap.get(dStr);
    const isHol = Boolean(holiday);
    const isWorkDay = !isOff && !isHol;

    const classLabel = isHol
      ? `Company Holiday: ${holiday.name}`
      : isOff
      ? `Weekly Off (${dayName})`
      : "Standard Working Day";

    calendarAuditRows.push([
      dStr,
      dayName,
      classLabel,
      isWorkDay ? "YES" : "NO",
      isOff ? "YES" : "NO",
      holiday?.name || "—",
      holiday?.description || (isWorkDay ? `Regular Shift: ${shiftStart} - ${shiftEnd}` : "Mandatory Non-Working Day"),
    ]);
  }

  calendarAuditRows.push([]);
  calendarAuditRows.push(["═══ SECTION 2: APPROVED EMPLOYEE LEAVE REGISTER ═══"]);
  calendarAuditRows.push([
    "Employee ID",
    "Employee Name",
    "Department",
    "Leave Category",
    "Leave Start Date",
    "Leave End Date",
    "Duration (Days)",
    "Half-Day Leave?",
    "Approval Status",
    "Reason / Policy Justification",
  ]);

  if (leaveRequests.length === 0) {
    calendarAuditRows.push([
      "—",
      "No employee leave records recorded in this reporting period",
      "—",
      "—",
      "—",
      "—",
      0,
      "NO",
      "N/A",
      "Normal Operations",
    ]);
  } else {
    for (const req of leaveRequests) {
      const emp = employees.find((e) => e.id === req.employeeId);
      const isPaid = req.leaveType === "PAID" || req.isPaid;
      const isHalf = Boolean(req.isHalfDay || req.halfDayPart);
      const category = isHalf ? "Half-Day Leave" : isPaid ? "Paid Leave" : "Unpaid Leave";

      calendarAuditRows.push([
        emp?.employeeCode || emp?.loginId || req.employeeId,
        emp?.fullName || "Employee",
        emp?.department?.name || "Operations",
        category,
        toYMD(req.startDate),
        toYMD(req.endDate),
        req.totalDays || 1,
        isHalf ? "YES" : "NO",
        String(req.status).toUpperCase(),
        req.reason || "Approved by HR / Manager",
      ]);
    }
  }

  const wsCalendar = XLSX.utils.aoa_to_sheet(calendarAuditRows);
  wsCalendar["!cols"] = calculateColWidths(calendarAuditRows, 16, 50);
  XLSX.utils.book_append_sheet(wb, wsCalendar, "Calendar & Leave Audit");

  return wb;
}

