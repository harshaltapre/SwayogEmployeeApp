import { prisma } from "../lib/prisma.js";
import { TaskStatus } from "@prisma/client";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setMilliseconds(0);
  return value;
}

function startOfMonth(date: Date) {
  const value = new Date(date.getFullYear(), date.getMonth(), 1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfMonth(date: Date) {
  const value = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  value.setHours(23, 59, 59, 999);
  return value;
}

function differenceInMinutes(later: Date, earlier: Date) {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 60000));
}

import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { sendAdminEmailIfConfigured } from "../lib/mailer.js";

export async function getRulesAsync() {
  try {
    let dbRule = await prisma.attendanceRule.findUnique({
      where: { id: "default" },
    });
    if (!dbRule) {
      dbRule = await prisma.attendanceRule.create({
        data: {
          id: "default",
          shiftStart: "09:15",
          faceRequired: true,
          geofenceEnabled: false,
          officeLat: 18.5204,
          officeLng: 73.8567,
          officeRadius: 150.0,
          faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55"),
          weeklyOffDays: [0],
          dailyWorkingHours: 9.0,
        },
      });
    }
    return dbRule;
  } catch (err) {
    console.error("Failed to read rules from DB, returning defaults:", err);
    return {
      id: "default",
      shiftStart: "09:15",
      faceRequired: true,
      geofenceEnabled: false,
      officeLat: 18.5204,
      officeLng: 73.8567,
      officeRadius: 150.0,
      faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55"),
      weeklyOffDays: [0],
      dailyWorkingHours: 9.0,
    };
  }
}

export async function saveRulesAsync(rules: any) {
  try {
    await prisma.attendanceRule.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        shiftStart: rules.shiftStart ?? "09:15",
        faceRequired: rules.faceRequired !== false,
        geofenceEnabled: rules.geofenceEnabled === true,
        officeLat: rules.officeLat != null ? parseFloat(rules.officeLat) : 18.5204,
        officeLng: rules.officeLng != null ? parseFloat(rules.officeLng) : 73.8567,
        officeRadius: rules.officeRadius != null ? parseFloat(rules.officeRadius) : 150.0,
        faceMatchThreshold: rules.faceMatchThreshold != null ? parseFloat(rules.faceMatchThreshold) : 0.55,
        weeklyOffDays: Array.isArray(rules.weeklyOffDays) ? rules.weeklyOffDays.map(Number) : [0],
        dailyWorkingHours: rules.dailyWorkingHours != null ? parseFloat(rules.dailyWorkingHours) : 9.0,
      },
      update: {
        shiftStart: rules.shiftStart ?? "09:15",
        faceRequired: rules.faceRequired !== false,
        geofenceEnabled: rules.geofenceEnabled === true,
        officeLat: rules.officeLat != null ? parseFloat(rules.officeLat) : 18.5204,
        officeLng: rules.officeLng != null ? parseFloat(rules.officeLng) : 73.8567,
        officeRadius: rules.officeRadius != null ? parseFloat(rules.officeRadius) : 150.0,
        faceMatchThreshold: rules.faceMatchThreshold != null ? parseFloat(rules.faceMatchThreshold) : 0.55,
        weeklyOffDays: Array.isArray(rules.weeklyOffDays) ? rules.weeklyOffDays.map(Number) : undefined,
        dailyWorkingHours: rules.dailyWorkingHours != null ? parseFloat(rules.dailyWorkingHours) : undefined,
      },
    });
    return true;
  } catch (err) {
    console.error("Failed to save rules to DB:", err);
    return false;
  }
}

export async function getHolidaysAsync(startDate?: Date, endDate?: Date) {
  try {
    const where: any = {};
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    }
    return await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });
  } catch (err) {
    console.error("Failed to fetch holidays:", err);
    return [];
  }
}

