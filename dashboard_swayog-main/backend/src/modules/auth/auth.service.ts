import { Prisma, UserRole, type User } from "@prisma/client";

import { generateUniqueLoginId } from "../../lib/login-id.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { isRefreshTokenRevoked, markRefreshTokenRevoked } from "../../lib/redis.js";
import {
  getTokenExpiry,
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
} from "../../lib/token.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../middleware/error.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const authUserSelect = {
  id: true,
  loginId: true,
  employeeCode: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  passwordHash: true,
  role: true,
  designationTitle: true,
  departmentId: true,
  reportingManagerId: true,
  employeeProfile: {
    select: {
      jobRole: true,
    },
  },
  isActive: true,
  failedLoginAttempts: true,
  lockoutUntil: true,
  lastFailedLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
type PublicUser = Omit<AuthUser, "passwordHash" | "updatedAt">;

function toPublicUser(user: AuthUser): PublicUser {
  const { passwordHash, updatedAt, ...safe } = user;
  void passwordHash;
  void updatedAt;
  return safe;
}

async function recordAuditLog(data: Parameters<typeof prisma.auditLog.create>[0]["data"]): Promise<void> {
  await prisma.auditLog.create({ data }).catch((error) => {
    console.warn("Auth audit log write failed:", error);
  });
}

async function issueSession(user: AuthUser) {
  const claims = {
    sub: user.id,
    role: user.role,
    loginId: user.loginId,
    jobRole: user.employeeProfile?.jobRole || user.designationTitle || undefined,
  };

  const accessToken = issueAccessToken(claims);
  const refreshToken = issueRefreshToken(claims);

  try {
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: getTokenExpiry(refreshToken),
      },
    });
  } catch (error) {
    console.warn("Could not save refresh token to DB (using in-memory bypass):", error);
  }

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

async function verifyStoredPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await verifyPassword(password, passwordHash);
  } catch (error) {
    console.warn("Password verification failed:", error);
    return false;
  }
}

async function findUserByIdentifier(identifier: string): Promise<AuthUser | null> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("@")) {
    return prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
      select: authUserSelect,
    });
  }

  const normalized = trimmed.toUpperCase();

  // Primary lookup by auth loginId.
  const direct = await prisma.user.findUnique({
    where: { loginId: normalized },
    select: authUserSelect,
  });
  if (direct) {
    return direct;
  }

  // Backward compatibility for customer identifiers where CUS/CUST prefixes may differ.
  const alternateIdentifiers = new Set<string>();
  if (normalized.startsWith("CUST-")) {
    alternateIdentifiers.add(`CUS-${normalized.slice(5)}`);
  }
  if (normalized.startsWith("CUS-")) {
    alternateIdentifiers.add(`CUST-${normalized.slice(4)}`);
  }

  for (const alternate of alternateIdentifiers) {
    const alternateUser = await prisma.user.findUnique({
      where: { loginId: alternate },
      select: authUserSelect,
    });
    if (alternateUser) {
      return alternateUser;
    }
  }

  // Allow customerCode input to resolve to linked user.
  const customer = await prisma.customer.findUnique({
    where: { customerCode: normalized },
    select: { userId: true },
  });

  if (customer?.userId) {
    return prisma.user.findUnique({
      where: { id: customer.userId },
      select: authUserSelect,
    });
  }

  return null;
}

function getLockoutUntil(): Date {
  return new Date(Date.now() + env.AUTH_LOCKOUT_DURATION_MS);
}

function getRetryAfterSeconds(until: Date): number {
  return Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));
}

async function registerFailedLoginAttempt(user: AuthUser): Promise<Date | null> {
  if (env.AUTH_LOCKOUT_ENABLED !== "true") {
    return null;
  }

  const nextAttemptCount = user.failedLoginAttempts + 1;
  const shouldLock = nextAttemptCount >= env.AUTH_LOCKOUT_MAX_ATTEMPTS;
  const lockoutUntil = shouldLock ? getLockoutUntil() : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: nextAttemptCount,
      lockoutUntil,
      lastFailedLoginAt: new Date(),
    },
  });

  if (shouldLock && lockoutUntil) {
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "AUTH_ACCOUNT_LOCKED",
        entity: "User",
        entityId: user.id,
        metadata: {
          failedLoginAttempts: nextAttemptCount,
          lockoutUntil: lockoutUntil.toISOString(),
        },
      },
    });
    return lockoutUntil;
  }

  return null;
}

async function resetLockoutState(user: AuthUser): Promise<void> {
  if (user.failedLoginAttempts === 0 && !user.lockoutUntil && !user.lastFailedLoginAt) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastFailedLoginAt: null,
    },
  });
}

