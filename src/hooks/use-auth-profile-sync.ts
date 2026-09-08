import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { subscribeEmployeeDataChanged } from "@/lib/entity-sync";
import { apiClient } from "@/lib/api-utils";

export function useAuthProfileSync() {
  const { user, token, updateUser } = useAuth();

  useEffect(() => {
    if (!token || !user?.id) return;

    const syncProfile = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        const freshUser = res.data?.data;
        if (freshUser) {
          updateUser({
            permissions: Array.isArray(freshUser.permissions) ? freshUser.permissions : [],
            designation: freshUser.designationTitle || freshUser.designation || user.designation,
            department: freshUser.department?.name || user.department,
          });
        }
      } catch {
        // Silently ignore when offline or failing silently
      }
    };

    // Initial sync
    syncProfile();

    // Subscribe to cross-tab and in-tab employee/permission changes
    const unsubscribe = subscribeEmployeeDataChanged((details) => {
      if (!details?.userId || String(details.userId) === String(user.id)) {
        if (details?.permissions && Array.isArray(details.permissions)) {
          updateUser({ permissions: details.permissions });
        } else {
          syncProfile();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token, user?.id, updateUser]);
}
