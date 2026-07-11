import dotenv from "dotenv";
import { z } from "zod";

// Ensure local backend/.env values are used even if machine-level env vars exist.
dotenv.config({ override: true });

// Strip surrounding quotes from process.env keys (e.g. Vercel dashboard copy-pastes)
for (const key of Object.keys(process.env)) {
  const val = process.env[key];
  if (val && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
    process.env[key] = val.slice(1, -1);
  }
}

const boolString = z.enum(["true", "false"]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MOCK_DATABASE: boolString.default("false"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").transform(v => v.replace(/^['"]|['"]$/g, '')),
  DIRECT_URL: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TRUST_PROXY: z.preprocess(
    (val) =>
      val === undefined || val === ""
        ? process.env.VERCEL
          ? "true"
          : "false"
        : val,
    boolString,
  ),
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
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.string().default(""),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_SECURE: z.string().default("false"),
  SMTP_FROM: z.string().default(""),
  SEED_SUPER_ADMIN_NAME: z.string().default("Harshal Tapre"),
  SEED_SUPER_ADMIN_EMAIL: z.string().email().default("harshaltapre27@gmail.com"),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8).default("Harshal.27"),
  WAAREE_API_BASE_URL: z.string().default("https://digital.waaree.com"),
  WAAREE_API_TOKEN: z.string().optional(),
  WAAREE_API_SECRET: z.string().optional(),
  WAAREE_PLANT_ID: z.string().optional(),
  WAAREE_SOLAX_TOKEN_ID: z.string().optional(),
  WAAREE_SOLAX_INVERTER_SN: z.string().optional(),
});

let parsedEnv: any;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error: any) {
  let errorMsg = "Zod validation failed: ";
  if (error && error.errors) {
    errorMsg += error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
  } else {
    errorMsg += error.message || String(error);
  }
  console.error("ENVIRONMENT VARIABLE VALIDATION FAILED:", errorMsg);
  
  try {
    // Generate safe defaults by parsing an empty object (since Zod schema has defaults for optional fields)
    const defaults = envSchema.partial().parse({});
    parsedEnv = { ...defaults, ...process.env };
  } catch {
    parsedEnv = { ...process.env };
  }
  parsedEnv.ENV_ERROR = errorMsg;
}

export const env = parsedEnv;