export async function createHolidayAsync(data: {
  date: string | Date;
  name: string;
  description?: string | null;
  createdBy?: string | null;
}) {
  let targetDate: Date;
  if (typeof data.date === "string") {
    const clean = data.date.split("T")[0];
    const parts = clean.split("-").map(Number);
    targetDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
  } else {
    targetDate = new Date(Date.UTC(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 0, 0, 0, 0));
  }

  return await prisma.holiday.upsert({
    where: { date: targetDate },
    create: {
      date: targetDate,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      createdBy: data.createdBy ?? null,
    },
    update: {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      createdBy: data.createdBy ?? null,
    },
  });
}

export async function updateHolidayAsync(
  id: string,
  data: { date?: string | Date; name?: string; description?: string | null }
) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
  if (data.date !== undefined) {
    if (typeof data.date === "string") {
      const clean = data.date.split("T")[0];
      const parts = clean.split("-").map(Number);
      updateData.date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
    } else {
      updateData.date = new Date(Date.UTC(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 0, 0, 0, 0));
    }
  }

  return await prisma.holiday.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteHolidayAsync(id: string) {
  return await prisma.holiday.delete({
    where: { id },
  });
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export async function checkIn(employeeId: string, opts?: { selfieDataUrl?: string | null; latitude?: number | null; longitude?: number | null }) {
  const today = startOfDay(new Date());
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing?.checkInTime) {
    throw new Error("Already checked in today");
  }

  if (existing && existing.source === "ADMIN_ASSIGNED") {
    throw new Error("Attendance for today has already been marked or assigned by your administrator.");
  }

  // Prevent employee check-in if attendance was already recorded/assigned by administrator
  if (existing && (existing.manualOverride || (existing.status === "PRESENT" && !existing.checkInTime) || existing.status === "LEAVE" || existing.status === "HOLIDAY" || (existing.status === "ABSENT" && existing.manualOverride))) {
    throw new Error(
      existing.status === "LEAVE"
        ? "Your attendance status for today is already marked as LEAVE."
        : existing.status === "HOLIDAY"
        ? "Today is a company holiday; check-in is not required."
        : "Attendance has already been recorded for today by administrator."
    );
  }

  const rules = await getRulesAsync();

  // Validate geofence
  if (rules.geofenceEnabled) {
    if (opts?.latitude === null || opts?.longitude === null || opts?.latitude === undefined || opts?.longitude === undefined) {
      throw new Error("Geofencing is enabled. Access to GPS location is required to check in.");
    }
    
    const dist = getDistanceInMeters(
      Number(opts.latitude),
      Number(opts.longitude),
      rules.officeLat,
      rules.officeLng
    );
    if (dist > rules.officeRadius) {
      throw new Error(`Location verification failed. You are ${Math.round(dist)}m away from the office (Allowed radius: ${rules.officeRadius}m).`);
    }
  }

  const now = new Date();
  const [sh, sm] = rules.shiftStart.split(":").map(Number);
  const graceTime = new Date(today);
  graceTime.setHours(sh, sm, 0, 0);
  const status = now > graceTime ? "LATE" : "PRESENT";

  // Upsert attendance record with source set to EMPLOYEE_CHECK_IN
  const attendance = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    create: { employeeId, date: today, checkInTime: now, status, source: "EMPLOYEE_CHECK_IN" },
    update: { checkInTime: now, status, source: "EMPLOYEE_CHECK_IN" },
  });

  // Handle selfie upload (data URL) if provided
  let selfieUrl: string | null = null;
  if (opts?.selfieDataUrl) {
    try {
      const matches = opts.selfieDataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
      const uploadsDir = path.join(process.cwd(), "uploads", "checkins");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const filename = `${Date.now()}_${employeeId}.jpg`;
      const outPath = path.join(uploadsDir, filename);

      if (matches) {
        const base64Data = matches[3];
        fs.writeFileSync(outPath, Buffer.from(base64Data, "base64"));
        selfieUrl = `/uploads/checkins/${filename}`;
      } else {
        // If not a data URL, ignore
      }
    } catch (err) {
      // Log but don't fail main check-in
      console.error("Error saving selfie:", err);
    }
  }

  // Create CheckIn record
  const checkInRecord = await prisma.checkIn.create({
    data: {
      employeeId,
      selfieUrl: selfieUrl ?? null,
      latitude: opts?.latitude ?? null,
      longitude: opts?.longitude ?? null,
      status: "CHECKED_IN",
    },
  });

  // Create AdminNotification
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  const message = `${employee?.fullName ?? "Employee"} checked in at ${now.toISOString()}`;

  await prisma.adminNotification.create({
    data: {
      type: "CHECKIN_SELFIE",
      message,
      imageUrl: selfieUrl ?? null,
      employeeId,
    },
  });

  // Send email to admins if configured
  try {
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true } });
    const toEmails = admins.map((a) => a.email).filter(Boolean);
    if (toEmails.length > 0) {
      const subject = `Check-in: ${employee?.fullName ?? "Employee"}`;
      const text = message;
      const imagePath = selfieUrl ? path.join(process.cwd(), selfieUrl.replace(/^\//, "")) : null;
      await sendAdminEmailIfConfigured(toEmails, subject, text, imagePath);
    }
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }

  await recalculateMonthlyPerformance(employeeId).catch((err) => {
    console.error("Failed to recalculate performance on check-in:", err);
  });

  return { attendance, checkInRecord };
}

