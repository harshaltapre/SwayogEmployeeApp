import { prisma } from "../lib/prisma.js";
import { TaskStatus, UserRole } from "@prisma/client";
import { createAdminNotification } from "./notificationService.js";
import { ApiError } from "../middleware/error.js";

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
import {
  evaluateAttendancePolicy,
  getKolkataTimeInfo,
  calculateHaversineDistance,
  verifyFaceToken,
} from "./attendancePolicyEngine.js";

let attendanceSchemaEnsuredPromise: Promise<void> | null = null;

async function ensureAttendanceSchemaReady(): Promise<void> {
  if (!attendanceSchemaEnsuredPromise) {
    attendanceSchemaEnsuredPromise = (async () => {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lateSequenceNumber" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lateAllowanceConsumed" BOOLEAN NOT NULL DEFAULT false;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "faceVerified" BOOLEAN NOT NULL DEFAULT false;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "gpsVerified" BOOLEAN NOT NULL DEFAULT false;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "locationAccuracy" DOUBLE PRECISION;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "policyVersionUsed" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clientUploadId" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "checkOutClientUploadId" TEXT;`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_employeeId_clientUploadId_key" ON "AttendanceRecord"("employeeId", "clientUploadId");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_employeeId_checkOutClientUploadId_key" ON "AttendanceRecord"("employeeId", "checkOutClientUploadId");`);
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "DeviceSyncHealth" (
            "id" TEXT NOT NULL,
            "employeeId" TEXT NOT NULL,
            "appVersionCode" INTEGER NOT NULL DEFAULT 0,
            "appVersionName" TEXT,
            "androidVersion" TEXT,
            "deviceModel" TEXT,
            "pendingOutboxCount" INTEGER NOT NULL DEFAULT 0,
            "failedOutboxCount" INTEGER NOT NULL DEFAULT 0,
            "lastSuccessfulSyncAt" TIMESTAMP(3),
            "lastSyncStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
            "lastSyncError" TEXT,
            "lastHttpCode" INTEGER,
            "tokenRefreshFailures" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "DeviceSyncHealth_pkey" PRIMARY KEY ("id")
          );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DeviceSyncHealth_employeeId_key" ON "DeviceSyncHealth"("employeeId");`);
      } catch (err) {
        attendanceSchemaEnsuredPromise = null;
        console.warn("[AttendanceSchemaGuard] Non-fatal schema check warning:", err);
      }
    })();
  }
  await attendanceSchemaEnsuredPromise;
}

async function withAttendanceSchemaGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.code === "P2022" || err?.code === "P2021") {
      console.warn(`[AttendanceSchemaGuard] Detected missing schema object (${err.code}); applying additive guard and retrying`);
      attendanceSchemaEnsuredPromise = null;
      await ensureAttendanceSchemaReady();
      return await fn();
    }
    throw err;
  }
}

export class AttendanceConflictError extends Error {
  readonly statusCode = 409;
  readonly code = "ATTENDANCE_CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "AttendanceConflictError";
  }
}

export class AttendanceValidationError extends Error {
  readonly statusCode = 422;
  readonly code = "ATTENDANCE_VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "AttendanceValidationError";
  }
}

export const DEFAULT_SWAYOG_OFFICE_LAT = 21.175401747696093;
export const DEFAULT_SWAYOG_OFFICE_LNG = 79.05111036149488;
export const DEFAULT_SWAYOG_OFFICE_NAME = "Swayog Energy Pvt. Ltd., Nagpur";

export function isValidCoordinate(lat: any, lng: any): boolean {
  if (lat == null || lng == null) return false;
  const nLat = typeof lat === "number" ? lat : parseFloat(String(lat));
  const nLng = typeof lng === "number" ? lng : parseFloat(String(lng));
  if (isNaN(nLat) || isNaN(nLng)) return false;
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) return false;
  if (nLat === 0 && nLng === 0) return false;
  return true;
}

export function getAuthoritativeWorkplaceLocation(rules?: any): {
  latitude: number;
  longitude: number;
  name: string;
} {
  // Priority 1: Explicit environment variable configuration
  const envLat = process.env.WORKPLACE_LAT ? parseFloat(process.env.WORKPLACE_LAT) : (env?.WORKPLACE_LAT ?? null);
  const envLng = process.env.WORKPLACE_LNG ? parseFloat(process.env.WORKPLACE_LNG) : (env?.WORKPLACE_LNG ?? null);
  if (isValidCoordinate(envLat, envLng)) {
    return {
      latitude: Number(envLat),
      longitude: Number(envLng),
      name: process.env.WORKPLACE_NAME || env?.WORKPLACE_NAME || DEFAULT_SWAYOG_OFFICE_NAME,
    };
  }

  // Priority 2: Configured rules from DB if valid and not an outdated template placeholder or previous rounded coords
  if (rules && isValidCoordinate(rules.officeLat, rules.officeLng)) {
    const rLat = Number(rules.officeLat);
    const rLng = Number(rules.officeLng);
    const isOldPunePlaceholder = Math.abs(rLat - 18.5204) < 0.001 && Math.abs(rLng - 73.8567) < 0.001;
    const isOldNagpurPlaceholder = Math.abs(rLat - 21.1458) < 0.001 && Math.abs(rLng - 79.0882) < 0.001;

    if (!isOldPunePlaceholder && !isOldNagpurPlaceholder) {
      return {
        latitude: rLat,
        longitude: rLng,
        name: process.env.WORKPLACE_NAME || env?.WORKPLACE_NAME || DEFAULT_SWAYOG_OFFICE_NAME,
      };
    }
  }

  // Priority 3: Exact authoritative default coordinates for Swayog Energy Pvt. Ltd. workplace
  return {
    latitude: DEFAULT_SWAYOG_OFFICE_LAT,
    longitude: DEFAULT_SWAYOG_OFFICE_LNG,
    name: process.env.WORKPLACE_NAME || env?.WORKPLACE_NAME || DEFAULT_SWAYOG_OFFICE_NAME,
  };
}

export function resolveAttendanceLocationSync(params: {
  actualLatitude?: number | null;
  actualLongitude?: number | null;
  isSelfPunchDisplay: boolean;
  isAdminAppliedOrRegularized: boolean;
  rules?: any;
}): {
  latitude: number | null;
  longitude: number | null;
  location_source: "ACTUAL_GPS" | "WORKPLACE_FALLBACK" | "UNAVAILABLE";
  actual_gps_captured: boolean;
  workplace_location_name?: string | null;
} {
  const { actualLatitude, actualLongitude, isSelfPunchDisplay, isAdminAppliedOrRegularized, rules } = params;

  // Priority 1: Valid GPS coordinates captured from the employee's actual attendance punch
  if (isValidCoordinate(actualLatitude, actualLongitude)) {
    return {
      latitude: Number(actualLatitude),
      longitude: Number(actualLongitude),
      location_source: "ACTUAL_GPS",
      actual_gps_captured: true,
      workplace_location_name: null,
    };
  }

  // Priority 2: Configured workplace coordinates, ONLY for Super Admin self-punch display mode
  if (isSelfPunchDisplay && isAdminAppliedOrRegularized) {
    const wp = getAuthoritativeWorkplaceLocation(rules);

    if (isValidCoordinate(wp.latitude, wp.longitude)) {
      return {
        latitude: wp.latitude,
        longitude: wp.longitude,
        location_source: "WORKPLACE_FALLBACK",
        actual_gps_captured: false,
        workplace_location_name: wp.name,
      };
    }
  }

  // Priority 3: Neither exists or workplace coordinates are missing/invalid -> unavailable state
  return {
    latitude: null,
    longitude: null,
    location_source: "UNAVAILABLE",
    actual_gps_captured: false,
    workplace_location_name: null,
  };
}

export async function resolveAttendanceLocation(params: {
  actualLatitude?: number | null;
  actualLongitude?: number | null;
  isSelfPunchDisplay: boolean;
  isAdminAppliedOrRegularized: boolean;
  rules?: any;
}): Promise<{
  latitude: number | null;
  longitude: number | null;
  location_source: "ACTUAL_GPS" | "WORKPLACE_FALLBACK" | "UNAVAILABLE";
  actual_gps_captured: boolean;
  workplace_location_name?: string | null;
}> {
  const activeRules = params.rules !== undefined ? params.rules : (await getRulesAsync());
  return resolveAttendanceLocationSync({ ...params, rules: activeRules });
}

