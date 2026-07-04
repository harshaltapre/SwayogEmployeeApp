import { env } from "../config/env.js";

type LogLevel = "info" | "warn" | "error" | "debug";

function formatLog(level: LogLevel, message: string, meta?: any): string {
  const logObj = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...meta,
  };

  if (env.NODE_ENV === "production") {
    return JSON.stringify(logObj);
  } else {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${logObj.timestamp}] ${logObj.level}: ${message}${metaStr}`;
  }
}

export const logger = {
  info(message: string, meta?: any) {
    console.log(formatLog("info", message, meta));
  },
  warn(message: string, meta?: any) {
    console.warn(formatLog("warn", message, meta));
  },
  error(message: string, meta?: any) {
    console.error(formatLog("error", message, meta));
  },
  debug(message: string, meta?: any) {
    if (env.NODE_ENV === "development") {
      console.log(formatLog("debug", message, meta));
    }
  },
};
