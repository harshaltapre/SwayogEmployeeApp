const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:4000";

export function normalizeApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, "");
}

export function isLocalFrontendHost(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/**
 * Resolves the backend API origin for fetch calls.
 * - Env overrides win when set (VITE_AUTH_API_BASE_URL / VITE_API_BASE_URL).
 * - Local dev defaults to the Express port (4000).
 * - Production on Vercel (same deployment): use the page origin so /api/v1 hits serverless + Express.
 */
export function resolveConfiguredApiBaseUrl(): string | null {
  const authBase = (import.meta.env.VITE_AUTH_API_BASE_URL ?? "").trim();
  if (authBase.length > 0) {
    return normalizeApiBaseUrl(authBase);
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (apiBase.length > 0) {
    return normalizeApiBaseUrl(apiBase);
  }

  // Use the current origin in local development to leverage the Vite proxy (configured in vite.config.ts).
  // This is more robust than hardcoding localhost:4000.
  if (typeof window !== "undefined") {
    return normalizeApiBaseUrl(window.location.origin);
  }

  return null;
}

/**
 * Axios base URL for /api/v1/* routes (attendance, daily-commits, tasks, etc.).
 * Uses Vite proxy in local dev (origin + /api/v1) or explicit env when set.
 */
export function getApiV1BaseUrl(): string {
  const configured = resolveConfiguredApiBaseUrl();

  if (configured) {
    if (/\/api\/v\d+$/i.test(configured)) {
      return configured;
    }
    return `${configured}/api/v1`;
  }

  if (typeof window !== "undefined" && isLocalFrontendHost()) {
    return `${normalizeApiBaseUrl(window.location.origin)}/api/v1`;
  }

  return `${DEFAULT_LOCAL_API_BASE_URL}/api/v1`;
}
