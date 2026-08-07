import { create } from 'zustand';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'department_head'
  | 'team_lead'
  | 'employee'
  | 'partner'
  | 'epc_contractor'
  | 'customer'
  | 'sub_admin';


const AUTH_STORAGE_KEYS = {
  user: 'user',
  token: 'token',
  refreshToken: 'refreshToken',
} as const;

function isUserRole(value: unknown): value is UserRole {
  if (typeof value !== 'string') return false;
  const lower = value.trim().toLowerCase();
  return (
    lower === 'super_admin' ||
    lower === 'admin' ||
    lower === 'department_head' ||
    lower === 'team_lead' ||
    lower === 'employee' ||
    lower === 'partner' ||
    lower === 'epc_contractor' ||
    lower === 'customer' ||
    lower === 'sub_admin'
  );
}

function getSafeStoredUser(): User | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (
      parsed &&
      (typeof parsed.id === 'number' || typeof parsed.id === 'string') &&
      typeof parsed.name === 'string'
    ) {
      const roleStr = String(parsed.role || '').toLowerCase();
      let normalizedRole: UserRole = 'employee';

      if (roleStr === 'super_admin' || roleStr === 'superadmin') normalizedRole = 'super_admin';
      else if (roleStr === 'admin') normalizedRole = 'admin';
      else if (roleStr === 'epc_contractor' || roleStr === 'epccontractor' || roleStr === 'epc_partner') normalizedRole = 'epc_contractor';
      else if (roleStr === 'partner' || roleStr === 'vendor') normalizedRole = 'partner';
      else if (roleStr === 'customer') normalizedRole = 'customer';
      else if (roleStr === 'sub_admin' || roleStr === 'subadmin') normalizedRole = 'sub_admin';

      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email || `${parsed.id}@swayog.in`,
        role: normalizedRole,
        jobRole: parsed.jobRole || (normalizedRole === 'partner' ? 'EPC Contractor' : undefined),
        avatarInitials: parsed.avatarInitials || parsed.name.slice(0, 2).toUpperCase(),
        department: parsed.department,
        designation: parsed.designation,
        departmentId: parsed.departmentId,
        reportingManagerId: parsed.reportingManagerId,
        employeeCode: parsed.employeeCode,
        loginId: parsed.loginId,
      };
    }
  } catch {
    // Invalid local session data should not break app startup.
  }

  return null;
}

function getSafeStoredValue(key: string): string | null {
  const value = localStorage.getItem(key);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function isServiceCoordinator(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, "");
  return normalized === "servicecoordinator";
}

export function isSubAdminJobRole(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, "");
  return normalized === "subadmin" || normalized === "servicecoordinator";
}

export function isInventoryExecutiveJobRole(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, " ");
  return normalized === "inventory executive";
}

export function isServiceExecutiveHeadJobRole(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, "");
  return (
    normalized === "ispheregreenhead" ||
    normalized === "ispheregreen" ||
    normalized === "serviceandexecutivehead" ||
    normalized === "serviceexecutivehead" ||
    normalized === "servicehead"
  );
}

export function isEpcPartnerJobRole(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, "");
  return normalized === "epccontractor" || normalized === "epc" || normalized === "epcpartner";
}

export function getRoleDashboardPath(role: UserRole, jobRole?: string): string {
  const r = String(role || '').toLowerCase();

  if (r === 'super_admin') {
    return '/super-admin/dashboard';
  }

  if (r === 'admin') {
    return '/admin/dashboard';
  }

  if (isServiceExecutiveHeadJobRole(jobRole)) {
    return '/service-executive/dashboard';
  }

  if (isInventoryExecutiveJobRole(jobRole)) {
    return '/inventory/dashboard';
  }

  if (r === 'sub_admin' || isSubAdminJobRole(jobRole)) {
    return '/subadmin/dashboard';
  }

  if (isEpcPartnerJobRole(jobRole) || r === 'epc_contractor') {
    return '/epc-contractor/dashboard';
  }

  if (r === 'partner') {
    return '/partner/dashboard';
  }

  if (r === 'team_lead' || r === 'department_head' || r === 'employee') {
    return '/employee/dashboard';
  }

  if (r === 'customer') {
    return '/customer/dashboard';
  }

  return '/partner/dashboard';
}


interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  jobRole?: string;
  avatarInitials: string;
  department?: string;
  designation?: string;
  departmentId?: string | null;
  reportingManagerId?: string | null;
  employeeCode?: string | null;
  loginId?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: getSafeStoredUser(),
  token: getSafeStoredValue(AUTH_STORAGE_KEYS.token),
  refreshToken: getSafeStoredValue(AUTH_STORAGE_KEYS.refreshToken),
  isLoading: false,
  isAuthenticated: !!getSafeStoredValue(AUTH_STORAGE_KEYS.token),
  login: (token, user, refreshToken) => {
    localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
    }
    set({ token, user, refreshToken: refreshToken ?? null, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    set({ token: null, user: null, refreshToken: null, isAuthenticated: false });
  },
}));