export function determineAttendanceSource(record: {
  manualOverride?: boolean;
  reviewedBy?: string | null;
  checkInTime?: Date | null;
  status: string;
}): string {
  if (record.manualOverride || record.reviewedBy) {
    return record.checkInTime ? "ADMIN_CORRECTION" : "ADMIN_MARKED";
  }
  if (record.status === "LEAVE") return "LEAVE";
  if (record.status === "HOLIDAY") return "HOLIDAY";
  if (record.status === "ABSENT") return "ABSENT";
  if (record.checkInTime) return "EMPLOYEE_CHECK_IN";
  return "SYSTEM_GENERATED";
}

export function isRecordAttendanceCompleted(record: {
  manualOverride?: boolean;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  status: string;
}): boolean {
  if (record.manualOverride) return true;
  if (record.status === "PRESENT" && !record.checkInTime) return true;
  if (record.checkOutTime != null) return true;
  if (record.status === "LEAVE" || record.status === "HOLIDAY" || record.status === "ABSENT") return true;
  return false;
}

export async function checkOut(employeeId: string) {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!record) {
    throw new Error("No attendance record found for today");
  }
  if (record.checkOutTime) {
    throw new Error("Already checked out today");
  }
  if (record.manualOverride && !record.checkInTime) {
    throw new Error("Attendance was completed by administrator; check-out is not required.");
  }
  if (!record.checkInTime) {
    throw new Error("No check-in found for today");
  }

  const now = new Date();
  const totalMinutes = differenceInMinutes(now, record.checkInTime);
  const status = totalMinutes < 240 ? "HALF_DAY" : record.status;

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { checkOutTime: now, totalMinutes, status },
  });

  await recalculateMonthlyPerformance(employeeId);
  return updated;
}

export async function getTodayAttendance(employeeId: string) {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!record) return null;

  let reviewerName: string | null = null;
  if (record.reviewedBy) {
    const reviewer = await prisma.user.findUnique({
      where: { id: record.reviewedBy },
      select: { fullName: true },
    });
    reviewerName = reviewer?.fullName || "Administrator";
  }

  const source = determineAttendanceSource(record);
  const isAttendanceCompleted = isRecordAttendanceCompleted(record);

  // Fetch CheckIn record for GPS info if employee checked in
  let latitude: number | null = null;
  let longitude: number | null = null;
  let selfieUrl: string | null = null;
  if (record.checkInTime) {
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        employeeId,
        createdAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "asc" },
      select: { latitude: true, longitude: true, selfieUrl: true },
    });
    if (checkIn) {
      latitude = checkIn.latitude;
      longitude = checkIn.longitude;
      selfieUrl = checkIn.selfieUrl;
    }
  }

  return {
    ...record,
    source,
    reviewerName,
    isAttendanceCompleted,
    requiresCheckIn: !isAttendanceCompleted && record.checkInTime == null,
    latitude,
    longitude,
    selfieUrl,
  };
}