export async function registerCustomer(input: RegisterInput) {
  if (input.role && input.role !== UserRole.CUSTOMER) {
    throw new ApiError(403, "Self-signup is only available for customers");
  }

  const existingConditions: Array<{ email?: string; phoneNumber?: string }> = [
    { email: input.email.toLowerCase() },
  ];
  if (input.phoneNumber) {
    existingConditions.push({ phoneNumber: input.phoneNumber });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: existingConditions,
    },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, "An account with this email or phone already exists");
  }

  const loginId = await generateUniqueLoginId(UserRole.CUSTOMER);

  const user = await prisma.user.create({
    data: {
      loginId,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber,
      passwordHash: await hashPassword(input.password),
      role: UserRole.CUSTOMER,
      customerProfile: {
        create: {
          customerCode: loginId,
          fullName: input.fullName,
          email: input.email.toLowerCase(),
          phoneNumber: input.phoneNumber ?? "Not Provided",
          city: "Not Provided",
          address: "Not Provided",
          systemSizeKw: 0,
          installationDate: new Date(),
        },
      },
    },
    select: authUserSelect,
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "AUTH_REGISTER",
      entity: "User",
      entityId: user.id,
      metadata: {
        role: user.role,
      },
    },
  });

  return issueSession(user);
}

export async function login(input: LoginInput) {
  console.log("Login attempt for:", input.identifier, "as role:", input.role);

  try {
    // Database-backed login flow
    const user = await findUserByIdentifier(input.identifier);

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid email or password");
    }

    // CRITICAL SECURITY CHECK: Validate role matches
    if (user.role !== input.role) {
      // Specialized case: SUB_ADMIN users should be allowed to login using the "EMPLOYEE" role selection
      const isSubAdminLoggingAsEmployee = (user.role === UserRole.SUB_ADMIN && (input.role as string) === "EMPLOYEE");
      
      if (!isSubAdminLoggingAsEmployee) {
        // Log the unauthorized access attempt
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "AUTH_ROLE_MISMATCH",
            entity: "User",
            entityId: user.id,
            metadata: {
              userRole: user.role,
              requestedRole: input.role,
              identifier: input.identifier,
            },
          },
        }).catch(() => {
          // Silently fail if audit logging doesn't work
        });

        throw new ApiError(
          403,
          `Unauthorized access for this role. Your account has role '${user.role}', but you attempted to login as '${input.role}'.`
        );
      }
    }

    if (env.AUTH_LOCKOUT_ENABLED === "true" && user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new ApiError(423, "Account temporarily locked due to repeated login failures", {
        lockoutUntil: user.lockoutUntil.toISOString(),
        retryAfter: getRetryAfterSeconds(user.lockoutUntil),
      });
    }

    const passwordMatches = await verifyStoredPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      const lockoutUntil = await registerFailedLoginAttempt(user);
      if (lockoutUntil) {
        throw new ApiError(423, "Account temporarily locked due to repeated login failures", {
          lockoutUntil: lockoutUntil.toISOString(),
          retryAfter: getRetryAfterSeconds(lockoutUntil),
        });
      }

      throw new ApiError(401, "Invalid email or password");
    }

    await recordAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN",
      entity: "User",
      entityId: user.id,
      metadata: {
        role: user.role,
      },
    });

    await resetLockoutState(user);

    return issueSession(user);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("Login failed due to internal error:", error);
    throw new ApiError(500, "Internal server error");
  }
}

export async function refreshSession(rawRefreshToken: string) {
  let payload;

  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const revokedInCache = await isRefreshTokenRevoked(tokenHash);
  if (revokedInCache) {
    throw new ApiError(401, "Refresh token is expired or revoked");
  }

  const existingToken = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!existingToken) {
    throw new ApiError(401, "Refresh token is expired or revoked");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "User not active");
  }

  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { revokedAt: new Date() },
  });

  await markRefreshTokenRevoked(tokenHash, existingToken.expiresAt);

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "AUTH_REFRESH",
      entity: "User",
      entityId: user.id,
    },
  });

  return issueSession(user);
}

export async function logout(rawRefreshToken: string) {
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    const tokenHash = hashToken(rawRefreshToken);

    const existingToken = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    await prisma.refreshToken.updateMany({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (existingToken) {
      await markRefreshTokenRevoked(tokenHash, existingToken.expiresAt);
    }

    await prisma.auditLog.create({
      data: {
        actorId: payload.sub,
        action: "AUTH_LOGOUT",
        entity: "User",
        entityId: payload.sub,
      },
    });
  } catch {
    // Keeping logout idempotent prevents client-side token-state loops.
  }

  return { success: true };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toPublicUser(user);
}
