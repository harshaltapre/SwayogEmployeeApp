import crypto from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { type UserRole } from "@prisma/client";

import { env } from "../config/env.js";

export type SessionClaims = {
  sub: string;
  role: UserRole;
  loginId: string;
  jobRole?: string;
  tokenType: "access" | "refresh";
};

type BaseClaims = Omit<SessionClaims, "tokenType">;

export function issueAccessToken(claims: BaseClaims): string {
  return jwt.sign(
    {
      ...claims,
      tokenType: "access",
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL as any },
  );
}

export function issueRefreshToken(claims: BaseClaims): string {
  return jwt.sign(
    {
      ...claims,
      tokenType: "refresh",
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL as any },
  );
}

export function verifyAccessToken(token: string): SessionClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as SessionClaims;
  if (payload.tokenType !== "access") {
    throw new Error("Invalid access token type");
  }
  return payload;
}

export function verifyRefreshToken(token: string): SessionClaims {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as SessionClaims;
  if (payload.tokenType !== "refresh") {
    throw new Error("Invalid refresh token type");
  }
  return payload;
}

export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded?.exp) {
    throw new Error("Token missing exp claim");
  }
  return new Date(decoded.exp * 1000);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