// ── In-Memory Rule & Holiday Caching for High-Throughput Attendance Fetching ──
let cachedRules: { data: any; expiresAt: number } | null = null;
const RULES_CACHE_TTL_MS = 60_000; // 60 seconds

const holidaysCache = new Map<string, { data: any[]; expiresAt: number }>();
const HOLIDAYS_CACHE_TTL_MS = 60_000; // 60 seconds

const reviewerCache = new Map<string, { name: string; expiresAt: number }>();

async function getReviewerNames(reviewerIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const now = Date.now();
  const missingIds: string[] = [];

  for (const id of reviewerIds) {
    const cached = reviewerCache.get(id);
    if (cached && cached.expiresAt > now) {
      result.set(id, cached.name);
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0) {
    try {
      const users = await prisma.user.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, fullName: true },
      });
      for (const u of users) {
        reviewerCache.set(u.id, { name: u.fullName, expiresAt: now + 5 * 60 * 1000 });
        result.set(u.id, u.fullName);
      }
    } catch (err) {
      console.error("[Attendance] Failed to resolve reviewer names:", err);
    }
  }

  return result;
}

export async function getRulesAsync() {
  const now = Date.now();
  if (cachedRules && cachedRules.expiresAt > now) {
    return cachedRules.data;
  }

  try {
    let dbRule = await prisma.attendanceRule.findUnique({
      where: { id: "default" },
    });
    if (!dbRule) {
      dbRule = await prisma.attendanceRule.create({
        data: {
          id: "default",
          shiftStart: "09:15",
          shiftEnd: "18:30",
          autoCheckoutGraceMinutes: 30,
          faceRequired: true,
          geofenceEnabled: false,
          officeLat: DEFAULT_SWAYOG_OFFICE_LAT,
          officeLng: DEFAULT_SWAYOG_OFFICE_LNG,
          officeRadius: 150.0,
          faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55"),
          weeklyOffDays: [0],
          dailyWorkingHours: 9.0,
        },
      });
    } else {
      const isOldPune = Math.abs(Number(dbRule.officeLat) - 18.5204) < 0.001 && Math.abs(Number(dbRule.officeLng) - 73.8567) < 0.001;
      const isOldNagpur = Math.abs(Number(dbRule.officeLat) - 21.1458) < 0.001 && Math.abs(Number(dbRule.officeLng) - 79.0882) < 0.001;
      if (isOldPune || isOldNagpur) {
        try {
          dbRule = await prisma.attendanceRule.update({
            where: { id: "default" },
            data: {
              officeLat: DEFAULT_SWAYOG_OFFICE_LAT,
              officeLng: DEFAULT_SWAYOG_OFFICE_LNG,
            },
          });
        } catch {
          // If update fails, override in-memory values
          dbRule.officeLat = DEFAULT_SWAYOG_OFFICE_LAT;
          dbRule.officeLng = DEFAULT_SWAYOG_OFFICE_LNG;
        }
      }
    }
    const resolved = {
      ...dbRule,
      shiftEnd: dbRule.shiftEnd || "18:30",
      autoCheckoutGraceMinutes: dbRule.autoCheckoutGraceMinutes ?? 30,
    };
    cachedRules = { data: resolved, expiresAt: now + RULES_CACHE_TTL_MS };
    return resolved;
  } catch (err) {
    console.error("Failed to read rules from DB, returning defaults:", err);
    return {
      id: "default",
      shiftStart: "09:15",
      shiftEnd: "18:30",
      autoCheckoutGraceMinutes: 30,
      faceRequired: true,
      geofenceEnabled: false,
      officeLat: DEFAULT_SWAYOG_OFFICE_LAT,
      officeLng: DEFAULT_SWAYOG_OFFICE_LNG,
      officeRadius: 150.0,
      faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55"),
      weeklyOffDays: [0],
      dailyWorkingHours: 9.0,
    };
  }
}

export async function saveRulesAsync(rules: any) {
  try {
    cachedRules = null; // Invalidate cache immediately
    await prisma.attendanceRule.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        shiftStart: rules.shiftStart ?? "09:15",
        shiftEnd: rules.shiftEnd ?? "18:30",
        autoCheckoutGraceMinutes: rules.autoCheckoutGraceMinutes != null ? parseInt(rules.autoCheckoutGraceMinutes, 10) : 30,
        faceRequired: rules.faceRequired !== false,
        geofenceEnabled: rules.geofenceEnabled === true,
        officeLat: rules.officeLat != null ? parseFloat(rules.officeLat) : DEFAULT_SWAYOG_OFFICE_LAT,
        officeLng: rules.officeLng != null ? parseFloat(rules.officeLng) : DEFAULT_SWAYOG_OFFICE_LNG,
        officeRadius: rules.officeRadius != null ? parseFloat(rules.officeRadius) : 150.0,
        faceMatchThreshold: rules.faceMatchThreshold != null ? parseFloat(rules.faceMatchThreshold) : 0.55,
        weeklyOffDays: Array.isArray(rules.weeklyOffDays) ? rules.weeklyOffDays.map(Number) : [0],
        dailyWorkingHours: rules.dailyWorkingHours != null ? parseFloat(rules.dailyWorkingHours) : 9.0,
      },
      update: {
        shiftStart: rules.shiftStart ?? "09:15",
        shiftEnd: rules.shiftEnd ?? "18:30",
        autoCheckoutGraceMinutes: rules.autoCheckoutGraceMinutes != null ? parseInt(rules.autoCheckoutGraceMinutes, 10) : undefined,
        faceRequired: rules.faceRequired !== false,
        geofenceEnabled: rules.geofenceEnabled === true,
        officeLat: rules.officeLat != null ? parseFloat(rules.officeLat) : DEFAULT_SWAYOG_OFFICE_LAT,
        officeLng: rules.officeLng != null ? parseFloat(rules.officeLng) : DEFAULT_SWAYOG_OFFICE_LNG,
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
  const cacheKey = `${startDate ? startDate.toISOString() : "all"}_${endDate ? endDate.toISOString() : "all"}`;
  const now = Date.now();
  const cached = holidaysCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const where: any = {};
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    }
    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });
    holidaysCache.set(cacheKey, { data: holidays, expiresAt: now + HOLIDAYS_CACHE_TTL_MS });
    return holidays;
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
  holidaysCache.clear(); // Invalidate cache immediately
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
  holidaysCache.clear(); // Invalidate cache immediately
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
  holidaysCache.clear(); // Invalidate cache immediately
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

export async function checkIn(
  employeeId: string,
  opts?: {
    selfieDataUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    faceVerified?: boolean;
    verificationToken?: string | null;
    matchConfidence?: number | null;
    matchDistance?: number | null;
    livenessVerified?: boolean;
    clientUploadId?: string | null;
  }
) {
  return withAttendanceSchemaGuard(() => checkInInternal(employeeId, opts));
}

