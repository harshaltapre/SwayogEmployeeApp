import { create } from 'zustand';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'department_head'
  | 'team_lead'
  | 'employee'
  | 'partner'
  | 'customer'
  | 'sub_admin';


const AUTH_STORAGE_KEYS = {
  user: 'user',
  token: 'token',
  refreshToken: 'refreshToken',
} as const;

function isUserRole(value: unknown): value is UserRole {
  return (
    value === 'super_admin' ||
    value === 'admin' ||
    value === 'department_head' ||
    value === 'team_lead' ||
    value === 'employee' ||
    value === 'partner' ||
    value === 'customer' ||
    value === 'sub_admin'
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
      (typeof parsed.id === 'number' || typeof parsed.id === 'string') &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.avatarInitials === 'string' &&
      isUserRole(parsed.role)
    ) {
      return parsed as User;
    }
  } catch {
    // Invalid local session data should not break app startup.
  }

  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
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

export function getRoleDashboardPath(role: UserRole, jobRole?: string): string {
  if (role === 'super_admin') {
    return '/super-admin/dashboard';
  }

  if (role === 'admin') {
    return '/admin/dashboard';
  }

  if (isInventoryExecutiveJobRole(jobRole)) {
    return '/inventory/dashboard';
  }

  if (role === 'sub_admin' || isSubAdminJobRole(jobRole)) {
    return '/subadmin/dashboard';
  }

  if (role === 'team_lead' || role === 'department_head' || role === 'employee') {
    return '/employee/dashboard';
  }

  return `/${role}/dashboard`;
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
