import type { Request, Response } from "express";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import type { LoginInput, RefreshInput, RegisterInput, ChangePasswordInput } from "./auth.schemas.js";
import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  registerCustomer,
  changePassword,
} from "./auth.service.js";

export async function registerHandler(req: Request<unknown, unknown, RegisterInput>, res: Response): Promise<void> {
  const session = await registerCustomer(req.body);
  res.status(201).json({ data: session });
}

export async function loginHandler(req: Request<unknown, unknown, LoginInput>, res: Response): Promise<void> {
  const session = await login(req.body);
  res.status(200).json({ data: session });
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

export async function changePasswordHandler(req: Request<unknown, unknown, ChangePasswordInput>, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }
  const { currentPassword, newPassword } = req.body;
  await changePassword(auth.userId, { currentPassword, newPassword });
  res.status(200).json({ data: { success: true } });
}