async function checkInInternal(
  employeeId: string,
  opts?: {
    selfieDataUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    faceVerified?: boolean;
    verificationToken?: string | null;
    matchConfidence?: number | null;
    matchDistance?: number | null;
    livenessVerified?: boolean;
    clientUploadId?: string | null;
  }
) {
  const today = startOfDay(new Date());
  const clientUploadId = opts?.clientUploadId?.trim() || null;

  if (clientUploadId) {
    const existingByIdempotency = await prisma.attendanceRecord.findUnique({
      where: { employeeId_clientUploadId: { employeeId, clientUploadId } },
    });
    if (existingByIdempotency) {
      const latestCheckIn = await prisma.checkIn.findFirst({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
      });
      return { attendance: existingByIdempotency, checkInRecord: latestCheckIn, idempotentReplay: true };
    }
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing?.checkInTime) {
    if (clientUploadId && existing.clientUploadId === clientUploadId) {
      const latestCheckIn = await prisma.checkIn.findFirst({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
      });
      return { attendance: existing, checkInRecord: latestCheckIn, idempotentReplay: true };
    }
    throw new AttendanceConflictError("Already checked in today");
  }

  if (existing && existing.source === "ADMIN_ASSIGNED") {
    throw new AttendanceConflictError("Attendance for today has already been marked or assigned by your administrator.");
  }

  // Prevent employee check-in if attendance was already recorded/assigned by administrator
  if (existing && (existing.manualOverride || (existing.status === "PRESENT" && !existing.checkInTime) || existing.status === "LEAVE" || existing.status === "HOLIDAY" || (existing.status === "ABSENT" && existing.manualOverride))) {
    throw new AttendanceConflictError(
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
      throw new AttendanceValidationError("Geofencing is enabled. Access to GPS location is required to check in.");
    }
    if (opts?.accuracy != null && rules.minLocationAccuracy != null && opts.accuracy > rules.minLocationAccuracy) {
      throw new AttendanceValidationError(`Location accuracy is poor (${Math.round(opts.accuracy)}m). Minimum required accuracy is ${rules.minLocationAccuracy}m.`);
    }
    const dist = calculateHaversineDistance(
      Number(opts.latitude),
      Number(opts.longitude),
      rules.officeLat,
      rules.officeLng
    );
    if (dist > rules.officeRadius) {
      throw new AttendanceValidationError(`Location verification failed. You are ${Math.round(dist)}m away from the office (Allowed radius: ${rules.officeRadius}m).`);
    }
  }

  const now = new Date();
  let isFaceVerified = Boolean(opts?.faceVerified);
  if (opts?.verificationToken) {
    const tokenCheck = verifyFaceToken(opts.verificationToken, employeeId);
    if (!tokenCheck.valid) {
      throw new AttendanceValidationError(`Face verification failed: ${tokenCheck.error}`);
    }
    isFaceVerified = true;
  } else if (rules.faceRequired && !isFaceVerified) {
    throw new AttendanceValidationError("Face verification is required. Please complete face verification before checking in.");
  }

  const kolkataInfo = getKolkataTimeInfo(now);
  const yearMonth = kolkataInfo.yearMonth;

  let attendance: any;
  let status: any;
  let lateSequenceNumber: any = null;
  let lateAllowanceConsumed: any = false;

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const txExisting = await tx.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId, date: today } },
      });
      if (txExisting?.checkInTime) {
        if (clientUploadId && txExisting.clientUploadId === clientUploadId) {
          return { attendance: txExisting, idempotentReplay: true, status: txExisting.status, lateSequenceNumber: null, lateAllowanceConsumed: false };
        }
        throw new AttendanceConflictError("Already checked in today");
      }

      let counter = await tx.monthlyLateCounter.findUnique({
        where: { employeeId_yearMonth: { employeeId, yearMonth } },
      });
      if (!counter) {
        counter = await tx.monthlyLateCounter.create({
          data: { employeeId, yearMonth, lateDaysUsed: 0, halfDayCount: 0 },
        });
      }

      const policyResult = evaluateAttendancePolicy({
        checkInTime: now,
        reportingTimeStr: rules.reportingTime || rules.shiftStart || "10:30",
        monthlyLateAllowance: rules.monthlyLateAllowance ?? 3,
        currentLateDaysUsed: counter.lateDaysUsed,
        currentHalfDayCount: counter.halfDayCount,
        weeklyOffDays: rules.weeklyOffDays || [0],
      });

      if (policyResult.newLateDaysUsed !== counter.lateDaysUsed || policyResult.newHalfDayCount !== counter.halfDayCount) {
        await tx.monthlyLateCounter.update({
          where: { id: counter.id },
          data: {
            lateDaysUsed: policyResult.newLateDaysUsed,
            halfDayCount: policyResult.newHalfDayCount,
          },
        });
      }

      const upserted = await tx.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId, date: today } },
        create: {
          employeeId,
          date: today,
          checkInTime: now,
          status: policyResult.status,
          lateSequenceNumber: policyResult.lateSequenceNumber,
          lateAllowanceConsumed: policyResult.lateAllowanceConsumed,
          faceVerified: isFaceVerified,
          gpsVerified: rules.geofenceEnabled ? true : (opts?.latitude != null && opts?.longitude != null),
          locationAccuracy: opts?.accuracy ?? null,
          policyVersionUsed: rules.policyStatus || "ACTIVE",
          source: "EMPLOYEE_CHECK_IN",
          clientUploadId,
        },
        update: {
          checkInTime: now,
          status: policyResult.status,
          lateSequenceNumber: policyResult.lateSequenceNumber,
          lateAllowanceConsumed: policyResult.lateAllowanceConsumed,
          faceVerified: isFaceVerified,
          gpsVerified: rules.geofenceEnabled ? true : (opts?.latitude != null && opts?.longitude != null),
          locationAccuracy: opts?.accuracy ?? null,
          policyVersionUsed: rules.policyStatus || "ACTIVE",
          source: "EMPLOYEE_CHECK_IN",
          ...(clientUploadId ? { clientUploadId } : {}),
        },
      });

      return {
        attendance: upserted,
        idempotentReplay: false,
        status: policyResult.status,
        lateSequenceNumber: policyResult.lateSequenceNumber,
        lateAllowanceConsumed: policyResult.lateAllowanceConsumed,
      };
    });

    if (txResult.idempotentReplay) {
      const latestCheckIn = await prisma.checkIn.findFirst({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
      });
      return { attendance: txResult.attendance, checkInRecord: latestCheckIn, idempotentReplay: true };
    }

    attendance = txResult.attendance;
    status = txResult.status;
    lateSequenceNumber = txResult.lateSequenceNumber;
    lateAllowanceConsumed = txResult.lateAllowanceConsumed;
  } catch (err: any) {
    if (err instanceof AttendanceConflictError || err instanceof AttendanceValidationError) {
      throw err;
    }
    if (err?.code === "P2002") {
      if (clientUploadId) {
        const existingRecord = await prisma.attendanceRecord.findUnique({
          where: { employeeId_date: { employeeId, date: today } },
        });
        if (existingRecord?.clientUploadId === clientUploadId) {
          const latestCheckIn = await prisma.checkIn.findFirst({
            where: { employeeId },
            orderBy: { createdAt: "desc" },
          });
          return { attendance: existingRecord, checkInRecord: latestCheckIn, idempotentReplay: true };
        }
      }
      throw new AttendanceConflictError("Already checked in today");
    }
    throw err;
  }

  await prisma.attendanceAuditEvent.create({
    data: {
      employeeId,
      date: today,
      eventType: "CHECK_IN_ATTEMPT",
      previousStatus: existing?.status ?? null,
      newStatus: status,
      actorId: employeeId,
      reason: `Check-in recorded at ${now.toISOString()} with status ${status}`,
      metadata: {
        reportingTime: rules.reportingTime || "10:30",
        lateSequenceNumber,
        lateAllowanceConsumed,
        faceVerified: isFaceVerified,
        latitude: opts?.latitude ?? null,
        longitude: opts?.longitude ?? null,
      },
    },
  }).catch(() => {});

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
      }
    } catch (err) {
      console.error("Error saving selfie:", err);
    }
  }

  // Create CheckIn record with face recognition metadata
  const threshold = rules.faceMatchThreshold ?? parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.55");
  const checkInRecord = await prisma.checkIn.create({
    data: {
      employeeId,
      selfieUrl: selfieUrl ?? null,
      latitude: opts?.latitude ?? null,
      longitude: opts?.longitude ?? null,
      status: "CHECKED_IN",
      matchConfidence: opts?.matchConfidence != null ? opts.matchConfidence : null,
      matchDistance: opts?.matchDistance != null ? opts.matchDistance : null,
      livenessVerified: opts?.livenessVerified === true || isFaceVerified,
      flagged: opts?.matchConfidence != null
        ? (opts.matchConfidence < (threshold + 0.1) && opts.matchConfidence >= threshold)
        : false,
    },
  });

  // Create AdminNotification
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  const timeFormatted = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const message = `${employee?.fullName ?? "Employee"} checked in at ${timeFormatted}`;

  await createAdminNotification({
    type: "CHECKIN_SELFIE",
    message,
    imageUrl: selfieUrl ?? null,
    employeeId,
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

  // Recalculate monthly performance asynchronously in background without blocking check-in punch response
  recalculateMonthlyPerformance(employeeId).catch((err) => {
    console.error("Failed to recalculate performance on check-in:", err);
  });

  return { attendance, checkInRecord };
}

export function determineAttendanceSource(record: {
  manualOverride?: boolean;
  reviewedBy?: string | null;
  checkInTime?: Date | null;
  status: string;
  displayAsSelfPunch?: boolean;
}): string {
  if (record.displayAsSelfPunch) {
    return "EMPLOYEE_CHECK_IN";
  }
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

export async function checkOut(employeeId: string, opts?: { clientUploadId?: string | null }) {
  return withAttendanceSchemaGuard(() => checkOutInternal(employeeId, opts));
}

async function checkOutInternal(employeeId: string, opts?: { clientUploadId?: string | null }) {
  const today = startOfDay(new Date());
  const clientUploadId = opts?.clientUploadId?.trim() || null;

  if (clientUploadId) {
    const existingByIdempotency = await prisma.attendanceRecord.findUnique({
      where: { employeeId_checkOutClientUploadId: { employeeId, checkOutClientUploadId: clientUploadId } },
    });
    if (existingByIdempotency) {
      return existingByIdempotency;
    }
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!record) {
    throw new AttendanceValidationError("No attendance record found for today");
  }
  if (record.checkOutTime) {
    if (record.checkOutSource === "SYSTEM_AUTO_CLOSURE") {
      // Replace assumed shift-end auto-closure with real physical punch
    } else {
      return record;
    }
  }
  if (record.manualOverride && !record.checkInTime) {
    throw new AttendanceConflictError("Attendance was completed by administrator; check-out is not required.");
  }
  if (!record.checkInTime) {
    throw new AttendanceValidationError("No check-in found for today");
  }

  const now = new Date();
  const totalMinutes = differenceInMinutes(now, record.checkInTime);
  const status = totalMinutes < 240 ? "HALF_DAY" : record.status;

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutTime: now,
      actualCheckOutTime: now,
      effectiveCheckOutTime: now,
      checkOutSource: "EMPLOYEE_CHECK_OUT",
      autoClosedAt: null,
      autoClosureReason: null,
      totalMinutes,
      status,
      ...(clientUploadId ? { checkOutClientUploadId: clientUploadId } : {}),
    },
  });

  // Notify Admins on checkout
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  const timeFormatted = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  await createAdminNotification({
    type: "CHECKOUT",
    message: `${employee?.fullName ?? "Employee"} checked out at ${timeFormatted} (Duration: ${hours}h ${mins}m)`,
    employeeId,
  }).catch((err) => console.error("Failed to notify admins on checkout:", err));

  await recalculateMonthlyPerformance(employeeId);
  return updated;
}

