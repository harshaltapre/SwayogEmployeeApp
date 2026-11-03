import type { NextFunction, Request, Response } from "express";

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

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[Global Error Handler]:", err);

  if (err instanceof ApiError) {
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
    
    // Check for database connection errors
    if (
      message.includes("Can't reach database") ||
      message.includes("ECONNREFUSED") ||
      message.includes("connect ECONNREFUSED")
    ) {
      console.error(
        "[Database Error] PostgreSQL connection failed. Using mock database instead."
      );
      res.status(503).json({
        error: "Service temporarily unavailable",
        details:
          process.env.NODE_ENV === "development"
            ? "Database connection failed. Running in mock mode with sample data."
            : undefined,
      });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "production" ? undefined : message,
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "production" ? undefined : "Unexpected error",
  });
}
