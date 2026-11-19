import ExcelJS from "exceljs";
import JSZip from "jszip";
import { generateAttendanceReportWorkbook } from "./src/services/attendanceReportWorkbook.js";
import type { AttendanceReport } from "./src/services/attendanceReportService.js";

const day = (key: string) => new Date(`${key}T00:00:00.000Z`);

const report: AttendanceReport = {
  companyName: "Swayog Energy Pvt. Ltd.",
  reportType: "Monthly",
  periodLabel: "March 2026",
  startDate: day("2026-03-01"),
  endDate: day("2026-03-31"),
  generatedAt: new Date("2026-04-01T10:30:00.000Z"),
  generatedBy: "Verification Admin (verify@example.com)",
  dataSource: "AttendanceRecord, CheckIn, LeaveRequest, OvertimeRequest",
  appliedFilters: "Employees: All matching employees | Employment status: Active only",
  policyNote: "Attendance % uses present, late, half-day and comp-off credit against scheduled working days.",
  rules: {
    shiftStart: "09:15",
    shiftEnd: "18:30",
    dailyWorkingHours: 9,
    weeklyOffDays: [0],
    timezone: "Asia/Kolkata",
  },
  employees: [
    {
      employeeId: "e1", employeeCode: "SW-001", employeeName: "Aarav Deshmukh", designation: "Technician",
      department: "Operations", zone: "Nagpur", reportingPeriod: "March 2026", scheduledWorkingDays: 26,
      presentDays: 22, absentDays: 1, halfDays: 1, paidLeaveDays: 2, unpaidLeaveDays: 0, leaveDays: 2,
      weeklyOffs: 5, companyHolidays: 0, expectedWorkingHours: 234, regularWorkingHours: 198.5,
      approvedOvertimeHours: 6, lateArrivals: 2, lateArrivalMinutes: 35, missingCheckOuts: 0,
      attendancePercent: 90.4, creditDays: 23.5,
    },
    {
      employeeId: "e2", employeeCode: "SW-002", employeeName: "Isha Kulkarni", designation: "Coordinator",
      department: "Service", zone: "Nagpur", reportingPeriod: "March 2026", scheduledWorkingDays: 26,
      presentDays: 18, absentDays: 5, halfDays: 0, paidLeaveDays: 1, unpaidLeaveDays: 1, leaveDays: 2,
      weeklyOffs: 5, companyHolidays: 0, expectedWorkingHours: 234, regularWorkingHours: 160.25,
      approvedOvertimeHours: 1.5, lateArrivals: 4, lateArrivalMinutes: 96, missingCheckOuts: 2,
      attendancePercent: 70.8, creditDays: 18.4,
    },
    {
      employeeId: "e3", employeeCode: "SW-003", employeeName: "Rohan Patil", designation: "Supervisor",
      department: "Operations", zone: "Wardha", reportingPeriod: "March 2026", scheduledWorkingDays: 26,
      presentDays: 25, absentDays: 0, halfDays: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, leaveDays: 0,
      weeklyOffs: 5, companyHolidays: 0, expectedWorkingHours: 234, regularWorkingHours: 228,
      approvedOvertimeHours: 12, lateArrivals: 0, lateArrivalMinutes: 0, missingCheckOuts: 0,
      attendancePercent: 96.2, creditDays: 25,
    },
  ],
  dailyLogs: [
    {
      employeeId: "e1", employeeCode: "SW-001", employeeName: "Aarav Deshmukh", designation: "Technician",
      department: "Operations", date: day("2026-03-02"), dateKey: "2026-03-02", dayOfWeek: "Monday",
      scheduledShift: "09:15 - 18:30", checkInTime: "09:42 AM", checkOutTime: "06:40 PM",
      actualWorkingHours: 8.97, expectedWorkingHours: 9, status: "LATE", lateArrivalMinutes: 27,
      overtimeHours: 0, approvedOvertimeHours: 0, source: "EMPLOYEE_CHECK_IN", remarks: "",
      location: "GPS (21.17540, 79.05111)", latitude: 21.1754, longitude: 79.05111,
      mapUrl: "https://www.google.com/maps?q=21.1754,79.05111", missingCheckOut: false,
    },
    {
      employeeId: "e2", employeeCode: "SW-002", employeeName: "Isha Kulkarni", designation: "Coordinator",
      department: "Service", date: day("2026-03-03"), dateKey: "2026-03-03", dayOfWeek: "Tuesday",
      scheduledShift: "09:15 - 18:30", checkInTime: "09:20 AM", checkOutTime: "Not Available",
      actualWorkingHours: 0, expectedWorkingHours: 9, status: "PRESENT", lateArrivalMinutes: 5,
      overtimeHours: 0, approvedOvertimeHours: 0, source: "ADMIN_ASSIGNED", remarks: "Forgot checkout",
      location: "Not Available", latitude: null, longitude: null, mapUrl: null, missingCheckOut: true,
    },
    {
      employeeId: "e3", employeeCode: "SW-003", employeeName: "Rohan Patil", designation: "Supervisor",
      department: "Operations", date: day("2026-03-04"), dateKey: "2026-03-04", dayOfWeek: "Wednesday",
      scheduledShift: "09:15 - 18:30", checkInTime: "09:05 AM", checkOutTime: "07:15 PM",
      actualWorkingHours: 10.17, expectedWorkingHours: 9, status: "PRESENT", lateArrivalMinutes: 0,
      overtimeHours: 0, approvedOvertimeHours: 1.25, source: "EMPLOYEE_CHECK_IN", remarks: "",
      location: "GPS (21.14610, 79.08820)", latitude: 21.1461, longitude: 79.0882,
      mapUrl: "https://www.google.com/maps?q=21.1461,79.0882", missingCheckOut: false,
    },
  ],
  monthlyBreakdown: [
    { monthKey: "2026-03", monthLabel: "March 2026", employeeId: "e1", employeeCode: "SW-001", employeeName: "Aarav Deshmukh", presentDays: 22, absentDays: 1, halfDays: 1, leaveDays: 2, attendancePercent: 90.4, regularWorkingHours: 198.5, approvedOvertimeHours: 6 },
    { monthKey: "2026-03", monthLabel: "March 2026", employeeId: "e2", employeeCode: "SW-002", employeeName: "Isha Kulkarni", presentDays: 18, absentDays: 5, halfDays: 0, leaveDays: 2, attendancePercent: 70.8, regularWorkingHours: 160.25, approvedOvertimeHours: 1.5 },
    { monthKey: "2026-03", monthLabel: "March 2026", employeeId: "e3", employeeCode: "SW-003", employeeName: "Rohan Patil", presentDays: 25, absentDays: 0, halfDays: 0, leaveDays: 0, attendancePercent: 96.2, regularWorkingHours: 228, approvedOvertimeHours: 12 },
  ],
  locationRows: [
    { employeeName: "Aarav Deshmukh", employeeCode: "SW-001", date: day("2026-03-02"), dateKey: "2026-03-02", checkInLocation: "GPS (21.17540, 79.05111)", checkOutLocation: "Not Available", checkInLatitude: 21.1754, checkInLongitude: 79.05111, checkOutLatitude: null, checkOutLongitude: null, mapUrl: "https://www.google.com/maps?q=21.1754,79.05111", attendanceSource: "EMPLOYEE_CHECK_IN", locationAvailability: "GPS captured at check-in" },
    { employeeName: "Rohan Patil", employeeCode: "SW-003", date: day("2026-03-04"), dateKey: "2026-03-04", checkInLocation: "GPS (21.14610, 79.08820)", checkOutLocation: "Not Available", checkInLatitude: 21.1461, checkInLongitude: 79.0882, checkOutLatitude: null, checkOutLongitude: null, mapUrl: "https://www.google.com/maps?q=21.1461,79.0882", attendanceSource: "EMPLOYEE_CHECK_IN", locationAvailability: "GPS captured at check-in" },
  ],
  dashboard: {
    totalEmployees: 3, scheduledWorkingDays: 78, presentDays: 65, absentDays: 6, halfDays: 1,
    paidLeaveDays: 3, unpaidLeaveDays: 1, weeklyOffs: 5, companyHolidays: 0,
    averageAttendancePercent: 85.8, recordedWorkingHours: 586.75, approvedOvertimeHours: 19.5,
    lateArrivals: 6, missingCheckOuts: 2,
  },
  statusDistribution: [
    { label: "Present", value: 65 },
    { label: "Absent", value: 6 },
    { label: "Half Day", value: 1 },
    { label: "Paid Leave", value: 3 },
    { label: "Unpaid Leave", value: 1 },
  ],
  trend: [
    { label: "01 Sun", attendancePercent: 0 },
    { label: "02 Mon", attendancePercent: 92.3 },
    { label: "03 Tue", attendancePercent: 76.9 },
    { label: "04 Wed", attendancePercent: 100 },
    { label: "05 Thu", attendancePercent: 88.5 },
  ],
  trendGranularity: "daily",
};

async function main() {
  const buffer = await generateAttendanceReportWorkbook(report);
  console.log("generated bytes:", buffer.length);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  console.log("sheets:", workbook.worksheets.map((sheet) => sheet.name).join(", "));

  const zip = await JSZip.loadAsync(buffer);
  const charts = Object.keys(zip.files).filter((name) => /^xl\/charts\/chart\d+\.xml$/.test(name));
  const drawings = Object.keys(zip.files).filter((name) => /^xl\/drawings\/drawing\d+\.xml$/.test(name));
  console.log("chart parts:", charts.join(", "));
  console.log("drawing parts:", drawings.join(", "));
  console.log("dashboard A1:", workbook.getWorksheet("Attendance Dashboard")?.getCell("A1").value);
  console.log("summary totals T4:", JSON.stringify(workbook.getWorksheet("Employee Summary")?.getCell("T4").value));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
