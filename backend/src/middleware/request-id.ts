import crypto from "node:crypto";
import type { RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface Request {
    /** Unique request correlation ID (passed via X-Request-Id or auto-generated). */
    requestId?: string;
  }
}

/**
 * Middleware that assigns a unique request ID to every inbound request.
 * - Prefers the client-supplied `X-Request-Id` header (e.g. from an API gateway).
 * - Falls back to a server-generated UUID v4.
 * - Echoes the ID back in the `X-Request-Id` response header for client correlation.
 */
export const requestIdMiddleware: RequestHandler = (req, _res, next) => {
  const existing = req.headers["x-request-id"];
  const id =
    typeof existing === "string" && existing.length > 0
      ? existing
      : crypto.randomUUID();

  req.requestId = id;
  _res.setHeader("X-Request-Id", id);
  next();
};
