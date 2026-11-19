import { prisma } from "../lib/prisma.js";
import { getRulesAsync } from "./attendanceService.js";

function differenceInMinutes(later: Date, earlier: Date): number {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 60000));
}

export interface ShiftTimingConfig {
  shiftStart: string;
  shiftEnd: string;
  dailyWorkingHours: number;
  graceMinutes: number;
}

/**
 * Resolves the authoritative shift timing configuration.
 * Reads company rules, calculates shiftEnd from dailyWorkingHours if missing,
 * and allows for future employee-level shift specialization.
 */
export async function getEffectiveShiftTiming(employeeId?: string): Promise<ShiftTimingConfig> {
  const rules = await getRulesAsync();

  const shiftStart = rules.shiftStart || "10:30";
  const dailyWorkingHours = typeof rules.dailyWorkingHours === "number" && rules.dailyWorkingHours > 0
    ? rules.dailyWorkingHours
    : 8.0;
  const graceMinutes = typeof rules.autoCheckoutGraceMinutes === "number" && rules.autoCheckoutGraceMinutes >= 0
    ? rules.autoCheckoutGraceMinutes
    : 30;

  // Resolve shiftEnd: use configured shiftEnd, or calculate shiftStart + dailyWorkingHours
  let shiftEnd = rules.shiftEnd;
  if (!shiftEnd || !/^\d{1,2}:\d{2}$/.test(shiftEnd)) {
    const [sh, sm] = shiftStart.split(":").map(Number);
    const startMinutes = (isNaN(sh) ? 10 : sh) * 60 + (isNaN(sm) ? 30 : sm);
    const endMinutes = (startMinutes + Math.round(dailyWorkingHours * 60)) % (24 * 60);
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    shiftEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }

  return {
    shiftStart,
    shiftEnd,
    dailyWorkingHours,
    graceMinutes,
  };
}

/**
 * Converts a date and an IST time string (e.g. "18:30") to a UTC Date object.
 */
export function getUtcTimeFromIst(recordDate: Date, timeStr: string): Date {
  const parts = timeStr.trim().split(":").map(Number);
  const hours = isNaN(parts[0]) ? 18 : parts[0];
  const minutes = isNaN(parts[1]) ? 30 : parts[1];

  // Convert Indian Standard Time (IST = UTC+5:30) to UTC
  const totalMinutesIst = hours * 60 + minutes;
  let totalMinutesUtc = totalMinutesIst - 330; // 5 hours 30 min

  let dayOffset = 0;
  if (totalMinutesUtc < 0) {
    totalMinutesUtc += 24 * 60;
    dayOffset = -1;
  } else if (totalMinutesUtc >= 24 * 60) {
    totalMinutesUtc -= 24 * 60;
    dayOffset = 1;
  }

  const utcHours = Math.floor(totalMinutesUtc / 60);
  const utcMinutes = totalMinutesUtc % 60;

  const result = new Date(Date.UTC(
    recordDate.getUTCFullYear(),
    recordDate.getUTCMonth(),
    recordDate.getUTCDate(),
    utcHours,
    utcMinutes,
    0,
    0
  ));

  if (dayOffset !== 0) {
    result.setUTCDate(result.getUTCDate() + dayOffset);
  }

  return result;
}

/**
 * Automatically finalizes missing check-outs once shift end + grace period has elapsed.
 * - Idempotent: Can be run repeatedly safely.
 * - Preserves actual check-out times and manual administrative overrides.
 * - Records full audit details distinguishing actual device punches from system-generated closures.
 */
export async function processMissingCheckOuts(): Promise<{
  processedCount: number;
  closedRecords: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    checkInTime: Date;
    checkOutTime: Date;
    totalMinutes: number;
  }>;
}> {
  const now = new Date();
  const timing = await getEffectiveShiftTiming();

  // Find all attendance records with check-in recorded but NO check-out time
  // Eligible records: employee self check-ins (manualOverride: false) or
  // forgot-punch self-punch records (displayAsSelfPunch: true) where check-out is genuinely missing.
  // Records explicitly finalized by admin without self-punch are preserved.
  const openRecords = await prisma.attendanceRecord.findMany({
    where: {
      checkInTime: { not: null },
      checkOutTime: null,
      OR: [
        { manualOverride: false },
        { displayAsSelfPunch: true },
      ],
      status: {
        notIn: ["LEAVE", "HOLIDAY", "ABSENT"],
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const closedRecords: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    checkInTime: Date;
    checkOutTime: Date;
    totalMinutes: number;
  }> = [];

  for (const record of openRecords) {
    if (!record.checkInTime) continue;

    // Calculate scheduled shift end time and cutoff time for this record's date
    const scheduledCheckOutUtc = getUtcTimeFromIst(record.date, timing.shiftEnd);
    const cutoffUtc = new Date(scheduledCheckOutUtc.getTime() + timing.graceMinutes * 60 * 1000);

    // If shift has not ended yet and grace period has not elapsed, leave it open for active employee
    if (now < cutoffUtc) {
      continue;
    }

    // Check if employee has an active verified overtime session
    try {
      const activeOt = await prisma.overtimeSession.findFirst({
        where: {
          employeeId: record.employeeId,
          status: "ACTIVE",
        },
      });
      if (activeOt) {
        // Employee is actively working an approved overtime session; do not close prematurely
        continue;
      }
    } catch {
      // Overtime check failure non-blocking
    }

    // Calculate regular working hours (capped at scheduled shift end)
    const checkInDate = new Date(record.checkInTime);
    const totalMinutes = differenceInMinutes(scheduledCheckOutUtc, checkInDate);

    // Status: If under 4 hours (240 mins), mark HALF_DAY, otherwise keep PRESENT / LATE
    const newStatus = totalMinutes < 240 ? "HALF_DAY" : record.status;

    // Execute idempotent update
    await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutTime: scheduledCheckOutUtc,
        effectiveCheckOutTime: scheduledCheckOutUtc,
        actualCheckOutTime: null, // Employee device punch was not captured
        checkOutSource: "SYSTEM_AUTO_CLOSURE",
        autoClosedAt: now,
        autoClosureReason: "SCHEDULED_SHIFT_END_AUTO_CHECKOUT",
        totalMinutes,
        overtimeMinutes: 0, // Unverified time after shift end is not counted as overtime
        status: newStatus,
      },
    });

    closedRecords.push({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee?.fullName || "Employee",
      date: record.date.toISOString().slice(0, 10),
      checkInTime: checkInDate,
      checkOutTime: scheduledCheckOutUtc,
      totalMinutes,
    });
  }

  if (closedRecords.length > 0) {
    console.log(`[AutoCheckout] Successfully auto-finalized ${closedRecords.length} missing check-out records at configured shift end (${timing.shiftEnd}).`);
  }

  return {
    processedCount: closedRecords.length,
    closedRecords,
  };
}
