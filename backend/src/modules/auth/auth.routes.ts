import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { createRateLimit, getRequestIp } from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate.js";
import { env } from "../../config/env.js";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from "./auth.controller.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "./auth.schemas.js";

export const authRoutes = Router();

const registerRateLimit = createRateLimit({
  keyPrefix: "auth-register",
  limit: env.AUTH_REGISTER_RATE_LIMIT_MAX,
  windowMs: env.AUTH_REGISTER_RATE_LIMIT_WINDOW_MS,
  message: "Too many registration attempts. Please try again later.",
  keyGenerator: (req) => getRequestIp(req),
});

const loginRateLimit = createRateLimit({
  keyPrefix: "auth-login",
  limit: env.AUTH_LOGIN_RATE_LIMIT_MAX,
  windowMs: env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
  message: "Too many login attempts. Please try again later.",
  keyGenerator: (req) => {
    const body = (req.body ?? {}) as { identifier?: string };
    const identifier = body.identifier?.trim().toLowerCase() ?? "unknown";
    return `${getRequestIp(req)}:${identifier}`;
  },
});

const refreshRateLimit = createRateLimit({
  keyPrefix: "auth-refresh",
  limit: env.AUTH_REFRESH_RATE_LIMIT_MAX,
  windowMs: env.AUTH_REFRESH_RATE_LIMIT_WINDOW_MS,
  message: "Too many token refresh attempts. Please try again later.",
  keyGenerator: (req) => getRequestIp(req),
});

const logoutRateLimit = createRateLimit({
  keyPrefix: "auth-logout",
  limit: env.AUTH_LOGOUT_RATE_LIMIT_MAX,
  windowMs: env.AUTH_LOGOUT_RATE_LIMIT_WINDOW_MS,
  message: "Too many logout attempts. Please try again later.",
  keyGenerator: (req) => getRequestIp(req),
});

const meRateLimit = createRateLimit({
  keyPrefix: "auth-me",
  limit: env.AUTH_ME_RATE_LIMIT_MAX,
  windowMs: env.AUTH_ME_RATE_LIMIT_WINDOW_MS,
  message: "Too many profile requests. Please try again later.",
  keyGenerator: (req) => `${getRequestIp(req)}:${req.auth?.userId ?? "anonymous"}`,
});

authRoutes.post("/register", registerRateLimit, validateBody(registerSchema), asyncHandler(registerHandler));
authRoutes.post("/login", loginRateLimit, validateBody(loginSchema), asyncHandler(loginHandler));
authRoutes.post("/refresh", refreshRateLimit, validateBody(refreshSchema), asyncHandler(refreshHandler));
authRoutes.post("/logout", logoutRateLimit, validateBody(logoutSchema), asyncHandler(logoutHandler));
authRoutes.get("/me", authenticateAccessToken, meRateLimit, asyncHandler(meHandler));
