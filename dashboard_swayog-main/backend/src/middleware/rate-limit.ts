import type { Request, RequestHandler } from "express";

import { incrementRateLimitCounter } from "../lib/redis.js";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  message: string;
  keyGenerator: (req: Request) => string;
};

const localBuckets = new Map<string, Bucket>();

function getLocalRateLimitState(key: string, windowMs: number): { count: number; ttlMs: number } {
  const now = Date.now();
  const existing = localBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    localBuckets.set(key, { count: 1, resetAt });
    return { count: 1, ttlMs: windowMs };
  }

  existing.count += 1;
  return { count: existing.count, ttlMs: existing.resetAt - now };
}

function toRetryAfterSeconds(ttlMs: number): number {
  return Math.max(1, Math.ceil(ttlMs / 1000));
}

export function getRequestIp(req: Request): string {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.length > 0) {
    return xForwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }
  return req.ip || "unknown";
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  return async (req, res, next) => {
    const dynamicKey = options.keyGenerator(req);
    const key = `${options.keyPrefix}:${dynamicKey}`;

    const redisState = await incrementRateLimitCounter(key, options.windowMs);
    const state = redisState ?? getLocalRateLimitState(key, options.windowMs);

    if (state.count > options.limit) {
      const retryAfter = toRetryAfterSeconds(state.ttlMs);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: options.message,
        details: {
          retryAfter,
          limit: options.limit,
          windowMs: options.windowMs,
        },
      });
      return;
    }

    next();
  };
}
