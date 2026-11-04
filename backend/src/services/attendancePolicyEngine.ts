import { prisma } from "../lib/prisma.js";
import { getRulesAsync } from "./attendanceService.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "swayog-attendance-secret-key-2026";
const USED_VERIFICATION_TOKENS = new Set<string>();

export interface PolicyEvaluationResult {
  status: "PRESENT" | "PRESENT_LATE_ALLOWANCE" | "HALF_DAY" | "WEEKLY_OFF" | "HOLIDAY" | "ON_LEAVE";
  lateAllowanceConsumed: boolean;
  lateSequenceNumber: number | null;
  newLateDaysUsed: number;
  newHalfDayCount: number;
  isHalfDay: boolean;
  isLate: boolean;
}

/**
 * Returns current date/time components formatted in Asia/Kolkata timezone
 */
export function getKolkataTimeInfo(date: Date = new Date()): {
  dateStr: string; // "YYYY-MM-DD"
  yearMonth: string; // "YYYY-MM"
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hours: number;
  minutes: number;
  seconds: number;
  dateObj: Date;
} {
  // Format to Asia/Kolkata
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = partMap.year;
  const month = partMap.month;
  const day = partMap.day;
  const hours = parseInt(partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const seconds = parseInt(partMap.second, 10);
  const dateStr = `${year}-${month}-${day}`;
  const yearMonth = `${year}-${month}`;

  // Sunday = 0, Monday = 1, etc.
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = weekdayMap[partMap.weekday] ?? date.getDay();

  // Create Date object representing start of day UTC for database Date column
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`);

  return {
    dateStr,
    yearMonth,
    dayOfWeek,
    hours,
    minutes,
    seconds,
    dateObj,
  };
}

/**
 * Pure policy evaluation engine
 */
export function evaluateAttendancePolicy(params: {
  checkInTime: Date;
  reportingTimeStr?: string; // e.g. "10:30"
  monthlyLateAllowance?: number; // e.g. 3
  currentLateDaysUsed: number;
  currentHalfDayCount?: number;
  weeklyOffDays?: number[]; // e.g. [0] for Sunday
  isHoliday?: boolean;
  isOnLeave?: boolean;
}): PolicyEvaluationResult {
  const reportingTime = params.reportingTimeStr || "10:30";
  const allowance = params.monthlyLateAllowance != null ? params.monthlyLateAllowance : 3;
  const lateDays = Math.max(0, params.currentLateDaysUsed || 0);
  const halfDays = Math.max(0, params.currentHalfDayCount || 0);
  const weeklyOffDays = params.weeklyOffDays && params.weeklyOffDays.length > 0 ? params.weeklyOffDays : [0];

  const kolkata = getKolkataTimeInfo(params.checkInTime);

  // 1. Check Leave
  if (params.isOnLeave) {
    return {
      status: "ON_LEAVE",
      lateAllowanceConsumed: false,
      lateSequenceNumber: null,
      newLateDaysUsed: lateDays,
      newHalfDayCount: halfDays,
      isHalfDay: false,
      isLate: false,
    };
  }

  // 2. Check Holiday
  if (params.isHoliday) {
    return {
      status: "HOLIDAY",
      lateAllowanceConsumed: false,
      lateSequenceNumber: null,
      newLateDaysUsed: lateDays,
      newHalfDayCount: halfDays,
      isHalfDay: false,
      isLate: false,
    };
  }

  // 3. Check Weekly Off (Sunday)
  if (weeklyOffDays.includes(kolkata.dayOfWeek)) {
    return {
      status: "WEEKLY_OFF",
      lateAllowanceConsumed: false,
      lateSequenceNumber: null,
      newLateDaysUsed: lateDays,
      newHalfDayCount: halfDays,
      isHalfDay: false,
      isLate: false,
    };
  }

  // 4. Compare with Reporting Time (e.g. 10:30 AM)
  const [rh, rm] = reportingTime.split(":").map(Number);
  const checkInMinutes = kolkata.hours * 60 + kolkata.minutes;
  const reportingMinutes = rh * 60 + rm;

  if (checkInMinutes <= reportingMinutes) {
    // On-Time Arrival: PRESENT, does not consume late allowance
    return {
      status: "PRESENT",
      lateAllowanceConsumed: false,
      lateSequenceNumber: null,
      newLateDaysUsed: lateDays,
      newHalfDayCount: halfDays,
      isHalfDay: false,
      isLate: false,
    };
  }

  // Late Arrival
  const nextLateDays = lateDays + 1;

  if (lateDays < allowance) {
    // Within 3-day allowance: PRESENT_LATE_ALLOWANCE (counted as 1/3, 2/3, 3/3)
    return {
      status: "PRESENT_LATE_ALLOWANCE",
      lateAllowanceConsumed: true,
      lateSequenceNumber: nextLateDays,
      newLateDaysUsed: nextLateDays,
      newHalfDayCount: halfDays,
      isHalfDay: false,
      isLate: true,
    };
  } else {
    // 4th day onward: HALF_DAY
    return {
      status: "HALF_DAY",
      lateAllowanceConsumed: false,
      lateSequenceNumber: nextLateDays,
      newLateDaysUsed: nextLateDays,
      newHalfDayCount: halfDays + 1,
      isHalfDay: true,
      isLate: true,
    };
  }
}

/**
 * Generate a short-lived, cryptographically signed face verification token
 */
export function generateFaceVerificationToken(params: {
  employeeId: string;
  matchScore: number;
  livenessVerified: boolean;
  expiresInSeconds?: number;
}): { token: string; expiresAt: Date } {
  const expiresIn = params.expiresInSeconds || 300; // 5 minutes validity
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const tokenId = `fvt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const token = jwt.sign(
    {
      sub: params.employeeId,
      jti: tokenId,
      type: "FACE_VERIFICATION",
      matchScore: params.matchScore,
      livenessVerified: params.livenessVerified,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: `${expiresIn}s` }
  );

  return { token, expiresAt };
}

/**
 * Validates face verification token and prevents token replay
 */
export function verifyFaceToken(
  token: string,
  expectedEmployeeId: string
): { valid: boolean; error?: string; payload?: any } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== "FACE_VERIFICATION") {
      return { valid: false, error: "Invalid token type" };
    }
    if (decoded.sub !== expectedEmployeeId) {
      return { valid: false, error: "Face token does not match employee" };
    }
    if (decoded.jti && USED_VERIFICATION_TOKENS.has(decoded.jti)) {
      return { valid: false, error: "Verification token has already been used (replay detected)" };
    }

    // Mark token as used to prevent replay
    if (decoded.jti) {
      USED_VERIFICATION_TOKENS.add(decoded.jti);
      // Clean up old tokens from set after 10 minutes
      const timer = setTimeout(() => {
        USED_VERIFICATION_TOKENS.delete(decoded.jti);
      }, 10 * 60 * 1000);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }

    return { valid: true, payload: decoded };
  } catch (err: any) {
    return { valid: false, error: err?.message || "Token verification failed" };
  }
}

/**
 * Calculates distance in meters between two coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cosine similarity between two float vectors
 */
export function calculateCosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}
