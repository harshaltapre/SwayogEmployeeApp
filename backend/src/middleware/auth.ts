import { UserRole } from "@prisma/client";
import type { Request, RequestHandler } from "express";

import { verifyAccessToken } from "../lib/token.js";
import { ApiError } from "./error.js";

export type AuthContext = {
  userId: string;
  loginId: string;
  role: UserRole;
  jobRole?: string;
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new ApiError(401, "Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Invalid Authorization header format");
  }

  return token;
}

export const authenticateAccessToken: RequestHandler = (req, _res, next) => {
  try {
    const token = getBearerToken(req);
    const payload = verifyAccessToken(token);

    req.auth = {
      userId: payload.sub,
      loginId: payload.loginId,
      role: payload.role,
      jobRole: payload.jobRole,
    };

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};

/**
 * Middleware to authorize routes based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns RequestHandler middleware
 * 
 * @example
 * // Single role
 * router.get('/superadmin/dashboard', authorizeRoles(UserRole.SUPER_ADMIN), handler);
 * 
 * // Multiple roles
 * router.get('/admin/reports', authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), handler);
 */
export function authorizeRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(
        new ApiError(
          403,
          `Access denied. This route is only accessible to: ${allowedRoles.join(", ")}. Your role is: ${req.auth.role}`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Middleware to require a specific single role (strict role matching)
 * @param requiredRole - The exact role required to access the route
 * @returns RequestHandler middleware
 * 
 * @example
 * router.get('/superadmin/users', requireRole(UserRole.SUPER_ADMIN), handler);
 */
export function requireRole(requiredRole: UserRole): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (req.auth.role !== requiredRole) {
      next(
        new ApiError(
          403,
          `Unauthorized access for this role. This resource requires role '${requiredRole}', but your role is '${req.auth.role}'.`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user has minimum role tier
 * Useful for hierarchical role structures like: SUPER_ADMIN > ADMIN > EMPLOYEE > PARTNER > CUSTOMER
 * @param minRole - The minimum role tier (and above) allowed
 * @returns RequestHandler middleware
 * 
 * @example
 * // Only ADMIN and SUPER_ADMIN can access
 * router.get('/admin-panel', requireMinRole(UserRole.ADMIN), handler);
 */
export function requireMinRole(minRole: UserRole): RequestHandler {
  const roleTiers: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 7,
    [UserRole.ADMIN]: 6,
    [UserRole.SUB_ADMIN]: 5,
    [UserRole.DEPARTMENT_HEAD]: 5,
    [UserRole.TEAM_LEAD]: 4,
    [UserRole.EMPLOYEE]: 3,
    [UserRole.PARTNER]: 2,
    [UserRole.CUSTOMER]: 1,
  };

  return (req, _res, next) => {
    if (!req.auth) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    const userTier = roleTiers[req.auth.role];
    const minTier = roleTiers[minRole];

    if (userTier < minTier) {
      next(
        new ApiError(
          403,
          `Insufficient privileges. This resource requires role tier '${minRole}' or higher. Your role is '${req.auth.role}'.`
        )
      );
      return;
    }

    next();
  };
}
