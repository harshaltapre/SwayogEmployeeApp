/**
 * SuperAdmin API Client
 * All calls target <api-base>/api/v1/superadmin/...
 * Bearer token is pulled from useAuth Zustand store.
 */
import { useAuth } from "./auth";
import { resolveConfiguredApiBaseUrl } from "@/lib/resolve-api-base-url";

function getConfiguredApiBaseUrl(): string | null {
  return resolveConfiguredApiBaseUrl();
}

function getSuperAdminBaseUrl(): string {
  const apiBaseUrl = getConfiguredApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("Backend API URL is not configured.");
  }

  // Supports both forms:
  // 1) http://host/api/v1
  // 2) http://host
  if (/\/api\/v\d+$/i.test(apiBaseUrl)) {
    return `${apiBaseUrl}/superadmin`;
  }

  return `${apiBaseUrl}/api/v1/superadmin`;
}

function getToken(): string {
  return useAuth.getState().token ?? "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = getSuperAdminBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      msg = json.error || msg;
    } catch {}
    throw new Error(msg);
  }

  // CSV export returns text
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    return (await res.text()) as unknown as T;
  }

  const json = await res.json();
  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SUB_ADMIN" | "EMPLOYEE" | "PARTNER" | "CUSTOMER";

export interface SAUser {
  id: string;
  loginId: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  createdAt: string;
  updatedAt: string;
  portalPassword?: string | null;
  employeeProfile?: { jobRole: string; zone: string; monthlySalaryInr?: number | null } | null;
  partnerProfile?: { businessName: string; serviceZone: string } | null;
}

export interface SAUsersResponse {
  users: SAUser[];
  pagination: { total: number; limit: number; offset: number };
  roleCounts: Record<UserRole, number>;
}

export interface LoginHistoryEntry {
  id: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: UserRole;
  jobRole?: string;
  zone?: string;
  monthlySalaryInr?: number;
  businessName?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
  jobRole?: string;
  zone?: string;
  monthlySalaryInr?: number;
}

export interface ImportUserRow {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface ForceSyncResult {
  syncedAt: string;
  summary: {
    users: number;
    customers: number;
    tasks: number;
    partners: number;
    complaints: number;
  };
}

export interface ClearCacheResult {
  redisEnabled: boolean;
  deletedKeys: number;
}

export interface BulkDeactivateResult {
  roles: UserRole[];
  deactivatedCount: number;
}

export interface PurgeAuditLogsResult {
  olderThanDays: number;
  deletedCount: number;
  cutoff: string;
}

export interface MaintenanceModeState {
  enabled: boolean;
  message: string;
  updatedAt: string;
  updatedBy: string | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const superAdminApi = {
  /** Fetch all users with optional filters */
  fetchUsers: (params?: { role?: string; isActive?: boolean; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.role) qs.set("role", params.role);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return request<SAUsersResponse>("GET", `/users${q ? `?${q}` : ""}`);
  },

  fetchUser: (userId: string) => request<SAUser>("GET", `/users/${userId}`),

  createUser: (data: CreateUserInput) => request<SAUser>("POST", "/users", data),

  updateUser: (userId: string, data: UpdateUserInput) =>
    request<SAUser>("PATCH", `/users/${userId}`, data),

  deleteUser: (userId: string) =>
    request<{ success: boolean; message: string }>("DELETE", `/users/${userId}`),

  activateUser: (userId: string) =>
    request<SAUser>("POST", `/users/${userId}/activate`),

  deactivateUser: (userId: string) =>
    request<SAUser>("POST", `/users/${userId}/deactivate`),

  changeRole: (userId: string, newRole: UserRole) =>
    request<SAUser>("PATCH", `/users/${userId}/role`, { newRole }),

  resetPassword: (userId: string, newPassword: string) =>
    request<{ success: boolean }>("POST", `/users/${userId}/reset-password`, { newPassword }),

  forceLogout: (userId: string) =>
    request<{ success: boolean; sessionsRevoked: number }>("POST", `/users/${userId}/force-logout`),

  getLoginHistory: (userId: string, limit = 20) =>
    request<{ logs: LoginHistoryEntry[]; total: number }>("GET", `/users/${userId}/login-history?limit=${limit}`),

  /** Returns raw CSV text */
  exportCSV: async (): Promise<string> => {
    const base = getSuperAdminBaseUrl();
    const res = await fetch(`${base}/users/export`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
    return res.text();
  },

  importUsers: (users: ImportUserRow[]) =>
    request<{
      results: Array<{ email: string; status: "created" | "skipped"; loginId?: string; reason?: string }>;
      summary: { total: number; created: number; skipped: number };
    }>("POST", "/users/import", { users }),

  forceSyncAllData: () => request<ForceSyncResult>("POST", "/system/force-sync"),

  clearSystemCache: () => request<ClearCacheResult>("POST", "/system/clear-cache"),

  deactivateUsersByRole: (roles: UserRole[]) =>
    request<BulkDeactivateResult>("POST", "/system/deactivate-users", { roles }),

  purgeAuditLogs: (olderThanDays = 90) =>
    request<PurgeAuditLogsResult>("DELETE", `/system/audit-logs?olderThanDays=${olderThanDays}`),

  getMaintenanceMode: () => request<MaintenanceModeState>("GET", "/system/maintenance-mode"),

  setMaintenanceMode: (enabled: boolean, message?: string) =>
    request<MaintenanceModeState>("POST", "/system/maintenance-mode", { enabled, message }),
};