export async function getMonthlyAttendance(employeeId: string, month: number, year: number) {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));

  const [records, checkIns, holidays, rules] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.checkIn.findMany({
      where: { employeeId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    getRulesAsync(),
  ]);

  // Enrich records with reviewer name if manualOverride / reviewedBy is present
  const reviewerIds = [...new Set(records.map((r) => r.reviewedBy).filter(Boolean))] as string[];
  const reviewers = reviewerIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const reviewerMap = new Map(reviewers.map((u) => [u.id, u.fullName]));

  const enrichedRecords = records.map((r) => {
    const source = determineAttendanceSource(r);
    const isAttendanceCompleted = isRecordAttendanceCompleted(r);
    return {
      ...r,
      source,
      reviewerName: r.reviewedBy ? reviewerMap.get(r.reviewedBy) || "Administrator" : null,
      isAttendanceCompleted,
      requiresCheckIn: !isAttendanceCompleted && r.checkInTime == null,
    };
  });

  // Build a set of festival holiday date strings (YYYY-MM-DD)
  const holidayDateSet = new Set<string>();
  const holidayList = holidays.map((h) => {
    const d = new Date(h.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    holidayDateSet.add(dateStr);
    return {
      id: h.id,
      date: h.date,
      dateStr,
      name: h.name,
      description: h.description,
    };
  });

  const weeklyOffDays: number[] = rules.weeklyOffDays && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays : [0];
  const workingDays = getWorkingDays(start, end, holidayDateSet, weeklyOffDays);
  
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const halfDays = records.filter((r) => r.status === "HALF_DAY").length;
  const leaves = records.filter((r) => r.status === "LEAVE").length;
  const adminAssignedCount = records.filter((r) => r.source === "ADMIN_ASSIGNED").length;
  const explicitAbsent = records.filter((r) => r.status === "ABSENT").length;

  const attendedTotal = presentCount + lateCount;
  const absent = Math.max(explicitAbsent, workingDays - attendedTotal - halfDays - leaves);
  const attendancePercent = workingDays > 0
    ? Math.round(((attendedTotal + halfDays * 0.5) / workingDays) * 100)
    : 0;

  const totalMinutes = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
  const totalLoggedHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    records: enrichedRecords,
    checkIns,
    holidays: holidayList,
    present: attendedTotal,
    onTime: presentCount,
    late: lateCount,
    halfDays,
    leaves,
    absent,
    adminAssignedCount,
    workingDays,
    attendancePercent,
    totalLoggedHours,
    rules: {
      weeklyOffDays,
      shiftStart: rules.shiftStart,
      dailyWorkingHours: rules.dailyWorkingHours ?? 9.0,
    },
  };
}