type AutomaticCheckoutMode = "BACKFILL" | "DAILY";

function getIndiaDateTimeUtc(date: Date, hour: number, minute: number): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day"), hour - 5, minute - 30, 0, 0));
}

/**
 * Closes open attendance records without changing records already checked out.
 * BACKFILL is intentionally limited to dates before today so startup cannot
 * prematurely close today's attendance before the 7 PM rule runs.
 */
export async function closeOpenAttendanceRecords(mode: AutomaticCheckoutMode): Promise<number> {
  const now = new Date();
  const todayStart = getIndiaDateTimeUtc(now, 0, 0);
  const records = await prisma.attendanceRecord.findMany({
    where: {
      checkInTime: { not: null },
      checkOutTime: null,
      status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
      ...(mode === "BACKFILL"
        ? { date: { lt: todayStart } }
        : { date: todayStart }),
    },
    select: { id: true, employeeId: true, date: true, checkInTime: true },
  });

  let closedCount = 0;
  for (const record of records) {
    if (!record.checkInTime) continue;
    const cutoff = mode === "BACKFILL"
      ? getIndiaDateTimeUtc(record.date, 19, 30)
      : getIndiaDateTimeUtc(now, 19, 0);
    const checkOutTime = new Date(Math.max(cutoff.getTime(), record.checkInTime.getTime()));
    const totalMinutes = differenceInMinutes(checkOutTime, record.checkInTime);
    const status = totalMinutes < 240 ? "HALF_DAY" : record.status;

    const result = await prisma.attendanceRecord.updateMany({
      where: { id: record.id, checkOutTime: null },
      data: {
        checkOutTime,
        totalMinutes,
        status,
        source: "SYSTEM_GENERATED",
        notes: mode === "BACKFILL" ? "Automatic checkout backfill at 7:30 PM" : "Automatic checkout at 7:00 PM",
      },
    });
    if (result.count > 0) {
      closedCount += result.count;
      await recalculateMonthlyPerformance(record.employeeId).catch((err) => {
        console.error(`[Attendance] Failed to recalculate performance for ${record.employeeId}:`, err);
      });
    }
  }

  if (closedCount > 0) {
    console.log(`[Attendance] Automatically closed ${closedCount} open record(s) (${mode}).`);
  }
  return closedCount;
}

export async function getTodayAttendance(employeeId: string, viewerRole?: UserRole) {
  return withAttendanceSchemaGuard(() => getTodayAttendanceInternal(employeeId, viewerRole));
}

async function getTodayAttendanceInternal(employeeId: string, viewerRole?: UserRole) {
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

  const isSelfPunchDisplay = Boolean(record.displayAsSelfPunch);
  const isSuperAdminViewer = viewerRole === UserRole.SUPER_ADMIN;
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

  const actualSource = record.source || (record.manualOverride ? "ADMIN_ASSIGNED" : "EMPLOYEE_CHECK_IN");
  const displaySource = isSelfPunchDisplay ? "SELF_PUNCH" : source;
  const isAdminAppliedOrRegularized = Boolean(record.manualOverride || record.reviewedBy || record.source?.startsWith("ADMIN"));

  const loc = await resolveAttendanceLocation({
    actualLatitude: latitude,
    actualLongitude: longitude,
    isSelfPunchDisplay,
    isAdminAppliedOrRegularized,
  });

  if (isSelfPunchDisplay) {
    return {
      ...record,
      source: "EMPLOYEE_CHECK_IN",
      display_source: "SELF_PUNCH",
      displaySource: "SELF_PUNCH",
      actual_source: actualSource,
      actualSource,
      display_as_self_punch: true,
      displayAsSelfPunch: true,
      manualOverride: false,
      reviewerName: null,
      overrideReason: null,
      notes: null,
      admin_remark: null,
      applied_by: null,
      isAttendanceCompleted,
      requiresCheckIn: !isAttendanceCompleted && record.checkInTime == null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      location_source: loc.location_source,
      locationSource: loc.location_source,
      actual_gps_captured: loc.actual_gps_captured,
      actualGpsCaptured: loc.actual_gps_captured,
      workplace_location_name: loc.workplace_location_name,
      selfieUrl,
      audit: isSuperAdminViewer ? {
        appliedBy: reviewerName || record.reviewedBy,
        appliedById: record.reviewedBy,
        appliedAt: record.createdAt,
        updatedAt: record.updatedAt,
        remark: record.overrideReason || record.notes,
        actualSource,
        displayAsSelfPunch: true,
        locationSource: loc.location_source,
        actualGpsCaptured: loc.actual_gps_captured,
        workplaceLocationName: loc.workplace_location_name,
        workplaceLatitude: loc.location_source === "WORKPLACE_FALLBACK" ? loc.latitude : undefined,
        workplaceLongitude: loc.location_source === "WORKPLACE_FALLBACK" ? loc.longitude : undefined,
        checkOutSource: record.checkOutSource || (record.checkOutTime ? "EMPLOYEE_CHECK_OUT" : null),
        actualCheckOutTime: record.actualCheckOutTime,
        effectiveCheckOutTime: record.effectiveCheckOutTime || record.checkOutTime,
        autoClosedAt: record.autoClosedAt,
        autoClosureReason: record.autoClosureReason,
        isAutoClosed: record.checkOutSource === "SYSTEM_AUTO_CLOSURE",
        verificationBypasses: [
          "Face matching / biometric verification bypassed (manual admin entry)",
          loc.location_source === "WORKPLACE_FALLBACK"
            ? "GPS geofence location verification bypassed (configured workplace coordinates applied as fallback)"
            : "GPS geofence location verification bypassed (manual admin entry)",
          "Device signature verification bypassed (manual admin entry)",
        ],
      } : null,
    };
  }

  return {
    ...record,
    source: source,
    display_source: displaySource,
    displaySource,
    actual_source: actualSource,
    actualSource,
    display_as_self_punch: false,
    displayAsSelfPunch: false,
    applied_by: record.reviewedBy,
    applied_at: record.createdAt,
    admin_remark: record.overrideReason || record.notes,
    reviewerName,
    isAttendanceCompleted,
    requiresCheckIn: !isAttendanceCompleted && record.checkInTime == null,
    latitude: loc.latitude,
    longitude: loc.longitude,
    location_source: loc.location_source,
    locationSource: loc.location_source,
    actual_gps_captured: loc.actual_gps_captured,
    actualGpsCaptured: loc.actual_gps_captured,
    workplace_location_name: loc.workplace_location_name,
    selfieUrl,
    audit: isSuperAdminViewer ? {
      appliedBy: reviewerName || record.reviewedBy,
      appliedById: record.reviewedBy,
      appliedAt: record.createdAt,
      updatedAt: record.updatedAt,
      remark: record.overrideReason || record.notes,
      actualSource,
      displayAsSelfPunch: false,
      locationSource: loc.location_source,
      actualGpsCaptured: loc.actual_gps_captured,
      checkOutSource: record.checkOutSource || (record.checkOutTime ? "ADMIN_ASSIGNED" : null),
      actualCheckOutTime: record.actualCheckOutTime,
      effectiveCheckOutTime: record.effectiveCheckOutTime || record.checkOutTime,
      autoClosedAt: record.autoClosedAt,
      autoClosureReason: record.autoClosureReason,
      isAutoClosed: record.checkOutSource === "SYSTEM_AUTO_CLOSURE",
      verificationBypasses: [
        "Manual administration override",
      ],
    } : null,
  };
}

