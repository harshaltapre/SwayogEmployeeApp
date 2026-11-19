import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { getRequestIp } from "./rate-limit.js";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, "Route not found"));
}

function getPrismaSchemaErrorCode(err: unknown): "P2021" | "P2022" | undefined {
  if (typeof err !== "object" || err === null || !("code" in err)) return undefined;
  return err.code === "P2021" || err.code === "P2022" ? err.code : undefined;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const reqInfo = {
    method: req.method,
    url: req.url,
    ip: getRequestIp(req),
  };

  const prismaSchemaErrorCode = getPrismaSchemaErrorCode(err);
  if (prismaSchemaErrorCode) {
    logger.error(`Prisma schema mismatch (${prismaSchemaErrorCode})`, reqInfo);
    res.status(503).json({
      error: "Database schema is out of date. Redeploy the backend to apply pending Prisma migrations.",
    });
    return;
  }

  // Handle common Prisma known request errors cleanly instead of 500
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string; meta?: Record<string, unknown> }).code;
    if (code === "P2002") {
      res.status(409).json({
        error: "A record with this unique identifier already exists.",
        details: (err as any).meta,
      });
      return;
    }
    if (code === "P2003") {
      res.status(400).json({
        error: "Referenced record does not exist or cannot be modified due to existing links.",
        details: (err as any).meta,
      });
      return;
    }
    if (code === "P2025") {
      res.status(404).json({
        error: "Requested record was not found.",
      });
      return;
    }
  }

  if (err instanceof ApiError) {
    logger.warn(`API Error ${err.statusCode} (${err.message})`, { ...reqInfo, details: err.details });

    const details =
      err.details && typeof err.details === "object"
        ? (err.details as { retryAfter?: number | string })
        : undefined;

    if ((err.statusCode === 423 || err.statusCode === 429) && details?.retryAfter) {
      res.setHeader("Retry-After", String(details.retryAfter));
    }

    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Handle Prisma connection errors
  if (err instanceof Error) {
    const message = err.message;
    logger.error(`Internal Exception: ${message}`, { ...reqInfo, stack: err.stack });
    
    // Check for database connection errors
    if (
      message.includes("Can't reach database") ||
      message.includes("ECONNREFUSED") ||
      message.includes("connect ECONNREFUSED") ||
      message.includes("P1001") ||
      message.includes("P1003")
    ) {
      logger.error("[Database Connection Failure] PostgreSQL connection failed.", reqInfo);
      res.status(503).json({
        error: "Service temporarily unavailable",
        details:
          process.env.NODE_ENV === "development"
            ? "Database connection failed. Running in mock mode with sample data."
            : "Database connection failed. Please check server logs.",
      });
      return;
    }

    // Check for Prisma client not generated
    if (message.includes("Prisma Client") || message.includes("prisma client")) {
      logger.error("[Prisma Client Error] Prisma client may not be generated.", reqInfo);
      res.status(500).json({
        error: "Server configuration error",
        details: process.env.NODE_ENV === "production" ? undefined : "Prisma client not generated properly",
      });
      return;
    }

    // Check for missing environment variables
    if (message.includes("DATABASE_URL") || message.includes("env")) {
      logger.error("[Environment Error] Missing or invalid environment variables.", reqInfo);
      res.status(500).json({
        error: "Server configuration error",
        details: process.env.NODE_ENV === "production" ? undefined : "Missing environment variables",
      });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "production" ? undefined : message,
    });
    return;
  }

  logger.error(`Unexpected Exception: ${String(err)}`, reqInfo);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "production" ? undefined : "Unexpected error",
  });
}
