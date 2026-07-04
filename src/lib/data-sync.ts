/**
 * Data Sync Utility - Real-time data synchronization for admin pages
 * Provides automatic polling, caching, and refresh mechanisms
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";

export interface SyncConfig {
  intervalMs?: number;
  enableAutoSync?: boolean;
  retryCount?: number;
  retryDelayMs?: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  intervalMs: 30000, // 30 seconds
  enableAutoSync: true,
  retryCount: 3,
  retryDelayMs: 5000,
};

/**
 * Hook for auto-syncing multiple query keys
 */
export function useAutoSync(queryKeys: string[], config?: SyncConfig) {
  const queryClient = useQueryClient();
  const config_ = { ...DEFAULT_SYNC_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const performSync = useCallback(async () => {
    try {
      // Invalidate all provided query keys to trigger refetch
      for (const key of queryKeys) {
        await queryClient.refetchQueries({ queryKey: [key] });
      }
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Sync error:", error);
      if (retryCountRef.current < config_.retryCount!) {
        retryCountRef.current++;
        setTimeout(performSync, config_.retryDelayMs);
      }
    }
  }, [queryClient, queryKeys, config_]);

  useEffect(() => {
    if (!config_.enableAutoSync) return;

    // Perform initial sync
    performSync();

    // Set up interval
    intervalRef.current = setInterval(performSync, config_.intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [performSync, config_]);

  // Manual refresh function
  return { refresh: performSync };
}

/**
 * Hook for syncing individual query key
 */
export function useSingleSync(queryKey: string, config?: SyncConfig) {
  const { refresh } = useAutoSync([queryKey], config);
  return refresh;
}

/**
 * Hook for manual refresh with debounce
 */
export function useManualRefresh(queryKeys: string[], debounceMs = 1000) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      queryKeys.forEach(key => {
        queryClient.refetchQueries({ queryKey: [key] });
      });
    }, debounceMs);
  }, [queryClient, queryKeys, debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return refresh;
}

/**
 * Hook for polling-based sync with visibility detection
 */
export function usePollWithVisibility(queryKey: string, intervalMs = 30000) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);
  const lastActivityRef = useRef<number>(Date.now());
  const activeIntervalMsRef = useRef<number>(intervalMs);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const executePoll = async () => {
      // 1. Skip if network is offline
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      // 2. Skip if tab is hidden or window blurred
      if (typeof document !== "undefined" && (document.hidden || !document.hasFocus())) {
        return;
      }

      // 3. Inactivity timeout (5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - lastActivityRef.current > fiveMinutes) {
        return;
      }

      try {
        await queryClient.refetchQueries({ queryKey: [queryKey] });
        // Reset backoff on success
        failureCountRef.current = 0;
        if (activeIntervalMsRef.current !== intervalMs) {
          activeIntervalMsRef.current = intervalMs;
          startPolling();
        }
      } catch (error) {
        failureCountRef.current++;
        // Apply backoff: double the interval up to 4x original interval
        const maxMultiplier = 4;
        const multiplier = Math.min(Math.pow(2, failureCountRef.current), maxMultiplier);
        const newInterval = intervalMs * multiplier;
        if (activeIntervalMsRef.current !== newInterval) {
          activeIntervalMsRef.current = newInterval;
          startPolling();
        }
      }
    };

    intervalRef.current = setInterval(executePoll, activeIntervalMsRef.current);
  }, [queryClient, queryKey, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const updateActivity = () => {
      const wasInactive = Date.now() - lastActivityRef.current > 5 * 60 * 1000;
      lastActivityRef.current = Date.now();
      if (wasInactive) {
        // Resume polling instantly when user becomes active
        startPolling();
      }
    };

    const handleVisibilityAndFocus = () => {
      if (document.hidden || !document.hasFocus()) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    const handleOnline = () => {
      startPolling();
    };

    const handleOffline = () => {
      stopPolling();
    };

    document.addEventListener("visibilitychange", handleVisibilityAndFocus);
    window.addEventListener("focus", handleVisibilityAndFocus);
    window.addEventListener("blur", handleVisibilityAndFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    lastActivityRef.current = Date.now();
    startPolling();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityAndFocus);
      window.removeEventListener("focus", handleVisibilityAndFocus);
      window.removeEventListener("blur", handleVisibilityAndFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return { refresh: () => queryClient.refetchQueries({ queryKey: [queryKey] }) };
}

/**
 * Cache invalidation helper
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateAdmin: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    invalidateEmployees: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
    invalidateCustomers: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    invalidateComplaints: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
    invalidateFinancials: () => queryClient.invalidateQueries({ queryKey: ["financials"] }),
    invalidatePartners: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
