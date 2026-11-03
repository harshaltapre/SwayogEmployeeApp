import type { Request, Response } from "express";

import { ApiError } from "../../middleware/error.js";
import { env } from "../../config/env.js";
import {
  checkInEmployee,
  checkOutEmployee,
  finalizeMissingLogouts,
  listEmployeeAttendance,
  serializeAttendance,
  updateEmployeeBreaks,
} from "./attendance.service.js";

function employeeId(req: Request): string {
  const id = req.auth?.userId;
  if (!id) throw new ApiError(401, "Authentication required");
  return id;
}

export async function checkInHandler(req: Request, res: Response): Promise<void> {
  try {
    const record = await checkInEmployee(employeeId(req), {
      checkInSelfie: typeof req.body?.checkInSelfie === "string" ? req.body.checkInSelfie : null,
      checkInLocation: typeof req.body?.checkInLocation === "string" ? req.body.checkInLocation : null,
    });
    res.status(200).json({ data: serializeAttendance(record) });
  } catch (error) {
    if (error instanceof Error && error.message === "Attendance has already been completed for today.") {
      throw new ApiError(409, error.message);
    }
    throw error;
  }
}

export async function checkOutHandler(req: Request, res: Response): Promise<void> {
  const breakMinutes = Number(req.body?.breakMinutes ?? 0);
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
    throw new ApiError(400, "breakMinutes must be a non-negative number");
  }
  let record;
  try {
    record = await checkOutEmployee(employeeId(req), breakMinutes, req.body?.breaks ?? []);
  } catch (error) {
    if (error instanceof Error && error.message === "No check-in found for today.") {
      throw new ApiError(404, error.message);
    }
    throw error;
  }
  res.status(200).json({ data: serializeAttendance(record) });
}

export async function updateBreaksHandler(req: Request, res: Response): Promise<void> {
  if (!Array.isArray(req.body?.breaks)) {
    throw new ApiError(400, "breaks must be an array");
  }
  let record;
  try {
    record = await updateEmployeeBreaks(employeeId(req), req.body.breaks);
  } catch (error) {
    if (error instanceof Error && error.message.includes("No check-in")) {
      throw new ApiError(404, error.message);
    }
    if (error instanceof Error && error.message.includes("already been completed")) {
      throw new ApiError(409, error.message);
    }
    throw error;
  }
  res.status(200).json({ data: serializeAttendance(record) });
}

export async function attendanceListHandler(req: Request, res: Response): Promise<void> {
  const records = await listEmployeeAttendance(employeeId(req));
  res.status(200).json({ data: records.map(serializeAttendance) });
}

export async function autoLogoutCronHandler(req: Request, res: Response): Promise<void> {
  if (env.NODE_ENV === "production" && env.CRON_SECRET === "development-attendance-cron-secret") {
    throw new ApiError(503, "CRON_SECRET is not configured");
  }
  const authorization = req.headers.authorization;
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (authorization !== expected) {
    throw new ApiError(401, "Invalid cron authorization");
  }

  const finalized = await finalizeMissingLogouts();
  res.status(200).json({ data: { finalized }, message: "Attendance auto-logout completed" });
}
