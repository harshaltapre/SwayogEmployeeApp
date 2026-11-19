import ExcelJS from "exceljs";
import { addCharts, validate } from "chartsheet";
import type { ChartSpec } from "chartsheet";
import type {
  AttendanceReport,
  ReportDailyLog,
  ReportEmployeeSummary,
} from "./attendanceReportService.js";

const DASHBOARD_SHEET = "Attendance Dashboard";
const SUMMARY_SHEET = "Employee Summary";
const LOGS_SHEET = "Daily Attendance Logs";
const MONTHLY_SHEET = "Monthly Breakdown";
const LOCATION_SHEET = "Location Details";

const ROW_HEIGHT = 18;
const CHART_START_ROW = 20; // zero-based anchor row: Excel row 21

const COLORS = {
  navy: "FF1E3A8A",
  navyDark: "FF0F172A",
  blue: "FF2563EB",
  blueLight: "FFDBEAFE",
  skyLight: "FFE0F2FE",
  slate: "FF334155",
  slateLight: "FFF1F5F9",
  border: "FFCBD5E1",
  white: "FFFFFFFF",
  green: "FF15803D",
  greenFill: "FFDCFCE7",
  amber: "FFB45309",
  amberFill: "FFFEF3C7",
  red: "FFB91C1C",
  redFill: "FFFEE2E2",
  purple: "FF7E22CE",
  purpleFill: "FFF3E8FF",
  gray: "FF64748B",
  grayLight: "FFE2E8F0",
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

const PERCENT_FORMAT = '0.0"%"';
const NUMBER_FORMAT = "#,##0";
const HOURS_FORMAT = "0.00";
const DATE_FORMAT = "dd-mmm-yyyy";

type CellValue = string | number | Date | null | undefined;

function fillCell(cell: ExcelJS.Cell, argb: string): void {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function applyBorder(cell: ExcelJS.Cell): void {
  cell.border = THIN_BORDER;
}

function font(cell: ExcelJS.Cell, options: Partial<ExcelJS.Font>): void {
  cell.font = { name: "Calibri", size: 10, ...options };
}

function align(cell: ExcelJS.Cell, horizontal: ExcelJS.Alignment["horizontal"], wrapText = false): void {
  cell.alignment = { vertical: "middle", horizontal, wrapText };
}

function columnLetter(index: number): string {
  let value = index;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function sheetRange(sheetName: string, range: string): string {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`;
}

function applyNumberFormat(cell: ExcelJS.Cell, value: CellValue, format?: string): void {
  if (value === null || value === undefined) return;
  if (format) cell.numFmt = format;
}

function writeHeaderRow(
  worksheet: ExcelJS.Worksheet,
  headers: string[],
  options?: { height?: number; fill?: string },
): void {
  const row = worksheet.getRow(1);
  headers.forEach((header, index) => {
    const cell = row.getCell(index + 1);
    cell.value = header;
    fillCell(cell, options?.fill ?? COLORS.navy);
    font(cell, { bold: true, color: { argb: COLORS.white }, size: 10 });
    align(cell, "center", true);
    applyBorder(cell);
  });
  row.height = options?.height ?? 34;
}

function styleTableRow(row: ExcelJS.Row, columnCount: number, even: boolean): void {
  for (let column = 1; column <= columnCount; column += 1) {
    const cell = row.getCell(column);
    if (even) fillCell(cell, COLORS.slateLight);
    applyBorder(cell);
    if (!cell.font) font(cell, { size: 10 });
  }
}

function setSheetTab(worksheet: ExcelJS.Worksheet, argb: string): void {
  worksheet.properties.tabColor = { argb };
}

function addStatusConditionalFormatting(
  worksheet: ExcelJS.Worksheet,
  range: string,
  startPriority = 1,
): void {
  worksheet.addConditionalFormatting({
    ref: range,
    rules: [
      {
        type: "cellIs",
        operator: "equal",
        formulae: ['"ABSENT"'],
        priority: startPriority,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.redFill } }, font: { color: { argb: COLORS.red }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "equal",
        formulae: ['"LATE"'],
        priority: startPriority + 1,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.amberFill } }, font: { color: { argb: COLORS.amber }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "equal",
        formulae: ['"HALF_DAY"'],
        priority: startPriority + 2,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.blueLight } }, font: { color: { argb: COLORS.blue }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "equal",
        formulae: ['"LEAVE"'],
        priority: startPriority + 3,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.purpleFill } }, font: { color: { argb: COLORS.purple }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "equal",
        formulae: ['"HOLIDAY"'],
        priority: startPriority + 4,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.greenFill } }, font: { color: { argb: COLORS.green }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "equal",
        formulae: ['"WEEKLY_OFF"'],
        priority: startPriority + 5,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.grayLight } }, font: { color: { argb: COLORS.gray } } },
      },
    ],
  });
}

function addAttendancePercentConditionalFormatting(
  worksheet: ExcelJS.Worksheet,
  range: string,
  startPriority = 20,
): void {
  worksheet.addConditionalFormatting({
    ref: range,
    rules: [
      {
        type: "cellIs",
        operator: "lessThan",
        formulae: [75],
        priority: startPriority,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.redFill } }, font: { color: { argb: COLORS.red }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "between",
        formulae: [75, 89.999],
        priority: startPriority + 1,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.amberFill } }, font: { color: { argb: COLORS.amber } } },
      },
      {
        type: "cellIs",
        operator: "greaterThan",
        formulae: [89.999],
        priority: startPriority + 2,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.greenFill } }, font: { color: { argb: COLORS.green }, bold: true } },
      },
    ],
  });
}

function buildDashboardLayout(employeeCount: number): {
  chartHeights: number[];
  anchors: Array<{ col: number; row: number }>;
  chartDataStartRow: number;
} {
  const employeeChartHeight = Math.min(600, Math.max(320, 80 + employeeCount * 16));
  const heights = [300, 300, employeeChartHeight, employeeChartHeight, employeeChartHeight, employeeChartHeight];
  const rowsFor = (height: number) => Math.ceil(height / ROW_HEIGHT) + 2;

  let leftRow = CHART_START_ROW;
  let rightRow = CHART_START_ROW;
  const anchors: Array<{ col: number; row: number }> = [];

  heights.forEach((height, index) => {
    if (index % 2 === 0) {
      anchors.push({ col: 0, row: leftRow });
      leftRow += rowsFor(height);
    } else {
      anchors.push({ col: 8, row: rightRow });
      rightRow += rowsFor(height);
    }
  });

  return {
    chartHeights: heights,
    anchors,
    chartDataStartRow: Math.max(leftRow, rightRow) + 3,
  };
}

function writeChartBlock(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  title: string,
  headers: string[],
  rows: CellValue[][],
  numberFormats: Record<number, string> = {},
): { headerRow: number; firstRow: number; lastRow: number } {
  worksheet.mergeCells(startRow, 1, startRow, Math.max(headers.length, 3));
  const titleCell = worksheet.getCell(startRow, 1);
  titleCell.value = title;
  fillCell(titleCell, COLORS.blueLight);
  font(titleCell, { bold: true, size: 10, color: { argb: COLORS.navy } });
  align(titleCell, "left");
  worksheet.getRow(startRow).height = 20;

  const headerRow = startRow + 1;
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(headerRow, index + 1);
    cell.value = header;
    fillCell(cell, COLORS.slateLight);
    font(cell, { bold: true, size: 9, color: { argb: COLORS.slate } });
    align(cell, index === 0 ? "left" : "center", true);
    applyBorder(cell);
  });
  worksheet.getRow(headerRow).height = 24;

  let rowIndex = headerRow + 1;
  for (const row of rows) {
    row.forEach((value, index) => {
      const cell = worksheet.getCell(rowIndex, index + 1);
      cell.value = value ?? null;
      font(cell, { size: 9 });
      align(cell, index === 0 ? "left" : "right");
      applyNumberFormat(cell, value, numberFormats[index + 1]);
    });
    rowIndex += 1;
  }

  return {
    headerRow,
    firstRow: headerRow + 1,
    lastRow: Math.max(headerRow, rowIndex - 1),
  };
}

function buildChartSpecs(
  report: AttendanceReport,
  blocks: {
    status: { firstRow: number; lastRow: number };
    trend: { firstRow: number; lastRow: number };
    attendance: { firstRow: number; lastRow: number };
    presence: { firstRow: number; lastRow: number };
    hours: { firstRow: number; lastRow: number };
    overtime: { firstRow: number; lastRow: number };
  },
  layout: ReturnType<typeof buildDashboardLayout>,
): ChartSpec[] {
  const categoryRef = (first: number, last: number) =>
    sheetRange(DASHBOARD_SHEET, `$A$${first}:$A$${last}`);
  const valueRef = (column: string, first: number, last: number) =>
    sheetRange(DASHBOARD_SHEET, `$${column}$${first}:$${last}`);

  return [
    {
      type: "pie",
      title: "Attendance Status Distribution",
      sheet: DASHBOARD_SHEET,
      categories: categoryRef(blocks.status.firstRow, blocks.status.lastRow),
      series: [{ name: "Days", ref: valueRef("B", blocks.status.firstRow, blocks.status.lastRow) }],
      anchor: layout.anchors[0],
      width: 600,
      height: layout.chartHeights[0],
      dataLabels: true,
      legend: "r",
    },
    {
      type: "line",
      title: report.trendGranularity === "daily" ? "Daily Attendance Trend" : "Monthly Attendance Trend",
      sheet: DASHBOARD_SHEET,
      categories: categoryRef(blocks.trend.firstRow, blocks.trend.lastRow),
      series: [{ name: "Attendance %", ref: valueRef("B", blocks.trend.firstRow, blocks.trend.lastRow), colour: "2563EB" }],
      anchor: layout.anchors[1],
      width: 600,
      height: layout.chartHeights[1],
      numberFormat: PERCENT_FORMAT,
      yTitle: "Attendance %",
      xTitle: report.trendGranularity === "daily" ? "Day" : "Month",
    },
    {
      type: "bar",
      horizontal: true,
      title: "Employee-wise Attendance %",
      sheet: DASHBOARD_SHEET,
      categories: categoryRef(blocks.attendance.firstRow, blocks.attendance.lastRow),
      series: [{ name: "Attendance %", ref: valueRef("B", blocks.attendance.firstRow, blocks.attendance.lastRow), colour: "16A34A" }],
      anchor: layout.anchors[2],
      width: 1000,
      height: layout.chartHeights[2],
      numberFormat: PERCENT_FORMAT,
      xTitle: "Attendance %",
      legend: false,
    },
    {
      type: "column",
      title: "Present vs Absent by Employee",
      sheet: DASHBOARD_SHEET,
      categories: categoryRef(blocks.presence.firstRow, blocks.presence.lastRow),
      series: [
        { name: "Present Days", ref: valueRef("B", blocks.presence.firstRow, blocks.presence.lastRow), colour: "2563EB" },
        { name: "Absent Days", ref: valueRef("C", blocks.presence.firstRow, blocks.presence.lastRow), colour: "DC2626" },
      ],
      anchor: layout.anchors[3],
      width: 600,
      height: layout.chartHeights[3],
      numberFormat: NUMBER_FORMAT,
      yTitle: "Days",
      legend: "b",
    },
    {
      type: "column",
      title: "Recorded vs Expected Working Hours",
      sheet: DASHBOARD_SHEET,
      categories: categoryRef(blocks.hours.firstRow, blocks.hours.lastRow),
      series: [
        { name: "Recorded Hours", ref: valueRef("B", blocks.hours.firstRow, blocks.hours.lastRow), colour: "0EA5E9" },
        { name: "Expected Hours", ref: valueRef("C", blocks.hours.firstRow, blocks.hours.lastRow), colour: "94A3B8" },
      ],
      anchor: layout.anchors[4],
      width: 1000,
      height: layout.chartHeights[4],
      numberFormat: HOURS_FORMAT,
      yTitle: "Hours",
      legend: "b",
    },
    {
      type: "bar",
      horizontal: true,
      title: "Approved Overtime by Employee",
      sheet: DASHBOARD_SHEET,
      categories: categoryRef(blocks.overtime.firstRow, blocks.overtime.lastRow),
      series: [{ name: "Approved OT Hours", ref: valueRef("B", blocks.overtime.firstRow, blocks.overtime.lastRow), colour: "D97706" }],
      anchor: layout.anchors[5],
      width: 600,
      height: layout.chartHeights[5],
      numberFormat: HOURS_FORMAT,
      xTitle: "Hours",
      legend: false,
    },
  ];
}

function writeDashboard(worksheet: ExcelJS.Worksheet, report: AttendanceReport): ChartSpec[] {
  worksheet.columns = [
    { width: 30 }, { width: 16 }, { width: 14 }, { width: 26 }, { width: 16 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
  ];
  worksheet.properties.defaultRowHeight = ROW_HEIGHT;

  worksheet.mergeCells("A1:T1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = report.companyName.toUpperCase();
  fillCell(titleCell, COLORS.navy);
  font(titleCell, { bold: true, size: 18, color: { argb: COLORS.white } });
  align(titleCell, "center");
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells("A2:T2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "EMPLOYEE ATTENDANCE ANALYSIS & EXCEL DASHBOARD";
  fillCell(subtitleCell, COLORS.navyDark);
  font(subtitleCell, { bold: true, size: 12, color: { argb: COLORS.white } });
  align(subtitleCell, "center");
  worksheet.getRow(2).height = 24;

  const metaRows: Array<[string, string, string, string]> = [
    ["Report Type", report.reportType, "Reporting Period", report.periodLabel],
    [
      "Generated On",
      new Intl.DateTimeFormat("en-IN", {
        timeZone: report.rules.timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(report.generatedAt),
      "Generated By",
      report.generatedBy,
    ],
  ];
  metaRows.forEach(([labelA, valueA, labelB, valueB], index) => {
    const row = 4 + index;
    const a = worksheet.getCell(row, 1);
    const b = worksheet.getCell(row, 2);
    const d = worksheet.getCell(row, 4);
    const e = worksheet.getCell(row, 5);
    a.value = labelA;
    b.value = valueA;
    d.value = labelB;
    e.value = valueB;
    [a, d].forEach((cell) => {
      font(cell, { bold: true, color: { argb: COLORS.slate } });
      fillCell(cell, COLORS.slateLight);
    });
    [b, e].forEach((cell) => font(cell, { size: 10 }));
    worksheet.mergeCells(row, 2, row, 3);
    worksheet.mergeCells(row, 5, row, 8);
    [a, b, d, e].forEach(applyBorder);
    worksheet.getRow(row).height = 20;
  });

  const longMeta: Array<[string, string, number]> = [
    ["Applied Filters", report.appliedFilters, 30],
    ["Data Source", report.dataSource, 30],
    ["Attendance Policy", report.policyNote, 86],
  ];
  longMeta.forEach(([label, value, height], index) => {
    const row = 6 + index;
    const a = worksheet.getCell(row, 1);
    a.value = label;
    font(a, { bold: true, color: { argb: COLORS.slate } });
    fillCell(a, COLORS.slateLight);
    applyBorder(a);
    worksheet.mergeCells(row, 2, row, 20);
    const b = worksheet.getCell(row, 2);
    b.value = value;
    font(b, { size: 9, color: { argb: COLORS.slate } });
    align(b, "left", true);
    applyBorder(b);
    worksheet.getRow(row).height = height;
  });

  const layout = buildDashboardLayout(report.employees.length);

  const sectionRow = 10;
  worksheet.mergeCells(sectionRow, 1, sectionRow, 20);
  const sectionCell = worksheet.getCell(sectionRow, 1);
  sectionCell.value = "SUMMARY METRICS";
  fillCell(sectionCell, COLORS.blue);
  font(sectionCell, { bold: true, size: 11, color: { argb: COLORS.white } });
  align(sectionCell, "left");
  worksheet.getRow(sectionRow).height = 22;

  const headerRow = 11;
  ["Metric", "Value", "", "Metric", "Value"].forEach((label, index) => {
    if (!label) return;
    const column = index + 1;
    const cell = worksheet.getCell(headerRow, column);
    cell.value = label;
    fillCell(cell, COLORS.slateLight);
    font(cell, { bold: true, size: 9, color: { argb: COLORS.slate } });
    align(cell, column === 2 || column === 5 ? "center" : "left");
    applyBorder(cell);
  });
  worksheet.getRow(headerRow).height = 20;

  const metrics = report.dashboard;
  const leftMetrics: Array<[string, number, "int" | "decimal" | "percent" | "hours"]> = [
    ["Total Employees", metrics.totalEmployees, "int"],
    ["Total Scheduled Working Days", metrics.scheduledWorkingDays, "int"],
    ["Total Present Days", metrics.presentDays, "int"],
    ["Total Absent Days", metrics.absentDays, "int"],
    ["Total Half Days", metrics.halfDays, "int"],
    ["Approved Paid Leave (days)", metrics.paidLeaveDays, "decimal"],
    ["Approved Unpaid Leave (days)", metrics.unpaidLeaveDays, "decimal"],
  ];
  const rightMetrics: Array<[string, number, "int" | "decimal" | "percent" | "hours"]> = [
    ["Weekly Offs (calendar days)", metrics.weeklyOffs, "int"],
    ["Company Holidays (calendar days)", metrics.companyHolidays, "int"],
    ["Average Attendance %", metrics.averageAttendancePercent, "percent"],
    ["Total Recorded Working Hours", metrics.recordedWorkingHours, "hours"],
    ["Total Approved Overtime Hours", metrics.approvedOvertimeHours, "hours"],
    ["Late Arrivals", metrics.lateArrivals, "int"],
    ["Missing Check-outs", metrics.missingCheckOuts, "int"],
  ];

  const formatFor = (kind: "int" | "decimal" | "percent" | "hours") =>
    kind === "percent" ? PERCENT_FORMAT : kind === "hours" ? HOURS_FORMAT : kind === "decimal" ? "0.0" : NUMBER_FORMAT;

  leftMetrics.forEach(([label, value, kind], index) => {
    const row = 12 + index;
    const labelCell = worksheet.getCell(row, 1);
    const valueCell = worksheet.getCell(row, 2);
    labelCell.value = label;
    valueCell.value = value;
    font(labelCell, { size: 10, color: { argb: COLORS.slate } });
    font(valueCell, { bold: true, size: 11, color: { argb: COLORS.navy } });
    valueCell.numFmt = formatFor(kind);
    align(labelCell, "left");
    align(valueCell, "center");
    applyBorder(labelCell);
    applyBorder(valueCell);
    if (index % 2 === 1) {
      fillCell(labelCell, COLORS.slateLight);
      fillCell(valueCell, COLORS.slateLight);
    }
  });

  rightMetrics.forEach(([label, value, kind], index) => {
    const row = 12 + index;
    const labelCell = worksheet.getCell(row, 4);
    const valueCell = worksheet.getCell(row, 5);
    labelCell.value = label;
    valueCell.value = value;
    font(labelCell, { size: 10, color: { argb: COLORS.slate } });
    font(valueCell, { bold: true, size: 11, color: { argb: COLORS.navy } });
    valueCell.numFmt = formatFor(kind);
    align(labelCell, "left");
    align(valueCell, "center");
    applyBorder(labelCell);
    applyBorder(valueCell);
    if (index % 2 === 1) {
      fillCell(labelCell, COLORS.slateLight);
      fillCell(valueCell, COLORS.slateLight);
    }
  });

  const noteRow = 19;
  worksheet.mergeCells(noteRow, 1, noteRow, 20);
  const noteCell = worksheet.getCell(noteRow, 1);
  noteCell.value = `Native Excel charts below are linked to the chart-data table starting at row ${layout.chartDataStartRow + 1}. Change a value there and the chart redraws.`;
  font(noteCell, { italic: true, size: 9, color: { argb: COLORS.gray } });
  align(noteCell, "left");

  const dataStart = layout.chartDataStartRow;
  worksheet.mergeCells(dataStart, 1, dataStart, 20);
  const dataTitle = worksheet.getCell(dataStart, 1);
  dataTitle.value = "CHART DATA (source table for the dashboard charts above)";
  fillCell(dataTitle, COLORS.skyLight);
  font(dataTitle, { bold: true, size: 11, color: { argb: COLORS.navy } });
  align(dataTitle, "left");
  worksheet.getRow(dataStart).height = 22;

  let cursor = dataStart + 1;
  const statusBlock = writeChartBlock(
    worksheet,
    cursor,
    "Attendance status distribution",
    ["Status", "Days"],
    report.statusDistribution.map((slice) => [slice.label, slice.value]),
  );
  cursor = statusBlock.lastRow + 3;

  const trendBlock = writeChartBlock(
    worksheet,
    cursor,
    report.trendGranularity === "daily" ? "Daily attendance trend" : "Monthly attendance trend",
    ["Period", "Attendance %"],
    report.trend.map((point) => [point.label, point.attendancePercent]),
    { 2: PERCENT_FORMAT },
  );
  cursor = trendBlock.lastRow + 3;

  const attendanceBlock = writeChartBlock(
    worksheet,
    cursor,
    "Employee-wise attendance %",
    ["Employee", "Attendance %"],
    report.employees.map((employee) => [employee.employeeName, employee.attendancePercent]),
    { 2: PERCENT_FORMAT },
  );
  cursor = attendanceBlock.lastRow + 3;

  const presenceBlock = writeChartBlock(
    worksheet,
    cursor,
    "Present vs absent by employee",
    ["Employee", "Present Days", "Absent Days"],
    report.employees.map((employee) => [employee.employeeName, employee.presentDays, employee.absentDays]),
    { 2: NUMBER_FORMAT, 3: NUMBER_FORMAT },
  );
  cursor = presenceBlock.lastRow + 3;

  const hoursBlock = writeChartBlock(
    worksheet,
    cursor,
    "Recorded vs expected working hours",
    ["Employee", "Recorded Hours", "Expected Hours"],
    report.employees.map((employee) => [
      employee.employeeName,
      employee.regularWorkingHours,
      employee.expectedWorkingHours,
    ]),
    { 2: HOURS_FORMAT, 3: HOURS_FORMAT },
  );
  cursor = hoursBlock.lastRow + 3;

  const overtimeBlock = writeChartBlock(
    worksheet,
    cursor,
    "Approved overtime by employee",
    ["Employee", "Approved OT Hours"],
    report.employees.map((employee) => [employee.employeeName, employee.approvedOvertimeHours]),
    { 2: HOURS_FORMAT },
  );

  worksheet.views = [{ state: "frozen", ySplit: 2 }];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
  };
  setSheetTab(worksheet, COLORS.navy);

  return buildChartSpecs(
    report,
    {
      status: statusBlock,
      trend: trendBlock,
      attendance: attendanceBlock,
      presence: presenceBlock,
      hours: hoursBlock,
      overtime: overtimeBlock,
    },
    layout,
  );
}

function writeEmployeeSummary(worksheet: ExcelJS.Worksheet, report: AttendanceReport): void {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Designation",
    "Department",
    "Zone / Location",
    "Reporting Period",
    "Scheduled Working Days",
    "Present Days",
    "Absent Days",
    "Half Days",
    "Paid Leave Days",
    "Unpaid Leave Days",
    "Weekly Offs",
    "Company Holidays",
    "Total Expected Working Hours",
    "Total Regular Working Hours",
    "Total Approved Overtime Hours",
    "Late Arrivals",
    "Missing Check-outs",
    "Attendance %",
  ];
  const widths = [18, 28, 22, 24, 20, 20, 14, 12, 12, 12, 12, 12, 12, 12, 16, 16, 16, 12, 14, 14];
  worksheet.columns = widths.map((width) => ({ width }));
  worksheet.properties.defaultRowHeight = 18;
  writeHeaderRow(worksheet, headers);

  const rows = report.employees;
  rows.forEach((employee, index) => {
    const row = worksheet.addRow([
      employee.employeeCode,
      employee.employeeName,
      employee.designation,
      employee.department,
      employee.zone,
      employee.reportingPeriod,
      employee.scheduledWorkingDays,
      employee.presentDays,
      employee.absentDays,
      employee.halfDays,
      employee.paidLeaveDays,
      employee.unpaidLeaveDays,
      employee.weeklyOffs,
      employee.companyHolidays,
      employee.expectedWorkingHours,
      employee.regularWorkingHours,
      employee.approvedOvertimeHours,
      employee.lateArrivals,
      employee.missingCheckOuts,
      employee.attendancePercent,
    ]);
    styleTableRow(row, headers.length, index % 2 === 1);
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(5).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(6).alignment = { vertical: "middle", horizontal: "center" };
    for (let column = 7; column <= 20; column += 1) {
      row.getCell(column).alignment = { vertical: "middle", horizontal: "center" };
    }
    row.getCell(11).numFmt = "0.0";
    row.getCell(12).numFmt = "0.0";
    row.getCell(15).numFmt = HOURS_FORMAT;
    row.getCell(16).numFmt = HOURS_FORMAT;
    row.getCell(17).numFmt = HOURS_FORMAT;
    row.getCell(20).numFmt = PERCENT_FORMAT;
  });

  const lastDataRow = rows.length + 1;
  const totalsRowIndex = lastDataRow + 1;
  const totalsRow = worksheet.getRow(totalsRowIndex);
  totalsRow.getCell(1).value = "TOTAL / AVERAGE";
  worksheet.mergeCells(totalsRowIndex, 1, totalsRowIndex, 6);
  const totalColumns: Array<[number, string]> = [
    [7, "G"], [8, "H"], [9, "I"], [10, "J"], [11, "K"], [12, "L"],
    [13, "M"], [14, "N"], [15, "O"], [16, "P"], [17, "Q"], [18, "R"], [19, "S"],
  ];
  totalColumns.forEach(([column, letter]) => {
    totalsRow.getCell(column).value = { formula: `SUM(${letter}2:${letter}${lastDataRow})` };
  });
  totalsRow.getCell(20).value = { formula: `IFERROR(AVERAGE(T2:T${lastDataRow}),0)` };
  for (let column = 1; column <= 20; column += 1) {
    const cell = totalsRow.getCell(column);
    fillCell(cell, COLORS.navy);
    font(cell, { bold: true, size: 10, color: { argb: COLORS.white } });
    align(cell, column === 1 ? "left" : "center");
    applyBorder(cell);
  }
  totalsRow.getCell(15).numFmt = HOURS_FORMAT;
  totalsRow.getCell(16).numFmt = HOURS_FORMAT;
  totalsRow.getCell(17).numFmt = HOURS_FORMAT;
  totalsRow.getCell(20).numFmt = PERCENT_FORMAT;

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, lastDataRow), column: 20 },
  };
  worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: 1, topLeftCell: "C2" }];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
    paperSize: 9,
  };
  addAttendancePercentConditionalFormatting(worksheet, `T2:T${lastDataRow}`, 30);
  worksheet.addConditionalFormatting({
    ref: `S2:S${lastDataRow}`,
    rules: [{
      type: "cellIs",
      operator: "greaterThan",
      formulae: [0],
      priority: 33,
      style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.redFill } }, font: { color: { argb: COLORS.red }, bold: true } },
    }],
  });
  worksheet.addConditionalFormatting({
    ref: `R2:R${lastDataRow}`,
    rules: [{
      type: "cellIs",
      operator: "greaterThan",
      formulae: [0],
      priority: 34,
      style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.amberFill } }, font: { color: { argb: COLORS.amber } } },
    }],
  });
  setSheetTab(worksheet, COLORS.blue);
}

function writeDailyLogs(worksheet: ExcelJS.Worksheet, report: AttendanceReport): void {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Designation",
    "Department",
    "Attendance Date",
    "Day of Week",
    "Scheduled Shift",
    "Check-in Time",
    "Check-out Time",
    "Actual Working Duration (hrs)",
    "Expected Working Duration (hrs)",
    "Attendance Status",
    "Late Arrival Duration (mins)",
    "Overtime Duration (hrs)",
    "Approved Overtime Duration (hrs)",
    "Attendance Source",
    "Attendance Remarks",
    "Location / Address",
    "GPS Latitude",
    "GPS Longitude",
    "Google Maps Location Link",
  ];
  const widths = [16, 26, 20, 22, 16, 12, 20, 14, 14, 14, 14, 14, 14, 14, 16, 20, 36, 30, 12, 12, 24];
  worksheet.columns = widths.map((width) => ({ width }));
  worksheet.properties.defaultRowHeight = 16;
  writeHeaderRow(worksheet, headers, { height: 44 });

  for (const log of report.dailyLogs) {
    const row = worksheet.addRow([
      log.employeeCode,
      log.employeeName,
      log.designation,
      log.department,
      log.date,
      log.dayOfWeek,
      log.scheduledShift,
      log.checkInTime,
      log.checkOutTime,
      log.actualWorkingHours,
      log.expectedWorkingHours,
      log.status,
      log.lateArrivalMinutes,
      log.overtimeHours,
      log.approvedOvertimeHours,
      log.source,
      log.remarks,
      log.location,
      log.latitude,
      log.longitude,
      null,
    ]);
    const mapCell = row.getCell(21);
    if (log.mapUrl) {
      mapCell.value = { text: "Open in Google Maps", hyperlink: log.mapUrl };
      font(mapCell, { color: { argb: COLORS.blue }, underline: true, size: 9 });
    } else {
      mapCell.value = "Not Available";
      font(mapCell, { color: { argb: COLORS.gray }, size: 9 });
    }
    row.getCell(19).numFmt = "0.00000";
    row.getCell(20).numFmt = "0.00000";
  }

  const lastRow = Math.max(2, report.dailyLogs.length + 1);
  worksheet.getColumn(5).numFmt = DATE_FORMAT;
  worksheet.getColumn(10).numFmt = HOURS_FORMAT;
  worksheet.getColumn(11).numFmt = HOURS_FORMAT;
  worksheet.getColumn(14).numFmt = HOURS_FORMAT;
  worksheet.getColumn(15).numFmt = HOURS_FORMAT;
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastRow, column: headers.length },
  };
  worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: 1, topLeftCell: "C2" }];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
    paperSize: 9,
  };
  addStatusConditionalFormatting(worksheet, `L2:L${lastRow}`, 40);
  worksheet.addConditionalFormatting({
    ref: `H2:I${lastRow}`,
    rules: [{
      type: "expression",
      formulae: ['AND($H2<>"Not Available",$I2="Not Available")'],
      priority: 47,
      style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.redFill } }, font: { color: { argb: COLORS.red }, bold: true } },
    }],
  });
  setSheetTab(worksheet, COLORS.green);
}

function writeMonthlyBreakdown(worksheet: ExcelJS.Worksheet, report: AttendanceReport): void {
  const headers = [
    "Month",
    "Employee ID",
    "Employee Name",
    "Present Days",
    "Absent Days",
    "Half Days",
    "Leave Days",
    "Attendance %",
    "Regular Working Hours",
    "Approved Overtime Hours",
  ];
  const widths = [20, 18, 28, 14, 14, 12, 12, 14, 20, 22];
  worksheet.columns = widths.map((width) => ({ width }));
  worksheet.properties.defaultRowHeight = 18;
  writeHeaderRow(worksheet, headers);

  report.monthlyBreakdown.forEach((entry, index) => {
    const row = worksheet.addRow([
      entry.monthLabel,
      entry.employeeCode,
      entry.employeeName,
      entry.presentDays,
      entry.absentDays,
      entry.halfDays,
      entry.leaveDays,
      entry.attendancePercent,
      entry.regularWorkingHours,
      entry.approvedOvertimeHours,
    ]);
    styleTableRow(row, headers.length, index % 2 === 1);
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
    for (let column = 4; column <= 10; column += 1) {
      row.getCell(column).alignment = { vertical: "middle", horizontal: "center" };
    }
    row.getCell(7).numFmt = "0.0";
    row.getCell(8).numFmt = PERCENT_FORMAT;
    row.getCell(9).numFmt = HOURS_FORMAT;
    row.getCell(10).numFmt = HOURS_FORMAT;
  });

  const lastDataRow = Math.max(1, report.monthlyBreakdown.length + 1);
  if (report.monthlyBreakdown.length > 0) {
    const totalsRowIndex = lastDataRow + 1;
    const totalsRow = worksheet.getRow(totalsRowIndex);
    totalsRow.getCell(1).value = "TOTAL / AVERAGE";
    worksheet.mergeCells(totalsRowIndex, 1, totalsRowIndex, 3);
    [4, 5, 6, 7, 9, 10].forEach((column) => {
      const letter = columnLetter(column);
      totalsRow.getCell(column).value = { formula: `SUM(${letter}2:${letter}${lastDataRow})` };
    });
    totalsRow.getCell(8).value = { formula: `IFERROR(AVERAGE(H2:H${lastDataRow}),0)` };
    for (let column = 1; column <= 10; column += 1) {
      const cell = totalsRow.getCell(column);
      fillCell(cell, COLORS.navy);
      font(cell, { bold: true, size: 10, color: { argb: COLORS.white } });
      align(cell, column === 1 ? "left" : "center");
      applyBorder(cell);
    }
    totalsRow.getCell(7).numFmt = "0.0";
    totalsRow.getCell(8).numFmt = PERCENT_FORMAT;
    totalsRow.getCell(9).numFmt = HOURS_FORMAT;
    totalsRow.getCell(10).numFmt = HOURS_FORMAT;
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastDataRow, column: headers.length },
  };
  worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: 1, topLeftCell: "C2" }];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
    paperSize: 9,
  };
  addAttendancePercentConditionalFormatting(worksheet, `H2:H${lastDataRow}`, 50);
  setSheetTab(worksheet, COLORS.amber);
}

function writeLocationDetails(worksheet: ExcelJS.Worksheet, report: AttendanceReport): void {
  const headers = [
    "Employee Name",
    "Attendance Date",
    "Check-in Location",
    "Check-out Location",
    "Check-in Coordinates",
    "Check-out Coordinates",
    "Google Maps Link",
    "Attendance Source",
    "Location Availability",
  ];
  const widths = [28, 18, 32, 22, 24, 22, 24, 22, 28];
  worksheet.columns = widths.map((width) => ({ width }));
  worksheet.properties.defaultRowHeight = 18;
  writeHeaderRow(worksheet, headers);

  if (report.locationRows.length === 0) {
    worksheet.mergeCells(2, 1, 2, headers.length);
    const note = worksheet.getCell(2, 1);
    note.value = "No GPS location data was captured for the selected reporting period and filters. Location fields are reported as Not Available for all records.";
    font(note, { italic: true, color: { argb: COLORS.gray } });
    align(note, "left", true);
    worksheet.getRow(2).height = 34;
  } else {
    report.locationRows.forEach((entry, index) => {
      const row = worksheet.addRow([
        entry.employeeName,
        entry.date,
        entry.checkInLocation,
        entry.checkOutLocation,
        `${entry.checkInLatitude}, ${entry.checkInLongitude}`,
        entry.checkOutLatitude !== null && entry.checkOutLongitude !== null
          ? `${entry.checkOutLatitude}, ${entry.checkOutLongitude}`
          : "Not Available",
        null,
        entry.attendanceSource,
        entry.locationAvailability,
      ]);
      styleTableRow(row, headers.length, index % 2 === 1);
      row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(2).numFmt = DATE_FORMAT;
      const linkCell = row.getCell(7);
      linkCell.value = { text: "Open in Google Maps", hyperlink: entry.mapUrl };
      font(linkCell, { color: { argb: COLORS.blue }, underline: true, size: 9 });
    });
  }

  const lastRow = Math.max(2, report.locationRows.length + 1);
  if (report.locationRows.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: lastRow, column: headers.length },
    };
  }
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
    paperSize: 9,
  };
  setSheetTab(worksheet, COLORS.purple);
}

export async function generateAttendanceReportWorkbook(report: AttendanceReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Swayog Dashboard";
  workbook.lastModifiedBy = report.generatedBy;
  workbook.created = report.generatedAt;
  workbook.modified = report.generatedAt;
  workbook.title = "Swayog Attendance Analysis Report";
  workbook.subject = `${report.reportType} attendance report - ${report.periodLabel}`;
  workbook.company = report.companyName;
  workbook.description = report.policyNote;
  workbook.keywords = "attendance, employee, report, dashboard, overtime, leave, GPS";
  workbook.calcProperties.fullCalcOnLoad = true;

  const dashboard = workbook.addWorksheet(DASHBOARD_SHEET);
  const summary = workbook.addWorksheet(SUMMARY_SHEET);
  const logs = workbook.addWorksheet(LOGS_SHEET);
  const monthly = workbook.addWorksheet(MONTHLY_SHEET);
  const location = workbook.addWorksheet(LOCATION_SHEET);

  const chartSpecs = writeDashboard(dashboard, report);
  writeEmployeeSummary(summary, report);
  writeDailyLogs(logs, report);
  writeMonthlyBreakdown(monthly, report);
  writeLocationDetails(location, report);

  const workbookBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const withCharts = await addCharts(workbookBuffer, chartSpecs);

  if (process.env.ATTENDANCE_REPORT_VALIDATE !== "false") {
    const validation = await validate(withCharts);
    if (!validation.valid) {
      throw new Error(`Attendance report workbook failed validation: ${validation.errors.join("; ")}`);
    }
    if (validation.warnings.length > 0) {
      console.warn("[attendance-report] Workbook validation warnings:", validation.warnings.join("; "));
    }
  }

  return Buffer.from(withCharts);
}

export function summarizeReportForLog(report: AttendanceReport): string {
  return [
    `${report.reportType} ${report.periodLabel}`,
    `${report.dashboard.totalEmployees} employees`,
    `${report.dailyLogs.length} daily rows`,
    `${report.monthlyBreakdown.length} monthly rows`,
    `${report.locationRows.length} GPS rows`,
  ].join(", ");
}