export async function applyOrUpdateAttendanceRecord(params: {
  employeeId: string;
  date: string | Date;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "LEAVE";
  checkInTime?: string | null;
  checkOutTime?: string | null;
  remark: string;
  adminUserId: string;
  source?: string;
}) {
  const { employeeId, date, status, checkInTime, checkOutTime, remark, adminUserId, source } = params;

  if (!remark || remark.trim().length < 3) {
    throw new Error("A remark explaining why the employee forgot or why attendance is being updated is required (at least 3 characters).");
  }

  // Parse date - handles YYYY-MM-DD cleanly in UTC for @db.Date
  let targetDay: Date;
  if (typeof date === "string") {
    const cleanDateStr = date.split("T")[0];
    const parts = cleanDateStr.split("-").map(Number);
    if (parts.length === 3) {
      targetDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
    } else {
      targetDay = new Date(date);
    }
  } else {
    targetDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  }

  let checkInDateTime: Date | null = null;
  let checkOutDateTime: Date | null = null;

  // Helper to convert time strings (e.g. "10:30", "06:30", "6:30 PM", ISO) to UTC timestamps in IST (+5:30)
  const parseTimeToUtcDate = (timeInput: string, isCheckOut = false): Date => {
    const clean = timeInput.trim();
    if (clean.includes("T")) {
      return new Date(clean);
    }

    let isPm = false;
    let isAm = false;
    let timeOnly = clean;

    if (/pm/i.test(clean)) {
      isPm = true;
      timeOnly = clean.replace(/pm/i, "").trim();
    } else if (/am/i.test(clean)) {
      isAm = true;
      timeOnly = clean.replace(/am/i, "").trim();
    }

    const parts = timeOnly.split(":").map((p) => parseInt(p, 10));
    let hours = isNaN(parts[0]) ? 0 : parts[0];
    const minutes = isNaN(parts[1]) ? 0 : parts[1];

    if (isPm && hours < 12) {
      hours += 12;
    } else if (isAm && hours === 12) {
      hours = 0;
    } else if (!isPm && !isAm) {
      // For check-out in work shift, if hour is 1-7 (e.g. 6:30 or 06:30), admin intended afternoon/evening PM (18:30)
      if (isCheckOut && hours >= 1 && hours <= 7) {
        hours += 12;
      }
    }

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

    const result = new Date(targetDay);
    if (dayOffset !== 0) {
      result.setUTCDate(result.getUTCDate() + dayOffset);
    }
    result.setUTCHours(utcHours, utcMinutes, 0, 0);
    return result;
  };

  // Save ONLY the times explicitly included by admin - no shift timing fallbacks
  if (checkInTime && typeof checkInTime === "string" && checkInTime.trim() !== "" && status !== "ABSENT" && status !== "LEAVE") {
    checkInDateTime = parseTimeToUtcDate(checkInTime, false);
  }

  if (checkOutTime && typeof checkOutTime === "string" && checkOutTime.trim() !== "" && status !== "ABSENT" && status !== "LEAVE") {
    checkOutDateTime = parseTimeToUtcDate(checkOutTime, true);
  }

  let totalMinutes: number | null = null;
  if (checkInDateTime && checkOutDateTime) {
    totalMinutes = differenceInMinutes(checkOutDateTime, checkInDateTime);
  }

  const attendance = await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: targetDay,
      },
    },
    create: {
      employeeId,
      date: targetDay,
      status: status as any,
      source: source || "ADMIN_ASSIGNED",
      checkInTime: checkInDateTime,
      checkOutTime: checkOutDateTime,
      totalMinutes,
      manualOverride: true,
      overrideReason: remark.trim(),
      notes: remark.trim(),
      reviewedBy: adminUserId,
      flagged: false,
    },
    update: {
      status: status as any,
      source: source || "ADMIN_ASSIGNED",
      checkInTime: checkInDateTime,
      checkOutTime: checkOutDateTime,
      totalMinutes,
      manualOverride: true,
      overrideReason: remark.trim(),
      notes: remark.trim(),
      reviewedBy: adminUserId,
      flagged: false,
    },
  });

  // If a CheckIn record exists for this day, update its override status
  const nextDay = new Date(targetDay.getTime() + 24 * 60 * 60 * 1000);
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      employeeId,
      createdAt: {
        gte: targetDay,
        lt: nextDay,
      },
    },
  });

  if (existingCheckIn) {
    await prisma.checkIn.update({
      where: { id: existingCheckIn.id },
      data: {
        manualOverride: true,
        overrideReason: remark.trim(),
        reviewedBy: adminUserId,
        flagged: false,
        status: status === "ABSENT" || status === "LEAVE" ? "CHECKED_OUT" : "CHECKED_IN",
      },
    }).catch(() => {});
  } else if (status !== "ABSENT" && status !== "LEAVE") {
    await prisma.checkIn.create({
      data: {
        employeeId,
        status: "CHECKED_IN",
        manualOverride: true,
        overrideReason: remark.trim(),
        reviewedBy: adminUserId,
        createdAt: checkInDateTime || targetDay,
      },
    }).catch(() => {});
  }

  // Recalculate monthly performance for that employee
  const targetMonth = targetDay.getMonth() + 1;
  const targetYear = targetDay.getFullYear();
  const performance = await recalculateMonthlyPerformance(employeeId, targetMonth, targetYear);

  return { attendance, performance };
}


/**
 * Counts working days between start and end (inclusive), up to today.
 * Weekly offs: Based on configured weeklyOffDays (default: Sunday [0]).
 * Declared festival holidays: Any date matching a configured festival holiday is excluded.
 */
