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

export async function checkIn(employeeId: string, opts?: { selfieDataUrl?: string | null; latitude?: number | null; longitude?: number | null }) {
  const today = startOfDay(new Date());
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing?.checkInTime) {
    throw new Error("Already checked in today");
  }

  const now = new Date();
  const nineThirty = new Date(today);
  nineThirty.setHours(9, 30, 0, 0);
  const status = now > nineThirty ? "LATE" : "PRESENT";

  // Upsert attendance record (existing behavior)
  const attendance = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    create: { employeeId, date: today, checkInTime: now, status },
    update: { checkInTime: now, status },
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

  return { attendance, checkInRecord };
}

export async function checkOut(employeeId: string) {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!record?.checkInTime) {
    throw new Error("No check-in found for today");
  }
  if (record.checkOutTime) {
    throw new Error("Already checked out today");
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
  return prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: startOfDay(new Date()) } },
  });
}

export async function getMonthlyAttendance(employeeId: string, month: number, year: number) {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));

  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  const checkIns = await prisma.checkIn.findMany({
    where: { employeeId, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "asc" },
  });

  const workingDays = getWorkingDays(start, end);
  const presentCount = records.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
  const halfDays = records.filter((record) => record.status === "HALF_DAY").length;
  const absent = Math.max(0, workingDays - presentCount - halfDays);
  const attendancePercent = workingDays > 0
    ? Math.round(((presentCount + halfDays * 0.5) / workingDays) * 100)
    : 0;

  return { records, checkIns, present: presentCount, absent, halfDays, workingDays, attendancePercent };
}


function getWorkingDays(start: Date, end: Date) {
  let count = 0;
  const current = new Date(start);
  const today = new Date();

  while (current <= end && current <= today) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
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
