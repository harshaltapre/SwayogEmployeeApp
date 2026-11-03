import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import fs from "fs";

// Load .env file if it exists (in Vercel serverless, env vars are injected by the platform)
const envPath = path.resolve(process.cwd(), "backend", ".env");
const localEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
} else {
  // Vercel injects env vars directly — no .env file needed
  dotenv.config({ override: true });
}

const boolString = z.enum(["true", "false"]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TRUST_PROXY: boolString.default("false"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_ENABLED: boolString.default("false"),
  REDIS_KEY_PREFIX: z.string().default("swayog"),
  AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_REGISTER_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_REFRESH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  AUTH_REFRESH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(300000),
  AUTH_LOGOUT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  AUTH_LOGOUT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(300000),
  AUTH_ME_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  AUTH_ME_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AUTH_LOCKOUT_ENABLED: boolString.default("true"),
  AUTH_LOCKOUT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCKOUT_DURATION_MS: z.coerce.number().int().positive().default(900000),
  CRON_SECRET: z.string().min(16).default("development-attendance-cron-secret"),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  WARI_INVERTER_API_URL: z.string().default(""),
  PPBLINK_INVERTER_API_URL: z.string().default(""),
  SEED_SUPER_ADMIN_NAME: z.string().default("Harshal Tapre"),
  SEED_SUPER_ADMIN_EMAIL: z.string().email().default("harshaltapre27@gmail.com"),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8).default("Harshal.27"),
});

export const env = envSchema.parse(process.env);