export async function getMonthlyAttendance(employeeId: string, month: number, year: number, viewerRole?: UserRole) {
  return withAttendanceSchemaGuard(() => getMonthlyAttendanceInternal(employeeId, month, year, viewerRole));
}

async function getMonthlyAttendanceInternal(employeeId: string, month: number, year: number, viewerRole?: UserRole) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));

  const [records, checkIns, holidays, rules] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { employeeId, date: { gte: start, lt: endExclusive } },
      orderBy: { date: "asc" },
    }),
    prisma.checkIn.findMany({
      where: { employeeId, createdAt: { gte: start, lt: endExclusive } },
      select: {
        id: true,
        employeeId: true,
        createdAt: true,
        latitude: true,
        longitude: true,
        selfieUrl: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    getHolidaysAsync(start, endExclusive),
    getRulesAsync(),
  ]);

  // Index check-ins by YYYY-MM-DD date string so genuine GPS/selfie can be matched
  const checkInByDate = new Map<string, any>();
  checkIns.forEach((ci) => {
    const dStr = ci.createdAt ? new Date(ci.createdAt).toISOString().slice(0, 10) : "";
    if (dStr && !checkInByDate.has(dStr)) {
      checkInByDate.set(dStr, ci);
    }
  });

  // Enrich records with reviewer name if manualOverride / reviewedBy is present (cached)
  const reviewerIds = [...new Set(records.map((r) => r.reviewedBy).filter(Boolean))] as string[];
  const reviewerMap = await getReviewerNames(reviewerIds);

  const enrichedRecords = records.map((r) => {
    const isSelfPunchDisplay = Boolean(r.displayAsSelfPunch);
    const isSuperAdminViewer = viewerRole === UserRole.SUPER_ADMIN;
    const source = determineAttendanceSource(r);
    const isAttendanceCompleted = isRecordAttendanceCompleted(r);

    const actualSource = r.source || (r.manualOverride ? "ADMIN_ASSIGNED" : "EMPLOYEE_CHECK_IN");
    const displaySource = isSelfPunchDisplay ? "SELF_PUNCH" : source;
    const reviewerName = r.reviewedBy ? reviewerMap.get(r.reviewedBy) || "Administrator" : null;

    const dateStr = r.date ? new Date(r.date).toISOString().slice(0, 10) : "";
    const matchedCheckIn = checkInByDate.get(dateStr);
    const latitude = matchedCheckIn?.latitude ?? null;
    const longitude = matchedCheckIn?.longitude ?? null;
    const selfieUrl = matchedCheckIn?.selfieUrl ?? null;

    const isAdminAppliedOrRegularized = Boolean(r.manualOverride || r.reviewedBy || r.source?.startsWith("ADMIN"));

    // Resolve location provenance following strict priority order
    const loc = resolveAttendanceLocationSync({
      actualLatitude: latitude,
      actualLongitude: longitude,
      isSelfPunchDisplay,
      isAdminAppliedOrRegularized,
      rules,
    });

    if (isSelfPunchDisplay) {
      return {
        ...r,
        source: "EMPLOYEE_CHECK_IN",
        display_source: "SELF_PUNCH",
        displaySource: "SELF_PUNCH",
        actual_source: actualSource,
        actualSource,
        display_as_self_punch: true,
        displayAsSelfPunch: true,
        manualOverride: false,
        reviewerName: null,
        overrideReason: null,
        notes: null,
        admin_remark: null,
        applied_by: null,
        isAttendanceCompleted,
        requiresCheckIn: !isAttendanceCompleted && r.checkInTime == null,
        latitude: loc.latitude,
        longitude: loc.longitude,
        location_source: loc.location_source,
        locationSource: loc.location_source,
        actual_gps_captured: loc.actual_gps_captured,
        actualGpsCaptured: loc.actual_gps_captured,
        workplace_location_name: loc.workplace_location_name,
        selfieUrl,
        audit: isSuperAdminViewer ? {
          appliedBy: reviewerName || r.reviewedBy,
          appliedById: r.reviewedBy,
          appliedAt: r.createdAt,
          updatedAt: r.updatedAt,
          remark: r.overrideReason || r.notes,
          actualSource,
          displayAsSelfPunch: true,
          locationSource: loc.location_source,
          actualGpsCaptured: loc.actual_gps_captured,
          workplaceLocationName: loc.workplace_location_name,
          workplaceLatitude: loc.location_source === "WORKPLACE_FALLBACK" ? loc.latitude : undefined,
          workplaceLongitude: loc.location_source === "WORKPLACE_FALLBACK" ? loc.longitude : undefined,
          checkOutSource: r.checkOutSource || (r.checkOutTime ? "EMPLOYEE_CHECK_OUT" : null),
          actualCheckOutTime: r.actualCheckOutTime,
          effectiveCheckOutTime: r.effectiveCheckOutTime || r.checkOutTime,
          autoClosedAt: r.autoClosedAt,
          autoClosureReason: r.autoClosureReason,
          isAutoClosed: r.checkOutSource === "SYSTEM_AUTO_CLOSURE",
          verificationBypasses: [
            "Face matching / biometric verification bypassed (manual admin entry)",
            loc.location_source === "WORKPLACE_FALLBACK"
              ? "GPS geofence location verification bypassed (configured workplace coordinates applied as fallback)"
              : "GPS geofence location verification bypassed (manual admin entry)",
            "Device signature verification bypassed (manual admin entry)",
          ],
        } : null,
      };
    }

    return {
      ...r,
      source: source,
      display_source: displaySource,
      displaySource,
      actual_source: actualSource,
      actualSource,
      display_as_self_punch: false,
      displayAsSelfPunch: false,
      applied_by: r.reviewedBy,
      applied_at: r.createdAt,
      admin_remark: r.overrideReason || r.notes,
      reviewerName,
      isAttendanceCompleted,
      requiresCheckIn: !isAttendanceCompleted && r.checkInTime == null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      location_source: loc.location_source,
      locationSource: loc.location_source,
      actual_gps_captured: loc.actual_gps_captured,
      actualGpsCaptured: loc.actual_gps_captured,
      workplace_location_name: loc.workplace_location_name,
      selfieUrl,
      audit: isSuperAdminViewer ? {
        appliedBy: reviewerName || r.reviewedBy,
        appliedById: r.reviewedBy,
        appliedAt: r.createdAt,
        updatedAt: r.updatedAt,
        remark: r.overrideReason || r.notes,
        actualSource,
        displayAsSelfPunch: false,
        locationSource: loc.location_source,
        actualGpsCaptured: loc.actual_gps_captured,
        checkOutSource: r.checkOutSource || (r.checkOutTime ? "ADMIN_ASSIGNED" : null),
        actualCheckOutTime: r.actualCheckOutTime,
        effectiveCheckOutTime: r.effectiveCheckOutTime || r.checkOutTime,
        autoClosedAt: r.autoClosedAt,
        autoClosureReason: r.autoClosureReason,
        isAutoClosed: r.checkOutSource === "SYSTEM_AUTO_CLOSURE",
        verificationBypasses: [
          "Manual administration override",
        ],
      } : null,
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
  const workingDateKeys = getWorkingDateKeys(start, endExclusive, holidayDateSet, weeklyOffDays);
  const workingDayRecords = records.filter((record) =>
    workingDateKeys.has(new Date(record.date).toISOString().slice(0, 10)),
  );

  const presentCount = workingDayRecords.filter((r) => r.status === "PRESENT" || r.status === "PRESENT_LATE_ALLOWANCE").length;
  const lateCount = workingDayRecords.filter((r) => r.status === "LATE").length;
  const halfDays = workingDayRecords.filter((r) => r.status === "HALF_DAY").length;
  const leaves = workingDayRecords.filter((r) => r.status === "LEAVE" || r.status === "ON_LEAVE").length;
  const adminAssignedCount = records.filter((r) => r.source === "ADMIN_ASSIGNED").length;
  const attendanceByDate = new Map<string, (typeof records)[number]>(
    workingDayRecords.map((record) => [new Date(record.date).toISOString().slice(0, 10), record]),
  );
  const absent = [...workingDateKeys].filter((dateKey) => {
    const record = attendanceByDate.get(dateKey);
    return !record || record.status === "ABSENT";
  }).length;

  const attendedTotal = presentCount + lateCount;
  const workingDays = workingDateKeys.size;
  const attendancePercent = workingDays > 0
    ? Math.round(((attendedTotal + halfDays * 0.5) / workingDays) * 100)
    : 0;

  const totalMinutes = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
  const totalLoggedHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);
  const totalOvertimeHours = Math.round((totalOvertimeMinutes / 60) * 10) / 10;

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
    totalOvertimeHours,
    totalOvertimeMinutes,
    rules: {
      weeklyOffDays,
      shiftStart: rules.shiftStart,
      shiftEnd: rules.shiftEnd || "18:30",
      autoCheckoutGraceMinutes: rules.autoCheckoutGraceMinutes ?? 30,
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
  remark?: string;
  adminUserId: string;
  source?: string;
  displayAsSelfPunch?: boolean;
}) {
  const { employeeId, date, status, checkInTime, checkOutTime, remark, adminUserId, source, displayAsSelfPunch } = params;

  const isSelfPunch = Boolean(displayAsSelfPunch);
  if (!isSelfPunch && (!remark || remark.trim().length < 3)) {
    throw new ApiError(400, "A remark explaining why the employee forgot or why attendance is being updated is required (at least 3 characters).");
  }

  const finalRemark = (remark && remark.trim().length > 0)
    ? remark.trim()
    : (isSelfPunch ? "Self Punch Regularization" : "");

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, isActive: true, role: true },
  });
  if (!employee) throw new ApiError(404, "Employee not found.");
  if (!employee.isActive) throw new ApiError(400, "Attendance can only be applied to an active employee.");

  // Parse date - handles YYYY-MM-DD cleanly in UTC for @db.Date
  let targetDay: Date;
  if (typeof date === "string") {
    const cleanDateStr = date.split("T")[0];
    const parts = cleanDateStr.split("-").map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr) || parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
      throw new ApiError(400, "Attendance date must use YYYY-MM-DD format.");
    }
    if (parts.length === 3) {
      targetDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
    } else {
      targetDay = new Date(date);
    }
  } else {
    targetDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  }
  if (Number.isNaN(targetDay.getTime())) throw new ApiError(400, "Attendance date is invalid.");
  if (
    typeof date === "string"
    && (targetDay.getUTCFullYear() !== Number(date.slice(0, 4))
      || targetDay.getUTCMonth() !== Number(date.slice(5, 7)) - 1
      || targetDay.getUTCDate() !== Number(date.slice(8, 10)))
  ) {
    throw new ApiError(400, "Attendance date is invalid.");
  }

  let checkInDateTime: Date | null = null;
  let checkOutDateTime: Date | null = null;

  // Helper to convert time strings (e.g. "10:30", "06:30", "6:30 PM", ISO) to UTC timestamps in IST (+5:30)
  const parseTimeToUtcDate = (timeInput: string, isCheckOut = false): Date => {
    const clean = timeInput.trim();
    if (clean.includes("T")) {
      const parsed = new Date(clean);
      if (Number.isNaN(parsed.getTime())) throw new ApiError(400, "Attendance time is invalid.");
      return parsed;
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
    if (!/^\d{1,2}:\d{2}$/.test(timeOnly)) {
      throw new ApiError(400, "Attendance times must be valid HH:MM values.");
    }

    const parts = timeOnly.split(":").map((p) => parseInt(p, 10));
    let hours = isNaN(parts[0]) ? 0 : parts[0];
    const minutes = isNaN(parts[1]) ? 0 : parts[1];
    if (
      parts.length !== 2
      || !Number.isInteger(hours)
      || !Number.isInteger(minutes)
      || hours < 0
      || hours > 23
      || minutes < 0
      || minutes > 59
      || (isPm || isAm) && hours > 12
    ) {
      throw new ApiError(400, "Attendance times must be valid HH:MM values.");
    }

    if (isPm && hours < 12) {
      hours += 12;
    } else if (isAm && hours === 12) {
      hours = 0;
    } else if (!isPm && !isAm) {
      // For check-out in work shift, if hour is 1-11 (e.g. 6:30, 7:30, 8:30), admin intended afternoon/evening PM
      if (isCheckOut && hours >= 1 && hours <= 11) {
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
  if (checkInDateTime && checkOutDateTime && checkOutDateTime < checkInDateTime) {
    throw new ApiError(400, "Check-out time cannot be before check-in time.");
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
      actualCheckOutTime: isSelfPunch ? checkOutDateTime : null,
      effectiveCheckOutTime: checkOutDateTime,
      checkOutSource: checkOutDateTime ? (isSelfPunch ? "EMPLOYEE_CHECK_OUT" : "ADMIN_ASSIGNED") : null,
      autoClosedAt: null,
      autoClosureReason: null,
      totalMinutes,
      manualOverride: true,
      overrideReason: finalRemark,
      notes: finalRemark,
      reviewedBy: adminUserId,
      flagged: false,
      displayAsSelfPunch: Boolean(displayAsSelfPunch),
    },
    update: {
      status: status as any,
      source: source || "ADMIN_ASSIGNED",
      checkInTime: checkInDateTime,
      checkOutTime: checkOutDateTime,
      actualCheckOutTime: isSelfPunch ? checkOutDateTime : null,
      effectiveCheckOutTime: checkOutDateTime,
      checkOutSource: checkOutDateTime ? (isSelfPunch ? "EMPLOYEE_CHECK_OUT" : "ADMIN_ASSIGNED") : null,
      autoClosedAt: null,
      autoClosureReason: null,
      totalMinutes,
      manualOverride: true,
      overrideReason: finalRemark,
      notes: finalRemark,
      reviewedBy: adminUserId,
      flagged: false,
      ...(displayAsSelfPunch !== undefined ? { displayAsSelfPunch: Boolean(displayAsSelfPunch) } : {}),
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
        ...(isSelfPunch
          ? {
              latitude: DEFAULT_SWAYOG_OFFICE_LAT,
              longitude: DEFAULT_SWAYOG_OFFICE_LNG,
            }
          : {}),
        manualOverride: true,
        overrideReason: finalRemark,
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
        ...(isSelfPunch
          ? {
              latitude: DEFAULT_SWAYOG_OFFICE_LAT,
              longitude: DEFAULT_SWAYOG_OFFICE_LNG,
            }
          : {}),
        manualOverride: true,
        overrideReason: finalRemark,
        reviewedBy: adminUserId,
        createdAt: checkInDateTime || targetDay,
      },
    }).catch(() => {});
  }

  // Recalculate monthly performance for that employee
  const targetMonth = targetDay.getMonth() + 1;
  const targetYear = targetDay.getFullYear();
  const performance = await recalculateMonthlyPerformance(employeeId, targetMonth, targetYear);

  // Notify admins of attendance assignment or correction
  const employeeUser = await prisma.user.findUnique({ where: { id: employeeId }, select: { fullName: true } });
  const dateFormatted = targetDay.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  await createAdminNotification({
    type: "ATTENDANCE_CORRECTION",
    message: `Attendance for ${employeeUser?.fullName ?? "Employee"} on ${dateFormatted} was ${source === "CORRECTION_APPROVED" ? "approved" : "updated"} to ${status}`,
    employeeId,
  }).catch(() => {});

  const loc = await resolveAttendanceLocation({
    actualLatitude: existingCheckIn?.latitude ?? null,
    actualLongitude: existingCheckIn?.longitude ?? null,
    isSelfPunchDisplay: isSelfPunch,
    isAdminAppliedOrRegularized: true,
  });

  return {
    attendance: {
      ...attendance,
      latitude: loc.latitude,
      longitude: loc.longitude,
      location_source: loc.location_source,
      locationSource: loc.location_source,
      actual_gps_captured: loc.actual_gps_captured,
      actualGpsCaptured: loc.actual_gps_captured,
      workplace_location_name: loc.workplace_location_name,
    },
    performance,
  };
}


