import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { requestApi } from "@/lib/api-client";
import { subscribeEmployeeDataChanged } from "@/lib/entity-sync";

/**
 * Hook to keep the logged-in user's profile and permissions in sync in real-time.
 * Synchronizes:
 * 1. On mount when authenticated
 * 2. On window focus (e.g. employee switches back to dashboard tab)
 * 3. On cross-tab BroadcastChannel / localStorage sync events (e.g. superadmin saves permissions in another tab)
 */
export function useAuthProfileSync() {
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      return;
    }

    const syncProfile = async (detail?: { userId?: string; permissions?: string[] }) => {
      // Fast path: If the broadcast detail directly specifies this user's updated permissions, apply immediately
      if (
        detail &&
        detail.userId &&
        (String(detail.userId) === String(user.id) ||
         (user.email && detail.userId === user.email) ||
         (user.loginId && detail.userId === user.loginId)) &&
        Array.isArray(detail.permissions)
      ) {
        updateUser({ permissions: detail.permissions });
        return;
      }

      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const res = await requestApi<{ data: any }>("/auth/me");
        const freshUser = (res as any)?.data || res;
        if (freshUser) {
          const newPermissions: string[] = Array.isArray(freshUser.permissions)
            ? freshUser.permissions
            : (Array.isArray(freshUser.employeeProfile?.permissions)
              ? freshUser.employeeProfile.permissions
              : []);

          const currentPerms = user.permissions || [];
          const hasPermsChanged =
            newPermissions.length !== currentPerms.length ||
            newPermissions.some((p) => !currentPerms.includes(p));

          if (hasPermsChanged) {
            updateUser({
              permissions: newPermissions,
            });
          }
        }
      } catch {
        // Silent failure for background profile sync
      } finally {
        isSyncingRef.current = false;
      }
    };

    // 1. Initial sync on mount
    syncProfile();

    // 2. Sync on window focus
    const handleFocus = () => {
      syncProfile();
    };
    window.addEventListener("focus", handleFocus);

    // 3. Sync on cross-tab / window sync events
    const unsubscribe = subscribeEmployeeDataChanged((detail) => {
      syncProfile(detail);
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
      unsubscribe();
    };
  }, [isAuthenticated, token, user?.id, updateUser]);
}