function getWorkingDays(start: Date, end: Date, holidayDateSet?: Set<string>, weeklyOffDays: number[] = [0]) {
  let count = 0;
  const current = new Date(start);
  const today = new Date();

  while (current <= end && current <= today) {
    const day = current.getDay();
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    // Skip weekly offs and any declared festival holidays
    if (!weeklyOffDays.includes(day) && (!holidayDateSet || !holidayDateSet.has(dateStr))) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export async function recalculateMonthlyPerformance(employeeId: string, monthOverride?: number, yearOverride?: number) {
  const now = new Date();
  const month = monthOverride ?? now.getMonth() + 1;
  const year = yearOverride ?? now.getFullYear();

  const { attendancePercent, present, absent } = await getMonthlyAttendance(employeeId, month, year);
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));

  const tasks = await prisma.task.findMany({
    where: { employeeUserId: employeeId, createdAt: { gte: start, lte: end } },
  });

  const tasksAssigned = tasks.length;
  const tasksCompleted = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
  const taskCompletionRate = tasksAssigned > 0
    ? Math.round((tasksCompleted / tasksAssigned) * 100)
    : 0;

  const submissions = await prisma.workSubmission.findMany({
    where: {
      employeeId,
      submittedAt: { gte: start, lte: end },
      status: "APPROVED",
    },
  });

  const workSubmissions = submissions.length;
  const totalHoursLogged = submissions.reduce((sum, submission) => sum + submission.hoursSpent, 0);
  const scored = submissions.filter((submission) => submission.reviewScore !== null && submission.reviewScore !== undefined);
  const avgWorkScore = scored.length > 0
    ? scored.reduce((sum, submission) => sum + (submission.reviewScore ?? 0), 0) / scored.length
    : 0;

  const performanceScore = Math.round((
    (attendancePercent / 100) * 5 * 0.40 +
    (taskCompletionRate / 100) * 5 * 0.35 +
    (avgWorkScore / 5) * 5 * 0.25
  ) * 10) / 10;

  await prisma.performanceSnapshot.upsert({
    where: { employeeId_month_year: { employeeId, month, year } },
    create: {
      employeeId,
      month,
      year,
      attendancePercent,
      taskCompletionRate,
      avgWorkScore,
      totalHoursLogged,
      performanceScore,
      daysPresent: present,
      daysAbsent: absent,
      tasksAssigned,
      tasksCompleted,
      workSubmissions,
    },
    update: {
      attendancePercent,
      taskCompletionRate,
      avgWorkScore,
      totalHoursLogged,
      performanceScore,
      daysPresent: present,
      daysAbsent: absent,
      tasksAssigned,
      tasksCompleted,
      workSubmissions,
      calculatedAt: new Date(),
    },
  });

  return { attendancePercent, performanceScore, taskCompletionRate };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE REGULARIZATION (FORGOT ATTENDANCE) SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

export async function createRegularizationRequest(params: {
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "LEAVE";
  checkInTime?: string | null;
  checkInPeriod?: "AM" | "PM" | null;
  checkOutTime?: string | null;
  checkOutPeriod?: "AM" | "PM" | null;
  reason: string;
}) {
  const { employeeId, date, status, checkInTime, checkInPeriod, checkOutTime, checkOutPeriod, reason } = params;

  if (!reason || reason.trim().length < 3) {
    throw new Error("A mandatory reason explaining why you forgot or missed attendance is required (minimum 3 characters).");
  }

  // Parse target date to UTC Date
  const cleanDateStr = date.split("T")[0];
  const parts = cleanDateStr.split("-").map(Number);
  if (parts.length !== 3) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  const targetDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));

  // Check if date is in the future
  const nowUtc = new Date();
  const todayUtc = new Date(Date.UTC(nowUtc.getFullYear(), nowUtc.getMonth(), nowUtc.getDate(), 23, 59, 59, 999));
  if (targetDay.getTime() > todayUtc.getTime()) {
    throw new Error("Cannot submit attendance regularization for future dates.");
  }

  // Check if there is already a PENDING request for this employee on this date
  const existingPending = await prisma.attendanceRegularizationRequest.findFirst({
    where: {
      employeeId,
      date: targetDay,
      requestStatus: "PENDING",
    },
  });

  if (existingPending) {
    throw new Error(`You already have a pending regularization request for ${cleanDateStr}. Please wait for admin review.`);
  }

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { fullName: true, loginId: true },
  });

  const request = await prisma.attendanceRegularizationRequest.create({
    data: {
      employeeId,
      date: targetDay,
      status: status as any,
      checkInTime: checkInTime?.trim() || null,
      checkInPeriod: checkInPeriod || null,
      checkOutTime: checkOutTime?.trim() || null,
      checkOutPeriod: checkOutPeriod || null,
      reason: reason.trim(),
      requestStatus: "PENDING",
    },
  });

  // Create an Admin Notification so admins get notified
  try {
    await prisma.adminNotification.create({
      data: {
        type: "ATTENDANCE_REGULARIZATION",
        message: `${employee?.fullName || "Employee"} submitted a regularization request for ${cleanDateStr} (${status}).`,
        employeeId,
      },
    });
  } catch (notifErr) {
    console.error("Failed to create admin notification for regularization request:", notifErr);
  }

  return request;
}

