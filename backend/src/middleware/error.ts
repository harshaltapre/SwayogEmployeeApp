import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { getRequestIp } from "./rate-limit.js";

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, "Route not found", undefined, "ROUTE_NOT_FOUND"));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const reqInfo = {
    method: req.method,
    url: req.url,
    ip: getRequestIp(req),
  };

  if (err instanceof ApiError) {
    logger.warn(`API Error ${err.statusCode} (${err.message})`, { ...reqInfo, details: err.details, errorCode: err.errorCode });

    const details =
      err.details && typeof err.details === "object"
        ? (err.details as { retryAfter?: number | string })
        : undefined;

    if ((err.statusCode === 423 || err.statusCode === 429) && details?.retryAfter) {
      res.setHeader("Retry-After", String(details.retryAfter));
    }

    res.status(err.statusCode).json({
      error: err.message,
      errorCode: err.errorCode,
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