/**
 * Counts working days between start and end (inclusive), up to today.
 * Weekly offs: Based on configured weeklyOffDays (default: Sunday [0]).
 * Declared festival holidays: Any date matching a configured festival holiday is excluded.
 */
function getWorkingDateKeys(start: Date, endExclusive: Date, holidayDateSet: Set<string>, weeklyOffDays: number[]) {
  const dateKeys = new Set<string>();
  const current = new Date(start);
  const indiaDateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const indiaToday = new Date(Date.UTC(
    Number(indiaDateParts.find((part) => part.type === "year")?.value),
    Number(indiaDateParts.find((part) => part.type === "month")?.value) - 1,
    Number(indiaDateParts.find((part) => part.type === "day")?.value),
  ));

  while (current < endExclusive && current <= indiaToday) {
    const day = current.getUTCDay();
    const dateKey = current.toISOString().slice(0, 10);
    if (!weeklyOffDays.includes(day) && !holidayDateSet.has(dateKey)) {
      dateKeys.add(dateKey);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dateKeys;
}

export async function getTeamAttendanceSnapshots(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));

  // 1. Fetch active employees in ONE query
  const employees = await prisma.user.findMany({
    where: { role: { in: [UserRole.EMPLOYEE, UserRole.SUB_ADMIN] }, isActive: true },
    select: { id: true },
  });
  if (employees.length === 0) return [];

  const employeeIds = employees.map((e: any) => e.id);

  // 2. Fetch records, holidays (cached), rules (cached) concurrently
  const [records, holidays, rules] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: start, lt: endExclusive },
      },
      select: {
        employeeId: true,
        date: true,
        status: true,
      },
    }),
    getHolidaysAsync(start, endExclusive),
    getRulesAsync(),
  ]);

  // 3. Calculate working days once for the entire team
  const holidayDateSet = new Set<string>();
  holidays.forEach((h: any) => {
    const d = new Date(h.date);
    holidayDateSet.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
  });
  const weeklyOffDays = rules.weeklyOffDays && rules.weeklyOffDays.length > 0 ? rules.weeklyOffDays : [0];
  const workingDateKeys = getWorkingDateKeys(start, endExclusive, holidayDateSet, weeklyOffDays);
  const workingDays = workingDateKeys.size;

  // 4. Group records by employee
  const recordsByEmployee = new Map<string, Array<{ date: Date; status: string }>>();
  records.forEach((r: any) => {
    let list = recordsByEmployee.get(r.employeeId);
    if (!list) {
      list = [];
      recordsByEmployee.set(r.employeeId, list);
    }
    list.push(r);
  });

  // 5. Compute attendancePercent for each employee in memory
  return employees.map((emp: any) => {
    const empRecords = recordsByEmployee.get(emp.id) || [];
    const workingDayRecords = empRecords.filter((r: any) => 
      workingDateKeys.has(new Date(r.date).toISOString().slice(0, 10))
    );
    const attended = workingDayRecords.filter((r: any) => r.status === "PRESENT" || r.status === "PRESENT_LATE_ALLOWANCE" || r.status === "LATE").length;
    const halfDays = workingDayRecords.filter((r: any) => r.status === "HALF_DAY").length;
    const attendancePercent = workingDays > 0
      ? Math.round(((attended + halfDays * 0.5) / workingDays) * 100)
      : 0;

    return {
      employeeId: emp.id,
      attendancePercent,
    };
  });
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

  // Out-Time Validation for Current Date (Forgot Attendance)
  // When applying for current date, Out-Time must be <= current time.
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, "0");
  const todayDay = String(now.getDate()).padStart(2, "0");
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  if (cleanDateStr === todayStr) {
    if (status !== "ABSENT" && status !== "LEAVE" && checkOutTime && checkOutTime.trim()) {
      let [hours, minutes] = checkOutTime.trim().split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        if (checkOutPeriod) {
          const p = checkOutPeriod.toUpperCase();
          if (p === "PM" && hours < 12) hours += 12;
          if (p === "AM" && hours === 12) hours = 0;
        }
        const outTimeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        if (outTimeDate.getTime() > now.getTime()) {
          throw new Error("Out-Time cannot be greater than the current time for today's forgot attendance request. It must be equal to or earlier than the current time.");
        }
      }
    }
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
    await createAdminNotification({
      type: "ATTENDANCE_REGULARIZATION",
      message: `${employee?.fullName || "Employee"} submitted a regularization request for ${cleanDateStr} (${status}).`,
      employeeId,
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

export async function upsertSyncHealthAsync(
  employeeId: string,
  payload: {
    appVersionCode?: number;
    appVersionName?: string | null;
    androidVersion?: string | null;
    deviceModel?: string | null;
    pendingOutboxCount?: number;
    failedOutboxCount?: number;
    lastSuccessfulSyncAt?: number | null;
    lastSyncStatus?: string;
    lastSyncError?: string | null;
    lastHttpCode?: number | null;
    tokenRefreshFailures?: number;
  }
) {
  return withAttendanceSchemaGuard(() => prisma.deviceSyncHealth.upsert({
    where: { employeeId },
    create: {
      employeeId,
      appVersionCode: payload.appVersionCode ?? 0,
      appVersionName: payload.appVersionName ?? null,
      androidVersion: payload.androidVersion ?? null,
      deviceModel: payload.deviceModel ?? null,
      pendingOutboxCount: payload.pendingOutboxCount ?? 0,
      failedOutboxCount: payload.failedOutboxCount ?? 0,
      lastSuccessfulSyncAt: payload.lastSuccessfulSyncAt ? new Date(payload.lastSuccessfulSyncAt) : null,
      lastSyncStatus: payload.lastSyncStatus ?? "UNKNOWN",
      lastSyncError: payload.lastSyncError ?? null,
      lastHttpCode: payload.lastHttpCode ?? null,
      tokenRefreshFailures: payload.tokenRefreshFailures ?? 0,
    },
    update: {
      appVersionCode: payload.appVersionCode ?? 0,
      appVersionName: payload.appVersionName ?? null,
      androidVersion: payload.androidVersion ?? null,
      deviceModel: payload.deviceModel ?? null,
      pendingOutboxCount: payload.pendingOutboxCount ?? 0,
      failedOutboxCount: payload.failedOutboxCount ?? 0,
      lastSuccessfulSyncAt: payload.lastSuccessfulSyncAt ? new Date(payload.lastSuccessfulSyncAt) : undefined,
      lastSyncStatus: payload.lastSyncStatus ?? "UNKNOWN",
      lastSyncError: payload.lastSyncError ?? null,
      lastHttpCode: payload.lastHttpCode ?? null,
      tokenRefreshFailures: payload.tokenRefreshFailures ?? 0,
    },
  }));
}

export async function listSyncHealthAsync() {
  return withAttendanceSchemaGuard(() => prisma.deviceSyncHealth.findMany({
    orderBy: { updatedAt: "desc" },
  }));
}

export async function getAlarmSettingsAsync(employeeId: string) {
  const rules = await getRulesAsync();
  let setting = await prisma.employeeAlarmSetting.findUnique({
    where: { employeeId },
  });
  if (!setting) {
    setting = await prisma.employeeAlarmSetting.create({
      data: {
        employeeId,
        personalAlarmTime: "09:30",
        reminder1Time: "10:00",
        reminder2Time: "10:15",
        repeatDays: [1, 2, 3, 4, 5, 6],
        enabled: true,
      },
    });
  }
  const [policy, ringtones] = await Promise.all([
    getCompanyAlarmPolicyAsync(),
    listCompanyRingtonesAsync(),
  ]);
  return {
    setting,
    companyReportingTime: rules.reportingTime || "10:30",
    alarms: Array.isArray(setting.alarms) ? setting.alarms : [],
    policy,
    ringtones,
  };
}

export async function saveAlarmSettingsAsync(employeeId: string, data: any) {
  const alarmsJson = Array.isArray(data.alarms) ? data.alarms : undefined;
  return await prisma.employeeAlarmSetting.upsert({
    where: { employeeId },
    create: {
      employeeId,
      personalAlarmTime: data.personalAlarmTime || "09:30",
      reminder1Time: data.reminder1Time || "10:00",
      reminder2Time: data.reminder2Time || "10:15",
      repeatDays: Array.isArray(data.repeatDays) ? data.repeatDays.map(Number) : [1, 2, 3, 4, 5, 6],
      soundUri: data.soundUri ?? null,
      vibrationEnabled: data.vibrationEnabled !== false,
      snoozeEnabled: data.snoozeEnabled !== false,
      enabled: data.enabled !== false,
      ...(alarmsJson ? { alarms: alarmsJson } : {}),
    },
    update: {
      personalAlarmTime: data.personalAlarmTime || "09:30",
      reminder1Time: data.reminder1Time || "10:00",
      reminder2Time: data.reminder2Time || "10:15",
      repeatDays: Array.isArray(data.repeatDays) ? data.repeatDays.map(Number) : undefined,
      soundUri: data.soundUri ?? null,
      vibrationEnabled: data.vibrationEnabled !== false,
      snoozeEnabled: data.snoozeEnabled !== false,
      enabled: data.enabled !== false,
      ...(alarmsJson ? { alarms: alarmsJson } : {}),
    },
  });
}

const ALARM_POLICY_DEFAULTS = {
  prepReminderTime: "10:00",
  prepReminderEnabled: true,
  finalReminderTime: "10:15",
  finalReminderEnabled: true,
  personalDefaultTime: "09:30",
  defaultSoundName: null as string | null,
  defaultSoundKey: null as string | null,
  policyNote: null as string | null,
};

export async function getCompanyAlarmPolicyRowAsync() {
  try {
    let row = await prisma.companyAlarmPolicy.findUnique({ where: { id: "default" } });
    if (!row) {
      row = await prisma.companyAlarmPolicy.create({ data: { id: "default" } });
    }
    return row;
  } catch (err) {
    console.error("Failed to read company alarm policy, using defaults:", err);
    return { id: "default", ...ALARM_POLICY_DEFAULTS };
  }
}

export async function getCompanyAlarmPolicyAsync() {
  const [row, rules] = await Promise.all([getCompanyAlarmPolicyRowAsync(), getRulesAsync()]);
  const offDays: number[] = Array.isArray(rules.weeklyOffDays) ? rules.weeklyOffDays.map(Number) : [0];
  const workingDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !offDays.includes(d));

  let companySoundUrl: string | null = null;
  if (row.defaultSoundKey) {
    const { generatePresignedUrl } = await import("./r2StorageService.js");
    companySoundUrl = await generatePresignedUrl(row.defaultSoundKey, 86400).catch(() => null);
  }

  return {
    reportingTime: rules.reportingTime || "10:30",
    timezone: rules.timezone || "Asia/Kolkata",
    workingDays: workingDays.length > 0 ? workingDays : [1, 2, 3, 4, 5, 6],
    personalDefaultTime: row.personalDefaultTime || "09:30",
    prepReminderTime: row.prepReminderTime || "10:00",
    prepReminderEnabled: row.prepReminderEnabled !== false,
    finalReminderTime: row.finalReminderTime || "10:15",
    finalReminderEnabled: row.finalReminderEnabled !== false,
    policyNote: row.policyNote ?? null,
    companySoundName: row.defaultSoundName ?? null,
    companySoundUrl,
  };
}

export async function saveCompanyAlarmPolicyAsync(data: any) {
  const update: any = {};
  if (data.prepReminderTime !== undefined) update.prepReminderTime = data.prepReminderTime;
  if (data.prepReminderEnabled !== undefined) update.prepReminderEnabled = data.prepReminderEnabled !== false;
  if (data.finalReminderTime !== undefined) update.finalReminderTime = data.finalReminderTime;
  if (data.finalReminderEnabled !== undefined) update.finalReminderEnabled = data.finalReminderEnabled !== false;
  if (data.personalDefaultTime !== undefined) update.personalDefaultTime = data.personalDefaultTime;
  if (data.policyNote !== undefined) update.policyNote = data.policyNote;
  if (data.defaultSoundName !== undefined) update.defaultSoundName = data.defaultSoundName;
  if (data.defaultSoundKey !== undefined) update.defaultSoundKey = data.defaultSoundKey;
  await prisma.companyAlarmPolicy.upsert({
    where: { id: "default" },
    create: { id: "default", ...update },
    update,
  });
  return true;
}

export async function listCompanyRingtonesAsync() {
  const { generatePresignedUrl } = await import("./r2StorageService.js");
  const rows = await prisma.companyRingtone.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return await Promise.all(
    rows.map(async (r: any) => ({
      id: r.id,
      name: r.name,
      objectKey: r.objectKey,
      mimeType: r.mimeType,
      url: await generatePresignedUrl(r.objectKey, 86400).catch(() => null),
    }))
  );
}

export async function createCompanyRingtoneAsync(data: {
  name: string;
  objectKey: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy?: string;
}) {
  return await prisma.companyRingtone.create({
    data: {
      name: data.name,
      objectKey: data.objectKey,
      mimeType: data.mimeType ?? null,
      fileSize: data.fileSize ?? null,
      uploadedBy: data.uploadedBy ?? null,
    },
  });
}

export async function deleteCompanyRingtoneAsync(id: string) {
  const row = await prisma.companyRingtone.findUnique({ where: { id } });
  if (!row) return false;
  const { deleteFromR2, extractObjectKeyFromUrl } = await import("./r2StorageService.js");
  const key = row.objectKey || extractObjectKeyFromUrl(row.objectKey);
  if (key) {
    await deleteFromR2(key).catch((e) => console.error("[Ringtones] R2 delete failed:", e));
  }
  await prisma.companyRingtone.delete({ where: { id } });
  return true;
}

export async function getLateAllowanceSummaryAsync(employeeId: string, month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month ?? (now.getMonth() + 1);
  const targetYear = year ?? now.getFullYear();
  const yearMonth = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

  const rules = await getRulesAsync();
  const counter = await prisma.monthlyLateCounter.findUnique({
    where: { employeeId_yearMonth: { employeeId, yearMonth } },
  });

  const lateDaysUsed = counter?.lateDaysUsed || 0;
  const maxAllowance = rules.monthlyLateAllowance || 3;
  const allowancesConsumed = Math.min(lateDaysUsed, maxAllowance);
  const remainingAllowances = Math.max(0, maxAllowance - allowancesConsumed);
  const halfDayCount = counter?.halfDayCount || 0;

  return {
    yearMonth,
    reportingTime: rules.reportingTime || "10:30",
    maxAllowance,
    lateDaysUsed,
    allowancesConsumed,
    remainingAllowances,
    halfDayCount,
  };
}

export async function reconcileMonthlyLateCounter(employeeId: string, yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const lateAllowanceRecords = records.filter((r: any) => r.status === "PRESENT_LATE_ALLOWANCE" || r.lateAllowanceConsumed);
  const halfDayRecords = records.filter((r: any) => r.status === "HALF_DAY");
  const totalLateCount = lateAllowanceRecords.length + halfDayRecords.length;
  const halfDayCount = halfDayRecords.length;

  return await prisma.monthlyLateCounter.upsert({
    where: { employeeId_yearMonth: { employeeId, yearMonth } },
    create: {
      employeeId,
      yearMonth,
      lateDaysUsed: totalLateCount,
      halfDayCount,
    },
    update: {
      lateDaysUsed: totalLateCount,
      halfDayCount,
    },
  });
}