export async function getEmployeeRegularizationRequests(employeeId: string) {
  return await prisma.attendanceRegularizationRequest.findMany({
    where: { employeeId },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAdminRegularizationRequests(statusFilter?: string) {
  const where: any = {};
  if (statusFilter && statusFilter !== "ALL") {
    where.requestStatus = statusFilter as any;
  }

  return await prisma.attendanceRegularizationRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          loginId: true,
          email: true,
          employeeCode: true,
          employeeProfile: {
            select: {
              jobRole: true,
              zone: true,
            },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: [
      { createdAt: "desc" },
    ],
    take: 200,
  });
}

export async function acceptRegularizationRequest(requestId: string, adminUserId: string, adminNotes?: string) {
  const request = await prisma.attendanceRegularizationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Regularization request not found.");
  }

  if (request.requestStatus !== "PENDING") {
    throw new Error(`Request has already been processed (Current status: ${request.requestStatus}).`);
  }

  // Combine time and period into standardized strings for applyOrUpdateAttendanceRecord
  let inTimeStr: string | null = null;
  if (request.checkInTime) {
    inTimeStr = request.checkInPeriod ? `${request.checkInTime} ${request.checkInPeriod}` : request.checkInTime;
  }

  let outTimeStr: string | null = null;
  if (request.checkOutTime) {
    outTimeStr = request.checkOutPeriod ? `${request.checkOutTime} ${request.checkOutPeriod}` : request.checkOutTime;
  }

  const remark = request.reason
    ? `Regularization Approved: ${request.reason}`
    : "Attendance regularized by admin approval";

  // Automatically allocate attendance for that employee and date
  const allocationResult = await applyOrUpdateAttendanceRecord({
    employeeId: request.employeeId,
    date: request.date,
    status: request.status as any,
    checkInTime: inTimeStr,
    checkOutTime: outTimeStr,
    remark,
    adminUserId,
    source: "CORRECTION_APPROVED",
  });

  // Mark request as APPROVED
  const updatedRequest = await prisma.attendanceRegularizationRequest.update({
    where: { id: requestId },
    data: {
      requestStatus: "APPROVED",
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
      adminNotes: adminNotes?.trim() || null,
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return {
    request: updatedRequest,
    attendance: allocationResult.attendance,
    performance: allocationResult.performance,
  };
}

export async function rejectRegularizationRequest(requestId: string, adminUserId: string, adminNotes?: string) {
  const request = await prisma.attendanceRegularizationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Regularization request not found.");
  }

  if (request.requestStatus !== "PENDING") {
    throw new Error(`Request has already been processed (Current status: ${request.requestStatus}).`);
  }

  const updatedRequest = await prisma.attendanceRegularizationRequest.update({
    where: { id: requestId },
    data: {
      requestStatus: "REJECTED",
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
      adminNotes: adminNotes?.trim() || "Request rejected by admin.",
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return updatedRequest;
}
