import { prisma } from "../../lib/prisma.js";

export const BUSINESS_TIME_ZONE = "Asia/Kolkata";
export const AUTO_LOGOUT_HOUR = 19;
export const AUTO_LOGOUT_MINUTE = 0;

type AttendanceDateParts = {
  date: string;
  hour: number;
  minute: number;
};

function getBusinessDateParts(value: Date): AttendanceDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));

  return {
    date: `${fields.year}-${fields.month}-${fields.day}`,
    hour: Number(fields.hour),
    minute: Number(fields.minute),
  };
}

export function getBusinessDate(value = new Date()): string {
  return getBusinessDateParts(value).date;
}

export function dateOnlyUtc(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function getAutoLogoutAt(dateKey: string): Date {
  // Asia/Kolkata is UTC+05:30 and does not observe DST.
  return new Date(`${dateKey}T13:30:00.000Z`);
}

export function calculateWorkMinutes(checkInAt: Date, checkOutAt: Date, breakMinutes = 0): number {
  return Math.max(
    0,
    Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60000) - Math.max(0, breakMinutes),
  );
}

export function formatBusinessTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

export function serializeAttendance(record: any) {
  const checkInMinutes = Number(formatBusinessTime(record.checkInAt).slice(0, 2)) * 60 +
    Number(formatBusinessTime(record.checkInAt).slice(3, 5));
  const status = record.workMinutes !== null && record.workMinutes < 240
    ? "half-day"
    : checkInMinutes > 9 * 60 + 15 ? "late" : "present";
  return {
    id: record.id,
    date: record.workDate.toISOString().slice(0, 10),
    checkIn: formatBusinessTime(record.checkInAt),
    checkOut: record.checkOutAt ? formatBusinessTime(record.checkOutAt) : null,
    status,
    workHours: record.workMinutes === null ? 0 : Number((record.workMinutes / 60).toFixed(1)),
    workMinutes: record.workMinutes,
    breakMinutes: record.breakMinutes,
    breaks: Array.isArray(record.breaks) ? record.breaks : [],
    checkInSelfie: record.checkInSelfie,
    checkInLocation: record.checkInLocation,
    checkOutSource: record.checkOutSource,
  };
}

export async function checkInEmployee(
  employeeId: string,
  proof: { checkInSelfie?: string | null; checkInLocation?: string | null } = {},
  now = new Date(),
) {
  const workDate = dateOnlyUtc(getBusinessDate(now));
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_workDate: { employeeId, workDate } },
  });

  if (existing) {
    if (!existing.checkOutAt) {
      return existing;
    }
    throw new Error("Attendance has already been completed for today.");
  }

  try {
    return await prisma.attendanceRecord.create({
      data: {
        employeeId,
        workDate,
        checkInAt: now,
        checkOutAt: null,
        workMinutes: null,
        checkOutSource: null,
        breaks: [],
        checkInSelfie: proof.checkInSelfie ?? null,
        checkInLocation: proof.checkInLocation ?? null,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      const concurrent = await prisma.attendanceRecord.findUnique({
        where: { employeeId_workDate: { employeeId, workDate } },
      });
      if (concurrent && !concurrent.checkOutAt) return concurrent;
    }
    throw error;
  }
}

export async function checkOutEmployee(
  employeeId: string,
  breakMinutes = 0,
  breaks: unknown[] = [],
  now = new Date(),
) {
  const workDate = dateOnlyUtc(getBusinessDate(now));
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_workDate: { employeeId, workDate } },
  });

  if (!existing) {
    throw new Error("No check-in found for today.");
  }
  if (existing.checkOutAt) {
    return existing;
  }

  await prisma.attendanceRecord.updateMany({
    where: { id: existing.id, checkOutAt: null },
    data: {
      checkOutAt: now,
      workMinutes: calculateWorkMinutes(existing.checkInAt, now, breakMinutes),
      breakMinutes: Math.max(0, breakMinutes),
      breaks,
      checkOutSource: "MANUAL",
    },
  });
  return prisma.attendanceRecord.findUniqueOrThrow({ where: { id: existing.id } });
}

export async function updateEmployeeBreaks(employeeId: string, breaks: unknown[]) {
  const workDate = dateOnlyUtc(getBusinessDate());
  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_workDate: { employeeId, workDate } },
  });
  if (!record) throw new Error("No check-in found for today.");
  if (record.checkOutAt) throw new Error("Attendance has already been completed for today.");

  const validBreaks = breaks.filter((value) => value && typeof value === "object");
  const breakMinutes = validBreaks.reduce(
    (total: number, value: any) => total + Math.max(0, Number(value.duration) || 0),
    0,
  );
  return prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { breaks: validBreaks, breakMinutes },
  });
}

export async function listEmployeeAttendance(employeeId: string) {
  return prisma.attendanceRecord.findMany({
    where: { employeeId },
    orderBy: { workDate: "desc" },
  });
}

export async function finalizeMissingLogouts(now = new Date()): Promise<number> {
  const current = getBusinessDateParts(now);
  const currentDate = dateOnlyUtc(current.date);
  const cutoffReached = current.hour > AUTO_LOGOUT_HOUR ||
    (current.hour === AUTO_LOGOUT_HOUR && current.minute >= AUTO_LOGOUT_MINUTE);

  const candidates = await prisma.attendanceRecord.findMany({
    where: {
      workDate: cutoffReached ? { lte: currentDate } : { lt: currentDate },
      checkOutAt: null,
    },
  });

  let finalized = 0;
  for (const record of candidates) {
    const cutoff = getAutoLogoutAt(record.workDate.toISOString().slice(0, 10));
    if (record.checkInAt > cutoff) {
      continue;
    }

    const result = await prisma.attendanceRecord.updateMany({
      where: { id: record.id, checkOutAt: null },
      data: {
        checkOutAt: cutoff,
        workMinutes: calculateWorkMinutes(record.checkInAt, cutoff, record.breakMinutes),
        checkOutSource: "AUTO",
      },
    });

    finalized += result.count;
  }

  if (finalized > 0) {
    console.info(`[Attendance] Auto-logout finalized ${finalized} record(s) at ${now.toISOString()}`);
  }
  return finalized;
}
