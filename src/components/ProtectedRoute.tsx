import React from 'react';
import { useLocation } from 'wouter';
import { useAuth, UserRole } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Redirects to 404 if user doesn't have required role
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback,
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  React.useEffect(() => {
    // If loading, show spinner
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      setLocation('/login?next=' + window.location.pathname);
      return;
    }

    // If specific roles are required, check them
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      setLocation('/not-found');
      return;
    }
  }, [isAuthenticated, isLoading, user, setLocation, requiredRoles]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  // Show fallback if role not allowed
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return fallback || null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}

/**
 * Admin-only Route
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Employee-only Route
 */
export function EmployeeRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['employee']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Auth Guard - Used to check authentication in components
 */
export function isUserAuthorized(requiredRoles?: UserRole[]): boolean {
  const { user, isAuthenticated } = useAuth.getState();

  if (!isAuthenticated || !user) {
    return false;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    return requiredRoles.includes(user.role);
  }

  return true;
}
