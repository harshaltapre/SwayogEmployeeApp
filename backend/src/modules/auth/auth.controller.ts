import type { Request, Response } from "express";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { logger } from "../../lib/logger.js";
import { getRequestIp } from "../../middleware/rate-limit.js";
import type { LoginInput, RefreshInput, RegisterInput } from "./auth.schemas.js";
import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  registerCustomer,
} from "./auth.service.js";

export async function registerHandler(req: Request<unknown, unknown, RegisterInput>, res: Response): Promise<void> {
  const session = await registerCustomer(req.body);
  res.status(201).json({ data: session });
}

export async function loginHandler(req: Request<unknown, unknown, LoginInput>, res: Response): Promise<void> {
  const ip = getRequestIp(req);
  const emailAttempted = req.body.identifier || req.body.email || "unknown";
  const startTime = process.hrtime();
  const timestamp = new Date().toISOString();

  logger.info(`[AUTH_LOGIN_START] IP: ${ip}, Email/Identifier: ${emailAttempted}, Timestamp: ${timestamp}`);

  try {
    const session = await login(req.body);
    const diff = process.hrtime(startTime);
    const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

    logger.info(`[AUTH_LOGIN_END] Outcome: SUCCESS, IP: ${ip}, Email/Identifier: ${emailAttempted}, Duration: ${durationMs}ms`);
    res.status(200).json({ data: session });
  } catch (error: any) {
    const diff = process.hrtime(startTime);
    const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const errorCode = error instanceof ApiError ? error.errorCode : "INTERNAL_ERROR";

    logger.warn(`[AUTH_LOGIN_END] Outcome: FAILURE (${errorCode}), IP: ${ip}, Email/Identifier: ${emailAttempted}, Status: ${statusCode}, Duration: ${durationMs}ms`);
    throw error;
  }
}

export async function refreshHandler(req: Request<unknown, unknown, RefreshInput>, res: Response): Promise<void> {
  const session = await refreshSession(req.body.refreshToken);
  res.status(200).json({ data: session });
}

export async function logoutHandler(req: Request<unknown, unknown, RefreshInput>, res: Response): Promise<void> {
  await logout(req.body.refreshToken);
  res.status(200).json({ data: { success: true } });
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const user = await getCurrentUser(auth.userId);
  res.status(200).json({ data: user });
}
