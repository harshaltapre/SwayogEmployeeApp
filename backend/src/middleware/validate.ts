import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { ApiError } from "./error.js";

export function validateBody<T>(schema: ZodType<T, any, any>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(new ApiError(400, "Invalid request body", parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T, any, any>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(new ApiError(400, "Invalid query params", parsed.error.flatten()));
      return;
    }

    req.query = parsed.data as any;
    next();
  };
}

export function validateParams<T>(schema: ZodType<T, any, any>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      next(new ApiError(400, "Invalid route params", parsed.error.flatten()));
      return;
    }

    req.params = parsed.data as any;
    next();
  };
}
